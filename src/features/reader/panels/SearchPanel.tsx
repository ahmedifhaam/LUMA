import { useSearchStore } from '@/application/search/search-store';

interface SearchPanelProps {
  onNavigate: (pageNumber: number) => void;
}

export function SearchPanel({ onNavigate }: SearchPanelProps) {
  const status = useSearchStore((s) => s.status);
  const indexedPages = useSearchStore((s) => s.indexedPages);
  const totalPages = useSearchStore((s) => s.totalPages);
  const query = useSearchStore((s) => s.query);
  const results = useSearchStore((s) => s.results);
  const searchable = useSearchStore((s) => s.searchable);
  const setQuery = useSearchStore((s) => s.setQuery);

  if (!searchable) {
    return (
      <p className="panel__empty">
        This document is image-based, so it has no searchable text.
      </p>
    );
  }

  const indexing = status === 'indexing';
  const pct = totalPages > 0 ? Math.round((indexedPages / totalPages) * 100) : 0;

  return (
    <div className="search-panel">
      <input
        className="panel__input"
        type="search"
        placeholder="Search this book…"
        value={query}
        aria-label="Search this book"
        onChange={(event) => setQuery(event.target.value)}
      />

      {indexing && (
        <p className="panel__hint">
          Indexing pages… {indexedPages}/{totalPages} ({pct}%)
        </p>
      )}

      {query.trim() && (
        <p className="panel__hint" data-testid="search-count">
          {results.length === 0
            ? indexing
              ? 'Searching as pages are indexed…'
              : 'No matches.'
            : `${results.length} page${results.length === 1 ? '' : 's'} with matches`}
        </p>
      )}

      <ul className="result-list">
        {results.map((result) => (
          <li key={result.pageNumber}>
            <button className="result-item" onClick={() => onNavigate(result.pageNumber)}>
              <span className="result-item__page">Page {result.pageNumber}</span>
              <span className="result-item__snippet">{result.snippet}</span>
              {result.matchCount > 1 && (
                <span className="result-item__count">{result.matchCount} matches</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
