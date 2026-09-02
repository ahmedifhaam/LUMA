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
import { getDeviceId } from '@/infrastructure/device/device-id';
import { createReadingState } from '@/infrastructure/persistence/reading-state-id';
import { resolveBookBytes } from '@/infrastructure/document-source/registry';
import {
  bookRepository,
  readingStateRepository,
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
      const deviceId = getDeviceId();
      const [book, reading] = await Promise.all([
        bookRepository.get(bookId),
        readingStateRepository.get(bookId, deviceId),
      ]);

      if (!book) throw new Error('Book not found in library');

      const bytes = await resolveBookBytes(book);
      const doc = book.format
        ? await engineForFormat(book.format).open(bytes)
        : await engineForSource(bytes, book.sourceName).open(bytes);
      const location = reading?.location ?? { pageNumber: 1, yOffset: 0 };
      const outline = await doc.getOutline().catch(() => []);
      const progress = progressFor(location, doc.metadata.pageCount);
      const now = Date.now();

      await Promise.all([
        bookRepository.save({ ...book, lastOpenedAt: now }),
        readingStateRepository.save(
          createReadingState(bookId, deviceId, {
            location,
            progress,
            lastOpenedAt: now,
            updatedAt: now,
          }),
        ),
      ]);

      set({
        status: 'ready',
        book,
        doc,
        outline,
        location,
        progress,
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
    const deviceId = getDeviceId();
    const now = Date.now();
    const state: ReadingState = createReadingState(book.id, deviceId, {
      location,
      progress,
      lastOpenedAt: now,
      updatedAt: now,
    });
    await readingStateRepository.save(state).catch(() => undefined);
  },
}));
