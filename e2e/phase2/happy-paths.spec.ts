import { test, expect } from '@playwright/test';
import { openFirstBook } from '../helpers/test-utils';
import {
  PHASE2_TEST_USER,
  closeAppMenu,
  connectDriveViaUi,
  createPhase2Context,
  importDriveBookViaUi,
  saveContextVideo,
  savePhase2Video,
  setDeviceDisplayName,
  setDeviceId,
  signInViaUi,
  writeRecordingsManifest,
  type Phase2Recording,
} from './helpers/cloud-utils';

/**
 * Serial happy-path recordings for PR review artifacts.
 * Run: npm run test:e2e:phase2:recordings
 * Output: e2e/artifacts/pr-videos/phase2-*.webm + manifest.json
 */
test.describe.configure({ mode: 'serial' });

const recordings: Phase2Recording[] = [];

async function readToPage(page: import('@playwright/test').Page, pageNumber: number) {
  await page.getByLabel('Go to page').fill(String(pageNumber));
  await page.getByLabel('Go to page').press('Enter');
  await expect(page.getByLabel('Go to page')).toHaveValue(String(pageNumber));
  await page.waitForTimeout(1_500);
}

test.describe('Phase 2 happy path recordings', () => {
  test.afterAll(() => {
    writeRecordingsManifest(recordings);
  });

  test('01 — app menu, sign-in, and Drive connect', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('app-menu-trigger').click();
    await expect(page.getByTestId('app-menu-panel')).toBeVisible();
    await expect(page.getByTestId('app-menu-how-to')).toBeVisible();
    await expect(page.getByTestId('app-menu-account')).toBeVisible();

    await page.getByTestId('app-menu-sign-in').click();
    await expect(page.getByTestId('auth-modal')).toBeVisible();
    await page.getByTestId('auth-username').fill(PHASE2_TEST_USER.username);
    await page.getByTestId('auth-password').fill(PHASE2_TEST_USER.password);
    await page.getByTestId('auth-submit').click();
    await page.getByTestId('auth-modal').waitFor({ state: 'hidden', timeout: 15_000 });

    await page.getByTestId('app-menu-trigger').click();
    await expect(page.getByTestId('auth-user-label')).toHaveText(PHASE2_TEST_USER.username);
    await closeAppMenu(page);

    await connectDriveViaUi(page);
    await page.getByTestId('app-menu-trigger').click();
    await expect(page.getByTestId('drive-connected-label')).toBeVisible();
    await page.waitForTimeout(800);

    await savePhase2Video(page, 'phase2-01-app-menu-and-sign-in');
    recordings.push({
      file: 'phase2-01-app-menu-and-sign-in.webm',
      title: 'Sign-in & Connect Drive',
      description: 'LUMA sign-in, Connect Google Drive (mock in CI), connected account state.',
    });
  });

  test('02 — import from Drive, read on device A, sync', async ({ browser }) => {
    const context = await createPhase2Context(browser);
    const page = await context.newPage();

    await page.goto('/');
    await setDeviceId(page, 'happy-path-device-a');
    await setDeviceDisplayName(page, 'Test Laptop');
    await page.reload();

    await signInViaUi(page);
    await closeAppMenu(page);
    await connectDriveViaUi(page);
    await importDriveBookViaUi(page);
    await openFirstBook(page);
    await readToPage(page, 5);
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Back to library' }).click();
    await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible();
    await page.waitForTimeout(800);

    await saveContextVideo(context, page, 'phase2-02-read-and-sync');
    recordings.push({
      file: 'phase2-02-read-and-sync.webm',
      title: 'Drive import & sync (Device A)',
      description: 'Import Drive PDF, read to page 5, return to library — position syncs.',
    });
  });

  test('03 — continuation prompt on device B', async ({ browser }) => {
    const context = await createPhase2Context(browser);
    const page = await context.newPage();

    await page.goto('/');
    await setDeviceId(page, 'happy-path-device-b');
    await setDeviceDisplayName(page, 'Test Phone');
    await page.reload();

    await signInViaUi(page);
    await closeAppMenu(page);
    await connectDriveViaUi(page);
    await importDriveBookViaUi(page);
    await openFirstBook(page);

    const prompt = page.getByTestId('continuation-prompt');
    await expect(prompt).toBeVisible({ timeout: 15_000 });
    await expect(prompt).toContainText('Test Laptop');
    await page.waitForTimeout(800);

    await page.getByTestId('continuation-continue').click();
    await expect(page.getByLabel('Go to page')).toHaveValue('5');
    await page.waitForTimeout(1_000);

    await saveContextVideo(context, page, 'phase2-03-continuation-on-device-b');
    recordings.push({
      file: 'phase2-03-continuation-on-device-b.webm',
      title: 'Cross-device continuation (Device B)',
      description: 'Same Drive book on Device B — Continue from Test Laptop → page 5.',
    });
  });
});
