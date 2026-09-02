import { useEffect, useRef, useState } from 'react';
import type { Annotation } from '@/domain/book/types';
import type { OpenDocument } from '@/domain/document/types';
import { RenderCancelledError } from '@/infrastructure/document-engine/pdfjs/pdf-engine';

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
  highlights: Annotation[];
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
  highlights,
}: PageCanvasProps) {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

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
    textTask.promise.catch(() => {
      // Text layer is best-effort; failures must not break page viewing.
    });

    return () => {
      renderTask.cancel();
      textTask.cancel();
      canvasHost.querySelector('canvas')?.remove();
      textLayer.replaceChildren();
    };
  }, [doc, pageNumber, scale, pageBackground, displayRevision]);

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
        <div ref={textLayerRef} className="textLayer" />
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
      </div>
      {!rendered && <div className="page-placeholder">Page {pageNumber}</div>}
    </div>
  );
}
