import { File } from 'node:buffer';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DocumentEngine, OpenDocument } from '@/domain/document/types';
import { computeFingerprint } from '@/application/document-identity/fingerprint';
import { DB_NAME, closeDatabase } from '@/infrastructure/persistence/db';
import {
  bookRepository,
  sourceRepository,
} from '@/infrastructure/persistence/repositories';
import { importBook } from './import-book';

async function deleteDatabase(): Promise<void> {
  await closeDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

function makeFakeEngine(pageCount: number, hasText: boolean): DocumentEngine {
  return {
    async open(bytes: ArrayBuffer): Promise<OpenDocument> {
      const fingerprint = await computeFingerprint(bytes);
      return {
        identity: { fingerprint, byteLength: bytes.byteLength },
        metadata: { title: null, author: null, pageCount, hasText },
        getPageGeometry: async () => ({ pageNumber: 1, width: 600, height: 800 }),
        renderPage: () => ({
          promise: Promise.reject(new Error('n/a')),
          cancel: () => {},
        }),
        extractPageText: async () => '',
        renderTextLayer: () => ({ promise: Promise.resolve(), cancel: () => {} }),
        getOutline: async () => [],
        destroy: async () => {},
      };
    },
  };
}

function pdfFile(content: string, name: string): globalThis.File {
  // Node's File implements arrayBuffer(); jsdom's does not in this environment.
  return new File([new TextEncoder().encode(content)], name, {
    type: 'application/pdf',
  }) as unknown as globalThis.File;
}

describe('importBook', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it('creates a new logical book and persists its source', async () => {
    const engine = makeFakeEngine(12, true);
    const result = await importBook(
      pdfFile('hello world pdf bytes', 'Hello.pdf'),
      engine,
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.book.title).toBe('Hello');
    expect(result.book.pageCount).toBe(12);

    const stored = await bookRepository.get(result.book.id);
    expect(stored).toBeTruthy();
    const source = await sourceRepository.get(result.book.id);
    expect(source).toBeTruthy();
  });

  it('recognizes duplicate content by fingerprint and reuses the book', async () => {
    const engine = makeFakeEngine(12, true);
    const first = await importBook(pdfFile('identical bytes', 'Original.pdf'), engine);
    const second = await importBook(
      pdfFile('identical bytes', 'Renamed-Copy.pdf'),
      engine,
    );

    expect(second.isDuplicate).toBe(true);
    expect(second.book.id).toBe(first.book.id);
    // Latest import updates the informational source name.
    expect(second.book.sourceName).toBe('Renamed-Copy.pdf');

    const all = await bookRepository.list();
    expect(all).toHaveLength(1);
  });

  it('marks scanned (image-only) documents as not text-friendly', async () => {
    const engine = makeFakeEngine(3, false);
    const result = await importBook(pdfFile('scanned', 'Scan.pdf'), engine);
    expect(result.book.hasText).toBe(false);
  });
});
