import type { ReadingLocationEnvelope } from './types';

export interface SyncMutation {
  mutationId: string;
  bookId: string;
  bookDeviceKey: string;
  deviceId: string;
  deviceName: string;
  location: ReadingLocationEnvelope;
  progress: number;
  lastActiveAt: number;
  createdAt: number;
  attemptCount: number;
  nextAttemptAt: number;
}

export function bookDeviceKey(bookId: string, deviceId: string): string {
  return `${bookId}:${deviceId}`;
}

export function createMutationId(deviceId: string, bookId: string, lastActiveAt: number): string {
  return `${deviceId}:${bookId}:${lastActiveAt}`;
}

export function syncBackoffMs(attemptCount: number): number {
  return Math.min(1_000 * 2 ** attemptCount, 60_000);
}

export function createSyncMutation(
  bookId: string,
  state: {
    deviceId: string;
    deviceName: string;
    location: ReadingLocationEnvelope;
    progress: number;
    lastActiveAt: number;
  },
  now = Date.now(),
): SyncMutation {
  const mutationId = createMutationId(state.deviceId, bookId, state.lastActiveAt);
  return {
    mutationId,
    bookId,
    bookDeviceKey: bookDeviceKey(bookId, state.deviceId),
    deviceId: state.deviceId,
    deviceName: state.deviceName,
    location: state.location,
    progress: state.progress,
    lastActiveAt: state.lastActiveAt,
    createdAt: now,
    attemptCount: 0,
    nextAttemptAt: now,
  };
}
