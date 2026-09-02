import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const syncRouter = Router();

syncRouter.use(requireAuth);

syncRouter.post('/push', async (req: AuthedRequest, res) => {
  const accountId = req.auth!.sub;
  const {
    bookId,
    deviceId,
    deviceName,
    location,
    progress,
    lastActiveAt,
    mutationId,
  } = req.body ?? {};

  if (!bookId || !deviceId || !deviceName || !location || typeof progress !== 'number') {
    res.status(400).json({ error: 'Invalid push payload' });
    return;
  }

  if (mutationId) {
    const seen = await pool.query(
      'SELECT 1 FROM sync_mutations WHERE mutation_id = $1 AND account_id = $2',
      [mutationId, accountId],
    );
    if ((seen.rowCount ?? 0) > 0) {
      res.status(204).end();
      return;
    }
  }

  await pool.query(
    `INSERT INTO devices (account_id, id, display_name, last_seen_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (account_id, id)
     DO UPDATE SET display_name = EXCLUDED.display_name, last_seen_at = NOW()`,
    [accountId, deviceId, deviceName],
  );

  const result = await pool.query<{ server_revision: string }>(
    `INSERT INTO reading_sessions
       (account_id, device_id, device_name, book_id, location, progress, last_active_at, mutation_id, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (account_id, device_id, book_id)
     DO UPDATE SET
       device_name = EXCLUDED.device_name,
       location = EXCLUDED.location,
       progress = EXCLUDED.progress,
       last_active_at = EXCLUDED.last_active_at,
       mutation_id = EXCLUDED.mutation_id,
       updated_at = NOW(),
       server_revision = nextval(pg_get_serial_sequence('reading_sessions', 'server_revision'))
     RETURNING server_revision`,
    [
      accountId,
      deviceId,
      deviceName,
      bookId,
      JSON.stringify(location),
      progress,
      lastActiveAt ?? Date.now(),
      mutationId ?? null,
    ],
  );

  if (mutationId) {
    await pool.query(
      'INSERT INTO sync_mutations (mutation_id, account_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [mutationId, accountId],
    );
  }

  res.json({ serverRevision: Number(result.rows[0]!.server_revision) });
});

syncRouter.get('/pull', async (req: AuthedRequest, res) => {
  const accountId = req.auth!.sub;
  const cursor = Number(req.query.cursor ?? 0);
  const bookId = req.query.bookId ? String(req.query.bookId) : null;

  const params: Array<string | number> = [accountId, cursor];
  let bookFilter = '';
  if (bookId) {
    params.push(bookId);
    bookFilter = ` AND book_id = $${params.length}`;
  }

  const rows = await pool.query<{
    device_id: string;
    device_name: string;
    book_id: string;
    location: unknown;
    progress: number;
    last_active_at: string;
    server_revision: string;
  }>(
    `SELECT device_id, device_name, book_id, location, progress, last_active_at, server_revision
     FROM reading_sessions
     WHERE account_id = $1 AND server_revision > $2${bookFilter}
     ORDER BY server_revision ASC
     LIMIT 200`,
    params,
  );

  const sessions = rows.rows.map((row) => ({
    deviceId: row.device_id,
    deviceName: row.device_name,
    bookId: row.book_id,
    location: row.location,
    progress: row.progress,
    lastActiveAt: Number(row.last_active_at),
  }));

  const nextCursor =
    rows.rows.length > 0
      ? Number(rows.rows.at(-1)!.server_revision)
      : cursor;

  res.json({ sessions, nextCursor });
});
