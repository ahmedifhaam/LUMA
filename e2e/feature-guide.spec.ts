import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  FEATURE_GUIDE_DIR,
  FIXTURE_FILES,
  captureGuideStep,
  importBook,
  openBookByTitle,
  searchMatchCount,
  setReaderLayout,
  waitForReaderReady,
} from './helpers/test-utils';

/**
 * Captures screenshots and a walkthrough video for docs/LUMA-v1-Feature-Guide.md.
 * Run: npm run test:feature-guide
 */
test.describe.configure({ mode: 'serial' });

test.describe('LUMA v1 feature guide', () => {
  test('capture screenshots and video for the feature documentation', async ({ page }) => {
    test.setTimeout(180_000);
    // ── Library ──────────────────────────────────────────────────────────────
    await page.goto('/');
    await captureGuideStep(page, '01-library-empty');

    await importBook(page, FIXTURE_FILES.samplePdf);
    await captureGuideStep(page, '02-library-pdf-imported');

    await importBook(page, FIXTURE_FILES.sampleEpub);
    await captureGuideStep(page, '03-library-pdf-and-epub');

    await importBook(page, FIXTURE_FILES.scannedPdf);
    await expect(page.locator('.book-card__badge', { hasText: 'Scanned' })).toBeVisible();
    await captureGuideStep(page, '04-library-scanned-badge');

    await importBook(page, FIXTURE_FILES.tocPdf);
    await captureGuideStep(page, '05-library-full-grid');

    // ── PDF reader ───────────────────────────────────────────────────────────
    await openBookByTitle(page, 'sample-book');
    await waitForReaderReady(page);
    await captureGuideStep(page, '06-reader-pdf-default');

    await page.getByRole('button', { name: 'Next page' }).click();
    await page.waitForTimeout(300);
    await captureGuideStep(page, '07-reader-pdf-page-two');

    const bottomBar = page.getByTestId('reader-bottom-bar');
    await setReaderLayout(page, { view: 'double', fit: 'width' });
    await captureGuideStep(page, '08-reader-double-view', { viewport: true });

    await setReaderLayout(page, { view: 'continuous', fit: 'screen' });
    await captureGuideStep(page, '09-reader-continuous-view', { viewport: true });

    await bottomBar.getByTestId('zoom-in').click();
    await bottomBar.getByTestId('zoom-in').click();
    await captureGuideStep(page, '10-reader-zoomed', { viewport: true });

    await bottomBar.getByTestId('theme-sepia').click();
    await captureGuideStep(page, '11-reader-sepia-theme', { viewport: true });

    await bottomBar.getByTestId('theme-light').click();

    // Table of contents (PDF with outline)
    await page.getByRole('button', { name: 'Back to library' }).click();
    await openBookByTitle(page, 'toc-book');
    await waitForReaderReady(page);
    await page.getByRole('button', { name: 'Contents', exact: true }).click();
    await captureGuideStep(page, '12-reader-contents-panel');

    // Search
    await page.getByRole('button', { name: 'Close panel' }).click();
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByLabel('Search this book').fill('machine-readable');
    await expect(page.getByTestId('search-count')).toContainText(searchMatchCount, {
      timeout: 30_000,
    });
    await captureGuideStep(page, '13-reader-search-results');

    // Bookmarks
    await page.getByRole('button', { name: 'Close panel' }).click();
    await page.getByRole('button', { name: 'Bookmark this page' }).click();
    await page.getByRole('button', { name: 'Bookmarks', exact: true }).click();
    await captureGuideStep(page, '14-reader-bookmarks-panel');

    // Notes panel
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await captureGuideStep(page, '15-reader-notes-panel');

    // Keyboard shortcuts help
    await page.getByRole('button', { name: 'Close panel' }).click();
    await page.getByTestId('app-menu-trigger').click();
    await page.getByTestId('open-shortcuts').click();
    await captureGuideStep(page, '16-keyboard-shortcuts-help');

    await page.getByRole('button', { name: '← Back' }).click();
    await page.locator('.reader__viewport').click();
    await page.keyboard.press('Home');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await captureGuideStep(page, '17-reader-keyboard-navigation', { viewport: true });

    // Scanned PDF warning
    await page.getByRole('button', { name: 'Back to library' }).click();
    await openBookByTitle(page, 'scanned-book');
    await waitForReaderReady(page);
    await expect(page.getByTestId('image-warning')).toBeVisible();
    await captureGuideStep(page, '18-reader-scanned-warning');

    // ── EPUB reader ──────────────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Back to library' }).click();
    await openBookByTitle(page, 'LUMA Sample EPUB');
    await waitForReaderReady(page);
    await expect(page.getByText('Chapter One')).toBeVisible();
    await captureGuideStep(page, '19-epub-chapter-one', { viewport: true });

    await page.getByRole('button', { name: 'Contents', exact: true }).click();
    await page.getByRole('button', { name: 'Chapter Two' }).click();
    await expect(page.getByText('Second chapter')).toBeVisible();
    await captureGuideStep(page, '20-epub-chapter-two', { viewport: true });

    await bottomBar.getByTestId('text-larger').click();
    await captureGuideStep(page, '21-epub-text-size', { viewport: true });

    // EPUB highlight
    await page.getByRole('button', { name: 'Close panel' }).click();
    const paragraph = page.locator('.epub-chapter-body p').first();
    await paragraph.scrollIntoViewIfNeeded();
    const box = await paragraph.boundingBox();
    if (!box) throw new Error('EPUB paragraph not visible');
    await page.mouse.move(box.x + 8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2);
    await page.mouse.up();
    await page.getByRole('button', { name: 'Highlight' }).click();
    await page.waitForTimeout(400);
    await captureGuideStep(page, '22-epub-highlight', { viewport: true });

    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await expect(page.getByText('Highlight')).toBeVisible();
    await captureGuideStep(page, '23-epub-notes-with-highlight');

    // Continue reading from library
    await page.getByRole('button', { name: 'Back to library' }).click();
    await expect(page.locator('.continue-card')).toBeVisible();
    await captureGuideStep(page, '24-library-continue-reading');

    // Video is only finalized after the page closes.
    await page.close();
    const video = page.video();
    if (video) {
      const { mkdirSync } = await import('node:fs');
      mkdirSync(FEATURE_GUIDE_DIR, { recursive: true });
      await video.saveAs(join(FEATURE_GUIDE_DIR, 'luma-v1-feature-tour.webm'));
    }
  });
});
