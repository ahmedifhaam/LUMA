import { describe, expect, it } from 'vitest';
import type { NormalizedRect } from '@/domain/book/types';
import { rectsFromRange, type SelectionMeasureContext } from './selection';

function makeRect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON() {
      return {};
    },
  };
}

describe('rectsFromRange', () => {
  it('normalizes rects to the visible page slot for PDF-like pages', () => {
    const context: SelectionMeasureContext = {
      kind: 'page',
      width: 400,
      height: 600,
      scrollLeft: 0,
      scrollTop: 0,
      toContentX: (x) => x,
      toContentY: (y) => y,
    };

    const rects = rectsFromRange(context, [makeRect(110, 210, 80, 20)]);
    expect(rects).toEqual([
      { left: 0.275, top: 0.35, width: 0.2, height: 20 / 600 },
    ] satisfies NormalizedRect[]);
  });

  it('accounts for scroll offset inside EPUB chapters', () => {
    const context: SelectionMeasureContext = {
      kind: 'epub',
      width: 500,
      height: 1200,
      scrollLeft: 0,
      scrollTop: 200,
      toContentX: (x) => x,
      toContentY: (y) => y + 200,
    };

    const rects = rectsFromRange(context, [makeRect(50, 130, 100, 24)]);
    expect(rects[0]?.top).toBeCloseTo(0.278, 2);
    expect(rects[0]?.left).toBeCloseTo(0.1, 2);
  });
});
