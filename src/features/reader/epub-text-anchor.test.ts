import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  rangeFromTextAnchor,
  textAnchorFromQuote,
  textAnchorFromRange,
  textOffsetForPoint,
} from './epub-text-anchor';

describe('epub-text-anchor', () => {
  let chapter: HTMLDivElement;

  beforeEach(() => {
    chapter = document.createElement('div');
    chapter.className = 'epub-chapter';
    chapter.innerHTML =
      '<div class="epub-chapter-body"><p>First paragraph with some text.</p><p>Second paragraph for highlighting.</p></div>';
    document.body.appendChild(chapter);
  });

  afterEach(() => {
    chapter.remove();
  });

  it('maps a DOM range to stable text offsets', () => {
    const paragraph = chapter.querySelector('p:last-child')!;
    const textNode = paragraph.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 6);

    expect(textAnchorFromRange(chapter, range)).toEqual({ start: 31, end: 37 });
  });

  it('reconstructs a range from text offsets after layout changes', () => {
    const anchor = textAnchorFromQuote(chapter, 'highlighting', 0.5);
    expect(anchor).toEqual({ start: 52, end: 64 });

    chapter.style.fontSize = '24px';
    const range = rangeFromTextAnchor(chapter, anchor!);
    expect(range?.toString()).toBe('highlighting');

    const startOffset = textOffsetForPoint(
      chapter,
      range!.startContainer,
      range!.startOffset,
    );
    expect(startOffset).toBe(52);
  });

  it('resolves quote-only legacy highlights', () => {
    const anchor = textAnchorFromQuote(chapter, 'some text', 0);
    expect(anchor).not.toBeNull();
    expect(rangeFromTextAnchor(chapter, anchor!)?.toString()).toBe('some text');
  });
});
