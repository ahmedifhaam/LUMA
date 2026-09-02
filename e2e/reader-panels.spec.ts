import { expect, test } from '@playwright/test';
import {
  FIXTURE_FILES,
  bookmarkInPanel,
  captureStep,
  importBook,
  openFirstBook,
  searchMatchCount,
  waitForReaderReady,
} from './helpers/test-utils';

test.describe('reader panels', () => {
  test('navigates via table of contents', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.tocPdf);
    await openFirstBook(page);
    await waitForReaderReady(page);

    await page.getByRole('button', { name: 'Contents', exact: true }).click();
    await expect(page.getByText('Chapter 2')).toBeVisible();
    await page.getByRole('button', { name: /Chapter 2/ }).click();
    await expect(page.getByLabel('Go to page')).toHaveValue('11');
    await captureStep(page, 'reader-toc-navigation');
  });

  test('searches within the current book', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.samplePdf);
    await openFirstBook(page);
    await waitForReaderReady(page);

    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByLabel('Search this book').fill('machine-readable');
    await expect(page.getByTestId('search-count')).toContainText(searchMatchCount, {
      timeout: 30_000,
    });
    await captureStep(page, 'reader-search-results');

    await page.getByRole('button', { name: /Page \d+/ }).first().click();
    await expect(page.locator('[data-testid^="page-"] canvas').first()).toBeVisible();
    await captureStep(page, 'reader-search-jump');
  });

  test('shows image warning for scanned PDFs', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.scannedPdf);
    await openFirstBook(page);
    await waitForReaderReady(page);

    await expect(page.getByTestId('image-warning')).toBeVisible();
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByRole('complementary').getByText('no searchable text')).toBeVisible();
    await captureStep(page, 'reader-scanned-warning');
  });

  test('lists bookmarks in the bookmarks panel', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.samplePdf);
    await openFirstBook(page);
    await waitForReaderReady(page);

    await page.getByRole('button', { name: 'Bookmark this page' }).click();
    await page.getByLabel('Go to page').fill('4');
    await page.getByLabel('Go to page').press('Enter');
    await page.getByRole('button', { name: 'Bookmark this page' }).click();

    await page.getByRole('button', { name: 'Bookmarks', exact: true }).click();
    await expect(bookmarkInPanel(page, 1)).toBeVisible();
    await expect(bookmarkInPanel(page, 4)).toBeVisible();
    await captureStep(page, 'reader-bookmarks-panel');
  });
});
