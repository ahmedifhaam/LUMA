import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PageGeometry } from '@/domain/document/types';
import { useReaderStore } from '@/application/reader/reader-store';
import { PageCanvas } from './PageCanvas';
import { useVirtualPages } from './useVirtualPages';

const PAGE_GAP = 16;
const OVERSCAN = 2;
const MAX_SCALE = 2;
const HORIZONTAL_PADDING = 48;

interface ReaderViewProps {
  onExit: () => void;
}

export function ReaderView({ onExit }: ReaderViewProps) {
  const status = useReaderStore((s) => s.status);
  const book = useReaderStore((s) => s.book);
  const doc = useReaderStore((s) => s.doc);
  const error = useReaderStore((s) => s.error);
  const location = useReaderStore((s) => s.location);
  const progress = useReaderStore((s) => s.progress);
  const updateLocation = useReaderStore((s) => s.updateLocation);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState<PageGeometry | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(location.pageNumber);
  const [pageInput, setPageInput] = useState(String(location.pageNumber));
  const restoredRef = useRef(false);

  useEffect(() => {
    restoredRef.current = false;
    setBase(null);
    if (doc) void doc.getPageGeometry(1).then(setBase);
  }, [doc]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [status]);

  const scale = useMemo(() => {
    if (!base || containerWidth === 0) return 1;
    const usable = Math.max(containerWidth - HORIZONTAL_PADDING, 240);
    return Math.min(usable / base.width, MAX_SCALE);
  }, [base, containerWidth]);

  const pageWidth = base ? base.width * scale : 0;
  const pageHeight = base ? base.height * scale : 0;
  const slotHeight = pageHeight + PAGE_GAP;
  const pageCount = doc?.metadata.pageCount ?? 0;

  const { range, totalHeight, offsetForPage, pageAtScroll, onScroll } = useVirtualPages(
    pageCount,
    slotHeight,
    OVERSCAN,
  );

  const goToPage = useCallback(
    (page: number) => {
      const el = scrollRef.current;
      if (!el || slotHeight <= 0) return;
      const target = Math.min(Math.max(page, 1), Math.max(pageCount, 1));
      el.scrollTo({ top: offsetForPage(target), behavior: 'auto' });
    },
    [offsetForPage, slotHeight, pageCount],
  );

  // Restore the saved reading position once geometry is known.
  useEffect(() => {
    if (restoredRef.current || !base || slotHeight <= 0 || pageCount === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const page = Math.min(Math.max(location.pageNumber, 1), pageCount);
    el.scrollTop = offsetForPage(page) + location.yOffset * slotHeight;
    onScroll(el.scrollTop, el.clientHeight);
    setCurrentPage(page);
    setPageInput(String(page));
    restoredRef.current = true;
  }, [base, slotHeight, pageCount, location, offsetForPage, onScroll]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !restoredRef.current) return;
    onScroll(el.scrollTop, el.clientHeight);
    const page = pageAtScroll(el.scrollTop, el.clientHeight);
    const yOffset = Math.min(
      Math.max((el.scrollTop - offsetForPage(page)) / slotHeight, 0),
      1,
    );
    setCurrentPage(page);
    setPageInput(String(page));
    updateLocation({ pageNumber: page, yOffset });
  }, [onScroll, pageAtScroll, offsetForPage, slotHeight, updateLocation]);

  const submitPage = useCallback(() => {
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isFinite(parsed)) goToPage(parsed);
  }, [pageInput, goToPage]);

  if (status === 'opening') {
    return <div className="reader-status">Opening book…</div>;
  }
  if (status === 'error') {
    return (
      <div className="reader-status reader-status--error">
        <p>Could not open this book.</p>
        <p className="reader-status__detail">{error}</p>
        <button className="btn" onClick={onExit}>
          ← Back to library
        </button>
      </div>
    );
  }
  if (!doc || !book) return null;

  const pages: number[] = [];
  for (let page = range.start; page <= range.end; page += 1) pages.push(page);

  return (
    <div className="reader">
      <header className="reader__toolbar">
        <button className="btn btn--ghost" onClick={onExit} aria-label="Back to library">
          ← Library
        </button>
        <div className="reader__title" title={book.title}>
          {book.title}
        </div>
        <div className="reader__nav">
          <button
            className="btn btn--icon"
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          >
            ‹
          </button>
          <form
            className="reader__page-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitPage();
            }}
          >
            <input
              className="reader__page-input"
              value={pageInput}
              inputMode="numeric"
              aria-label="Go to page"
              onChange={(event) => setPageInput(event.target.value)}
              onBlur={submitPage}
            />
            <span className="reader__page-total">/ {pageCount.toLocaleString()}</span>
          </form>
          <button
            className="btn btn--icon"
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </header>

      {!book.hasText && (
        <div className="reader__image-warning" role="alert" data-testid="image-warning">
          This document appears to be image-based (scanned). Text search, selection, and
          highlighting may be unavailable.
        </div>
      )}

      <div className="reader__progress" aria-hidden>
        <div
          className="reader__progress-bar"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="reader__viewport" ref={scrollRef} onScroll={handleScroll}>
        {base ? (
          <div className="reader__pages" style={{ height: totalHeight }}>
            {pages.map((page) => (
              <PageCanvas
                key={page}
                doc={doc}
                pageNumber={page}
                scale={scale}
                width={pageWidth}
                height={pageHeight}
                top={offsetForPage(page)}
              />
            ))}
          </div>
        ) : (
          <div className="reader-status">Preparing document…</div>
        )}
      </div>
    </div>
  );
}
