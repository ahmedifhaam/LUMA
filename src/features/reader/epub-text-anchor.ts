/** Character offsets within an EPUB chapter's text content. */
export interface TextAnchor {
  start: number;
  end: number;
}

export function getChapterContentRoot(chapter: HTMLElement): HTMLElement {
  const body = chapter.querySelector('.epub-chapter-body');
  return (body ?? chapter) as HTMLElement;
}

function countTextBefore(root: HTMLElement, container: Node, offset: number): number {
  const end = document.createRange();
  end.selectNodeContents(root);
  try {
    end.setEnd(container, offset);
  } catch {
    return -1;
  }

  let count = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let text: Text | null;
  while ((text = walker.nextNode() as Text | null)) {
    if (!end.intersectsNode(text)) {
      if (end.comparePoint(text, 0) < 0) break;
      continue;
    }

    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(text);
    if (end.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0) {
      count += text.length;
      continue;
    }

    if (end.endContainer === text) {
      count += end.endOffset;
    }
    break;
  }

  return count;
}

export function textOffsetForPoint(
  root: HTMLElement,
  container: Node,
  offset: number,
): number {
  if (!root.contains(container)) return -1;
  return countTextBefore(root, container, offset);
}

export function textAnchorFromRange(
  chapter: HTMLElement,
  range: Range,
): TextAnchor | null {
  const root = getChapterContentRoot(chapter);
  const start = textOffsetForPoint(root, range.startContainer, range.startOffset);
  const end = textOffsetForPoint(root, range.endContainer, range.endOffset);
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
  const root = getChapterContentRoot(chapter);
  const textLength = root.textContent?.length ?? 0;
  if (anchor.start < 0 || anchor.end <= anchor.start || anchor.end > textLength) {
    return null;
  }

  const startPos = locateTextPosition(root, anchor.start);
  const endPos = locateTextPosition(root, anchor.end);
  if (!startPos || !endPos) return null;

  const range = document.createRange();
  range.setStart(startPos.node, startPos.offset);
  range.setEnd(endPos.node, endPos.offset);
  return range;
}

function findQuoteMatch(
  text: string,
  quote: string,
  hint: number,
): { index: number; length: number } | null {
  const trimmed = quote.trim();
  if (!trimmed) return null;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.replace(/\s+/g, '\\s+');
  const regex = new RegExp(pattern, 'g');

  let best: { index: number; length: number } | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    const distance = Math.abs(match.index - hint);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { index: match.index, length: match[0].length };
    }
  }

  if (best) return best;

  const direct = text.indexOf(trimmed);
  if (direct >= 0) return { index: direct, length: trimmed.length };

  const hinted = text.indexOf(trimmed, Math.max(0, hint - trimmed.length));
  if (hinted >= 0) return { index: hinted, length: trimmed.length };

  return null;
}

export function textAnchorFromQuote(
  chapter: HTMLElement,
  quote: string,
  hintFraction = 0,
): TextAnchor | null {
  const root = getChapterContentRoot(chapter);
  const text = root.textContent ?? '';
  const hint = Math.floor(
    Math.min(Math.max(hintFraction, 0), 1) * Math.max(text.length - 1, 0),
  );
  const match = findQuoteMatch(text, quote, hint);
  if (!match) return null;
  return { start: match.index, end: match.index + match.length };
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
