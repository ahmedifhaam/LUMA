import { describe, expect, it } from 'vitest';
import {
  detectDocumentFormat,
  engineForFormat,
} from '@/infrastructure/document-engine/engine-registry';
import { epubEngine } from '@/infrastructure/document-engine/epub/epub-engine';
import { pdfEngine } from '@/infrastructure/document-engine/pdfjs/pdf-engine';

describe('detectDocumentFormat', () => {
  it('detects PDF from magic bytes and extension', () => {
    const pdfBytes = new TextEncoder().encode('%PDF-1.4').buffer;
    expect(detectDocumentFormat(pdfBytes, 'book.pdf')).toBe('pdf');
    expect(detectDocumentFormat(pdfBytes)).toBe('pdf');
  });

  it('detects EPUB from extension and zip header', () => {
    const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer;
    expect(detectDocumentFormat(zipBytes, 'novel.epub')).toBe('epub');
    expect(detectDocumentFormat(zipBytes)).toBe('epub');
  });

  it('returns null for unknown formats', () => {
    const bytes = new TextEncoder().encode('hello').buffer;
    expect(detectDocumentFormat(bytes, 'notes.txt')).toBeNull();
  });
});

describe('engineForFormat', () => {
  it('returns the matching document engine', () => {
    expect(engineForFormat('pdf')).toBe(pdfEngine);
    expect(engineForFormat('epub')).toBe(epubEngine);
  });
});
