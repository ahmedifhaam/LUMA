import {
  firstPageForMode,
  lastPageForMode,
  stepPage,
} from './reader-layout';

export interface ReaderShortcutState {
  currentPage: number;
  pageCount: number;
  viewMode: 'single' | 'double' | 'continuous';
  activePanel: ReaderPanelId | null;
  hasSelection: boolean;
}

export type ReaderShortcutAction =
  | { type: 'previous-page' }
  | { type: 'next-page' }
  | { type: 'first-page' }
  | { type: 'last-page' }
  | { type: 'toggle-bookmark' }
  | { type: 'close-panel' }
  | { type: 'clear-selection' }
  | { type: 'open-panel'; panel: ReaderPanelId };

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

/**
 * Resolve a keyboard event to a reader action. Returns null when the event should
 * be ignored (unknown shortcut, modifier combos, or typing in a form field).
 */
export function resolveReaderShortcut(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'target'>,
  state: ReaderShortcutState,
): ReaderShortcutAction | null {
  if (event.altKey) return null;

  const inField = isEditableTarget(event.target);

  if (event.key === 'Escape') {
    if (inField) return null;
    if (state.activePanel) return { type: 'close-panel' };
    if (state.hasSelection) return { type: 'clear-selection' };
    return null;
  }

  if (inField) return null;

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
    return { type: 'open-panel', panel: 'search' };
  }

  if (event.ctrlKey || event.metaKey || event.shiftKey) return null;

  switch (event.key) {
    case 'ArrowLeft':
    case 'PageUp':
      return { type: 'previous-page' };
    case 'ArrowRight':
    case 'PageDown':
      return { type: 'next-page' };
    case ' ':
      return { type: 'next-page' };
    case 'Home':
      return { type: 'first-page' };
    case 'End':
      return { type: 'last-page' };
    case 'b':
    case 'B':
      return { type: 'toggle-bookmark' };
    case '/':
      return { type: 'open-panel', panel: 'search' };
    default:
      return null;
  }
}

export function pageForShortcut(
  action: ReaderShortcutAction,
  state: ReaderShortcutState,
): number | null {
  const maxPage = Math.max(state.pageCount, 1);
  switch (action.type) {
    case 'previous-page':
      return stepPage(state.currentPage, state.pageCount, state.viewMode, -1);
    case 'next-page':
      return stepPage(state.currentPage, state.pageCount, state.viewMode, 1);
    case 'first-page':
      return firstPageForMode(state.pageCount, state.viewMode);
    case 'last-page':
      return lastPageForMode(state.pageCount, state.viewMode);
    default:
      return null;
  }
}

export interface ShortcutHelpEntry {
  keys: string[];
  description: string;
}

export interface ShortcutHelpGroup {
  title: string;
  shortcuts: ShortcutHelpEntry[];
}

/** Reference list for the keyboard shortcuts help page (keep in sync with resolveReaderShortcut). */
export const READER_SHORTCUT_HELP: ShortcutHelpGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['←', '→'], description: 'Previous / next page' },
      { keys: ['Page Up', 'Page Down'], description: 'Previous / next page' },
      { keys: ['Space'], description: 'Next page' },
      { keys: ['Home'], description: 'First page' },
      { keys: ['End'], description: 'Last page' },
    ],
  },
  {
    title: 'Bookmarks',
    shortcuts: [{ keys: ['B'], description: 'Toggle bookmark on the current page' }],
  },
  {
    title: 'Search',
    shortcuts: [
      { keys: ['/'], description: 'Open search panel' },
      { keys: ['Ctrl+F', '⌘F'], description: 'Open search panel' },
    ],
  },
  {
    title: 'Panels & selection',
    shortcuts: [
      { keys: ['Esc'], description: 'Close the open panel or clear text selection' },
      { keys: ['?'], description: 'Open this shortcuts reference' },
    ],
  },
];
