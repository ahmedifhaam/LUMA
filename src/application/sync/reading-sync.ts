import type { Book } from '@/domain/book/types';
import type { DocumentLocation } from '@/domain/document/types';
import { toReadingLocationEnvelope } from '@/domain/sync/reading-location';
import { features } from '@/config/features';
import { getDeviceDisplayName, getDeviceId } from '@/infrastructure/device/device-id';
import { syncStateService } from '@/infrastructure/sync';
import type { ContinuationOffer, ReadingStatePush } from '@/infrastructure/sync/types';

/** True when cloud sync is available and the user is signed in. */
export function canSyncReadingState(hasSession: boolean): boolean {
  // MVP: sync local books when logged in; cloud-source check comes with Drive.
  return features.cloudEnabled && hasSession;
}

export function buildReadingStatePush(
  deviceId: string,
  location: DocumentLocation,
  progress: number,
  format: 'pdf' | 'epub',
): ReadingStatePush {
  return {
    deviceId,
    deviceName: getDeviceDisplayName(),
    location: toReadingLocationEnvelope(format, location),
    progress,
    lastActiveAt: Date.now(),
  };
}

export async function pushReadingStateIfEligible(
  book: Book,
  location: DocumentLocation,
  progress: number,
  hasSession: boolean,
): Promise<void> {
  if (!canSyncReadingState(hasSession)) return;

  const format = book.format ?? 'pdf';
  const push = buildReadingStatePush(getDeviceId(), location, progress, format);
  await syncStateService.pushReadingState(book.id, push);
}

export async function fetchContinuationOffer(
  bookId: string,
  deviceId: string,
  format: 'pdf' | 'epub',
  localLocation: DocumentLocation,
  hasSession: boolean,
): Promise<ContinuationOffer> {
  if (!canSyncReadingState(hasSession)) return null;

  const envelope = toReadingLocationEnvelope(format, localLocation);
  return syncStateService.getContinuationOffer(bookId, deviceId, envelope);
}
