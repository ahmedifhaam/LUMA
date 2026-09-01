import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useVirtualPages } from './useVirtualPages';

const SLOT = 100;
const OVERSCAN = 2;
const VIEWPORT = 500;

describe('useVirtualPages', () => {
  it('renders only a bounded window regardless of page count', () => {
    const { result } = renderHook(() => useVirtualPages(15_000, SLOT, OVERSCAN));

    act(() => result.current.onScroll(0, VIEWPORT));

    const { start, end } = result.current.range;
    expect(start).toBe(1);
    // 5 visible + overscan, never anywhere near 15,000.
    expect(end).toBeLessThanOrEqual(8);
    expect(result.current.totalHeight).toBe(15_000 * SLOT);
  });

  it('jumps directly to a distant page without expanding the window', () => {
    const { result } = renderHook(() => useVirtualPages(15_000, SLOT, OVERSCAN));

    // Scroll straight to ~page 12,000.
    act(() => result.current.onScroll(result.current.offsetForPage(12_000), VIEWPORT));

    const { start, end } = result.current.range;
    expect(start).toBeGreaterThan(11_990);
    expect(end - start).toBeLessThan(12);
  });

  it('reports the page dominant in the viewport', () => {
    const { result } = renderHook(() => useVirtualPages(1_000, SLOT, OVERSCAN));
    // Center of viewport at scrollTop=950 with 500 tall viewport => 1200 => page 13.
    expect(result.current.pageAtScroll(950, VIEWPORT)).toBe(13);
  });
});
