import type { Book, ReadingState, StoredSource } from '@/domain/book/types';
import {
  STORE_BOOKS,
  STORE_READING_STATE,
  STORE_SOURCES,
  get,
  getAll,
  put,
  remove,
} from './db';

export const bookRepository = {
  list(): Promise<Book[]> {
    return getAll<Book>(STORE_BOOKS);
  },
  get(id: string): Promise<Book | undefined> {
    return get<Book>(STORE_BOOKS, id);
  },
  save(book: Book): Promise<void> {
    return put(STORE_BOOKS, book);
  },
  async remove(id: string): Promise<void> {
    await Promise.all([
      remove(STORE_BOOKS, id),
      remove(STORE_READING_STATE, id),
      remove(STORE_SOURCES, id),
    ]);
  },
};

export const readingStateRepository = {
  get(bookId: string): Promise<ReadingState | undefined> {
    return get<ReadingState>(STORE_READING_STATE, bookId);
  },
  list(): Promise<ReadingState[]> {
    return getAll<ReadingState>(STORE_READING_STATE);
  },
  save(state: ReadingState): Promise<void> {
    return put(STORE_READING_STATE, state);
  },
};

export const sourceRepository = {
  get(bookId: string): Promise<StoredSource | undefined> {
    return get<StoredSource>(STORE_SOURCES, bookId);
  },
  save(source: StoredSource): Promise<void> {
    return put(STORE_SOURCES, source);
  },
};
