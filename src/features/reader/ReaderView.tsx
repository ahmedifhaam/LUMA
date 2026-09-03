import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Annotation } from '@/domain/book/types';
import type { DocumentLocation, PageGeometry } from '@/domain/document/types';
import { useContinuationStore } from '@/application/sync/continuation-store';
import { AppMenu } from '@/features/menu/AppMenu';
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
import { isEditableTarget } from './reader-shortcuts';
import { ContinuationPrompt } from './ContinuationPrompt';
import { ReaderBottomBar } from './ReaderBottomBar';
import {
  applyZoomMultiplier,
  clampIndex,
  loadStoredDisplayPrefs,
  storeDisplayPrefs,
  supportsTextSizing,
  textSizeMultiplier,
  themeById,
  type ReaderThemeId,
  ZOOM_STEPS,
  TEXT_SIZE_STEPS,
} from './reader-display';
import {
  computePageScale,
  loadStoredFitMode,
  loadStoredViewMode,
  offsetForPage as layoutOffsetForPage,
  pageAtScroll as layoutPageAtScroll,
  slotHeightForMode,
  spreadsInRange,
  scrollSlotCount,
  stepPage,
  storeFitMode,
  storeViewMode,
  type PageFitMode,
  type ViewMode,
} from './reader-layout';

const OVERSCAN = 2;

type PanelId = 'contents' | 'search' | 'bookmarks' | 'notes';

