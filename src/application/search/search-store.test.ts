import { beforeEach, describe, expect, it } from 'vitest';
import type { OpenDocument } from '@/domain/document/types';
import { useSearchStore } from './search-store';

function fakeDoc(pages: string[], hasText = true): OpenDocument {
  return {
    identity: { fingerprint: 'fp', byteLength: 0 },
    metadata: { title: null, author: null, pageCount: pages.length, hasText },
    getPageGeometry: async () => ({ pageNumber: 1, width: 600, height: 800 }),
    renderPage: () => ({ promise: Promise.reject(new Error('n/a')), cancel: () => {} }),
    extractPageText: async (pageNumber: number) => pages[pageNumber - 1] ?? '',
    renderTextLayer: () => ({ promise: Promise.resolve(), cancel: () => {} }),
    getOutline: async () => [],
    destroy: async () => {},
  };
}

describe('search-store', () => {
  beforeEach(() => {
    useSearchStore.getState().clear();
  });

  it('indexes pages and finds matches scoped to the current book', async () => {
    const doc = fakeDoc([
      'The quick brown fox',
      'jumps over the lazy dog',
      'the fox returns',
    ]);
    await useSearchStore.getState().buildIndex(doc, 'book-a');
    expect(useSearchStore.getState().status).toBe('ready');

    useSearchStore.getState().setQuery('fox');
    const results = useSearchStore.getState().results;
    expect(results.map((r) => r.pageNumber)).toEqual([1, 3]);
    expect(results[0].snippet.toLowerCase()).toContain('fox');
  });

  it('counts multiple matches on a page', async () => {
    const doc = fakeDoc(['na na na batman na']);
    await useSearchStore.getState().buildIndex(doc, 'book-b');
    useSearchStore.getState().setQuery('na');
    expect(useSearchStore.getState().results[0].matchCount).toBe(4);
  });

  it('marks image-only documents as not searchable', async () => {
    const doc = fakeDoc(['', '', ''], false);
    await useSearchStore.getState().buildIndex(doc, 'book-c');
    expect(useSearchStore.getState().searchable).toBe(false);
  });
});
