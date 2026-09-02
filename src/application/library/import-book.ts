import type { Book } from '@/domain/book/types';
import { defaultLocalSourceRef } from '@/domain/book/source';
import type { DocumentEngine } from '@/domain/document/types';
import {
  detectDocumentFormat,
  engineForSource,
} from '@/infrastructure/document-engine/engine-registry';
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
  engine?: DocumentEngine,
): Promise<ImportResult> {
  const source = await readFileSource(file);
  const format = detectDocumentFormat(source.bytes, source.name);
  if (!format) {
    throw new Error('Unsupported document format. Import a PDF or EPUB file.');
  }
  const resolvedEngine = engine ?? engineForSource(source.bytes, source.name);
  const doc = await resolvedEngine.open(source.bytes);

  try {
    const existing = await bookRepository.get(doc.identity.fingerprint);
    if (existing) {
      const updated: Book = {
        ...existing,
        sourceName: source.name,
        source: existing.source ?? 'local',
        sourceRef: defaultLocalSourceRef(source.name),
        lastOpenedAt: Date.now(),
      };
      await bookRepository.save(updated);
      return { book: updated, isDuplicate: true };
    }

    const coverThumbnail = (await doc.extractCoverThumbnail?.()) ?? null;

    const now = Date.now();
    const book: Book = {
      id: doc.identity.fingerprint,
      title: deriveTitle(doc.metadata.title, source.name),
      author: doc.metadata.author,
      pageCount: doc.metadata.pageCount,
      byteLength: doc.identity.byteLength,
      hasText: doc.metadata.hasText,
      format,
      sourceName: source.name,
      source: 'local',
      sourceRef: defaultLocalSourceRef(source.name),
      createdAt: now,
      lastOpenedAt: null,
      coverThumbnail,
    };

    await bookRepository.save(book);
    // Persist a browser-local copy so the book can be reopened offline.
    await sourceRepository.save({ bookId: book.id, bytes: source.bytes });

    return { book, isDuplicate: false };
  } finally {
    await doc.destroy();
  }
}
