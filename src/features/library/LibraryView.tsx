import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReadingState } from '@/domain/book/types';
import { useLibraryStore } from '@/application/library/library-store';
import { mimeTypesForImport } from '@/infrastructure/document-engine/engine-registry';
import { readingStateRepository } from '@/infrastructure/persistence/repositories';

interface LibraryViewProps {
  onOpenBook: (bookId: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export function LibraryView({ onOpenBook }: LibraryViewProps) {
  const books = useLibraryStore((s) => s.books);
  const loading = useLibraryStore((s) => s.loading);
  const importing = useLibraryStore((s) => s.importing);
  const error = useLibraryStore((s) => s.error);
  const loadLibrary = useLibraryStore((s) => s.loadLibrary);
  const importFile = useLibraryStore((s) => s.importFile);
  const removeBook = useLibraryStore((s) => s.removeBook);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, ReadingState>>({});

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    void readingStateRepository.list().then((states) => {
      const map: Record<string, ReadingState> = {};
      for (const state of states) map[state.bookId] = state;
      setProgressMap(map);
    });
  }, [books]);

  const continueReading = useMemo(() => {
    return books.find((book) => book.lastOpenedAt !== null) ?? null;
  }, [books]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setNotice(null);
    for (const file of Array.from(fileList)) {
      try {
        const result = await importFile(file);
        setNotice(
          result.isDuplicate
            ? `“${result.book.title}” is already in your library — reading state kept.`
            : `Added “${result.book.title}”.`,
        );
      } catch {
        // Error surfaced via store state.
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="library">
      <header className="library__header">
        <div>
          <h1 className="library__title">My Library</h1>
          <p className="library__subtitle">
            Local-first reading for very large documents.
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? 'Importing…' : '+ Add Book'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={mimeTypesForImport()}
          multiple
          hidden
          data-testid="file-input"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </header>

      {notice && <div className="library__notice">{notice}</div>}
      {error && <div className="library__error">{error}</div>}

      {continueReading && (
        <section className="library__section">
          <h2 className="library__section-title">Continue Reading</h2>
          <button
            className="continue-card"
            onClick={() => onOpenBook(continueReading.id)}
          >
            {continueReading.coverThumbnail ? (
              <img
                className="continue-card__cover"
                src={continueReading.coverThumbnail}
                alt=""
                aria-hidden
              />
            ) : null}
            <div className="continue-card__info">
              <span className="continue-card__name">{continueReading.title}</span>
              <span className="continue-card__meta">
                {Math.round((progressMap[continueReading.id]?.progress ?? 0) * 100)}% ·{' '}
                {continueReading.pageCount.toLocaleString()} pages
              </span>
            </div>
            <span className="continue-card__cta">Continue →</span>
          </button>
        </section>
      )}

      <section className="library__section">
        <h2 className="library__section-title">All Books</h2>
        {loading ? (
          <p className="library__empty">Loading…</p>
        ) : books.length === 0 ? (
          <div className="library__empty">
            <p>No books yet.</p>
            <p>Click “Add Book” and choose a local PDF or EPUB to start reading.</p>
          </div>
        ) : (
          <ul className="book-grid">
            {books.map((book) => (
              <li key={book.id} className="book-card">
                <button
                  className="book-card__cover"
                  onClick={() => onOpenBook(book.id)}
                  aria-label={`Open ${book.title}`}
                >
                  {book.coverThumbnail ? (
                    <img
                      className="book-card__image"
                      src={book.coverThumbnail}
                      alt=""
                      aria-hidden
                    />
                  ) : (
                    <span className="book-card__initial">
                      {book.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {!book.hasText && <span className="book-card__badge">Scanned</span>}
                </button>
                <div className="book-card__body">
                  <span className="book-card__name" title={book.title}>
                    {book.title}
                  </span>
                  <span className="book-card__meta">
                    {book.pageCount.toLocaleString()} pages ·{' '}
                    {formatBytes(book.byteLength)}
                  </span>
                  <div className="book-card__actions">
                    <button
                      className="btn btn--small"
                      onClick={() => onOpenBook(book.id)}
                    >
                      Open
                    </button>
                    <button
                      className="btn btn--small btn--ghost"
                      onClick={() => void removeBook(book.id)}
                      aria-label={`Remove ${book.title}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
