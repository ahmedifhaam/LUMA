import { join } from 'node:path';
import type { Page } from '@playwright/test';

export const FIXTURES = join(process.cwd(), 'e2e', 'fixtures');
export const SCREENSHOTS = join(process.cwd(), 'e2e', 'artifacts', 'screenshots');

export const FIXTURE_FILES = {
  samplePdf: join(FIXTURES, 'sample-book.pdf'),
  scannedPdf: join(FIXTURES, 'scanned-book.pdf'),
  tocPdf: join(FIXTURES, 'toc-book.pdf'),
  sampleEpub: join(FIXTURES, 'sample-book.epub'),
} as const;

/** Capture a named screenshot for feature documentation. */
export async function captureStep(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: join(SCREENSHOTS, `${name}.png`),
    fullPage: true,
  });
}

export async function importBook(page: Page, filePath: string): Promise<void> {
  await page.goto('/');
  await page.setInputFiles('[data-testid="file-input"]', filePath);
  await page.getByRole('button', { name: 'Open', exact: true }).first().waitFor({
    timeout: 30_000,
  });
}

export async function openFirstBook(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open', exact: true }).first().click();
  await page.locator('[data-testid="page-1"]').waitFor({ timeout: 30_000 });
}

export async function waitForReaderReady(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Back to library' }).waitFor({ timeout: 30_000 });
  await page.locator('[data-testid="page-1"]').waitFor({ timeout: 30_000 });
}

export function bookmarkInPanel(page: Page, pageNumber: number) {
  return page.getByRole('button', { name: `Page ${pageNumber}`, exact: true });
}

export const searchMatchCount = /page(s)? with matches/;

export async function currentPageNumber(page: Page): Promise<number> {
  const value = await page.getByLabel('Go to page').inputValue();
  return Number.parseInt(value, 10);
}
