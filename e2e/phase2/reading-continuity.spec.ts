import { test, expect } from '@playwright/test';
import { FIXTURE_FILES, importBook, openFirstBook } from '../helpers/test-utils';
import {
  savePhase2Video,
  setDeviceId,
  signInViaUi,
} from './helpers/cloud-utils';

async function setDeviceDisplayName(page: import('@playwright/test').Page, name: string) {
  await page.evaluate((deviceName) => {
    localStorage.setItem('luma-device-name', deviceName);
  }, name);
}

async function closeAppMenu(page: import('@playwright/test').Page) {
  await page.keyboard.press('Escape');
}

async function readToPage(page: import('@playwright/test').Page, pageNumber: number) {
  await page.getByLabel('Go to page').fill(String(pageNumber));
  await page.getByLabel('Go to page').press('Enter');
  await expect(page.getByLabel('Go to page')).toHaveValue(String(pageNumber));
  // Allow debounced local save + cloud push.
  await page.waitForTimeout(1_500);
}

test.describe('Phase 2 reading continuity', () => {
  test('offers to continue from another device after synced reading', async ({ browser }) => {
    const deviceA = await browser.newContext();
    const deviceB = await browser.newContext();
    const pageA = await deviceA.newPage();
    const pageB = await deviceB.newPage();

    await pageA.goto('/');
    await pageB.goto('/');
    await setDeviceId(pageA, 'continuity-device-a');
    await setDeviceId(pageB, 'continuity-device-b');
    await setDeviceDisplayName(pageA, 'Test Laptop');
    await setDeviceDisplayName(pageB, 'Test Phone');
    await pageA.reload();
    await pageB.reload();

    // Device A — sign in, import, read to page 5, sync on close.
    await pageA.goto('/');
    await signInViaUi(pageA);
    await closeAppMenu(pageA);
    await importBook(pageA, FIXTURE_FILES.samplePdf);
    await openFirstBook(pageA);
    await readToPage(pageA, 5);
    await pageA.getByRole('button', { name: 'Back to library' }).click();

    // Device B — same book, should see continuation from Test Laptop.
    await pageB.goto('/');
    await signInViaUi(pageB);
    await closeAppMenu(pageB);
    await importBook(pageB, FIXTURE_FILES.samplePdf);
    await openFirstBook(pageB);

    const prompt = pageB.getByTestId('continuation-prompt');
    await expect(prompt).toBeVisible({ timeout: 15_000 });
    await expect(prompt).toContainText('Test Laptop');

    await pageB.getByTestId('continuation-continue').click();
    await expect(pageB.getByLabel('Go to page')).toHaveValue('5');

    await savePhase2Video(pageA, 'phase2-reading-continuity-a');
    await savePhase2Video(pageB, 'phase2-reading-continuity-b');

    await deviceA.close();
    await deviceB.close();
  });
});
