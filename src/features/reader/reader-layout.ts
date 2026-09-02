import type { PageGeometry } from '@/domain/document/types';

export type PageFitMode = 'width' | 'screen';
export type ViewMode = 'single' | 'double' | 'continuous';

export const PAGE_GAP = 16;
export const HORIZONTAL_PADDING = 48;
export const VERTICAL_PADDING = 32;
export const MAX_SCALE = 2;

export const VIEW_MODE_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: 'single', label: 'Single' },
  { id: 'double', label: 'Double' },
  { id: 'continuous', label: 'Continuous' },
];

export const FIT_MODE_OPTIONS: { id: PageFitMode; label: string }[] = [
  { id: 'width', label: 'Fit width' },
  { id: 'screen', label: 'Fit screen' },
];

export function spreadCount(pageCount: number): number {
  return Math.ceil(Math.max(pageCount, 1) / 2);
}

export function spreadIndexForPage(pageNumber: number): number {
  return Math.floor((pageNumber - 1) / 2);
}

export function leftPageForSpread(spreadIndex: number): number {
  return spreadIndex * 2 + 1;
}

export function computePageScale(
  base: PageGeometry,
  containerWidth: number,
  containerHeight: number,
  fitMode: PageFitMode,
  viewMode: ViewMode,
): number {
  if (containerWidth <= 0) return 1;

  const usableWidth = Math.max(containerWidth - HORIZONTAL_PADDING, 240);
  const usableHeight = Math.max(containerHeight - VERTICAL_PADDING, 200);
  const pageWidth = viewMode === 'double' ? (usableWidth - PAGE_GAP) / 2 : usableWidth;
  const widthScale = pageWidth / base.width;
  const heightScale = usableHeight / base.height;

  if (fitMode === 'screen' && containerHeight > 0) {
    return Math.min(widthScale, heightScale, MAX_SCALE);
  }

  return Math.min(widthScale, MAX_SCALE);
}

export function slotHeightForMode(
  viewMode: ViewMode,
  pageHeight: number,
  viewportHeight: number,
): number {
  if (viewMode === 'continuous') return pageHeight + PAGE_GAP;
  return Math.max(viewportHeight, 1);
}

export function scrollSlotCount(pageCount: number, viewMode: ViewMode): number {
  if (viewMode === 'double') return spreadCount(pageCount);
  return Math.max(pageCount, 1);
}

export function offsetForPage(
  pageNumber: number,
  viewMode: ViewMode,
  slotHeight: number,
): number {
  if (viewMode === 'double') {
    return spreadIndexForPage(pageNumber) * slotHeight;
  }
  return (pageNumber - 1) * slotHeight;
}

export function pageAtScroll(
  scrollTop: number,
  viewportHeight: number,
  pageCount: number,
  viewMode: ViewMode,
  slotHeight: number,
  viewportWidth = 0,
  pageWidth = 0,
): number {
  const maxPage = Math.max(pageCount, 1);

  if (viewMode === 'double') {
    const spread = Math.min(
      Math.max(Math.floor(scrollTop / slotHeight), 0),
      spreadCount(pageCount) - 1,
    );
    const left = leftPageForSpread(spread);
    const right = Math.min(left + 1, maxPage);
    if (right === left) return left;

    const spreadWidth = pageWidth * 2 + PAGE_GAP;
    const leftOffset = Math.max((viewportWidth - spreadWidth) / 2, 0);
    const centerX = viewportWidth / 2;
    const splitX = leftOffset + pageWidth + PAGE_GAP / 2;
    return centerX > splitX ? right : left;
  }

  const center = scrollTop + viewportHeight / 2;
  const page = Math.floor(center / slotHeight) + 1;
  return Math.min(Math.max(page, 1), maxPage);
}

export interface RenderSpread {
  index: number;
  top: number;
  leftPage: number;
  rightPage: number | null;
}

export function spreadsInRange(
  spreadStart: number,
  spreadEnd: number,
  pageCount: number,
  slotHeight: number,
): RenderSpread[] {
  const spreads: RenderSpread[] = [];
  for (let spread = spreadStart; spread <= spreadEnd; spread += 1) {
    const spreadIndex = spread - 1;
    const leftPage = leftPageForSpread(spreadIndex);
    if (leftPage > pageCount) continue;
    spreads.push({
      index: spreadIndex,
      top: spreadIndex * slotHeight,
      leftPage,
      rightPage: leftPage + 1 <= pageCount ? leftPage + 1 : null,
    });
  }
  return spreads;
}

export function loadStoredViewMode(): ViewMode {
  const value = localStorage.getItem('luma-reader-view-mode');
  if (value === 'single' || value === 'double' || value === 'continuous') return value;
  return 'continuous';
}

export function loadStoredFitMode(): PageFitMode {
  const value = localStorage.getItem('luma-reader-fit-mode');
  if (value === 'width' || value === 'screen') return value;
  return 'width';
}

export function storeViewMode(mode: ViewMode): void {
  localStorage.setItem('luma-reader-view-mode', mode);
}

export function storeFitMode(mode: PageFitMode): void {
  localStorage.setItem('luma-reader-fit-mode', mode);
}
