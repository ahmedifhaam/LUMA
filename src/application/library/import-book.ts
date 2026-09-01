import type { Book } from '@/domain/book/types';
import type { DocumentEngine } from '@/domain/document/types';
import { pdfEngine } from '@/infrastructure/document-engine/pdfjs/pdf-engine';
import { readFileSource } from '@/infrastructure/document-source/file-source';
import {
  bookRepository,
  sourceRepository,
} from '@/infrastructure/persistence/repositories';

export interface ImportResult {
  book: Book;
  /** True when the imported content matched an existing logical book. */
  isDuplicate: boolean;
}

function deriveTitle(metadataTitle: string | null, fileName: string): string {
  if (metadataTitle) return metadataTitle;
  return fileName.replace(/\.[^.]+$/, '') || 'Untitled document';
}

/**
 * Import flow (Phase 1 brief section 9 "Add Book"):
 * select -> inspect -> compute content identity -> dedupe -> create or reuse book.
 *
 * Identity is content-based, so re-importing the same bytes reuses the existing
 * logical book and its reading state instead of creating a duplicate.
 */
export async function importBook(
  file: File,
  engine: DocumentEngine = pdfEngine,
): Promise<ImportResult> {
  const source = await readFileSource(file);
  const doc = await engine.open(source.bytes);

  try {
    const existing = await bookRepository.get(doc.identity.fingerprint);
    if (existing) {
      const updated: Book = {
        ...existing,
        sourceName: source.name,
        lastOpenedAt: Date.now(),
      };
      await bookRepository.save(updated);
      return { book: updated, isDuplicate: true };
    }

    const now = Date.now();
    const book: Book = {
      id: doc.identity.fingerprint,
      title: deriveTitle(doc.metadata.title, source.name),
      author: doc.metadata.author,
      pageCount: doc.metadata.pageCount,
      byteLength: doc.identity.byteLength,
      hasText: doc.metadata.hasText,
      sourceName: source.name,
      createdAt: now,
      lastOpenedAt: null,
    };

    await bookRepository.save(book);
    // Persist a browser-local copy so the book can be reopened offline.
    await sourceRepository.save({ bookId: book.id, bytes: source.bytes });

    return { book, isDuplicate: false };
  } finally {
    await doc.destroy();
  }
}
