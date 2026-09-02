import type { DocumentLocation } from '@/domain/document/types';

export type BookFormat = 'pdf' | 'epub';

/**
 * A logical book. Identity is the document content fingerprint, so re-importing
 * the same content (even under a different filename) resolves to the same book
 * and reuses its reading state. See Phase 1 brief section 4.
 */
export interface Book {
  /** Content fingerprint (SHA-256). Also the primary key. */
  id: string;
  title: string;
  author: string | null;
  pageCount: number;
  byteLength: number;
  hasText: boolean;
  /** Document format; omitted on books imported before format tracking. */
  format?: BookFormat;
  /** Most recent filename this content was imported under (informational only). */
  sourceName: string;
  createdAt: number;
  lastOpenedAt: number | null;
  /** JPEG data URL for library cover display, when available at import. */
  coverThumbnail: string | null;
}

export interface ReadingState {
  /** Book id / fingerprint. */
  bookId: string;
  location: DocumentLocation;
  /** Fraction read in [0,1]. */
  progress: number;
  updatedAt: number;
}

/** The persisted PDF bytes for offline re-open, keyed by fingerprint. */
export interface StoredSource {
  bookId: string;
  bytes: ArrayBuffer;
}

export type AnnotationType = 'bookmark' | 'highlight' | 'note';

/** A normalized rectangle within a page, coordinates in [0,1] from top-left. */
export interface NormalizedRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * A reading annotation anchored to a stable {@link DocumentLocation} (never a DOM
 * node), so it can be reconstructed after reopening the document. See Phase 1
 * brief sections 10-11.
 */
export interface Annotation {
  id: string;
  bookId: string;
  type: AnnotationType;
  location: DocumentLocation;
  /** User text for notes, or an optional comment on a highlight. */
  note?: string;
  /** The selected text captured for a highlight. */
  quote?: string;
  /** Highlight geometry on the page, in normalized coordinates. */
  rects?: NormalizedRect[];
  createdAt: number;
}
