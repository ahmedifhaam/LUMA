import { useCallback, useEffect, useRef, useState } from 'react';

export interface VirtualRange {
  start: number;
  end: number;
}

interface VirtualPages {
  range: VirtualRange;
  totalHeight: number;
  /** Top offset (px) of a given 1-based page. */
  offsetForPage: (pageNumber: number) => number;
  /** 1-based page currently dominant in the viewport. */
  pageAtScroll: (scrollTop: number, viewportHeight: number) => number;
  onScroll: (scrollTop: number, viewportHeight: number) => void;
}

/**
 * Uniform-slot page virtualization.
 *
 * Layout math is O(1) per scroll regardless of page count, so a 15,000-page
 * document never implies 15,000 DOM nodes and jumping to a distant page does not
 * require laying out intervening pages (Phase 1 brief section 5). Slot height is
 * estimated from the first page; variable page sizes are a known later seam.
 */
export function useVirtualPages(
  pageCount: number,
  slotHeight: number,
  overscan: number,
): VirtualPages {
  const [range, setRange] = useState<VirtualRange>({ start: 1, end: 1 });
  const lastRange = useRef<VirtualRange>({ start: 1, end: 1 });

  const totalHeight = Math.max(pageCount, 1) * slotHeight;

  const offsetForPage = useCallback(
    (pageNumber: number) => (pageNumber - 1) * slotHeight,
    [slotHeight],
  );

  const pageAtScroll = useCallback(
    (scrollTop: number, viewportHeight: number) => {
      const center = scrollTop + viewportHeight / 2;
      const page = Math.floor(center / slotHeight) + 1;
      return Math.min(Math.max(page, 1), Math.max(pageCount, 1));
    },
    [slotHeight, pageCount],
  );

  const onScroll = useCallback(
    (scrollTop: number, viewportHeight: number) => {
      if (slotHeight <= 0) return;
      const first = Math.floor(scrollTop / slotHeight) + 1;
      const visibleCount = Math.ceil(viewportHeight / slotHeight);
      const start = Math.max(1, first - overscan);
      const end = Math.min(Math.max(pageCount, 1), first + visibleCount + overscan);

      if (start !== lastRange.current.start || end !== lastRange.current.end) {
        lastRange.current = { start, end };
        setRange({ start, end });
      }
    },
    [slotHeight, overscan, pageCount],
  );

  useEffect(() => {
    lastRange.current = { start: 1, end: 1 };
    setRange({ start: 1, end: 1 });
  }, [pageCount, slotHeight]);

  return { range, totalHeight, offsetForPage, pageAtScroll, onScroll };
}
