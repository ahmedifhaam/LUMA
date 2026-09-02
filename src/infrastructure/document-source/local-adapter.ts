import type { Book } from '@/domain/book/types';
import { sourceRepository } from '@/infrastructure/persistence/repositories';
import type { DocumentSourceAdapter } from './types';

const MISSING_LOCAL_COPY =
  'This book has no locally stored copy. Re-import the file.';

export const localDocumentSourceAdapter: DocumentSourceAdapter = {
  kind: 'local',
  async resolveBytes(book: Book): Promise<ArrayBuffer> {
    const source = await sourceRepository.get(book.id);
    if (!source) {
      throw new Error(MISSING_LOCAL_COPY);
    }
    return source.bytes;
  },
};
