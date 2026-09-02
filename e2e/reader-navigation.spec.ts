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

test.describe('reader navigation', () => {
  test.beforeEach(async ({ page }) => {
    await importBook(page, FIXTURE_FILES.samplePdf);
    await openFirstBook(page);
    await waitForReaderReady(page);
  });

  test('navigates with toolbar controls and page input', async ({ page }) => {
    await expect(page.getByLabel('Go to page')).toHaveValue('1');
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByLabel('Go to page')).toHaveValue('2');
    await page.getByLabel('Go to page').fill('8');
    await page.getByLabel('Go to page').press('Enter');
    await expect(page.getByLabel('Go to page')).toHaveValue('8');
    await captureStep(page, 'reader-page-navigation');
  });

  test('returns to the library', async ({ page }) => {
    await page.getByRole('button', { name: 'Back to library' }).click();
    await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible();
    await captureStep(page, 'reader-back-to-library');
  });

  test('switches layout modes from the bottom bar', async ({ page }) => {
    await expect(page.getByLabel('Reading layout controls')).toBeVisible();
    await page.getByTestId('view-mode-single').click();
    await expect(page.locator('.reader__viewport--paginated')).toBeVisible();
    await page.getByTestId('view-mode-double').click();
    await expect(page.locator('.reader-slot--double').first()).toBeVisible();
    await page.getByRole('button', { name: 'Fit screen' }).click();
    await captureStep(page, 'reader-layout-bottom-bar');
  });
});

test.describe('reader keyboard shortcuts', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'keyboard shortcuts are desktop-only');
    await importBook(page, FIXTURE_FILES.samplePdf);
    await openFirstBook(page);
    await waitForReaderReady(page);
    await page.locator('.reader__viewport').click();
  });

  test('arrow keys and space move between pages', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await expect(page.getByLabel('Go to page')).toHaveValue('2');
    await page.keyboard.press(' ');
    await expect(page.getByLabel('Go to page')).toHaveValue('3');
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByLabel('Go to page')).toHaveValue('2');
    await captureStep(page, 'reader-keyboard-page-nav');
  });

  test('home and end jump to first and last page', async ({ page }) => {
    await page.keyboard.press('End');
    await expect(page.getByLabel('Go to page')).toHaveValue('12');
    await page.keyboard.press('Home');
    await expect(page.getByLabel('Go to page')).toHaveValue('1');
    await captureStep(page, 'reader-keyboard-home-end');
  });

  test('b toggles bookmark on the current page', async ({ page }) => {
    await page.keyboard.press('b');
    await page.getByRole('button', { name: 'Bookmarks', exact: true }).click();
    await expect(bookmarkInPanel(page, 1)).toBeVisible();
    await captureStep(page, 'reader-keyboard-bookmark');
  });

  test('slash and ctrl+f open the search panel', async ({ page }) => {
    await page.keyboard.press('/');
    await expect(page.getByLabel('Search this book')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+f');
    await expect(page.getByLabel('Search this book')).toBeVisible();
    await captureStep(page, 'reader-keyboard-search-panel');
  });

  test('escape closes panels', async ({ page }) => {
    await page.keyboard.press('/');
    await expect(page.getByLabel('Search this book')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByLabel('Search this book')).toBeHidden();
    await captureStep(page, 'reader-keyboard-escape');
  });

  test('ignores shortcuts while typing in the page input', async ({ page }) => {
    const input = page.getByLabel('Go to page');
    await input.click();
    await input.fill('');
    await page.keyboard.type('5');
    await expect(input).toHaveValue('5');
    await captureStep(page, 'reader-keyboard-input-focus');
  });
});
