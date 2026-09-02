import type { ContinuationOffer, DeviceSession, ReadingLocationEnvelope } from './types';

/** Continuation window per sync spec (7 days). */
export const CONTINUATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function locationsEqual(a: ReadingLocationEnvelope, b: ReadingLocationEnvelope): boolean {
  if (a.format !== b.format) return false;
  return JSON.stringify(a.locator) === JSON.stringify(b.locator);
}

/**
 * Finds the most recent qualifying cross-device continuation offer.
 *
 * A session qualifies when:
 * - lastActiveAt is within the 7-day window
 * - deviceId differs from the current device
 * - location differs from the current device's track
 */
export function findContinuationOffer(
  sessions: DeviceSession[],
  currentDeviceId: string,
  currentLocation: ReadingLocationEnvelope,
  now: number,
): ContinuationOffer {
  const cutoff = now - CONTINUATION_WINDOW_MS;

  const qualifying = sessions
    .filter(
      (session) =>
        session.deviceId !== currentDeviceId &&
        session.lastActiveAt >= cutoff &&
        !locationsEqual(session.location, currentLocation),
    )
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt);

  const best = qualifying[0];
  if (!best) return null;

  return { fromDeviceName: best.deviceName, session: best };
}
