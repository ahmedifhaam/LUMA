import { test, expect } from '@playwright/test';
import {
  pullReadingSessions,
  pushReadingSession,
  savePhase2Video,
  setDeviceId,
  signInViaUi,
} from './helpers/cloud-utils';

test.describe('Phase 2 cross-device sync', () => {
  test('syncs reading sessions between two devices', async ({ browser }) => {
    const bookId = 'test-book-sync-001';

    const deviceA = await browser.newContext();
    const deviceB = await browser.newContext();
    const pageA = await deviceA.newPage();
    const pageB = await deviceB.newPage();

    await setDeviceId(pageA, 'phase2-device-a');
    await setDeviceId(pageB, 'phase2-device-b');

    await pageA.goto('/');
    await pageB.goto('/');

    await signInViaUi(pageA);
    await signInViaUi(pageB);

    await pushReadingSession(pageA, {
      bookId,
      deviceId: 'phase2-device-a',
      deviceName: 'Test Laptop',
      progress: 0.42,
      pageNumber: 21,
    });

    const sessionsOnB = await pullReadingSessions(pageB, bookId);
    expect(sessionsOnB.some((s) => s.deviceId === 'phase2-device-a')).toBe(true);
    expect(sessionsOnB.find((s) => s.deviceId === 'phase2-device-a')?.progress).toBeCloseTo(
      0.42,
      2,
    );

    await savePhase2Video(pageA, 'phase2-cross-device-sync-a');
    await savePhase2Video(pageB, 'phase2-cross-device-sync-b');

    await deviceA.close();
    await deviceB.close();
  });
});
