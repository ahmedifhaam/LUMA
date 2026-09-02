import { useCallback, useRef, useState } from 'react';
import { LibraryView } from '@/features/library/LibraryView';
import { KeyboardShortcutsView } from '@/features/help/KeyboardShortcutsView';
import { ReaderView } from '@/features/reader/ReaderView';
import { useReaderStore } from '@/application/reader/reader-store';

type View =
  | { name: 'library' }
  | { name: 'reader'; bookId: string }
  | { name: 'shortcuts' };

export function App() {
  const [view, setView] = useState<View>({ name: 'library' });
  const returnViewRef = useRef<View>({ name: 'library' });
  const openBook = useReaderStore((s) => s.openBook);
  const closeBook = useReaderStore((s) => s.closeBook);

  const handleOpenBook = useCallback(
    (bookId: string) => {
      setView({ name: 'reader', bookId });
      void openBook(bookId);
    },
    [openBook],
  );

  const handleExit = useCallback(() => {
    void closeBook();
    setView({ name: 'library' });
  }, [closeBook]);

  const handleOpenShortcuts = useCallback(() => {
    returnViewRef.current = view;
    setView({ name: 'shortcuts' });
  }, [view]);

  const handleCloseShortcuts = useCallback(() => {
    setView(returnViewRef.current);
  }, []);

  return (
    <div className="app-shell">
      {view.name === 'library' ? (
        <LibraryView
          onOpenBook={handleOpenBook}
          onOpenShortcuts={handleOpenShortcuts}
        />
      ) : view.name === 'reader' ? (
        <ReaderView onExit={handleExit} onOpenShortcuts={handleOpenShortcuts} />
      ) : (
        <KeyboardShortcutsView onBack={handleCloseShortcuts} />
      )}
    </div>
  );
}
