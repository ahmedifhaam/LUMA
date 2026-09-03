import type { ContinuationOffer, DeviceSession, ReadingLocationEnvelope } from './types';

/** Continuation window per sync spec (7 days). */
export const CONTINUATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function locationsEqual(a: ReadingLocationEnvelope, b: ReadingLocationEnvelope): boolean {
  if (a.format !== b.format) return false;
  return JSON.stringify(a.locator) === JSON.stringify(b.locator);
}

function contentVersionsCompatible(
  localVersion: string | null | undefined,
  remoteVersion: string | null | undefined,
): boolean {
  if (!localVersion || !remoteVersion) return true;
  return localVersion === remoteVersion;
}

/**
 * Finds the most recent qualifying cross-device continuation offer.
 *
 * A session qualifies when:
 * - lastActiveAt is within the 7-day window
 * - deviceId differs from the current device
 * - location differs from the current device's track
 *
 * When content versions differ, the offer is still returned with
 * `incompatibleContentVersion: true` so the UI can explain without applying it.
 */
export function findContinuationOffer(
  sessions: DeviceSession[],
  currentDeviceId: string,
  currentLocation: ReadingLocationEnvelope,
  now: number,
  localContentVersion?: string | null,
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

  const incompatibleContentVersion = !contentVersionsCompatible(
    localContentVersion,
    best.contentVersion,
  );

  return {
    fromDeviceName: best.deviceName,
    session: best,
    incompatibleContentVersion,
  };
}
