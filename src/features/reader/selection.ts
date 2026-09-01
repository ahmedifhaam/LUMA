import type { NormalizedRect } from '@/domain/book/types';

export interface SelectionHighlight {
  pageNumber: number;
  yOffset: number;
  quote: string;
  rects: NormalizedRect[];
  /** Anchor point (viewport client coords) for a selection popover. */
  anchorX: number;
  anchorY: number;
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

  const slotRect = slot.getBoundingClientRect();
  if (slotRect.width === 0 || slotRect.height === 0) return null;

  const rects: NormalizedRect[] = [];
  for (const r of Array.from(range.getClientRects())) {
    if (r.width === 0 || r.height === 0) continue;
    // Ignore rects outside this page (e.g. a selection spilling to the next page).
    if (r.bottom < slotRect.top || r.top > slotRect.bottom) continue;
    rects.push({
      left: clamp01((r.left - slotRect.left) / slotRect.width),
      top: clamp01((r.top - slotRect.top) / slotRect.height),
      width: clamp01(r.width / slotRect.width),
      height: clamp01(r.height / slotRect.height),
    });
  }
  if (rects.length === 0) return null;

  const last = range.getClientRects()[range.getClientRects().length - 1];
  return {
    pageNumber: Number(slot.dataset.page),
    yOffset: rects[0].top,
    quote,
    rects,
    anchorX: last ? last.right : slotRect.left,
    anchorY: last ? last.bottom : slotRect.top,
  };
}
