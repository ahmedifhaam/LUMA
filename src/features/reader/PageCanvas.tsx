import { useEffect, useRef, useState } from 'react';
import type { Annotation, BookFormat } from '@/domain/book/types';
import type { OpenDocument } from '@/domain/document/types';
import { RenderCancelledError } from '@/infrastructure/document-engine/pdfjs/pdf-engine';
import { clearEpubHighlights, scheduleEpubHighlightSync } from './highlight-rendering';

interface PageCanvasProps {
  doc: OpenDocument;
  pageNumber: number;
  scale: number;
  width: number;
  height: number;
  top?: number;
  inline?: boolean;
  pageBackground: string;
  displayRevision: number;
  bookFormat: BookFormat;
  highlights: Annotation[];
  onClearSelection?: () => void;
  /** Allow EPUB chapter text to scroll inside the page (continuous view). */
  epubScrollable?: boolean;
}

/**
 * Renders a single PDF page (canvas + selectable text layer) on demand and
 * releases it on unmount.
 *
 * The render tasks are cancelled when the page leaves the active/overscan
 * window, so rendered page resources stay bounded and owned by the reader
 * subsystem rather than global state (architectural rule 6).
 */
export function PageCanvas({
  doc,
  pageNumber,
  scale,
  width,
  height,
  top,
  inline = false,
  pageBackground,
  displayRevision,
  bookFormat,
  highlights,
  onClearSelection,
  epubScrollable = false,
}: PageCanvasProps) {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const highlightsRef = useRef(highlights);
  const [rendered, setRendered] = useState(false);
  const isEpub = bookFormat === 'epub';

  highlightsRef.current = highlights;

  useEffect(() => {
    const canvasHost = canvasHostRef.current;
    const textLayer = textLayerRef.current;
    if (!canvasHost || !textLayer) return;
    setRendered(false);

    const renderTask = doc.renderPage(pageNumber, scale);
    renderTask.promise
      .then((result) => {
        canvasHost.querySelector('canvas')?.remove();
        result.canvas.style.width = '100%';
        result.canvas.style.height = 'auto';
        result.canvas.style.display = 'block';
        canvasHost.appendChild(result.canvas);
        setRendered(true);
      })
      .catch((error) => {
        if (!(error instanceof RenderCancelledError)) {
          console.error(`Failed to render page ${pageNumber}`, error);
        }
      });

    textLayer.replaceChildren();
    const textTask = doc.renderTextLayer(pageNumber, scale, textLayer);
    textTask.promise
      .then(() => {
        if (isEpub) {
          scheduleEpubHighlightSync(textLayer, pageNumber, highlightsRef.current);
        }
      })
      .catch(() => {
        // Text layer is best-effort; failures must not break page viewing.
      });

    return () => {
      renderTask.cancel();
      textTask.cancel();
      canvasHost.querySelector('canvas')?.remove();
      if (isEpub) clearEpubHighlights(textLayer, pageNumber);
      textLayer.replaceChildren();
    };
  }, [doc, pageNumber, scale, pageBackground, displayRevision, isEpub]);

  useEffect(() => {
    if (!isEpub) return;
    const textLayer = textLayerRef.current;
    if (!textLayer) return;

    let disposed = false;

    const sync = () => {
      if (!disposed) {
        scheduleEpubHighlightSync(textLayer, pageNumber, highlightsRef.current);
      }
    };
    const onScroll = () => {
      sync();
      onClearSelection?.();
    };

    textLayer.addEventListener('scroll', onScroll);

    let resizeObserver: ResizeObserver | null = null;
    const observeChapter = () => {
      const chapter = textLayer.querySelector('.epub-chapter');
      if (!chapter) return;
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(sync);
      resizeObserver.observe(chapter);
    };

    const mutation = new MutationObserver(() => {
      observeChapter();
      sync();
    });
    mutation.observe(textLayer, { childList: true, subtree: true });

    observeChapter();
    sync();

    return () => {
      disposed = true;
      mutation.disconnect();
      resizeObserver?.disconnect();
      textLayer.removeEventListener('scroll', onScroll);
    };
  }, [isEpub, highlights, onClearSelection, displayRevision, pageNumber]);

  useEffect(() => {
    if (!isEpub || epubScrollable) return;
    const textLayer = textLayerRef.current;
    if (!textLayer) return;

    const onWheel = (event: WheelEvent) => {
      const viewport = textLayer.closest('[data-reader-viewport]');
      if (!(viewport instanceof HTMLElement)) return;
      viewport.scrollTop += event.deltaY;
      event.preventDefault();
    };

    textLayer.addEventListener('wheel', onWheel, { passive: false });
    return () => textLayer.removeEventListener('wheel', onWheel);
  }, [isEpub, epubScrollable, displayRevision, pageNumber]);

  const textLayerClassName =
    isEpub && !epubScrollable ? 'textLayer epub-text-layer--paginated' : 'textLayer';

  return (
    <div
      className={`page-slot${inline ? ' page-slot--inline' : ''}`}
      style={inline ? { width, height } : { top, width, height }}
      data-page={pageNumber}
      data-testid={`page-${pageNumber}`}
    >
      <div
        className="page-canvas-host"
        style={{ width, height, backgroundColor: pageBackground }}
      >
        <div ref={canvasHostRef} className="page-canvas" style={{ width, height }} />
        <div ref={textLayerRef} className={textLayerClassName} />
        {!isEpub && (
          <div className="page-highlights">
            {highlights.map((h) =>
              (h.rects ?? []).map((rect, i) => (
                <div
                  key={`${h.id}-${i}`}
                  className="page-highlight"
                  style={{
                    left: rect.left * width,
                    top: rect.top * height,
                    width: rect.width * width,
                    height: rect.height * height,
                  }}
                />
              )),
            )}
          </div>
        )}
      </div>
      {!rendered && <div className="page-placeholder">Page {pageNumber}</div>}
    </div>
  );
}
