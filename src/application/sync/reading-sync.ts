import type { Book } from '@/domain/book/types';
import type { DocumentLocation } from '@/domain/document/types';
import { toReadingLocationEnvelope } from '@/domain/sync/reading-location';
import { features } from '@/config/features';
import { getDeviceDisplayName, getDeviceId } from '@/infrastructure/device/device-id';
import { syncStateService } from '@/infrastructure/sync';
import type { ContinuationOffer, ReadingStatePush } from '@/infrastructure/sync/types';

const CLOUD_SYNC_SOURCES = new Set(['google-drive', 'luma-cloud', 'app-storage']);

/** True when cloud sync is available for this book and the user is signed in. */
export function canSyncReadingState(
  hasSession: boolean,
  book?: Pick<Book, 'source'> | null,
): boolean {
  if (!features.cloudEnabled || !hasSession || !book) return false;
  const source = book.source ?? 'local';
  return CLOUD_SYNC_SOURCES.has(source);
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
  if (!canSyncReadingState(hasSession, book)) return;

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
  book?: Pick<Book, 'source'> | null,
): Promise<ContinuationOffer> {
  if (!canSyncReadingState(hasSession, book)) return null;

  const envelope = toReadingLocationEnvelope(format, localLocation);
  return syncStateService.getContinuationOffer(bookId, deviceId, envelope);
}
