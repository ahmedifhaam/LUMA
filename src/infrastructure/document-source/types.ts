import type { BookSourceKind } from '@/domain/book/source';
import type { Book } from '@/domain/book/types';

/** Resolves a book's document bytes from its recorded source. */
export interface DocumentSourceAdapter {
  kind: BookSourceKind;
  resolveBytes(book: Book): Promise<ArrayBuffer>;
}
