import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? 'postgres://luma:luma@localhost:5432/luma',
});

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS devices (
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (account_id, id)
    );

    CREATE TABLE IF NOT EXISTS reading_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      device_id TEXT NOT NULL,
      device_name TEXT NOT NULL,
      book_id TEXT NOT NULL,
      location JSONB NOT NULL,
      progress REAL NOT NULL,
      last_active_at BIGINT NOT NULL,
      mutation_id TEXT,
      server_revision BIGSERIAL UNIQUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (account_id, device_id, book_id)
    );

    CREATE TABLE IF NOT EXISTS sync_mutations (
      mutation_id TEXT PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS reading_sessions_account_revision_idx
      ON reading_sessions (account_id, server_revision);
  `);
}

export async function seedTestUser(): Promise<void> {
  if (process.env.SEED_TEST_USER !== 'true') return;

  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash('testpass', 10);
  await pool.query(
    `INSERT INTO accounts (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO NOTHING`,
    ['testuser', hash],
  );
}
