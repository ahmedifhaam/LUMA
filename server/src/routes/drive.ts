import { Router } from 'express';
import {
  contentVersionFromMeta,
  downloadDriveFile,
  getDriveFileMeta,
  isSupportedDriveMime,
  listDriveBooks,
  registerDriveFile,
} from '../google/drive.js';
import { getValidAccessToken } from '../google/tokens.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const driveRouter = Router();

driveRouter.use(requireAuth);

driveRouter.get('/files', async (req: AuthedRequest, res) => {
  try {
    const token = await getValidAccessToken(req.auth!.sub);
    if (!token) {
      res.status(401).json({ error: 'Google Drive is not connected' });
      return;
    }
    const files = await listDriveBooks(req.auth!.sub);
    res.json({
      files: files.map((file) => ({
        remoteId: file.id,
        title: file.name.replace(/\.[^.]+$/, '') || file.name,
        name: file.name,
        mimeType: file.mimeType,
        contentVersion: contentVersionFromMeta(file),
        modifiedTime: file.modifiedTime,
      })),
    });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to list Drive files',
    });
  }
});

driveRouter.post('/files/register', async (req: AuthedRequest, res) => {
  const fileId = String(req.body?.fileId ?? '').trim();
  if (!fileId) {
    res.status(400).json({ error: 'fileId is required' });
    return;
  }

  try {
    const meta = await getDriveFileMeta(req.auth!.sub, fileId);
    if (!isSupportedDriveMime(meta.mimeType, meta.name)) {
      res.status(400).json({ error: 'Unsupported file type. Choose a PDF or EPUB.' });
      return;
    }
    await registerDriveFile(req.auth!.sub, fileId);
    res.json({
      remoteId: meta.id,
      title: meta.name.replace(/\.[^.]+$/, '') || meta.name,
      name: meta.name,
      mimeType: meta.mimeType,
      contentVersion: contentVersionFromMeta(meta),
      modifiedTime: meta.modifiedTime,
    });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to register Drive file',
    });
  }
});

driveRouter.get('/files/:fileId', async (req: AuthedRequest, res) => {
  try {
    const meta = await getDriveFileMeta(req.auth!.sub, req.params.fileId!);
    res.json({
      remoteId: meta.id,
      title: meta.name.replace(/\.[^.]+$/, '') || meta.name,
      name: meta.name,
      mimeType: meta.mimeType,
      contentVersion: contentVersionFromMeta(meta),
      modifiedTime: meta.modifiedTime,
    });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to load Drive metadata',
    });
  }
});

driveRouter.get('/files/:fileId/version', async (req: AuthedRequest, res) => {
  try {
    const meta = await getDriveFileMeta(req.auth!.sub, req.params.fileId!);
    res.json({ contentVersion: contentVersionFromMeta(meta) });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to read Drive version',
    });
  }
});

driveRouter.get('/files/:fileId/content', async (req: AuthedRequest, res) => {
  try {
    const { meta, bytes } = await downloadDriveFile(req.auth!.sub, req.params.fileId!);
    res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${meta.name.replace(/"/g, '')}"`,
    );
    res.setHeader('X-Luma-Content-Version', contentVersionFromMeta(meta));
    res.setHeader('X-Luma-File-Name', meta.name);
    res.send(bytes);
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to download Drive file',
    });
  }
});
