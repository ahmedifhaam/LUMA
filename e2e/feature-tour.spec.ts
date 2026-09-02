import { expect, test } from '@playwright/test';
import {
  FIXTURE_FILES,
  captureStep,
  importBook,
  searchMatchCount,
  waitForReaderReady,
} from './helpers/test-utils';

/**
 * Serial feature tour that records video and captures screenshots at each step.
 * Run with: npx playwright test --project=feature-tour
 */
test.describe.configure({ mode: 'serial' });

test.describe('LUMA feature tour', () => {
  test('documents the Phase 1 reading experience end-to-end', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, 'tour-01-empty-library');

    await importBook(page, FIXTURE_FILES.samplePdf);
    await captureStep(page, 'tour-02-library-with-pdf');

    await importBook(page, FIXTURE_FILES.sampleEpub);
    await captureStep(page, 'tour-03-library-with-epub');

    await page.getByRole('button', { name: /Open sample-book/i }).click();
    await waitForReaderReady(page);
    await captureStep(page, 'tour-04-reader-page-one');

    await page.getByRole('button', { name: 'Next page' }).click();
    await page.waitForTimeout(300);
    await captureStep(page, 'tour-05-reader-page-two');

    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByLabel('Search this book').fill('machine');
    await expect(page.getByTestId('search-count')).toContainText(searchMatchCount, {
      timeout: 30_000,
    });
    await captureStep(page, 'tour-06-search-panel');

    await page.getByRole('button', { name: 'Close panel' }).click();
    await page.getByRole('button', { name: 'Bookmark this page' }).click();
    await page.getByRole('button', { name: 'Bookmarks', exact: true }).click();
    await captureStep(page, 'tour-07-bookmarks-panel');

    await page.getByRole('button', { name: 'Back to library' }).click();
    await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible();
    await captureStep(page, 'tour-08-return-to-library');
  });
});
