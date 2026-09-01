import type { DocumentLocation } from '@/domain/document/types';

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
  /** Most recent filename this content was imported under (informational only). */
  sourceName: string;
  createdAt: number;
  lastOpenedAt: number | null;
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
