import { expect, test } from '@playwright/test';
import {
  FIXTURE_FILES,
  captureViewport,
  importBook,
  openFirstBook,
  setReaderLayout,
  waitForReaderReady,
} from './helpers/test-utils';

const VIEW_MODES = ['single', 'double', 'continuous'] as const;
const FIT_MODES = ['width', 'screen'] as const;
const ZOOM_LEVELS = ['100%', '125%', '150%'] as const;

test.describe('reader layout screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await importBook(page, FIXTURE_FILES.tocPdf);
    await openFirstBook(page);
    await waitForReaderReady(page);
  });

  for (const view of VIEW_MODES) {
    for (const fit of FIT_MODES) {
      for (const zoom of ZOOM_LEVELS) {
        test(`captures ${view} / ${fit} / ${zoom}`, async ({ page }) => {
          await setReaderLayout(page, { view, fit, zoom });
          await captureViewport(page, `layout-pdf-${view}-${fit}-zoom${zoom.replace('%', '')}`);
        });
      }
    }
  }
});

test.describe('reader layout behavior', () => {
  test('advances both pages together in double view', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.tocPdf);
    await openFirstBook(page);
    await waitForReaderReady(page);
    await setReaderLayout(page, { view: 'double', fit: 'width' });

    await expect(page.getByTestId('page-1')).toBeVisible();
    await expect(page.getByTestId('page-2')).toBeVisible();

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByLabel('Go to page')).toHaveValue('3');
    await expect(page.getByTestId('page-3')).toBeVisible();
    await expect(page.getByTestId('page-4')).toBeVisible();
  });

  test('does not scroll inside a paginated EPUB page in double view', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.sampleEpub);
    await openFirstBook(page);
    await waitForReaderReady(page);
    await setReaderLayout(page, { view: 'double', fit: 'screen' });

    const rightPage = page.locator('.reader-slot--double .page-slot').nth(1);
    await rightPage.hover();
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(150);

    const layerScroll = await rightPage
      .locator('.epub-text-layer')
      .evaluate((el) => el.scrollTop)
      .catch(() => 0);

    expect(layerScroll).toBe(0);
  });
});
