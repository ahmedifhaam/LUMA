import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixturesDir = join(root, 'e2e', 'fixtures');
const artifactsDir = join(root, 'e2e', 'artifacts');

export default async function globalSetup() {
  mkdirSync(fixturesDir, { recursive: true });
  mkdirSync(join(artifactsDir, 'screenshots'), { recursive: true });
  mkdirSync(join(root, 'docs', 'assets', 'feature-guide', 'screenshots'), { recursive: true });
  execFileSync(process.execPath, [join(root, 'scripts', 'make-test-fixtures.mjs'), fixturesDir], {
    stdio: 'inherit',
  });
}
