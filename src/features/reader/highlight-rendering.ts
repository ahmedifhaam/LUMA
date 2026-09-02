import type { Annotation } from '@/domain/book/types';

export function syncEpubHighlights(textLayer: HTMLElement, highlights: Annotation[]): void {
  const chapter = textLayer.querySelector('.epub-chapter');
  if (!chapter) return;

  let overlay = chapter.querySelector('.epub-highlights');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'epub-highlights';
    chapter.appendChild(overlay);
  }

  overlay.replaceChildren();
  const contentWidth = chapter.scrollWidth;
  const contentHeight = chapter.scrollHeight;
  if (contentWidth === 0 || contentHeight === 0) return;

  for (const highlight of highlights) {
    for (const rect of highlight.rects ?? []) {
      const node = document.createElement('div');
      node.className = 'page-highlight';
      node.style.left = `${rect.left * contentWidth}px`;
      node.style.top = `${rect.top * contentHeight}px`;
      node.style.width = `${rect.width * contentWidth}px`;
      node.style.height = `${rect.height * contentHeight}px`;
      overlay.appendChild(node);
    }
  }
}

export function clearEpubHighlights(textLayer: HTMLElement): void {
  textLayer.querySelector('.epub-highlights')?.remove();
}
