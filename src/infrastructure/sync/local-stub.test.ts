import { describe, expect, it } from 'vitest';
import { LocalSyncStub } from './local-stub';

describe('LocalSyncStub', () => {
  const sync = new LocalSyncStub();

  it('pushReadingState is a no-op', async () => {
    await expect(
      sync.pushReadingState('book-1', {
        deviceId: 'd1',
        deviceName: 'Test',
        location: { format: 'pdf', locator: { pageNumber: 0 } },
        progress: 0,
        lastActiveAt: Date.now(),
      }),
    ).resolves.toBeUndefined();
  });

  it('pullReadingState returns an empty array', async () => {
    await expect(sync.pullReadingState('book-1')).resolves.toEqual([]);
  });

  it('getContinuationOffer returns null', async () => {
    await expect(
      sync.getContinuationOffer('book-1', 'device-1', {
        format: 'pdf',
        locator: { pageNumber: 1, yOffset: 0 },
      }),
    ).resolves.toBeNull();
  });

  it('syncNow is a no-op', async () => {
    await expect(sync.syncNow()).resolves.toBeUndefined();
  });
});
