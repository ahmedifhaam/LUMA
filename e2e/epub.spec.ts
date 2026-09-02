import { expect, test } from '@playwright/test';
import {
  FIXTURE_FILES,
  captureStep,
  importBook,
  openFirstBook,
  searchMatchCount,
  waitForReaderReady,
} from './helpers/test-utils';

test.describe('EPUB support', () => {
  test('imports an EPUB and shows cover thumbnail', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.sampleEpub);
    await expect(page.getByText('Added')).toBeVisible();
    await expect(page.locator('.book-card__image').first()).toBeVisible();
    await captureStep(page, 'epub-library-with-cover');
  });

  test('opens an EPUB and renders chapter content', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.sampleEpub);
    await openFirstBook(page);
    await waitForReaderReady(page);

    await expect(page.getByText('Chapter One')).toBeVisible();
    await expect(page.getByText('LUMA EPUB fixture text')).toBeVisible();
    await captureStep(page, 'epub-chapter-one');
  });

  test('navigates EPUB chapters via table of contents', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.sampleEpub);
    await openFirstBook(page);
    await waitForReaderReady(page);

    await page.getByRole('button', { name: 'Contents', exact: true }).click();
    await page.getByRole('button', { name: 'Chapter Two' }).click();
    await expect(page.getByLabel('Go to page')).toHaveValue('2');
    await expect(page.getByText('Second chapter')).toBeVisible();
    await captureStep(page, 'epub-toc-chapter-two');
  });

  test('searches text within an EPUB', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.sampleEpub);
    await openFirstBook(page);
    await waitForReaderReady(page);

    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByLabel('Search this book').fill('searchable EPUB');
    await expect(page.getByTestId('search-count')).toContainText(searchMatchCount, {
      timeout: 15_000,
    });
    await captureStep(page, 'epub-search-results');
  });
});
