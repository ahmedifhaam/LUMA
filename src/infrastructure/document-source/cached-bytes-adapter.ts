import type { BookSourceKind } from '@/domain/book/source';
import type { Book } from '@/domain/book/types';
import { sourceRepository } from '@/infrastructure/persistence/repositories';
import type { DocumentSourceAdapter } from './types';

/** Cache-first resolver for sources that persist a local copy after import/download. */
export function createCachedBytesAdapter(kind: BookSourceKind): DocumentSourceAdapter {
  const missingMessage =
    kind === 'local'
      ? 'This book has no locally stored copy. Re-import the file.'
      : `This ${kind} book has no locally stored copy. Re-import it from the cloud source.`;

  return {
    kind,
    async resolveBytes(book: Book): Promise<ArrayBuffer> {
      const source = await sourceRepository.get(book.id);
      if (!source) {
        throw new Error(missingMessage);
      }
      return source.bytes;
    },
  };
}
