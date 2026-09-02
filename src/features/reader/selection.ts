import type { NormalizedRect, TextAnchor } from '@/domain/book/types';
import { textAnchorFromRange } from './epub-text-anchor';

export interface SelectionHighlight {
  pageNumber: number;
  yOffset: number;
  quote: string;
  rects: NormalizedRect[];
  textAnchor?: TextAnchor;
  /** Anchor point (viewport client coords) for a selection popover. */
  anchorX: number;
  anchorY: number;
}

export interface SelectionMeasureContext {
  kind: 'page' | 'epub';
  width: number;
  height: number;
  scrollLeft: number;
  scrollTop: number;
  toContentX: (viewportX: number) => number;
  toContentY: (viewportY: number) => number;
}

function findPageSlot(node: Node | null, root: HTMLElement): HTMLElement | null {
  let el = node instanceof HTMLElement ? node : (node?.parentElement ?? null);
  while (el && el !== root) {
    if (el.dataset.page) return el;
    el = el.parentElement;
  }
  return null;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function measureContextForSlot(slot: HTMLElement): SelectionMeasureContext {
  const chapter = slot.querySelector('.epub-chapter');
  const layer = slot.querySelector('.epub-text-layer') as HTMLElement | null;

  if (chapter && layer) {
    const layerRect = layer.getBoundingClientRect();
    return {
      kind: 'epub',
      width: chapter.scrollWidth,
      height: chapter.scrollHeight,
      scrollLeft: layer.scrollLeft,
      scrollTop: layer.scrollTop,
      toContentX: (viewportX) => viewportX - layerRect.left + layer.scrollLeft,
      toContentY: (viewportY) => viewportY - layerRect.top + layer.scrollTop,
    };
  }

  const slotRect = slot.getBoundingClientRect();
  return {
    kind: 'page',
    width: slotRect.width,
    height: slotRect.height,
    scrollLeft: 0,
    scrollTop: 0,
    toContentX: (viewportX) => viewportX - slotRect.left,
    toContentY: (viewportY) => viewportY - slotRect.top,
  };
}

export function rectsFromRange(
  context: SelectionMeasureContext,
  clientRects: Array<Pick<DOMRect, 'left' | 'top' | 'width' | 'height' | 'bottom'>>,
): NormalizedRect[] {
  const rects: NormalizedRect[] = [];
  for (const rect of clientRects) {
    if (rect.width === 0 || rect.height === 0) continue;
    const left = context.toContentX(rect.left);
    const top = context.toContentY(rect.top);
    rects.push({
      left: clamp01(left / context.width),
      top: clamp01(top / context.height),
      width: clamp01(rect.width / context.width),
      height: clamp01(rect.height / context.height),
    });
  }
  return rects;
}

/**
 * Derive a page-anchored highlight from the current window selection, if it
 * falls within a rendered page inside `root`. Returns null for empty/collapsed
 * selections or selections outside the reader.
 */
export function getSelectionHighlight(root: HTMLElement): SelectionHighlight | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;

  const quote = selection.toString().trim();
  if (!quote) return null;

  const range = selection.getRangeAt(0);
  const slot = findPageSlot(range.startContainer, root);
  if (!slot || !slot.dataset.page) return null;

  const context = measureContextForSlot(slot);
  if (context.width === 0 || context.height === 0) return null;

  const slotRect = slot.getBoundingClientRect();
  const clientRects = Array.from(range.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0 && rect.bottom >= slotRect.top && rect.top <= slotRect.bottom,
  );
  const rects = rectsFromRange(context, clientRects);
  if (rects.length === 0) return null;

  const chapter = slot.querySelector('.epub-chapter') as HTMLElement | null;
  const textAnchor =
    chapter && context.kind === 'epub' ? textAnchorFromRange(chapter, range) : undefined;

  const last = clientRects[clientRects.length - 1];
  return {
    pageNumber: Number(slot.dataset.page),
    yOffset: rects[0].top,
    quote,
    rects,
    textAnchor: textAnchor ?? undefined,
    anchorX: last ? last.right : slotRect.left,
    anchorY: last ? last.bottom : slotRect.top,
  };
}
