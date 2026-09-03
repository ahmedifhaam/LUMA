import type { Book, BookFormat } from '@/domain/book/types';
import type { BookSourceKind, BookSourceRef } from '@/domain/book/source';
import type { DocumentEngine } from '@/domain/document/types';
import {
  detectDocumentFormat,
  engineForSource,
} from '@/infrastructure/document-engine/engine-registry';
import {
  bookRepository,
  sourceRepository,
} from '@/infrastructure/persistence/repositories';
import type { ImportResult } from './import-book';

function deriveTitle(metadataTitle: string | null, fileName: string): string {
  if (metadataTitle) return metadataTitle;
  return fileName.replace(/\.[^.]+$/, '') || 'Untitled document';
}

export interface ImportSourceOptions {
  source: BookSourceKind;
  sourceRef: BookSourceRef;
}

/**
 * Import document bytes into the library with an explicit source identity.
 * Used by cloud connectors after downloading remote content.
 */
export async function importBookFromBytes(
  bytes: ArrayBuffer,
  fileName: string,
  sourceOptions: ImportSourceOptions,
  engine?: DocumentEngine,
): Promise<ImportResult> {
  const format = detectDocumentFormat(bytes, fileName);
  if (!format) {
    throw new Error('Unsupported document format. Import a PDF or EPUB file.');
  }
  const resolvedEngine = engine ?? engineForSource(bytes, fileName);
  const doc = await resolvedEngine.open(bytes);

  try {
    const existing = await bookRepository.get(doc.identity.fingerprint);
    if (existing) {
      const updated: Book = {
        ...existing,
        sourceName: fileName,
        source: sourceOptions.source,
        sourceRef: sourceOptions.sourceRef,
        lastOpenedAt: Date.now(),
      };
      await bookRepository.save(updated);
      await sourceRepository.save({ bookId: updated.id, bytes });
      return { book: updated, isDuplicate: true };
    }

    const coverThumbnail = (await doc.extractCoverThumbnail?.()) ?? null;
    const now = Date.now();
    const book: Book = {
      id: doc.identity.fingerprint,
      title: deriveTitle(doc.metadata.title, fileName),
      author: doc.metadata.author,
      pageCount: doc.metadata.pageCount,
      byteLength: doc.identity.byteLength,
      hasText: doc.metadata.hasText,
      format: format as BookFormat,
      sourceName: fileName,
      source: sourceOptions.source,
      sourceRef: sourceOptions.sourceRef,
      createdAt: now,
      lastOpenedAt: null,
      coverThumbnail,
    };

    await bookRepository.save(book);
    await sourceRepository.save({ bookId: book.id, bytes });
    return { book, isDuplicate: false };
  } finally {
    await doc.destroy();
  }
}
