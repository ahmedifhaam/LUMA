import { describe, expect, it } from 'vitest';
import { CONTINUATION_WINDOW_MS, findContinuationOffer } from './continuation';
import type { DeviceSession, ReadingLocationEnvelope } from './types';

const NOW = 1_700_000_000_000;
const BOOK_ID = 'book-abc';

function makeSession(overrides: Partial<DeviceSession> = {}): DeviceSession {
  return {
    deviceId: 'device-other',
    deviceName: 'Work Laptop',
    bookId: BOOK_ID,
    location: { format: 'pdf', locator: { pageNumber: 10, yOffset: 0.2 } },
    progress: 0.34,
    lastActiveAt: NOW - 60_000,
    ...overrides,
  };
}

const currentLocation: ReadingLocationEnvelope = {
  format: 'pdf',
  locator: { pageNumber: 1, yOffset: 0 },
};

describe('findContinuationOffer', () => {
  it('returns the most recent qualifying session from another device', () => {
    const sessions = [
      makeSession({
        deviceId: 'device-a',
        deviceName: 'Phone',
        lastActiveAt: NOW - 120_000,
        location: { format: 'pdf', locator: { pageNumber: 5, yOffset: 0 } },
      }),
      makeSession({
        deviceId: 'device-b',
        deviceName: 'Tablet',
        lastActiveAt: NOW - 30_000,
        location: { format: 'pdf', locator: { pageNumber: 12, yOffset: 0.1 } },
      }),
    ];

    const offer = findContinuationOffer(sessions, 'device-current', currentLocation, NOW);

    expect(offer).toEqual({
      fromDeviceName: 'Tablet',
      session: sessions[1],
    });
  });

  it('excludes sessions older than the 7-day window', () => {
    const sessions = [
      makeSession({
        lastActiveAt: NOW - CONTINUATION_WINDOW_MS - 1,
        location: { format: 'pdf', locator: { pageNumber: 20, yOffset: 0 } },
      }),
    ];

    expect(findContinuationOffer(sessions, 'device-current', currentLocation, NOW)).toBeNull();
  });

  it('includes sessions exactly at the 7-day boundary', () => {
    const sessions = [
      makeSession({
        lastActiveAt: NOW - CONTINUATION_WINDOW_MS,
        location: { format: 'pdf', locator: { pageNumber: 20, yOffset: 0 } },
      }),
    ];

    const offer = findContinuationOffer(sessions, 'device-current', currentLocation, NOW);
    expect(offer?.fromDeviceName).toBe('Work Laptop');
  });

  it('excludes the current device', () => {
    const sessions = [
      makeSession({
        deviceId: 'device-current',
        deviceName: 'This Device',
        location: { format: 'pdf', locator: { pageNumber: 20, yOffset: 0 } },
      }),
    ];

    expect(findContinuationOffer(sessions, 'device-current', currentLocation, NOW)).toBeNull();
  });

  it('excludes sessions at the same position as the current device track', () => {
    const sessions = [
      makeSession({
        location: { format: 'pdf', locator: { pageNumber: 1, yOffset: 0 } },
      }),
    ];

    expect(findContinuationOffer(sessions, 'device-current', currentLocation, NOW)).toBeNull();
  });

  it('returns null when no sessions qualify', () => {
    expect(findContinuationOffer([], 'device-current', currentLocation, NOW)).toBeNull();
  });
});