const PANELS: { id: PanelId; label: string; icon: string }[] = [
  { id: 'contents', label: 'Contents', icon: '☰' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
  { id: 'notes', label: 'Notes', icon: '✎' },
];

interface ReaderViewProps {
  onExit: () => void;
  onOpenShortcuts: () => void;
}

export function ReaderView({ onExit, onOpenShortcuts }: ReaderViewProps) {
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
  const [containerHeight, setContainerHeight] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadStoredViewMode());
  const [fitMode, setFitMode] = useState<PageFitMode>(() => loadStoredFitMode());
  const [displayPrefs, setDisplayPrefs] = useState(() => loadStoredDisplayPrefs());
  const [displayRevision, setDisplayRevision] = useState(0);
  const [currentPage, setCurrentPage] = useState(location.pageNumber);
  const [pageInput, setPageInput] = useState(String(location.pageNumber));
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [selection, setSelection] = useState<SelectionHighlight | null>(null);
  const restoredRef = useRef(false);
  const layoutChangeRef = useRef(false);
  const continuationCheckedRef = useRef<string | null>(null);

  useEffect(() => {
    restoredRef.current = false;
    continuationCheckedRef.current = null;
    setBase(null);
    if (doc) void doc.getPageGeometry(1).then(setBase);
  }, [doc]);

  useEffect(() => {
    if (status !== 'ready' || !book) return;
    if (continuationCheckedRef.current === book.id) return;
    continuationCheckedRef.current = book.id;
    void useContinuationStore.getState().checkOnOpen(book, location);
  }, [status, book, location]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      setContainerWidth(el.clientWidth);
      setContainerHeight(el.clientHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [status, activePanel, viewMode]);

  const fitScale = useMemo(() => {
    if (!base || containerWidth === 0) return 1;
    return computePageScale(
      base,
      containerWidth,
      containerHeight,
      fitMode,
      viewMode,
    );
  }, [base, containerWidth, containerHeight, fitMode, viewMode]);

  const scale = useMemo(
    () => applyZoomMultiplier(fitScale, displayPrefs.zoomIndex),
    [fitScale, displayPrefs.zoomIndex],
  );

  const theme = useMemo(() => themeById(displayPrefs.themeId), [displayPrefs.themeId]);
  const textScale = textSizeMultiplier(displayPrefs.textSizeIndex);
  const textSizingEnabled = supportsTextSizing(book?.format);
  const pageBackground =
    book?.format === 'epub' ? theme.pageBackground : '#ffffff';

  const viewportStyle = useMemo(
    () =>
      ({
        backgroundColor: theme.viewportBackground,
        '--reader-page-bg': theme.pageBackground,
        '--reader-text-color': theme.textColor,
        '--reader-text-scale': String(textScale),
      }) as CSSProperties,
    [theme, textScale],
  );

  const pageWidth = base ? base.width * scale : 0;
  const pageHeight = base ? base.height * scale : 0;
  const pageCount = doc?.metadata.pageCount ?? 0;
  const slotHeight = slotHeightForMode(viewMode, pageHeight, containerHeight);
  const scrollSlots = scrollSlotCount(pageCount, viewMode);

  const { range, totalHeight, onScroll } = useVirtualPages(
    scrollSlots,
    slotHeight,
    OVERSCAN,
  );

  const layoutOffsetForPageNumber = useCallback(
    (pageNumber: number) => layoutOffsetForPage(pageNumber, viewMode, slotHeight),
    [viewMode, slotHeight],
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

  const syncPageFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    onScroll(el.scrollTop, el.clientHeight);
    const page = layoutPageAtScroll(
      el.scrollTop,
      el.clientHeight,
      pageCount,
      viewMode,
      slotHeight,
      el.clientWidth,
      pageWidth,
    );
    const yOffset =
      viewMode === 'continuous'
        ? Math.min(
            Math.max((el.scrollTop - layoutOffsetForPageNumber(page)) / slotHeight, 0),
            1,
          )
        : 0;
    setCurrentPage(page);
    setPageInput(String(page));
    updateLocation({ pageNumber: page, yOffset });
  }, [
    onScroll,
    pageCount,
    viewMode,
    slotHeight,
    pageWidth,
    layoutOffsetForPageNumber,
    updateLocation,
  ]);

  const goToPage = useCallback(
    (page: number) => {
      const el = scrollRef.current;
      if (!el || slotHeight <= 0) return;
      const target = Math.min(Math.max(page, 1), Math.max(pageCount, 1));
      el.scrollTo({ top: layoutOffsetForPageNumber(target), behavior: 'auto' });
      syncPageFromScroll();
    },
    [layoutOffsetForPageNumber, slotHeight, pageCount, syncPageFromScroll],
  );

  useEffect(() => {
    if (restoredRef.current || !base || slotHeight <= 0 || pageCount === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const page = Math.min(Math.max(location.pageNumber, 1), pageCount);
    if (viewMode === 'continuous') {
      el.scrollTop =
        layoutOffsetForPageNumber(page) + location.yOffset * slotHeight;
    } else {
      el.scrollTop = layoutOffsetForPageNumber(page);
    }
    onScroll(el.scrollTop, el.clientHeight);
    setCurrentPage(page);
    setPageInput(String(page));
    restoredRef.current = true;
  }, [
    base,
    slotHeight,
    pageCount,
    location,
    layoutOffsetForPageNumber,
    onScroll,
    viewMode,
  ]);

  useEffect(() => {
    if (!layoutChangeRef.current || slotHeight <= 0) return;
    layoutChangeRef.current = false;
    goToPage(currentPage);
  }, [viewMode, fitMode, displayPrefs, slotHeight, goToPage, currentPage]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    layoutChangeRef.current = true;
    storeViewMode(mode);
    setViewMode(mode);
  }, []);

  const handleFitModeChange = useCallback((mode: PageFitMode) => {
    layoutChangeRef.current = true;
    storeFitMode(mode);
    setFitMode(mode);
  }, []);

  const persistDisplay = useCallback((next: typeof displayPrefs) => {
    layoutChangeRef.current = true;
    storeDisplayPrefs(next);
    setDisplayPrefs(next);
    setDisplayRevision((value) => value + 1);
  }, []);

  const handleZoomIndexChange = useCallback(
    (index: number) => {
      persistDisplay({
        ...displayPrefs,
        zoomIndex: clampIndex(index, ZOOM_STEPS.length),
      });
    },
    [displayPrefs, persistDisplay],
  );

  const handleTextSizeIndexChange = useCallback(
    (index: number) => {
      persistDisplay({
        ...displayPrefs,
        textSizeIndex: clampIndex(index, TEXT_SIZE_STEPS.length),
      });
    },
    [displayPrefs, persistDisplay],
  );

  const handleThemeChange = useCallback(
    (themeId: ReaderThemeId) => {
      persistDisplay({ ...displayPrefs, themeId });
    },
    [displayPrefs, persistDisplay],
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !restoredRef.current) return;
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    syncPageFromScroll();
  }, [syncPageFromScroll]);

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
      textAnchor: selection.textAnchor,
    });
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, [selection, addHighlight]);

  const stepReaderPage = useCallback(
    (direction: -1 | 1) => {
      goToPage(stepPage(currentPage, pageCount, viewMode, direction));
    },
    [goToPage, currentPage, pageCount, viewMode],
  );

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

  const handleContinuationContinue = useCallback(
    (loc: DocumentLocation) => {
      updateLocation(loc);
      const el = scrollRef.current;
      if (!el || slotHeight <= 0) return;
      const page = Math.min(Math.max(loc.pageNumber, 1), Math.max(pageCount, 1));
      const top =
        viewMode === 'continuous'
          ? layoutOffsetForPageNumber(page) + loc.yOffset * slotHeight
          : layoutOffsetForPageNumber(page);
      el.scrollTo({ top, behavior: 'auto' });
      syncPageFromScroll();
    },
    [
      updateLocation,
      slotHeight,
      pageCount,
      viewMode,
      layoutOffsetForPageNumber,
      syncPageFromScroll,
    ],
  );

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  useReaderShortcuts({
    currentPage,
    pageCount,
    viewMode,
    activePanel,
    hasSelection: selection !== null,
    onGoToPage: goToPage,
    onToggleBookmark: () => void toggleBookmark({ pageNumber: currentPage, yOffset: 0 }),
    onSetActivePanel: setActivePanel,
    onClearSelection: clearSelection,
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== '?' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      onOpenShortcuts();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenShortcuts]);

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

  const epubScrollable = viewMode === 'continuous';

  const pages: number[] = [];
  for (let page = range.start; page <= range.end; page += 1) pages.push(page);

  const spreads =
    viewMode === 'double'
      ? spreadsInRange(range.start, range.end, pageCount, slotHeight)
      : [];

  const viewportClassName =
    viewMode === 'continuous'
      ? 'reader__viewport'
      : 'reader__viewport reader__viewport--paginated';

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
            onClick={() => stepReaderPage(-1)}
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
            onClick={() => stepReaderPage(1)}
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
          <AppMenu onOpenShortcuts={onOpenShortcuts} />
        </div>
      </header>

      <ContinuationPrompt onContinue={handleContinuationContinue} />

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
          className={viewportClassName}
          data-reader-viewport
          style={viewportStyle}
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseUp={handlePointerUp}
        >
          {base ? (
            <div className="reader__pages" style={{ height: totalHeight }}>
              {viewMode === 'continuous' &&
                pages.map((page) => (
                  <PageCanvas
                    key={page}
                    doc={doc}
                    pageNumber={page}
                    scale={scale}
                    width={pageWidth}
                    height={pageHeight}
                    top={layoutOffsetForPageNumber(page)}
                    pageBackground={pageBackground}
                    displayRevision={displayRevision}
                    bookFormat={book.format ?? 'pdf'}
                    highlights={highlightsByPage.get(page) ?? []}
                    onClearSelection={clearSelection}
                    epubScrollable={epubScrollable}
                  />
                ))}

              {viewMode === 'single' &&
                pages.map((page) => (
                  <div
                    key={page}
                    className="reader-slot reader-slot--single"
                    style={{
                      top: layoutOffsetForPageNumber(page),
                      height: slotHeight,
                    }}
                  >
                    <PageCanvas
                      doc={doc}
                      pageNumber={page}
                      scale={scale}
                      width={pageWidth}
                      height={pageHeight}
                      inline
                      pageBackground={pageBackground}
                      displayRevision={displayRevision}
                      bookFormat={book.format ?? 'pdf'}
                      highlights={highlightsByPage.get(page) ?? []}
                      onClearSelection={clearSelection}
                      epubScrollable={epubScrollable}
                    />
                  </div>
                ))}

              {viewMode === 'double' &&
                spreads.map((spread) => (
                  <div
                    key={spread.index}
                    className="reader-slot reader-slot--double"
                    style={{ top: spread.top, height: slotHeight }}
                  >
                    <div className="reader-spread">
                      <PageCanvas
                        doc={doc}
                        pageNumber={spread.leftPage}
                        scale={scale}
                        width={pageWidth}
                        height={pageHeight}
                        inline
                        pageBackground={pageBackground}
                        displayRevision={displayRevision}
                        bookFormat={book.format ?? 'pdf'}
                        highlights={highlightsByPage.get(spread.leftPage) ?? []}
                        onClearSelection={clearSelection}
                        epubScrollable={epubScrollable}
                      />
                      {spread.rightPage ? (
                        <PageCanvas
                          doc={doc}
                          pageNumber={spread.rightPage}
                          scale={scale}
                          width={pageWidth}
                          height={pageHeight}
                          inline
                          pageBackground={pageBackground}
                          displayRevision={displayRevision}
                          bookFormat={book.format ?? 'pdf'}
                          highlights={highlightsByPage.get(spread.rightPage) ?? []}
                          onClearSelection={clearSelection}
                          epubScrollable={epubScrollable}
                        />
                      ) : (
                        <div
                          className="reader-spread__blank"
                          style={{
                            width: pageWidth,
                            height: pageHeight,
                            backgroundColor: pageBackground,
                          }}
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>
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

      <ReaderBottomBar
        fitMode={fitMode}
        viewMode={viewMode}
        zoomIndex={displayPrefs.zoomIndex}
        textSizeIndex={displayPrefs.textSizeIndex}
        themeId={displayPrefs.themeId}
        textSizingEnabled={textSizingEnabled}
        onFitModeChange={handleFitModeChange}
        onViewModeChange={handleViewModeChange}
        onZoomIndexChange={handleZoomIndexChange}
        onTextSizeIndexChange={handleTextSizeIndexChange}
        onThemeChange={handleThemeChange}
      />

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
