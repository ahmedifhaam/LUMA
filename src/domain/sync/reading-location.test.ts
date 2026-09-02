import { describe, expect, it } from 'vitest';
import type { DocumentLocation } from '@/domain/document/types';
import type { ReadingLocationEnvelope } from '@/infrastructure/sync/types';
import {
  fromReadingLocationEnvelope,
  toReadingLocationEnvelope,
} from './reading-location';

const location: DocumentLocation = { pageNumber: 7, yOffset: 0.35 };

describe('reading location envelope', () => {
  it('maps a PDF DocumentLocation to an envelope', () => {
    expect(toReadingLocationEnvelope('pdf', location)).toEqual({
      format: 'pdf',
      locator: { pageNumber: 7, yOffset: 0.35 },
    });
  });

  it('maps an EPUB DocumentLocation to an envelope', () => {
    expect(toReadingLocationEnvelope('epub', location)).toEqual({
      format: 'epub',
      locator: { pageNumber: 7, yOffset: 0.35 },
    });
  });

  it('maps an envelope back to a DocumentLocation', () => {
    const envelope: ReadingLocationEnvelope = {
      format: 'pdf',
      locator: { pageNumber: 12, yOffset: 0.1 },
    };

    expect(fromReadingLocationEnvelope(envelope)).toEqual({
      pageNumber: 12,
      yOffset: 0.1,
    });
  });

  it('round-trips through the envelope', () => {
    const envelope = toReadingLocationEnvelope('epub', location);
    expect(fromReadingLocationEnvelope(envelope)).toEqual(location);
  });
});
