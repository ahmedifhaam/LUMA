/** Character offsets within an EPUB chapter's text content. */
export interface TextAnchor {
  start: number;
  end: number;
}

export function textOffsetForPoint(
  root: HTMLElement,
  container: Node,
  offset: number,
): number {
  if (!root.contains(container)) return -1;
  const probe = document.createRange();
  probe.selectNodeContents(root);
  try {
    probe.setEnd(container, offset);
  } catch {
    return -1;
  }
  return probe.toString().length;
}

export function textAnchorFromRange(
  chapter: HTMLElement,
  range: Range,
): TextAnchor | null {
  const start = textOffsetForPoint(chapter, range.startContainer, range.startOffset);
  const end = textOffsetForPoint(chapter, range.endContainer, range.endOffset);
  if (start < 0 || end < 0 || end <= start) return null;
  return { start, end };
}

function locateTextPosition(
  root: HTMLElement,
  target: number,
): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = target;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const len = node.textContent?.length ?? 0;
    if (remaining <= len) {
      return { node: node as Text, offset: remaining };
    }
    remaining -= len;
  }
  return null;
}

export function rangeFromTextAnchor(
  chapter: HTMLElement,
  anchor: TextAnchor,
): Range | null {
  const textLength = chapter.textContent?.length ?? 0;
  if (anchor.start < 0 || anchor.end <= anchor.start || anchor.end > textLength) {
    return null;
  }

  const startPos = locateTextPosition(chapter, anchor.start);
  const endPos = locateTextPosition(chapter, anchor.end);
  if (!startPos || !endPos) return null;

  const range = document.createRange();
  range.setStart(startPos.node, startPos.offset);
  range.setEnd(endPos.node, endPos.offset);
  return range;
}

function findQuoteIndex(text: string, quote: string, hint: number): number {
  if (!quote) return -1;
  let index = text.indexOf(quote, Math.max(0, hint - quote.length));
  if (index >= 0) return index;

  index = text.indexOf(quote);
  if (index >= 0) return index;

  return text.indexOf(quote.trim());
}

export function textAnchorFromQuote(
  chapter: HTMLElement,
  quote: string,
  hintFraction = 0,
): TextAnchor | null {
  const text = chapter.textContent ?? '';
  const hint = Math.floor(
    Math.min(Math.max(hintFraction, 0), 1) * Math.max(text.length - 1, 0),
  );
  const index = findQuoteIndex(text, quote, hint);
  if (index < 0) return null;
  return { start: index, end: index + quote.length };
}

export function chapterLocalRects(
  chapter: HTMLElement,
  range: Range,
): Array<{ left: number; top: number; width: number; height: number }> {
  const chapterRect = chapter.getBoundingClientRect();
  const clientRects =
    typeof range.getClientRects === 'function'
      ? Array.from(range.getClientRects())
      : [];
  const boxes = clientRects.length > 0 ? clientRects : [range.getBoundingClientRect()];

  return boxes
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => ({
      left: rect.left - chapterRect.left,
      top: rect.top - chapterRect.top,
      width: rect.width,
      height: rect.height,
    }));
}
