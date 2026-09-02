import type { Annotation } from '@/domain/book/types';
import {
  chapterLocalRects,
  rangeFromTextAnchor,
  textAnchorFromQuote,
} from './epub-text-anchor';

const MAX_SYNC_ATTEMPTS = 12;

function resolveTextAnchor(
  chapter: HTMLElement,
  highlight: Annotation,
): ReturnType<typeof rangeFromTextAnchor> {
  if (highlight.textAnchor) {
    return rangeFromTextAnchor(chapter, highlight.textAnchor);
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

function countRenderedHighlights(overlay: Element | null): number {
  return overlay?.querySelectorAll('.page-highlight').length ?? 0;
}

export function syncEpubHighlights(textLayer: HTMLElement, highlights: Annotation[]): boolean {
  const chapter = textLayer.querySelector('.epub-chapter') as HTMLElement | null;
  if (!chapter) return false;

  let overlay = chapter.querySelector('.epub-highlights');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'epub-highlights';
    chapter.appendChild(overlay);
  }

  overlay.replaceChildren();

  for (const highlight of highlights) {
    const range = resolveTextAnchor(chapter, highlight);
    if (range) {
      for (const rect of chapterLocalRects(chapter, range)) {
        const node = document.createElement('div');
        node.className = 'page-highlight';
        node.style.left = `${rect.left}px`;
        node.style.top = `${rect.top}px`;
        node.style.width = `${rect.width}px`;
        node.style.height = `${rect.height}px`;
        overlay.appendChild(node);
      }
      continue;
    }

    const contentWidth = chapter.scrollWidth;
    const contentHeight = chapter.scrollHeight;
    if (contentWidth === 0 || contentHeight === 0) continue;

    for (const rect of highlight.rects ?? []) {
      const node = document.createElement('div');
      node.className = 'page-highlight';
      node.style.left = `${rect.left * contentWidth}px`;
      node.style.top = `${rect.top * contentHeight}px`;
      node.style.width = `${rect.width * contentWidth}px`;
      node.style.height = `${rect.height * contentHeight}px`;
      overlay.appendChild(node);
    }
  }

  if (highlights.length === 0) return true;
  return countRenderedHighlights(overlay) > 0;
}

export function scheduleEpubHighlightSync(
  textLayer: HTMLElement,
  highlights: Annotation[],
  attempt = 0,
): void {
  const run = () => {
    const rendered = syncEpubHighlights(textLayer, highlights);
    if (!rendered && attempt < MAX_SYNC_ATTEMPTS) {
      scheduleEpubHighlightSync(textLayer, highlights, attempt + 1);
    }
  };

  if (attempt === 0 && document.fonts?.ready) {
    void document.fonts.ready.then(() => {
      requestAnimationFrame(run);
    });
    return;
  }

  requestAnimationFrame(run);
}

export function clearEpubHighlights(textLayer: HTMLElement): void {
  textLayer.querySelector('.epub-highlights')?.remove();
}
