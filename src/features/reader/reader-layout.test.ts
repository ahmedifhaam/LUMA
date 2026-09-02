import { describe, expect, it } from 'vitest';
import {
  computePageScale,
  offsetForPage,
  pageAtScroll,
  spreadCount,
  spreadsInRange,
  stepPage,
} from './reader-layout';

const base = { pageNumber: 1, width: 600, height: 800 };

describe('computePageScale', () => {
  it('fits to width by default', () => {
    const scale = computePageScale(base, 648, 900, 'width', 'continuous');
    expect(scale).toBeCloseTo(1);
  });

  it('fits to screen using the smaller of width and height scale', () => {
    const scale = computePageScale(base, 648, 500, 'screen', 'single');
    expect(scale).toBeCloseTo((500 - 32) / 800, 2);
  });

  it('uses half the available width per page in double view', () => {
    const single = computePageScale(base, 1000, 900, 'width', 'single');
    const double = computePageScale(base, 1000, 900, 'width', 'double');
    expect(double).toBeLessThan(single);
    expect(double).toBeCloseTo(((1000 - 48 - 16) / 2) / 600, 2);
  });
});

describe('pageAtScroll', () => {
  it('maps scroll position to a page in continuous mode', () => {
    expect(pageAtScroll(950, 500, 100, 'continuous', 100)).toBe(13);
  });

  it('maps scroll position to a spread page in double mode', () => {
    expect(pageAtScroll(0, 800, 10, 'double', 800, 1200, 500)).toBe(1);
    expect(pageAtScroll(800, 800, 10, 'double', 800, 1200, 500)).toBe(3);
  });
});

describe('stepPage', () => {
  it('advances by spread in double mode', () => {
    expect(stepPage(1, 24, 'double', 1)).toBe(3);
    expect(stepPage(2, 24, 'double', 1)).toBe(3);
    expect(stepPage(3, 24, 'double', -1)).toBe(1);
  });

  it('advances one page in single and continuous modes', () => {
    expect(stepPage(1, 24, 'single', 1)).toBe(2);
    expect(stepPage(1, 24, 'continuous', 1)).toBe(2);
  });
});

describe('offsetForPage', () => {
  it('offsets by spread in double mode', () => {
    expect(offsetForPage(3, 'double', 800)).toBe(800);
    expect(offsetForPage(4, 'double', 800)).toBe(800);
  });
});

describe('spreadsInRange', () => {
  it('builds spread metadata for rendering', () => {
    expect(spreadCount(5)).toBe(3);
    const spreads = spreadsInRange(1, 2, 5, 900);
    expect(spreads).toHaveLength(2);
    expect(spreads[0]).toEqual({
      index: 0,
      top: 0,
      leftPage: 1,
      rightPage: 2,
    });
    expect(spreads[1]?.rightPage).toBe(4);
  });
});