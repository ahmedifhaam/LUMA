export type ReaderThemeId = 'light' | 'sepia' | 'dark' | 'slate';

export interface ReaderTheme {
  id: ReaderThemeId;
  label: string;
  pageBackground: string;
  textColor: string;
  viewportBackground: string;
}

export const ZOOM_STEPS = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3] as const;

export const TEXT_SIZE_STEPS = [0.8, 0.9, 1, 1.1, 1.2, 1.35, 1.5, 1.7] as const;

export const READER_THEMES: ReaderTheme[] = [
  {
    id: 'light',
    label: 'Light',
    pageBackground: '#ffffff',
    textColor: '#111827',
    viewportBackground: '#05070d',
  },
  {
    id: 'sepia',
    label: 'Sepia',
    pageBackground: '#f4ecd8',
    textColor: '#3f3a2f',
    viewportBackground: '#2a2419',
  },
  {
    id: 'dark',
    label: 'Dark',
    pageBackground: '#1a2334',
    textColor: '#e6ebf5',
    viewportBackground: '#05070d',
  },
  {
    id: 'slate',
    label: 'Slate',
    pageBackground: '#e2e8f0',
    textColor: '#0f172a',
    viewportBackground: '#1e293b',
  },
];

export const DEFAULT_ZOOM_INDEX = ZOOM_STEPS.indexOf(1);
export const DEFAULT_TEXT_SIZE_INDEX = TEXT_SIZE_STEPS.indexOf(1);

export interface ReaderDisplayPrefs {
  zoomIndex: number;
  textSizeIndex: number;
  themeId: ReaderThemeId;
}

export function themeById(themeId: ReaderThemeId): ReaderTheme {
  return READER_THEMES.find((theme) => theme.id === themeId) ?? READER_THEMES[0]!;
}

export function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), Math.max(length - 1, 0));
}

export function zoomMultiplier(zoomIndex: number): number {
  return ZOOM_STEPS[clampIndex(zoomIndex, ZOOM_STEPS.length)];
}

export function textSizeMultiplier(textSizeIndex: number): number {
  return TEXT_SIZE_STEPS[clampIndex(textSizeIndex, TEXT_SIZE_STEPS.length)];
}

export function formatZoomPercent(multiplier: number): string {
  return `${Math.round(multiplier * 100)}%`;
}

export function supportsTextSizing(format?: string): boolean {
  return format === 'epub';
}

export function loadStoredDisplayPrefs(): ReaderDisplayPrefs {
  const zoomIndex = Number.parseInt(localStorage.getItem('luma-reader-zoom-index') ?? '', 10);
  const textSizeIndex = Number.parseInt(localStorage.getItem('luma-reader-text-index') ?? '', 10);
  const themeId = localStorage.getItem('luma-reader-theme') as ReaderThemeId | null;

  return {
    zoomIndex: Number.isFinite(zoomIndex) ? clampIndex(zoomIndex, ZOOM_STEPS.length) : DEFAULT_ZOOM_INDEX,
    textSizeIndex: Number.isFinite(textSizeIndex)
      ? clampIndex(textSizeIndex, TEXT_SIZE_STEPS.length)
      : DEFAULT_TEXT_SIZE_INDEX,
    themeId:
      themeId && READER_THEMES.some((theme) => theme.id === themeId) ? themeId : 'light',
  };
}

export function storeDisplayPrefs(prefs: ReaderDisplayPrefs): void {
  localStorage.setItem('luma-reader-zoom-index', String(prefs.zoomIndex));
  localStorage.setItem('luma-reader-text-index', String(prefs.textSizeIndex));
  localStorage.setItem('luma-reader-theme', prefs.themeId);
}

export function applyZoomMultiplier(fitScale: number, zoomIndex: number): number {
  return fitScale * zoomMultiplier(zoomIndex);
}
