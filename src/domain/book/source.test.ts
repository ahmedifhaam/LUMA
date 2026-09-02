import { describe, expect, it } from 'vitest';
import {
  BOOK_SOURCE_LABELS,
  defaultLocalSourceRef,
  normalizeBookSource,
} from '@/domain/book/source';
import type { Book } from '@/domain/book/types';

describe('book source', () => {
  it('defaults legacy books to local source with sourceName as fileName', () => {
    const book = {
      sourceName: 'sample-book.pdf',
    };
    expect(normalizeBookSource(book)).toEqual({
      source: 'local',
      sourceRef: { fileName: 'sample-book.pdf' },
    });
  });

  it('preserves explicit cloud source metadata', () => {
    const book: Pick<Book, 'source' | 'sourceRef' | 'sourceName'> = {
      source: 'google-drive',
      sourceRef: { remoteId: 'drive-file-123' },
      sourceName: 'ignored.pdf',
    };
    expect(normalizeBookSource(book)).toEqual({
      source: 'google-drive',
      sourceRef: { remoteId: 'drive-file-123' },
    });
  });

  it('exposes labels for every source kind', () => {
    expect(BOOK_SOURCE_LABELS.local).toBe('This device');
    expect(BOOK_SOURCE_LABELS['google-drive']).toBe('Google Drive');
    expect(defaultLocalSourceRef('book.epub')).toEqual({ fileName: 'book.epub' });
  });
});
