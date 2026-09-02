import { expect, test } from '@playwright/test';
import {
  FIXTURE_FILES,
  captureStep,
  importBook,
  openFirstBook,
} from './helpers/test-utils';

test.describe('library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('imports a PDF and shows it in the library grid', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.samplePdf);
    await expect(page.getByText('Added')).toBeVisible();
    await expect(page.locator('.book-card__name', { hasText: 'sample-book' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open', exact: true })).toHaveCount(1);
    await captureStep(page, 'library-imported-pdf');
  });

  test('shows local source icon on imported book card', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.samplePdf);
    await expect(page.getByTestId('book-source-local')).toBeVisible();
    await captureStep(page, 'library-source-icon');
  });

  test('maintains independent reading state per device id', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.samplePdf);

    const originalDeviceId = await page.evaluate(() =>
      localStorage.getItem('luma-device-id'),
    );
    expect(originalDeviceId).toBeTruthy();

    await openFirstBook(page);
    await page.getByLabel('Go to page').fill('5');
    await page.getByLabel('Go to page').press('Enter');
    await expect(page.getByLabel('Go to page')).toHaveValue('5');
    await page.getByRole('button', { name: 'Back to library' }).click();

    await page.evaluate(() => {
      localStorage.setItem('luma-device-id', crypto.randomUUID());
    });
    await page.getByRole('button', { name: 'Open', exact: true }).first().click();
    await page.getByRole('button', { name: 'Back to library' }).waitFor({ timeout: 30_000 });
    await expect(page.getByLabel('Go to page')).toHaveValue('1');
    await page.getByRole('button', { name: 'Back to library' }).click();

    await page.evaluate((deviceId) => {
      localStorage.setItem('luma-device-id', deviceId);
    }, originalDeviceId!);
    await page.getByRole('button', { name: 'Open', exact: true }).first().click();
    await page.getByRole('button', { name: 'Back to library' }).waitFor({ timeout: 30_000 });
    await expect(page.getByLabel('Go to page')).toHaveValue('5');
    await captureStep(page, 'library-per-device-state');
  });

  test('shows a cover thumbnail for imported PDFs', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.samplePdf);
    const cover = page.locator('.book-card__image').first();
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute('src', /^data:image\/jpeg/);
    await captureStep(page, 'library-cover-thumbnail');
  });

  test('recognizes duplicate imports and keeps reading state', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.samplePdf);
    await openFirstBook(page);
    await page.getByLabel('Go to page').fill('5');
    await page.getByLabel('Go to page').press('Enter');
    await page.getByRole('button', { name: 'Back to library' }).click();
    await page.setInputFiles('[data-testid="file-input"]', FIXTURE_FILES.samplePdf);
    await expect(page.getByText('already in your library')).toBeVisible();
    await captureStep(page, 'library-duplicate-import');
  });

  test('marks scanned PDFs with a Scanned badge', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.scannedPdf);
    await expect(page.locator('.book-card__badge', { hasText: 'Scanned' })).toBeVisible();
    await captureStep(page, 'library-scanned-badge');
  });

  test('removes a book from the library', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.samplePdf);
    await page.getByRole('button', { name: /Remove/ }).click();
    await expect(page.getByText('No books yet.')).toBeVisible();
    await captureStep(page, 'library-after-remove');
  });
});
