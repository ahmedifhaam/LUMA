import { join } from 'node:path';
import type { Page } from '@playwright/test';

export const PHASE2_TEST_USER = {
  username: 'testuser',
  password: 'testpass',
} as const;

export const PR_VIDEOS_DIR = join(process.cwd(), 'e2e', 'artifacts', 'pr-videos');

const API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export async function signInViaUi(
  page: Page,
  username = PHASE2_TEST_USER.username,
  password = PHASE2_TEST_USER.password,
): Promise<void> {
  await page.getByTestId('auth-sign-in-button').click();
  await page.getByTestId('auth-username').fill(username);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
  await page.getByTestId('auth-user-label').waitFor({ timeout: 15_000 });
}

export async function savePhase2Video(page: Page, name: string): Promise<void> {
  await page.close();
  const video = page.video();
  if (!video) return;
  const { mkdirSync } = await import('node:fs');
  mkdirSync(PR_VIDEOS_DIR, { recursive: true });
  await video.saveAs(join(PR_VIDEOS_DIR, `${name}.webm`));
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
  bookId: string,
): Promise<Array<{ deviceId: string; deviceName: string; progress: number }>> {
  return page.evaluate(
    async ({ bookId, apiBaseUrl }) => {
      const token = localStorage.getItem('luma-auth-token');
      if (!token) throw new Error('Missing auth token');

      const url = new URL(`${apiBaseUrl}/sync/pull`);
      url.searchParams.set('cursor', '0');
      url.searchParams.set('bookId', bookId);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Pull failed: ${response.status}`);

      const data = (await response.json()) as {
        sessions: Array<{ deviceId: string; deviceName: string; progress: number }>;
      };
      return data.sessions;
    },
    { bookId, apiBaseUrl: API_BASE_URL },
  );
}

export async function setDeviceId(page: Page, deviceId: string): Promise<void> {
  await page.evaluate((id) => {
    localStorage.setItem('luma-device-id', id);
  }, deviceId);
}
