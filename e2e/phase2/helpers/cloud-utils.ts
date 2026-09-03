import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

export const PHASE2_TEST_USER = {
  username: 'testuser',
  password: 'testpass',
} as const;

export const PR_VIDEOS_DIR = join(process.cwd(), 'e2e', 'artifacts', 'pr-videos');

const API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

const PHASE2_VIEWPORT = { width: 1280, height: 800 };

/** Browser context with video recording (required for manually created contexts). */
export async function createPhase2Context(browser: Browser): Promise<BrowserContext> {
  mkdirSync(join(PR_VIDEOS_DIR, '_raw'), { recursive: true });
  return browser.newContext({
    viewport: PHASE2_VIEWPORT,
    recordVideo: {
      dir: join(PR_VIDEOS_DIR, '_raw'),
      size: PHASE2_VIEWPORT,
    },
  });
}

export async function setDeviceId(page: Page, deviceId: string): Promise<void> {
  await page.evaluate((id) => {
    localStorage.setItem('luma-device-id', id);
  }, deviceId);
}

export async function setDeviceDisplayName(page: Page, name: string): Promise<void> {
  await page.evaluate((deviceName) => {
    localStorage.setItem('luma-device-name', deviceName);
  }, name);
}

export async function closeAppMenu(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
}

export async function signInViaUi(
  page: Page,
  username = PHASE2_TEST_USER.username,
  password = PHASE2_TEST_USER.password,
): Promise<void> {
  await page.getByTestId('app-menu-trigger').click();
  await page.getByTestId('app-menu-sign-in').click();
  await page.getByTestId('auth-username').fill(username);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
  await page.getByTestId('auth-modal').waitFor({ state: 'hidden', timeout: 15_000 });
  await page.getByTestId('app-menu-trigger').click();
  await page.getByTestId('auth-user-label').waitFor({ timeout: 15_000 });
}

/** Connect Google Drive via mock OAuth (GOOGLE_MOCK / VITE_DRIVE_MOCK). */
export async function connectDriveViaUi(page: Page): Promise<void> {
  await page.getByTestId('app-menu-trigger').click();
  await Promise.all([
    page.waitForURL(/googleDrive=connected/, { timeout: 15_000 }),
    page.getByTestId('app-menu-drive-connect').click(),
  ]);
  await page.getByRole('heading', { name: 'My Library' }).waitFor({ timeout: 15_000 });
  await page.getByTestId('app-menu-trigger').click();
  await page.getByTestId('drive-connected-label').waitFor({ timeout: 15_000 });
  await closeAppMenu(page);
}

/** Import the mock Drive PDF into the library. */
export async function importDriveBookViaUi(page: Page): Promise<void> {
  await page.getByTestId('add-from-drive').click();
  await page.getByTestId('drive-picker-modal').waitFor({ timeout: 15_000 });
  await page.getByTestId('drive-file-mock-drive-pdf-1').click();
  await page.getByTestId('drive-picker-modal').waitFor({ state: 'hidden', timeout: 30_000 });
  await expect(page.locator('.book-card').first()).toBeVisible({ timeout: 15_000 });
}

export async function savePhase2Video(page: Page, name: string): Promise<void> {
  mkdirSync(PR_VIDEOS_DIR, { recursive: true });
  const video = page.video();
  await page.close();
  if (!video) {
    throw new Error(`No video attachment for "${name}" — ensure video: 'on' or recordVideo context`);
  }
  await video.saveAs(join(PR_VIDEOS_DIR, `${name}.webm`));
}

export async function saveContextVideo(
  context: BrowserContext,
  page: Page,
  name: string,
): Promise<void> {
  mkdirSync(PR_VIDEOS_DIR, { recursive: true });
  const video = page.video();
  await page.close();
  await context.close();
  if (!video) {
    throw new Error(`No video attachment for "${name}" — use createPhase2Context()`);
  }
  await video.saveAs(join(PR_VIDEOS_DIR, `${name}.webm`));
}

export type Phase2Recording = {
  file: string;
  title: string;
  description: string;
};

export function writeRecordingsManifest(recordings: Phase2Recording[]): void {
  mkdirSync(PR_VIDEOS_DIR, { recursive: true });
  writeFileSync(
    join(PR_VIDEOS_DIR, 'manifest.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), recordings }, null, 2)}\n`,
  );
}

export async function pushReadingSession(
  page: Page,
  payload: {
    bookId: string;
    deviceId: string;
    deviceName: string;
    progress: number;
    pageNumber: number;
  },
): Promise<void> {
  await page.evaluate(
    async ({ body, apiBaseUrl }) => {
      const token = localStorage.getItem('luma-auth-token');
      if (!token) throw new Error('Missing auth token');

      const response = await fetch(`${apiBaseUrl}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: body.bookId,
          deviceId: body.deviceId,
          deviceName: body.deviceName,
          progress: body.progress,
          lastActiveAt: Date.now(),
          location: {
            format: 'pdf',
            locator: { pageNumber: body.pageNumber, yOffset: 0 },
          },
          mutationId: `${body.deviceId}:${body.bookId}:${body.pageNumber}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Push failed: ${response.status}`);
      }
    },
    { body: payload, apiBaseUrl: API_BASE_URL },
  );
}

export async function pullReadingSessions(
  page: Page,
  bookId?: string,
): Promise<Array<{ deviceId: string; deviceName: string; progress: number }>> {
  return page.evaluate(
    async ({ bookId, apiBaseUrl }) => {
      const token = localStorage.getItem('luma-auth-token');
      if (!token) throw new Error('Missing auth token');

      const url = new URL(`${apiBaseUrl}/sync/pull`);
      url.searchParams.set('cursor', '0');
      if (bookId) url.searchParams.set('bookId', bookId);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Pull failed: ${response.status}`);

      const data = (await response.json()) as {
        sessions: Array<{ deviceId: string; deviceName: string; progress: number }>;
      };
      return data.sessions;
    },
    { bookId: bookId || undefined, apiBaseUrl: API_BASE_URL },
  );
}
