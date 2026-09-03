import { test, expect } from '@playwright/test';
import {
  closeAppMenu,
  connectDriveViaUi,
  importDriveBookViaUi,
  signInViaUi,
} from './helpers/cloud-utils';

test.describe('Phase 2 Google Drive', () => {
  test('connects Drive and imports a mock PDF', async ({ page }) => {
    await page.goto('/');
    await signInViaUi(page);
    await closeAppMenu(page);
    await connectDriveViaUi(page);

    await importDriveBookViaUi(page);
    await expect(page.locator('.book-card__name').first()).toContainText(/Mock Drive/i);
    await expect(page.getByTestId('book-source-google-drive').first()).toBeVisible();
  });
});
