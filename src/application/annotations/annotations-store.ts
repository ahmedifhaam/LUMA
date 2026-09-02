import { create } from 'zustand';
import type { Annotation, NormalizedRect, TextAnchor } from '@/domain/book/types';
import type { DocumentLocation } from '@/domain/document/types';
import { annotationRepository } from '@/infrastructure/persistence/repositories';

interface AddHighlightInput {
  location: DocumentLocation;
  quote: string;
  rects: NormalizedRect[];
  textAnchor?: TextAnchor;
  note?: string;
}

interface AnnotationsState {
  bookId: string | null;
  annotations: Annotation[];
  load: (bookId: string) => Promise<void>;
  clear: () => void;
  toggleBookmark: (location: DocumentLocation) => Promise<void>;
  addNote: (location: DocumentLocation, note: string) => Promise<Annotation>;
  updateNote: (id: string, note: string) => Promise<void>;
  addHighlight: (input: AddHighlightInput) => Promise<Annotation>;
  remove: (id: string) => Promise<void>;
}

function sortAnnotations(annotations: Annotation[]): Annotation[] {
  return [...annotations].sort((a, b) => {
    if (a.location.pageNumber !== b.location.pageNumber) {
      return a.location.pageNumber - b.location.pageNumber;
    }
    return a.location.yOffset - b.location.yOffset;
  });
}

function newId(): string {
  return crypto.randomUUID();
}

export const useAnnotationsStore = create<AnnotationsState>((set, get) => ({
  bookId: null,
  annotations: [],

  async load(bookId) {
    const annotations = await annotationRepository.listByBook(bookId);
    set({ bookId, annotations: sortAnnotations(annotations) });
  },

  clear() {
    set({ bookId: null, annotations: [] });
  },

  async toggleBookmark(location) {
    const { bookId, annotations } = get();
    if (!bookId) return;
    const existing = annotations.find(
      (a) => a.type === 'bookmark' && a.location.pageNumber === location.pageNumber,
    );
    if (existing) {
      await annotationRepository.remove(existing.id);
      set({ annotations: annotations.filter((a) => a.id !== existing.id) });
      return;
    }
    const bookmark: Annotation = {
      id: newId(),
      bookId,
      type: 'bookmark',
      location,
      createdAt: Date.now(),
    };
    await annotationRepository.save(bookmark);
    set({ annotations: sortAnnotations([...annotations, bookmark]) });
  },

  async addNote(location, note) {
    const { bookId, annotations } = get();
    if (!bookId) throw new Error('No book loaded');
    const annotation: Annotation = {
      id: newId(),
      bookId,
      type: 'note',
      location,
      note,
      createdAt: Date.now(),
    };
    await annotationRepository.save(annotation);
    set({ annotations: sortAnnotations([...annotations, annotation]) });
    return annotation;
  },

  async updateNote(id, note) {
    const { annotations } = get();
    const target = annotations.find((a) => a.id === id);
    if (!target) return;
    const updated: Annotation = { ...target, note };
    await annotationRepository.save(updated);
    set({ annotations: annotations.map((a) => (a.id === id ? updated : a)) });
  },

  async addHighlight({ location, quote, rects, textAnchor, note }) {
    const { bookId, annotations } = get();
    if (!bookId) throw new Error('No book loaded');
    const annotation: Annotation = {
      id: newId(),
      bookId,
      type: 'highlight',
      location,
      quote,
      rects,
      textAnchor,
      note,
      createdAt: Date.now(),
    };
    await annotationRepository.save(annotation);
    set({ annotations: sortAnnotations([...annotations, annotation]) });
    return annotation;
  },

  async remove(id) {
    await annotationRepository.remove(id);
    set({ annotations: get().annotations.filter((a) => a.id !== id) });
  },
}));
