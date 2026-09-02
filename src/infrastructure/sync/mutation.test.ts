import { describe, expect, it } from 'vitest';
import {
  bookDeviceKey,
  createMutationId,
  createSyncMutation,
  syncBackoffMs,
} from './mutation';

describe('sync mutation helpers', () => {
  it('builds stable mutation ids', () => {
    expect(createMutationId('device-a', 'book-1', 1_700_000_000_000)).toBe(
      'device-a:book-1:1700000000000',
    );
  });

  it('builds book-device keys for coalescing', () => {
    expect(bookDeviceKey('book-1', 'device-a')).toBe('book-1:device-a');
  });

  it('applies exponential backoff capped at one minute', () => {
    expect(syncBackoffMs(0)).toBe(1_000);
    expect(syncBackoffMs(1)).toBe(2_000);
    expect(syncBackoffMs(10)).toBe(60_000);
  });

  it('creates a mutation ready for immediate flush', () => {
    const mutation = createSyncMutation(
      'book-1',
      {
        deviceId: 'device-a',
        deviceName: 'Laptop',
        location: { format: 'pdf', locator: { pageNumber: 3, yOffset: 0 } },
        progress: 0.3,
        lastActiveAt: 100,
      },
      200,
    );

    expect(mutation.mutationId).toBe('device-a:book-1:100');
    expect(mutation.bookDeviceKey).toBe('book-1:device-a');
    expect(mutation.nextAttemptAt).toBe(200);
    expect(mutation.attemptCount).toBe(0);
  });
});
