import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';
import { googleMockEnabled } from './config.js';
import { getValidAccessToken } from './tokens.js';

export interface DriveFileMeta {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  md5Checksum?: string;
}

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), 'mock-assets');

function loadMockAsset(name: string): Buffer {
  return readFileSync(join(assetsDir, name));
}

const MOCK_PDF_BYTES = loadMockAsset('sample-book.pdf');
const MOCK_EPUB_BYTES = loadMockAsset('sample-book.epub');

const MOCK_FILES: DriveFileMeta[] = [
  {
    id: 'mock-drive-pdf-1',
    name: 'Mock Drive Book.pdf',
    mimeType: 'application/pdf',
    modifiedTime: '2026-09-01T00:00:00.000Z',
    size: String(MOCK_PDF_BYTES.length),
    md5Checksum: 'mock-pdf-v1',
  },
  {
    id: 'mock-drive-epub-1',
    name: 'Mock Drive Book.epub',
    mimeType: 'application/epub+zip',
    modifiedTime: '2026-09-01T00:00:00.000Z',
    size: String(MOCK_EPUB_BYTES.length),
    md5Checksum: 'mock-epub-v1',
  },
];

const SUPPORTED_MIME = new Set(['application/pdf', 'application/epub+zip']);

export function isSupportedDriveMime(mimeType: string, name: string): boolean {
  if (SUPPORTED_MIME.has(mimeType)) return true;
  const lower = name.toLowerCase();
  return lower.endsWith('.pdf') || lower.endsWith('.epub');
}

export async function registerDriveFile(
  accountId: string,
  fileId: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO drive_file_grants (account_id, file_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [accountId, fileId],
  );
}

export async function listGrantedFileIds(accountId: string): Promise<string[]> {
  const result = await pool.query<{ file_id: string }>(
    `SELECT file_id FROM drive_file_grants WHERE account_id = $1 ORDER BY granted_at DESC`,
    [accountId],
  );
  return result.rows.map((row) => row.file_id);
}

async function driveFetch(
  accountId: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const accessToken = await getValidAccessToken(accountId);
  if (!accessToken) {
    throw new Error('Google Drive is not connected');
  }

  return fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getDriveFileMeta(
  accountId: string,
  fileId: string,
): Promise<DriveFileMeta> {
  if (googleMockEnabled()) {
    const mock = MOCK_FILES.find((f) => f.id === fileId);
    if (!mock) throw new Error('File not found');
    return mock;
  }

  const fields = 'id,name,mimeType,modifiedTime,size,md5Checksum';
  const response = await driveFetch(
    accountId,
    `/files/${encodeURIComponent(fileId)}?fields=${fields}&supportsAllDrives=true`,
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive metadata failed: ${response.status} ${text}`);
  }
  return (await response.json()) as DriveFileMeta;
}

export async function listDriveBooks(accountId: string): Promise<DriveFileMeta[]> {
  if (googleMockEnabled()) {
    const granted = await listGrantedFileIds(accountId);
    if (granted.length === 0) {
      for (const file of MOCK_FILES) {
        await registerDriveFile(accountId, file.id);
      }
      return [...MOCK_FILES];
    }
    return MOCK_FILES.filter((f) => granted.includes(f.id));
  }

  const granted = await listGrantedFileIds(accountId);
  const files: DriveFileMeta[] = [];
  for (const fileId of granted) {
    try {
      const meta = await getDriveFileMeta(accountId, fileId);
      if (isSupportedDriveMime(meta.mimeType, meta.name)) {
        files.push(meta);
      }
    } catch {
      // Skip revoked/missing files without failing the whole list.
    }
  }
  return files;
}

export async function downloadDriveFile(
  accountId: string,
  fileId: string,
): Promise<{ meta: DriveFileMeta; bytes: Buffer }> {
  const meta = await getDriveFileMeta(accountId, fileId);
  if (!isSupportedDriveMime(meta.mimeType, meta.name)) {
    throw new Error('Unsupported Drive file type. Choose a PDF or EPUB.');
  }

  if (googleMockEnabled()) {
    if (fileId === 'mock-drive-epub-1') {
      return { meta, bytes: MOCK_EPUB_BYTES };
    }
    return { meta, bytes: MOCK_PDF_BYTES };
  }

  const response = await driveFetch(
    accountId,
    `/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive download failed: ${response.status} ${text}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return { meta, bytes: Buffer.from(arrayBuffer) };
}

export function contentVersionFromMeta(meta: DriveFileMeta): string {
  return meta.md5Checksum ?? meta.modifiedTime ?? meta.id;
}
