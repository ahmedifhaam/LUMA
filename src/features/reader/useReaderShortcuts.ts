import { useEffect } from 'react';
import {
  pageForShortcut,
  resolveReaderShortcut,
  type ReaderPanelId,
} from './reader-shortcuts';

interface UseReaderShortcutsOptions {
  currentPage: number;
  pageCount: number;
  viewMode: 'single' | 'double' | 'continuous';
  activePanel: ReaderPanelId | null;
  hasSelection: boolean;
  onGoToPage: (page: number) => void;
  onToggleBookmark: () => void;
  onSetActivePanel: (panel: ReaderPanelId | null) => void;
  onClearSelection: () => void;
}

export function useReaderShortcuts({
  currentPage,
  pageCount,
  viewMode,
  activePanel,
  hasSelection,
  onGoToPage,
  onToggleBookmark,
  onSetActivePanel,
  onClearSelection,
}: UseReaderShortcutsOptions): void {
  useEffect(() => {
    const state = { currentPage, pageCount, viewMode, activePanel, hasSelection };

    function handleKeyDown(event: KeyboardEvent) {
      const action = resolveReaderShortcut(event, state);
      if (!action) return;

      switch (action.type) {
        case 'previous-page':
        case 'next-page':
        case 'first-page':
        case 'last-page': {
          const page = pageForShortcut(action, state);
          if (page !== null && page !== currentPage) {
            event.preventDefault();
            onGoToPage(page);
          } else if (action.type === 'next-page' && event.key === ' ') {
            event.preventDefault();
          }
          break;
        }
        case 'toggle-bookmark':
          event.preventDefault();
          onToggleBookmark();
          break;
        case 'close-panel':
          event.preventDefault();
          onSetActivePanel(null);
          break;
        case 'clear-selection':
          event.preventDefault();
          onClearSelection();
          break;
        case 'open-panel':
          event.preventDefault();
          onSetActivePanel(action.panel);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentPage,
    pageCount,
    viewMode,
    activePanel,
    hasSelection,
    onGoToPage,
    onToggleBookmark,
    onSetActivePanel,
    onClearSelection,
  ]);
}
