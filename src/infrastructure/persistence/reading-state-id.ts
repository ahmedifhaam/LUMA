import type { ReadingState } from '@/domain/book/types';

export function readingStateId(bookId: string, deviceId: string): string {
  return `${bookId}::${deviceId}`;
}

export function createReadingState(
  bookId: string,
  deviceId: string,
  values: Pick<ReadingState, 'location' | 'progress'> & {
    lastOpenedAt?: number;
    updatedAt?: number;
  },
): ReadingState {
  const now = values.updatedAt ?? Date.now();
  return {
    id: readingStateId(bookId, deviceId),
    bookId,
    deviceId,
    location: values.location,
    progress: values.progress,
    lastOpenedAt: values.lastOpenedAt ?? now,
    updatedAt: now,
  };
}
