import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Phase 1 performance harness (brief sections 5, 7, 2.10).
 *
 * Proves the large-document architecture: opening and jumping around a very
 * large PDF must not scale DOM/render work with page count. Set PERF_PAGES to
 * model the ~15,000-page stress target (default 4000 keeps CI time bounded).
 *
 * Timings are measured and reported against the brief's targets. Assertions use
 * lenient ceilings (shared CI hardware varies) plus a strict bound on rendered
 * page nodes, which is the real invariant.
 */
const PERF_PAGES = Number(process.env.PERF_PAGES || 4000);
const PERF_PDF = join(tmpdir(), `luma-perf-${PERF_PAGES}.pdf`);

// Targets from the brief, for reporting.
const TARGET = { openMs: 1000, jumpMs: 3000, searchMs: 5000 };

test.describe('performance (large document)', () => {
  test.setTimeout(240_000);

  test.beforeAll(() => {
    execFileSync('node', ['scripts/make-perf-pdf.mjs', PERF_PDF, String(PERF_PAGES)], {
      stdio: 'inherit',
    });
  });

  test('opens, jumps, and searches a very large PDF with bounded rendering', async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'chromium', 'perf runs once');
    await page.goto('/');
    await page.setInputFiles('[data-testid="file-input"]', PERF_PDF);
    await expect(
      page.getByRole('button', { name: 'Open', exact: true }).first(),
    ).toBeVisible({
      timeout: 60_000,
    });

    // OPEN: time from opening the book to the first page being rendered.
    const openStart = Date.now();
    await page.getByRole('button', { name: 'Open', exact: true }).first().click();
    await page.locator('[data-testid="page-1"] canvas').waitFor({ timeout: 30_000 });
    const openMs = Date.now() - openStart;

    // Bounded rendering: page count must not drive DOM node count.
    const slotsAfterOpen = await page.locator('.page-slot').count();
    expect(slotsAfterOpen).toBeLessThanOrEqual(20);

    // JUMP: direct navigation to a distant page must not render intervening ones.
    const target = PERF_PAGES - 50;
    const jumpStart = Date.now();
    const pageInput = page.getByLabel('Go to page');
    await pageInput.fill(String(target));
    await pageInput.press('Enter');
    await page
      .locator(`[data-testid="page-${target}"] canvas`)
      .waitFor({ timeout: 30_000 });
    const jumpMs = Date.now() - jumpStart;

    const slotsAfterJump = await page.locator('.page-slot').count();
    expect(slotsAfterJump).toBeLessThanOrEqual(20);

    // SEARCH: a term present on early pages should return matches quickly, as
    // the index builds incrementally.
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const searchStart = Date.now();
    await page.getByLabel('Search this book').fill('machine');
    await expect(page.getByTestId('search-count')).toContainText('pages with matches', {
      timeout: 60_000,
    });
    const searchMs = Date.now() - searchStart;

    const report = [
      '',
      `LUMA performance harness — ${PERF_PAGES.toLocaleString()} pages`,
      `  rendered page nodes:  ${slotsAfterJump} (bounded, not ${PERF_PAGES.toLocaleString()})`,
      `  open:                 ${openMs} ms   (target ${TARGET.openMs} ms)`,
      `  jump to page ${target}: ${jumpMs} ms   (target ${TARGET.jumpMs} ms)`,
      `  first-match search:   ${searchMs} ms   (target ${TARGET.searchMs} ms)`,
      '',
    ].join('\n');
    console.log(report);
    test.info().annotations.push({ type: 'performance', description: report });

    // Lenient ceilings to catch gross regressions on variable CI hardware.
    expect(openMs).toBeLessThan(20_000);
    expect(jumpMs).toBeLessThan(15_000);
    expect(searchMs).toBeLessThan(30_000);
  });
});
