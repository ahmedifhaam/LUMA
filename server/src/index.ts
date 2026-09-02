import cors from 'cors';
import express from 'express';
import { migrate, pool, seedTestUser } from './db.js';
import { authRouter } from './routes/auth.js';
import { syncRouter } from './routes/sync.js';

const PORT = Number(process.env.PORT ?? 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

async function main(): Promise<void> {
  await migrate();
  await seedTestUser();

  const app = express();
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/auth', authRouter);
  app.use('/sync', syncRouter);

  app.listen(PORT, () => {
    console.log(`LUMA API listening on http://localhost:${PORT}`);
  });
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
