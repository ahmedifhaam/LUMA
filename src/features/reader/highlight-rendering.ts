import type { Annotation } from '@/domain/book/types';
import {
  chapterLocalRects,
  rangeFromTextAnchor,
  textAnchorFromQuote,
} from './epub-text-anchor';

const MAX_SYNC_ATTEMPTS = 30;
const CSS_HIGHLIGHT_PREFIX = 'luma-epub-p';

function supportsCssHighlights(): boolean {
  return typeof CSS !== 'undefined' && 'highlights' in CSS;
}

function cssHighlightName(pageNumber: number): string {
  return `${CSS_HIGHLIGHT_PREFIX}${pageNumber}`;
}

function ensureCssHighlightStyle(pageNumber: number): void {
  const styleId = `${CSS_HIGHLIGHT_PREFIX}style-${pageNumber}`;
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `::highlight(${cssHighlightName(pageNumber)}) { background-color: rgba(250, 204, 21, 0.4); }`;
  document.head.appendChild(style);
}

function clearCssHighlights(pageNumber: number): void {
  if (!supportsCssHighlights()) return;
  CSS.highlights.delete(cssHighlightName(pageNumber));
}

function resolveHighlightRange(
  chapter: HTMLElement,
  highlight: Annotation,
): Range | null {
  if (highlight.textAnchor) {
    const range = rangeFromTextAnchor(chapter, highlight.textAnchor);
    if (range) return range;
  }
  if (highlight.quote) {
    const anchor = textAnchorFromQuote(
      chapter,
      highlight.quote,
      highlight.location.yOffset,
    );
    if (anchor) return rangeFromTextAnchor(chapter, anchor);
  }
  return null;
}

function ensureOverlay(chapter: HTMLElement): Element {
  let overlay = chapter.querySelector('.epub-highlights');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'epub-highlights';
    chapter.appendChild(overlay);
  }
  return overlay;
}

function renderRangeToOverlay(chapter: HTMLElement, overlay: Element, range: Range): number {
  let rendered = 0;
  for (const rect of chapterLocalRects(chapter, range)) {
    const node = document.createElement('div');
    node.className = 'page-highlight';
    node.style.left = `${rect.left}px`;
    node.style.top = `${rect.top}px`;
    node.style.width = `${rect.width}px`;
    node.style.height = `${rect.height}px`;
    overlay.appendChild(node);
    rendered += 1;
  }
  return rendered;
}

function renderLegacyRects(chapter: HTMLElement, overlay: Element, highlight: Annotation): number {
  const contentWidth = chapter.scrollWidth;
  const contentHeight = chapter.scrollHeight;
  if (contentWidth === 0 || contentHeight === 0) return 0;

  let rendered = 0;
  for (const rect of highlight.rects ?? []) {
    const node = document.createElement('div');
    node.className = 'page-highlight';
    node.style.left = `${rect.left * contentWidth}px`;
    node.style.top = `${rect.top * contentHeight}px`;
    node.style.width = `${rect.width * contentWidth}px`;
    node.style.height = `${rect.height * contentHeight}px`;
    overlay.appendChild(node);
    rendered += 1;
  }
  return rendered;
}

function applyCssHighlights(
  chapter: HTMLElement,
  pageNumber: number,
  highlights: Annotation[],
): number {
  if (!supportsCssHighlights()) return 0;

  const ranges: Range[] = [];
  for (const highlight of highlights) {
    const range = resolveHighlightRange(chapter, highlight);
    if (range) ranges.push(range);
  }

  if (ranges.length === 0) return 0;

  ensureCssHighlightStyle(pageNumber);
  try {
    CSS.highlights.set(cssHighlightName(pageNumber), new Highlight(...ranges));
    return ranges.length;
  } catch {
    return 0;
  }
}

export function syncEpubHighlights(
  textLayer: HTMLElement,
  pageNumber: number,
  highlights: Annotation[],
): boolean {
  const chapter = textLayer.querySelector('.epub-chapter') as HTMLElement | null;
  if (!chapter) return false;

  clearCssHighlights(pageNumber);
  const overlay = ensureOverlay(chapter);
  overlay.replaceChildren();

  const cssApplied = applyCssHighlights(chapter, pageNumber, highlights);
  let overlayRendered = 0;

  if (cssApplied === 0) {
    for (const highlight of highlights) {
      const range = resolveHighlightRange(chapter, highlight);
      if (range) {
        overlayRendered += renderRangeToOverlay(chapter, overlay, range);
        continue;
      }
      overlayRendered += renderLegacyRects(chapter, overlay, highlight);
    }
  }

  if (highlights.length === 0) return true;
  return cssApplied > 0 || overlayRendered > 0;
}

export function scheduleEpubHighlightSync(
  textLayer: HTMLElement,
  pageNumber: number,
  highlights: Annotation[],
  attempt = 0,
): void {
  const delay = attempt === 0 ? 0 : Math.min(50 * attempt, 250);

  const run = () => {
    const chapter = textLayer.querySelector('.epub-chapter');
    if (!chapter) {
      if (attempt < MAX_SYNC_ATTEMPTS) {
        scheduleEpubHighlightSync(textLayer, pageNumber, highlights, attempt + 1);
      }
      return;
    }

    const rendered = syncEpubHighlights(textLayer, pageNumber, highlights);
    if (!rendered && attempt < MAX_SYNC_ATTEMPTS) {
      scheduleEpubHighlightSync(textLayer, pageNumber, highlights, attempt + 1);
    }
  };

  if (attempt === 0 && document.fonts?.ready) {
    void document.fonts.ready.finally(() => {
      window.setTimeout(run, delay);
    });
    return;
  }

  window.setTimeout(run, delay);
}

export function clearEpubHighlights(textLayer: HTMLElement, pageNumber: number): void {
  clearCssHighlights(pageNumber);
  textLayer.querySelector('.epub-highlights')?.remove();
}
