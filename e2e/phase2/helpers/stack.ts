import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiBaseUrl = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function waitForApi(timeoutMs = 120_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${apiBaseUrl}/health`);
      if (response.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`API not ready at ${apiBaseUrl} after ${timeoutMs}ms`);
}

export async function ensurePhase2Stack(): Promise<void> {
  if (process.env.PHASE2_SKIP_DOCKER === 'true') {
    await waitForApi();
    return;
  }

  execSync('docker compose up -d --wait', {
    cwd: root,
    stdio: 'inherit',
  });
  await waitForApi();
}

export async function setupPhase2Artifacts(): Promise<void> {
  mkdirSync(join(root, 'e2e', 'artifacts', 'pr-videos'), { recursive: true });
}

export function runFixtureScript(): void {
  const fixturesDir = join(root, 'e2e', 'fixtures');
  mkdirSync(fixturesDir, { recursive: true });
  execFileSync(process.execPath, [join(root, 'scripts', 'make-test-fixtures.mjs'), fixturesDir], {
    stdio: 'inherit',
  });
}
