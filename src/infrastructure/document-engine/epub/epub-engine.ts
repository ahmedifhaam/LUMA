import type {
  DocumentEngine,
  DocumentIdentity,
  DocumentMetadata,
  DocumentOutlineItem,
  OpenDocument,
  PageGeometry,
  RenderResult,
  RenderTask,
  TextLayerTask,
} from '@/domain/document/types';
import { computeFingerprint } from '@/application/document-identity/fingerprint';
import { RenderCancelledError } from '@/infrastructure/document-engine/pdfjs/pdf-engine';
import {
  EPUB_PAGE_HEIGHT,
  EPUB_PAGE_WIDTH,
  extractChapterBody,
  navToOutline,
  parseEpub,
  stripHtml,
  type ParsedEpub,
} from './epub-parser';

class EpubDocument implements OpenDocument {
  readonly identity: DocumentIdentity;
  readonly metadata: DocumentMetadata;
  readonly #epub: ParsedEpub;
  readonly #chapterCache = new Map<number, Promise<string>>();

  constructor(epub: ParsedEpub, identity: DocumentIdentity, metadata: DocumentMetadata) {
    this.#epub = epub;
    this.identity = identity;
    this.metadata = metadata;
  }

  async #chapterHtml(pageNumber: number): Promise<string> {
    let cached = this.#chapterCache.get(pageNumber);
    if (!cached) {
      cached = (async () => {
        const spineItem = this.#epub.spine[pageNumber - 1];
        if (!spineItem) return '';
        const raw = await this.#epub.readFile(spineItem.href);
        if (!raw) return '';
        return extractChapterBody(raw);
      })();
      this.#chapterCache.set(pageNumber, cached);
    }
    return cached;
  }

  async getPageGeometry(pageNumber: number): Promise<PageGeometry> {
    void pageNumber;
    return {
      pageNumber,
      width: EPUB_PAGE_WIDTH,
      height: EPUB_PAGE_HEIGHT,
    };
  }

  renderPage(pageNumber: number, scale: number): RenderTask {
    let cancelled = false;
    void pageNumber;

    const promise = (async (): Promise<RenderResult> => {
      if (cancelled) throw new RenderCancelledError();

      const width = Math.ceil(EPUB_PAGE_WIDTH * scale);
      const height = Math.ceil(EPUB_PAGE_HEIGHT * scale);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('2D canvas context unavailable');

      canvas.width = width;
      canvas.height = height;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);

      return { canvas, width, height };
    })();

    return {
      promise,
      cancel() {
        cancelled = true;
      },
    };
  }

  async extractPageText(pageNumber: number): Promise<string> {
    const html = await this.#chapterHtml(pageNumber);
    return stripHtml(html);
  }

  renderTextLayer(pageNumber: number, scale: number, container: HTMLElement): TextLayerTask {
    let cancelled = false;

    const promise = (async (): Promise<void> => {
      const html = await this.#chapterHtml(pageNumber);
      if (cancelled) return;

      container.replaceChildren();
      container.classList.add('epub-text-layer');
      container.style.setProperty('--scale-factor', String(scale));

      const wrapper = document.createElement('div');
      wrapper.className = 'epub-chapter';
      wrapper.style.width = `${EPUB_PAGE_WIDTH * scale}px`;
      wrapper.style.minHeight = `${EPUB_PAGE_HEIGHT * scale}px`;
      wrapper.style.padding = `${24 * scale}px`;
      wrapper.style.boxSizing = 'border-box';
      wrapper.style.color = '#111827';
      wrapper.style.lineHeight = '1.6';
      wrapper.innerHTML = html;
      container.appendChild(wrapper);
    })();

    return {
      promise,
      cancel() {
        cancelled = true;
        container.replaceChildren();
        container.classList.remove('epub-text-layer');
      },
    };
  }

  async getOutline(): Promise<DocumentOutlineItem[]> {
    if (this.#epub.nav.length === 0) return [];
    return navToOutline(this.#epub.nav, this.#epub.spine, this.#epub.opfDir);
  }

  async extractCoverThumbnail(): Promise<string | null> {
    if (!this.#epub.coverHref) return null;
    try {
      const blob = await this.#epub.readBlob(this.#epub.coverHref);
      if (!blob) return null;
      const dataUrl = await blobToDataUrl(blob);
      return await resizeCoverDataUrl(dataUrl);
    } catch {
      return null;
    }
  }

  async destroy(): Promise<void> {
    this.#chapterCache.clear();
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function resizeCoverDataUrl(dataUrl: string): Promise<string> {
  const image = await loadImage(dataUrl);
  const maxWidth = 160;
  const scale = Math.min(maxWidth / image.naturalWidth, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(image.naturalWidth * scale);
  canvas.height = Math.ceil(image.naturalHeight * scale);
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.75);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load cover image'));
    image.src = src;
  });
}

async function detectHasText(epub: ParsedEpub): Promise<boolean> {
  const sampleCount = Math.min(3, epub.spine.length);
  let total = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const raw = await epub.readFile(epub.spine[index]!.href);
    if (!raw) continue;
    total += stripHtml(extractChapterBody(raw)).length;
    if (total >= 16) return true;
  }
  return total >= 16;
}

export class EpubEngine implements DocumentEngine {
  async open(bytes: ArrayBuffer): Promise<OpenDocument> {
    const fingerprint = await computeFingerprint(bytes);
    const epub = await parseEpub(bytes);
    const pageCount = Math.max(epub.spine.length, 1);
    const hasText = await detectHasText(epub);

    const metadata: DocumentMetadata = {
      title: epub.title,
      author: epub.author,
      pageCount,
      hasText,
    };

    return new EpubDocument(epub, { fingerprint, byteLength: bytes.byteLength }, metadata);
  }
}

export const epubEngine = new EpubEngine();
