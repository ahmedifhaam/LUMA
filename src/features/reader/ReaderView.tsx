import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Annotation } from '@/domain/book/types';
import type { PageGeometry } from '@/domain/document/types';
import { useReaderStore } from '@/application/reader/reader-store';
import { useAnnotationsStore } from '@/application/annotations/annotations-store';
import { PageCanvas } from './PageCanvas';
import { useVirtualPages } from './useVirtualPages';
import { getSelectionHighlight, type SelectionHighlight } from './selection';
import { OutlinePanel } from './panels/OutlinePanel';
import { SearchPanel } from './panels/SearchPanel';
import { BookmarksPanel } from './panels/BookmarksPanel';
import { NotesPanel } from './panels/NotesPanel';
import { useReaderShortcuts } from './useReaderShortcuts';

const PAGE_GAP = 16;
const OVERSCAN = 2;
const MAX_SCALE = 2;
const HORIZONTAL_PADDING = 48;

type PanelId = 'contents' | 'search' | 'bookmarks' | 'notes';

const PANELS: { id: PanelId; label: string; icon: string }[] = [
  { id: 'contents', label: 'Contents', icon: '☰' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
  { id: 'notes', label: 'Notes', icon: '✎' },
];

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

  const annotations = useAnnotationsStore((s) => s.annotations);
  const toggleBookmark = useAnnotationsStore((s) => s.toggleBookmark);
  const addHighlight = useAnnotationsStore((s) => s.addHighlight);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState<PageGeometry | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(location.pageNumber);
  const [pageInput, setPageInput] = useState(String(location.pageNumber));
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [selection, setSelection] = useState<SelectionHighlight | null>(null);
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
  }, [status, activePanel]);

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

  const highlightsByPage = useMemo(() => {
    const map = new Map<number, Annotation[]>();
    for (const a of annotations) {
      if (a.type !== 'highlight') continue;
      const list = map.get(a.location.pageNumber) ?? [];
      list.push(a);
      map.set(a.location.pageNumber, list);
    }
    return map;
  }, [annotations]);

  const isBookmarked = useMemo(
    () =>
      annotations.some(
        (a) => a.type === 'bookmark' && a.location.pageNumber === currentPage,
      ),
    [annotations, currentPage],
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
    setSelection(null);
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

  const handlePointerUp = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setSelection(getSelectionHighlight(el));
  }, []);

  const commitHighlight = useCallback(() => {
    if (!selection) return;
    void addHighlight({
      location: { pageNumber: selection.pageNumber, yOffset: selection.yOffset },
      quote: selection.quote,
      rects: selection.rects,
    });
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, [selection, addHighlight]);

  const submitPage = useCallback(() => {
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isFinite(parsed)) goToPage(parsed);
  }, [pageInput, goToPage]);

  const navigateFromPanel = useCallback(
    (page: number) => {
      goToPage(page);
    },
    [goToPage],
  );

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  useReaderShortcuts({
    currentPage,
    pageCount,
    activePanel,
    hasSelection: selection !== null,
    onGoToPage: goToPage,
    onToggleBookmark: () => void toggleBookmark({ pageNumber: currentPage, yOffset: 0 }),
    onSetActivePanel: setActivePanel,
    onClearSelection: clearSelection,
  });

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

        <button
          className={`btn btn--icon${isBookmarked ? ' btn--active' : ''}`}
          aria-pressed={isBookmarked}
          aria-label={
            isBookmarked ? 'Remove bookmark on this page' : 'Bookmark this page'
          }
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
          onClick={() => void toggleBookmark({ pageNumber: currentPage, yOffset: 0 })}
        >
          {isBookmarked ? '🔖' : '🏷'}
        </button>

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

        <div className="reader__panel-tabs">
          {PANELS.map((panel) => (
            <button
              key={panel.id}
              className={`btn btn--icon${activePanel === panel.id ? ' btn--active' : ''}`}
              aria-label={panel.label}
              aria-pressed={activePanel === panel.id}
              title={panel.label}
              onClick={() =>
                setActivePanel((current) => (current === panel.id ? null : panel.id))
              }
            >
              {panel.icon}
            </button>
          ))}
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

      <div className="reader__body">
        <div
          className="reader__viewport"
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseUp={handlePointerUp}
        >
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
                  highlights={highlightsByPage.get(page) ?? []}
                />
              ))}
            </div>
          ) : (
            <div className="reader-status">Preparing document…</div>
          )}
        </div>

        {activePanel && (
          <aside className="reader__panel" aria-label={`${activePanel} panel`}>
            <div className="reader__panel-head">
              <span className="reader__panel-title">
                {PANELS.find((p) => p.id === activePanel)?.label}
              </span>
              <button
                className="btn btn--icon"
                aria-label="Close panel"
                onClick={() => setActivePanel(null)}
              >
                ×
              </button>
            </div>
            <div className="reader__panel-body">
              {activePanel === 'contents' && (
                <OutlinePanel onNavigate={navigateFromPanel} />
              )}
              {activePanel === 'search' && <SearchPanel onNavigate={navigateFromPanel} />}
              {activePanel === 'bookmarks' && (
                <BookmarksPanel onNavigate={navigateFromPanel} />
              )}
              {activePanel === 'notes' && (
                <NotesPanel currentPage={currentPage} onNavigate={navigateFromPanel} />
              )}
            </div>
          </aside>
        )}
      </div>

      {selection && (
        <button
          className="selection-popover"
          style={{ left: selection.anchorX, top: selection.anchorY + 8 }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={commitHighlight}
        >
          Highlight
        </button>
      )}
    </div>
  );
}
