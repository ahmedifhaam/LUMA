import { normalizeBookSource } from '@/domain/book/source';
import type { Annotation, Book, ReadingState, StoredSource } from '@/domain/book/types';
import { getDeviceId } from '@/infrastructure/device/device-id';
import { readingStateId } from '@/infrastructure/persistence/reading-state-id';
import {
  STORE_ANNOTATIONS,
  STORE_BOOKS,
  STORE_READING_STATE,
  STORE_SOURCES,
  get,
  getAll,
  getAllByIndex,
  put,
  remove,
  removeAllByIndex,
} from './db';

function normalizeBook(book: Book): Book {
  const { source, sourceRef } = normalizeBookSource(book);
  return { ...book, source, sourceRef };
}

export const bookRepository = {
  async list(): Promise<Book[]> {
    const books = await getAll<Book>(STORE_BOOKS);
    return books.map(normalizeBook);
  },
  async get(id: string): Promise<Book | undefined> {
    const book = await get<Book>(STORE_BOOKS, id);
    return book ? normalizeBook(book) : undefined;
  },
  save(book: Book): Promise<void> {
    const normalized = normalizeBook(book);
    return put(STORE_BOOKS, normalized);
  },
  async remove(id: string): Promise<void> {
    await Promise.all([
      remove(STORE_BOOKS, id),
      removeAllByIndex(STORE_READING_STATE, 'byBook', id),
      remove(STORE_SOURCES, id),
    ]);
  },
};

export const readingStateRepository = {
  get(bookId: string, deviceId = getDeviceId()): Promise<ReadingState | undefined> {
    return get<ReadingState>(STORE_READING_STATE, readingStateId(bookId, deviceId));
  },
  list(): Promise<ReadingState[]> {
    return getAll<ReadingState>(STORE_READING_STATE);
  },
  listForDevice(deviceId = getDeviceId()): Promise<ReadingState[]> {
    return getAllByIndex<ReadingState>(STORE_READING_STATE, 'byDevice', deviceId);
  },
  listForBook(bookId: string): Promise<ReadingState[]> {
    return getAllByIndex<ReadingState>(STORE_READING_STATE, 'byBook', bookId);
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

export const annotationRepository = {
  listByBook(bookId: string): Promise<Annotation[]> {
    return getAllByIndex<Annotation>(STORE_ANNOTATIONS, 'byBook', bookId);
  },
  save(annotation: Annotation): Promise<void> {
    return put(STORE_ANNOTATIONS, annotation);
  },
  remove(id: string): Promise<void> {
    return remove(STORE_ANNOTATIONS, id);
  },
};
