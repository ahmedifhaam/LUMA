import { test, expect } from '@playwright/test';
import { openFirstBook } from '../helpers/test-utils';
import {
  closeAppMenu,
  connectDriveViaUi,
  createPhase2Context,
  importDriveBookViaUi,
  pullReadingSessions,
  setDeviceDisplayName,
  setDeviceId,
  signInViaUi,
} from './helpers/cloud-utils';

test.describe('Phase 2 offline sync', () => {
  test('queues reading progress while offline and flushes when back online', async ({
    browser,
  }) => {
    const context = await createPhase2Context(browser);
    const page = await context.newPage();

    await page.goto('/');
    await setDeviceId(page, 'offline-device-a');
    await setDeviceDisplayName(page, 'Offline Laptop');
    await page.reload();

    await signInViaUi(page);
    await closeAppMenu(page);
    await connectDriveViaUi(page);
    await importDriveBookViaUi(page);
    await openFirstBook(page);

    await page.context().setOffline(true);
    await page.getByLabel('Go to page').fill('5');
    await page.getByLabel('Go to page').press('Enter');
    await expect(page.getByLabel('Go to page')).toHaveValue('5');
    await page.waitForTimeout(1_500);
    await page.getByRole('button', { name: 'Back to library' }).click();

    await page.context().setOffline(false);
    await page.waitForTimeout(2_000);
    // Trigger sync on online event + a manual navigate refresh of sync.
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(2_000);

    const sessions = await pullReadingSessions(page);
    expect(sessions.some((s) => s.deviceId === 'offline-device-a' && s.progress > 0)).toBe(
      true,
    );

    await context.close();
  });
});
