import { describe, expect, it } from 'vitest';
import {
  formatZoomPercent,
  supportsTextSizing,
  textSizeMultiplier,
  themeById,
  zoomMultiplier,
} from './reader-display';

describe('reader-display', () => {
  it('resolves zoom and text multipliers from indices', () => {
    expect(zoomMultiplier(3)).toBe(1);
    expect(textSizeMultiplier(2)).toBe(1);
    expect(formatZoomPercent(1.25)).toBe('125%');
  });

  it('returns theme colors by id', () => {
    expect(themeById('sepia').pageBackground).toBe('#f4ecd8');
  });

  it('enables text sizing for EPUB only', () => {
    expect(supportsTextSizing('epub')).toBe(true);
    expect(supportsTextSizing('pdf')).toBe(false);
  });
});
