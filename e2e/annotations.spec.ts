import { expect, test } from '@playwright/test';
import {
  FIXTURE_FILES,
  bookmarkInPanel,
  captureStep,
  importBook,
  openFirstBook,
  waitForReaderReady,
} from './helpers/test-utils';

async function expectEpubHighlightVisible(page: import('@playwright/test').Page): Promise<void> {
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const hasCssHighlight = [...CSS.highlights.keys()].some((name) =>
          name.startsWith('luma-epub-p'),
        );
        const hasOverlay = document.querySelector('.epub-highlights .page-highlight') !== null;
        return hasCssHighlight || hasOverlay;
      }),
    )
    .toBe(true);
}

test.describe('annotations', () => {
  test('creates and removes bookmarks from the toolbar', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.samplePdf);
    await openFirstBook(page);
    await waitForReaderReady(page);

    await page.getByRole('button', { name: 'Bookmark this page' }).click();
    await page.getByRole('button', { name: 'Bookmarks', exact: true }).click();
    await expect(bookmarkInPanel(page, 1)).toBeVisible();
    await captureStep(page, 'annotations-bookmark-created');

    await page
      .getByRole('button', { name: 'Remove bookmark on page 1' })
      .click();
    await expect(page.getByText('No bookmarks yet')).toBeVisible();
    await captureStep(page, 'annotations-bookmark-removed');
  });

  test('highlights selected text in an EPUB chapter', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.sampleEpub);
    await openFirstBook(page);
    await waitForReaderReady(page);

    const paragraph = page.locator('.epub-chapter-body p').first();
    await paragraph.scrollIntoViewIfNeeded();
    const box = await paragraph.boundingBox();
    if (!box) throw new Error('EPUB paragraph not visible');

    await page.mouse.move(box.x + 8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2);
    await page.mouse.up();

    await page.getByRole('button', { name: 'Highlight' }).click();
    await expectEpubHighlightVisible(page);

    const textLayer = page.locator('.epub-text-layer').first();
    await textLayer.evaluate((el) => {
      el.scrollTop = 120;
    });
    await expectEpubHighlightVisible(page);
    await captureStep(page, 'annotations-epub-highlight');
  });

  test('keeps EPUB highlights visible after increasing text size', async ({ page }) => {
    await importBook(page, FIXTURE_FILES.sampleEpub);
    await openFirstBook(page);
    await waitForReaderReady(page);

    const paragraph = page.locator('.epub-chapter-body p').first();
    await paragraph.scrollIntoViewIfNeeded();
    const box = await paragraph.boundingBox();
    if (!box) throw new Error('EPUB paragraph not visible');

    await page.mouse.move(box.x + 8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2);
    await page.mouse.up();

    await page.getByRole('button', { name: 'Highlight' }).click();
    await expectEpubHighlightVisible(page);

    await page.getByTestId('text-larger').click();
    await page.getByTestId('text-larger').click();
    await expectEpubHighlightVisible(page);
  });
});
