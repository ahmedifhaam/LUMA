import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, signToken, type AuthedRequest } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/session', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const existing = await pool.query<{ id: string; password_hash: string }>(
    'SELECT id, password_hash FROM accounts WHERE username = $1',
    [username],
  );

  let accountId: string;

  if (existing.rowCount === 0) {
    const hash = await bcrypt.hash(password, 10);
    const created = await pool.query<{ id: string }>(
      `INSERT INTO accounts (username, password_hash) VALUES ($1, $2) RETURNING id`,
      [username, hash],
    );
    accountId = created.rows[0]!.id;
  } else {
    const valid = await bcrypt.compare(password, existing.rows[0]!.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    accountId = existing.rows[0]!.id;
  }

  const token = signToken({ sub: accountId, username });
  res.json({ user: { id: accountId, username }, token });
});

authRouter.post('/logout', requireAuth, (_req, res) => {
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  res.json({
    user: { id: req.auth!.sub, username: req.auth!.username },
  });
});
