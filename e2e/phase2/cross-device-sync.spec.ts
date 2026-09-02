import { test, expect } from '@playwright/test';
import {
  createPhase2Context,
  pullReadingSessions,
  pushReadingSession,
  setDeviceId,
  signInViaUi,
} from './helpers/cloud-utils';

test.describe('Phase 2 cross-device sync', () => {
  test('syncs reading sessions between two devices', async ({ browser }) => {
    const bookId = 'test-book-sync-001';

    const deviceA = await createPhase2Context(browser);
    const deviceB = await createPhase2Context(browser);
    const pageA = await deviceA.newPage();
    const pageB = await deviceB.newPage();

    await pageA.goto('/');
    await pageB.goto('/');

    await setDeviceId(pageA, 'phase2-device-a');
    await setDeviceId(pageB, 'phase2-device-b');

    await pageA.reload();
    await pageB.reload();

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

    await deviceA.close();
    await deviceB.close();
  });
});
