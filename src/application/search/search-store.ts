import { create } from 'zustand';
import type { OpenDocument } from '@/domain/document/types';

export interface SearchResult {
  pageNumber: number;
  snippet: string;
  matchCount: number;
}

type IndexStatus = 'idle' | 'indexing' | 'ready';

interface SearchState {
  bookId: string | null;
  status: IndexStatus;
  indexedPages: number;
  totalPages: number;
  query: string;
  results: SearchResult[];
  searchable: boolean;
  buildIndex: (doc: OpenDocument, bookId: string) => Promise<void>;
  setQuery: (query: string) => void;
  clear: () => void;
}

/** In-memory per-page text, keyed by bookId (may be partial during indexing). */
const pageTextByBook = new Map<string, string[]>();
/** Books whose index has been fully built this session. */
const completedBooks = new Set<string>();
let activeBuildToken = 0;

function makeSnippet(text: string, matchIndex: number, queryLength: number): string {
  const radius = 40;
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(text.length, matchIndex + queryLength + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function runQuery(pages: string[], rawQuery: string): SearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  if (query.length === 0) return [];
  const results: SearchResult[] = [];

  for (let i = 0; i < pages.length; i += 1) {
    const text = pages[i];
    if (!text) continue;
    const haystack = text.toLowerCase();
    let matchCount = 0;
    let firstIndex = -1;
    let from = 0;
    for (;;) {
      const found = haystack.indexOf(query, from);
      if (found === -1) break;
      if (firstIndex === -1) firstIndex = found;
      matchCount += 1;
      from = found + query.length;
    }
    if (matchCount > 0) {
      results.push({
        pageNumber: i + 1,
        snippet: makeSnippet(text, firstIndex, query.length),
        matchCount,
      });
    }
  }
  return results;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  bookId: null,
  status: 'idle',
  indexedPages: 0,
  totalPages: 0,
  query: '',
  results: [],
  searchable: true,

  async buildIndex(doc, bookId) {
    activeBuildToken += 1;
    const token = activeBuildToken;
    const total = doc.metadata.pageCount;

    set({
      bookId,
      status: 'indexing',
      indexedPages: 0,
      totalPages: total,
      query: '',
      results: [],
      searchable: doc.metadata.hasText,
    });

    if (!doc.metadata.hasText) {
      set({ status: 'ready', indexedPages: total });
      return;
    }

    const cached = pageTextByBook.get(bookId);
    if (completedBooks.has(bookId) && cached && cached.length === total) {
      set({ status: 'ready', indexedPages: total });
      return;
    }

    // Publish the (initially empty) page array immediately so that queries can
    // search incrementally as pages are extracted, rather than only at the end.
    const pages: string[] = new Array(total).fill('');
    pageTextByBook.set(bookId, pages);

    for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
      if (token !== activeBuildToken) return; // superseded by a newer book
      pages[pageNumber - 1] = await doc.extractPageText(pageNumber).catch(() => '');
      if (pageNumber % 50 === 0 || pageNumber === total) {
        set({ indexedPages: pageNumber });
        const { query } = get();
        if (query.trim()) set({ results: runQuery(pages, query) });
      }
    }

    completedBooks.add(bookId);
    if (token !== activeBuildToken) return;
    set({ status: 'ready', indexedPages: total });

    const { query } = get();
    if (query.trim()) set({ results: runQuery(pages, query) });
  },

  setQuery(query) {
    const { bookId } = get();
    const pages = bookId ? pageTextByBook.get(bookId) : undefined;
    set({ query, results: pages ? runQuery(pages, query) : [] });
  },

  clear() {
    activeBuildToken += 1;
    set({
      bookId: null,
      status: 'idle',
      indexedPages: 0,
      totalPages: 0,
      query: '',
      results: [],
      searchable: true,
    });
  },
}));
