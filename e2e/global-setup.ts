import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensurePhase2Stack, setupPhase2Artifacts, runFixtureScript } from './phase2/helpers/stack';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const artifactsDir = join(root, 'e2e', 'artifacts');

export default async function globalSetup() {
  mkdirSync(join(artifactsDir, 'screenshots'), { recursive: true });
  mkdirSync(join(root, 'docs', 'assets', 'feature-guide', 'screenshots'), { recursive: true });
  runFixtureScript();

  const runningPhase2 =
    process.env.PHASE2_DOCKER === 'true' ||
    process.argv.some((arg) => arg.includes('phase2'));

  if (runningPhase2) {
    await setupPhase2Artifacts();
    await ensurePhase2Stack();
  }
}
