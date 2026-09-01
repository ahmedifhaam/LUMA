import { useCallback, useState } from 'react';
import { LibraryView } from '@/features/library/LibraryView';
import { ReaderView } from '@/features/reader/ReaderView';
import { useReaderStore } from '@/application/reader/reader-store';

type View = { name: 'library' } | { name: 'reader'; bookId: string };

export function App() {
  const [view, setView] = useState<View>({ name: 'library' });
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

  return (
    <div className="app-shell">
      {view.name === 'library' ? (
        <LibraryView onOpenBook={handleOpenBook} />
      ) : (
        <ReaderView onExit={handleExit} />
      )}
    </div>
  );
}
