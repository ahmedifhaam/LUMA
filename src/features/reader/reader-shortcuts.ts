export type ReaderPanelId = 'contents' | 'search' | 'bookmarks' | 'notes';

export interface ReaderShortcutState {
  currentPage: number;
  pageCount: number;
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
      return Math.max(state.currentPage - 1, 1);
    case 'next-page':
      return Math.min(state.currentPage + 1, maxPage);
    case 'first-page':
      return 1;
    case 'last-page':
      return maxPage;
    default:
      return null;
  }
}
