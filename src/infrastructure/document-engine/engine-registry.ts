import type { DocumentEngine } from '@/domain/document/types';
import { epubEngine } from '@/infrastructure/document-engine/epub/epub-engine';
import { pdfEngine } from '@/infrastructure/document-engine/pdfjs/pdf-engine';

export type DocumentFormat = 'pdf' | 'epub';

const EPUB_MIME = 'application/epub+zip';

export function detectDocumentFormat(
  bytes: ArrayBuffer,
  fileName?: string,
): DocumentFormat | null {
  const lowerName = fileName?.toLowerCase() ?? '';
  if (lowerName.endsWith('.epub')) return 'epub';
  if (lowerName.endsWith('.pdf')) return 'pdf';

  const view = new Uint8Array(bytes.slice(0, 4));
  const header = String.fromCharCode(...view);
  if (header === '%PDF') return 'pdf';
  if (view[0] === 0x50 && view[1] === 0x4b) return 'epub';

  return null;
}

export function engineForFormat(format: DocumentFormat): DocumentEngine {
  return format === 'epub' ? epubEngine : pdfEngine;
}

export function engineForSource(bytes: ArrayBuffer, fileName?: string): DocumentEngine {
  const format = detectDocumentFormat(bytes, fileName);
  if (!format) {
    throw new Error('Unsupported document format. Import a PDF or EPUB file.');
  }
  return engineForFormat(format);
}

export function mimeTypesForImport(): string {
  return `application/pdf,.pdf,${EPUB_MIME},.epub`;
}

export { EPUB_MIME };
