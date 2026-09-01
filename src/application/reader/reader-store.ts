import { create } from 'zustand';
import type { Book, ReadingState } from '@/domain/book/types';
import type { DocumentLocation, OpenDocument } from '@/domain/document/types';
import { pdfEngine } from '@/infrastructure/document-engine/pdfjs/pdf-engine';
import {
  bookRepository,
  readingStateRepository,
  sourceRepository,
} from '@/infrastructure/persistence/repositories';

type ReaderStatus = 'idle' | 'opening' | 'ready' | 'error';

interface ReaderState {
  status: ReaderStatus;
  book: Book | null;
  doc: OpenDocument | null;
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

    set({ status: 'opening', book: null, doc: null, error: null });

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

      const doc = await pdfEngine.open(source.bytes);
      const location = reading?.location ?? { pageNumber: 1, yOffset: 0 };

      await bookRepository.save({ ...book, lastOpenedAt: Date.now() });

      set({
        status: 'ready',
        book,
        doc,
        location,
        progress: progressFor(location, doc.metadata.pageCount),
        error: null,
      });
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
    set({ status: 'idle', book: null, doc: null, error: null });
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
