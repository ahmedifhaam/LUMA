import { create } from 'zustand';
import type { Book } from '@/domain/book/types';
import { bookRepository } from '@/infrastructure/persistence/repositories';
import { importBook, type ImportResult } from './import-book';

interface LibraryState {
  books: Book[];
  loading: boolean;
  importing: boolean;
  error: string | null;
  loadLibrary: () => Promise<void>;
  importFile: (file: File) => Promise<ImportResult>;
  removeBook: (id: string) => Promise<void>;
}

function sortBooks(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const aTime = a.lastOpenedAt ?? a.createdAt;
    const bTime = b.lastOpenedAt ?? b.createdAt;
    return bTime - aTime;
  });
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  loading: false,
  importing: false,
  error: null,

  async loadLibrary() {
    set({ loading: true, error: null });
    try {
      const books = await bookRepository.list();
      set({ books: sortBooks(books), loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },

  async importFile(file) {
    set({ importing: true, error: null });
    try {
      const result = await importBook(file);
      const books = await bookRepository.list();
      set({ books: sortBooks(books), importing: false });
      return result;
    } catch (error) {
      set({ importing: false, error: (error as Error).message });
      throw error;
    }
  },

  async removeBook(id) {
    await bookRepository.remove(id);
    set({ books: get().books.filter((book) => book.id !== id) });
  },
}));
