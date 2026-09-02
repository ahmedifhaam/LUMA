import type { DocumentLocation } from '@/domain/document/types';
import type { ReadingLocationEnvelope } from '@/infrastructure/sync/types';

export function toReadingLocationEnvelope(
  format: 'pdf' | 'epub',
  location: DocumentLocation,
): ReadingLocationEnvelope {
  return {
    format,
    locator: { pageNumber: location.pageNumber, yOffset: location.yOffset },
  };
}

export function fromReadingLocationEnvelope(
  envelope: ReadingLocationEnvelope,
): DocumentLocation {
  const { pageNumber, yOffset } = envelope.locator as {
    pageNumber: number;
    yOffset: number;
  };
  return { pageNumber, yOffset };
}
