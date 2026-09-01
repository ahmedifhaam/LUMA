import { useEffect, useRef, useState } from 'react';
import type { OpenDocument } from '@/domain/document/types';
import { RenderCancelledError } from '@/infrastructure/document-engine/pdfjs/pdf-engine';

interface PageCanvasProps {
  doc: OpenDocument;
  pageNumber: number;
  scale: number;
  width: number;
  height: number;
  top: number;
}

/**
 * Renders a single PDF page to a canvas on demand and releases it on unmount.
 *
 * The render task is cancelled when the page leaves the active/overscan window,
 * so rendered page resources stay bounded and owned by the reader subsystem
 * rather than global state (architectural rule 6).
 */
export function PageCanvas({
  doc,
  pageNumber,
  scale,
  width,
  height,
  top,
}: PageCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setRendered(false);
    const task = doc.renderPage(pageNumber, scale);

    task.promise
      .then((result) => {
        const canvas = host.querySelector('canvas');
        if (canvas) canvas.remove();
        result.canvas.style.width = '100%';
        result.canvas.style.height = 'auto';
        result.canvas.style.display = 'block';
        host.appendChild(result.canvas);
        setRendered(true);
      })
      .catch((error) => {
        if (!(error instanceof RenderCancelledError)) {
          // Surface unexpected render failures during development.
          console.error(`Failed to render page ${pageNumber}`, error);
        }
      });

    return () => {
      task.cancel();
      const canvas = host.querySelector('canvas');
      if (canvas) canvas.remove();
    };
  }, [doc, pageNumber, scale]);

  return (
    <div
      className="page-slot"
      style={{ top, width, height }}
      data-page={pageNumber}
      data-testid={`page-${pageNumber}`}
    >
      <div ref={hostRef} className="page-canvas-host" style={{ width, height }} />
      {!rendered && <div className="page-placeholder">Page {pageNumber}</div>}
    </div>
  );
}
