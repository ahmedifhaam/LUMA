import { beforeEach, describe, expect, it } from 'vitest';
import { DB_NAME, closeDatabase } from '@/infrastructure/persistence/db';
import { useAnnotationsStore } from './annotations-store';

async function resetDatabase(): Promise<void> {
  await closeDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

describe('annotations-store', () => {
  beforeEach(async () => {
    await resetDatabase();
    useAnnotationsStore.getState().clear();
    await useAnnotationsStore.getState().load('book-1');
  });

  it('toggles a bookmark on and off for a page', async () => {
    const store = useAnnotationsStore.getState();
    await store.toggleBookmark({ pageNumber: 5, yOffset: 0 });
    expect(
      useAnnotationsStore.getState().annotations.filter((a) => a.type === 'bookmark'),
    ).toHaveLength(1);

    await useAnnotationsStore.getState().toggleBookmark({ pageNumber: 5, yOffset: 0 });
    expect(
      useAnnotationsStore.getState().annotations.filter((a) => a.type === 'bookmark'),
    ).toHaveLength(0);
  });

  it('persists notes and highlights and can reload them', async () => {
    const store = useAnnotationsStore.getState();
    await store.addNote({ pageNumber: 2, yOffset: 0.1 }, 'Remember this');
    await store.addHighlight({
      location: { pageNumber: 3, yOffset: 0.2 },
      quote: 'important passage',
      rects: [{ left: 0.1, top: 0.2, width: 0.3, height: 0.02 }],
    });

    // Reload from IndexedDB to prove persistence.
    await useAnnotationsStore.getState().load('book-1');
    const annotations = useAnnotationsStore.getState().annotations;
    expect(annotations.find((a) => a.type === 'note')?.note).toBe('Remember this');
    const highlight = annotations.find((a) => a.type === 'highlight');
    expect(highlight?.quote).toBe('important passage');
    expect(highlight?.rects).toHaveLength(1);
  });

  it('scopes annotations to the loaded book', async () => {
    await useAnnotationsStore
      .getState()
      .addNote({ pageNumber: 1, yOffset: 0 }, 'book-1 note');
    await useAnnotationsStore.getState().load('book-2');
    expect(useAnnotationsStore.getState().annotations).toHaveLength(0);
  });
});
