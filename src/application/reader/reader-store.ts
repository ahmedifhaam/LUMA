import { create } from 'zustand';
import type { Book, ReadingState } from '@/domain/book/types';
import type {
  DocumentLocation,
  DocumentOutlineItem,
  OpenDocument,
} from '@/domain/document/types';
import {
  engineForFormat,
  engineForSource,
} from '@/infrastructure/document-engine/engine-registry';
import {
  bookRepository,
  readingStateRepository,
  sourceRepository,
} from '@/infrastructure/persistence/repositories';
import { useAnnotationsStore } from '@/application/annotations/annotations-store';
import { useSearchStore } from '@/application/search/search-store';

type ReaderStatus = 'idle' | 'opening' | 'ready' | 'error';

interface ReaderState {
  status: ReaderStatus;
  book: Book | null;
  doc: OpenDocument | null;
  outline: DocumentOutlineItem[];
  error: string | null;
  location: DocumentLocation;
  progress: number;
  openBook: (bookId: string) => Promise<void>;
  closeBook: () => Promise<void>;
  updateLocation: (location: DocumentLocation) => void;
  flushReadingState: () => Promise<void>;
}

const PERSIST_DEBOUNCE_MS = 800;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function progressFor(location: DocumentLocation, pageCount: number): number {
  if (pageCount <= 0) return 0;
  const page = Math.min(Math.max(location.pageNumber, 1), pageCount);
  return (page - 1 + location.yOffset) / pageCount;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  status: 'idle',
  book: null,
  doc: null,
  outline: [],
  error: null,
  location: { pageNumber: 1, yOffset: 0 },
  progress: 0,

  async openBook(bookId) {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    const previous = get().doc;
    if (previous) await previous.destroy().catch(() => undefined);

    set({ status: 'opening', book: null, doc: null, outline: [], error: null });

    try {
      const [book, source, reading] = await Promise.all([
        bookRepository.get(bookId),
        sourceRepository.get(bookId),
        readingStateRepository.get(bookId),
      ]);

      if (!book) throw new Error('Book not found in library');
      if (!source) {
        throw new Error('This book has no locally stored copy. Re-import the file.');
      }

      const doc = book.format
        ? await engineForFormat(book.format).open(source.bytes)
        : await engineForSource(source.bytes, book.sourceName).open(source.bytes);
      const location = reading?.location ?? { pageNumber: 1, yOffset: 0 };
      const outline = await doc.getOutline().catch(() => []);

      await bookRepository.save({ ...book, lastOpenedAt: Date.now() });

      set({
        status: 'ready',
        book,
        doc,
        outline,
        location,
        progress: progressFor(location, doc.metadata.pageCount),
        error: null,
      });

      // Load annotations and build the current-book search index in the
      // background; neither should block first paint of the reader.
      void useAnnotationsStore.getState().load(bookId);
      void useSearchStore.getState().buildIndex(doc, bookId);
    } catch (error) {
      set({ status: 'error', error: (error as Error).message });
    }
  },

  async closeBook() {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    await get().flushReadingState();
    const doc = get().doc;
    if (doc) await doc.destroy().catch(() => undefined);
    useAnnotationsStore.getState().clear();
    useSearchStore.getState().clear();
    set({ status: 'idle', book: null, doc: null, outline: [], error: null });
  },

  updateLocation(location) {
    const { doc, book } = get();
    if (!doc || !book) return;
    const progress = progressFor(location, doc.metadata.pageCount);
    set({ location, progress });

    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      void get().flushReadingState();
    }, PERSIST_DEBOUNCE_MS);
  },

  async flushReadingState() {
    const { book, location, progress } = get();
    if (!book) return;
    const state: ReadingState = {
      bookId: book.id,
      location,
      progress,
      updatedAt: Date.now(),
    };
    await readingStateRepository.save(state).catch(() => undefined);
  },
}));
