import { test, expect } from '@playwright/test';
import { FIXTURE_FILES, importBook, openFirstBook } from '../helpers/test-utils';
import {
  closeAppMenu,
  createPhase2Context,
  setDeviceDisplayName,
  setDeviceId,
  signInViaUi,
} from './helpers/cloud-utils';

async function readToPage(page: import('@playwright/test').Page, pageNumber: number) {
  await page.getByLabel('Go to page').fill(String(pageNumber));
  await page.getByLabel('Go to page').press('Enter');
  await expect(page.getByLabel('Go to page')).toHaveValue(String(pageNumber));
  await page.waitForTimeout(1_500);
}

test.describe('Phase 2 reading continuity', () => {
  test('offers to continue from another device after synced reading', async ({ browser }) => {
    const deviceA = await createPhase2Context(browser);
    const deviceB = await createPhase2Context(browser);
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

    await signInViaUi(pageA);
    await closeAppMenu(pageA);
    await importBook(pageA, FIXTURE_FILES.samplePdf);
    await openFirstBook(pageA);
    await readToPage(pageA, 5);
    await pageA.getByRole('button', { name: 'Back to library' }).click();

    await signInViaUi(pageB);
    await closeAppMenu(pageB);
    await importBook(pageB, FIXTURE_FILES.samplePdf);
    await openFirstBook(pageB);

    const prompt = pageB.getByTestId('continuation-prompt');
    await expect(prompt).toBeVisible({ timeout: 15_000 });
    await expect(prompt).toContainText('Test Laptop');

    await pageB.getByTestId('continuation-continue').click();
    await expect(pageB.getByLabel('Go to page')).toHaveValue('5');

    await deviceA.close();
    await deviceB.close();
  });
});
