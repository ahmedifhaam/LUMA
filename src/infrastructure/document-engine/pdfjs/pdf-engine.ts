import * as pdfjs from 'pdfjs-dist';
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask as PdfRenderTask,
} from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
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

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/** Number of leading pages sampled to decide whether a PDF is text-friendly. */
const TEXT_SAMPLE_PAGES = 5;
/** Minimum characters across sampled pages to treat a PDF as text-friendly. */
const TEXT_MIN_CHARS = 16;

class PdfDocument implements OpenDocument {
  readonly identity: DocumentIdentity;
  readonly metadata: DocumentMetadata;
  readonly #doc: PDFDocumentProxy;
  readonly #pageCache = new Map<number, Promise<PDFPageProxy>>();

  constructor(
    doc: PDFDocumentProxy,
    identity: DocumentIdentity,
    metadata: DocumentMetadata,
  ) {
    this.#doc = doc;
    this.identity = identity;
    this.metadata = metadata;
  }

  #page(pageNumber: number): Promise<PDFPageProxy> {
    let cached = this.#pageCache.get(pageNumber);
    if (!cached) {
      cached = this.#doc.getPage(pageNumber);
      this.#pageCache.set(pageNumber, cached);
    }
    return cached;
  }

  async getPageGeometry(pageNumber: number): Promise<PageGeometry> {
    const page = await this.#page(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    return { pageNumber, width: viewport.width, height: viewport.height };
  }

  renderPage(pageNumber: number, scale: number): RenderTask {
    let pdfTask: PdfRenderTask | null = null;
    let cancelled = false;

    const promise = (async (): Promise<RenderResult> => {
      const page = await this.#page(pageNumber);
      if (cancelled) throw new RenderCancelledError();

      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('2D canvas context unavailable');

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      pdfTask = page.render({ canvasContext: context, viewport });
      await pdfTask.promise;

      return { canvas, width: canvas.width, height: canvas.height };
    })();

    return {
      promise,
      cancel() {
        cancelled = true;
        pdfTask?.cancel();
      },
    };
  }

  async extractPageText(pageNumber: number): Promise<string> {
    const page = await this.#page(pageNumber);
    const content = await page.getTextContent();
    return content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  renderTextLayer(
    pageNumber: number,
    scale: number,
    container: HTMLElement,
  ): TextLayerTask {
    let textLayer: { render(): Promise<void>; cancel(): void } | null = null;
    let cancelled = false;

    const promise = (async (): Promise<void> => {
      const page = await this.#page(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      // The pdf.js text layer sizes glyphs relative to this CSS variable.
      container.style.setProperty('--scale-factor', String(scale));
      textLayer = new pdfjs.TextLayer({
        textContentSource: page.streamTextContent(),
        container,
        viewport,
      });
      await textLayer.render();
    })();

    return {
      promise,
      cancel() {
        cancelled = true;
        textLayer?.cancel();
      },
    };
  }

  async getOutline(): Promise<DocumentOutlineItem[]> {
    const raw = await this.#doc.getOutline().catch(() => null);
    if (!raw) return [];

    const resolvePage = async (dest: unknown): Promise<number | null> => {
      try {
        const explicit =
          typeof dest === 'string' ? await this.#doc.getDestination(dest) : dest;
        if (!Array.isArray(explicit) || explicit.length === 0) return null;
        const ref = explicit[0];
        if (ref == null || typeof ref !== 'object') return null;
        const index = await this.#doc.getPageIndex(
          ref as Parameters<PDFDocumentProxy['getPageIndex']>[0],
        );
        return index + 1;
      } catch {
        return null;
      }
    };

    type RawOutline = { title: string; dest: unknown; items: RawOutline[] };
    const map = async (items: RawOutline[]): Promise<DocumentOutlineItem[]> => {
      const result: DocumentOutlineItem[] = [];
      for (const item of items) {
        result.push({
          title: item.title,
          pageNumber: await resolvePage(item.dest),
          children: item.items?.length ? await map(item.items) : [],
        });
      }
      return result;
    };

    return map(raw as unknown as RawOutline[]);
  }

  async destroy(): Promise<void> {
    this.#pageCache.clear();
    await this.#doc.destroy();
  }
}

export class RenderCancelledError extends Error {
  constructor() {
    super('Page render cancelled');
    this.name = 'RenderCancelledError';
  }
}

async function detectHasText(doc: PDFDocumentProxy): Promise<boolean> {
  const pagesToSample = Math.min(TEXT_SAMPLE_PAGES, doc.numPages);
  let total = 0;
  for (let pageNumber = 1; pageNumber <= pagesToSample; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if ('str' in item) total += item.str.trim().length;
      if (total >= TEXT_MIN_CHARS) return true;
    }
  }
  return total >= TEXT_MIN_CHARS;
}

export class PdfJsEngine implements DocumentEngine {
  async open(bytes: ArrayBuffer): Promise<OpenDocument> {
    const fingerprint = await computeFingerprint(bytes);

    // PDF.js transfers/detaches the buffer it is given; hand it a copy so the
    // caller's ArrayBuffer (used for fingerprinting/persistence) stays intact.
    const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
    const doc = await loadingTask.promise;

    const info = (await doc.getMetadata().catch(() => null))?.info as
      { Title?: string; Author?: string } | undefined;
    const hasText = await detectHasText(doc);

    const metadata: DocumentMetadata = {
      title: info?.Title?.trim() || null,
      author: info?.Author?.trim() || null,
      pageCount: doc.numPages,
      hasText,
    };

    return new PdfDocument(doc, { fingerprint, byteLength: bytes.byteLength }, metadata);
  }
}

export const pdfEngine = new PdfJsEngine();
