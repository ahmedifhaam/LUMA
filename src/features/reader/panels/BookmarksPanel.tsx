import { useAnnotationsStore } from '@/application/annotations/annotations-store';

interface BookmarksPanelProps {
  onNavigate: (pageNumber: number) => void;
}

export function BookmarksPanel({ onNavigate }: BookmarksPanelProps) {
  const annotations = useAnnotationsStore((s) => s.annotations);
  const remove = useAnnotationsStore((s) => s.remove);
  const bookmarks = annotations.filter((a) => a.type === 'bookmark');

  if (bookmarks.length === 0) {
    return (
      <p className="panel__empty">
        No bookmarks yet. Use the bookmark button in the toolbar to mark a page.
      </p>
    );
  }

  return (
    <ul className="annotation-list">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id} className="annotation-item">
          <button
            className="annotation-item__main"
            onClick={() => onNavigate(bookmark.location.pageNumber)}
          >
            <span className="annotation-item__page">
              Page {bookmark.location.pageNumber}
            </span>
          </button>
          <button
            className="annotation-item__remove"
            aria-label={`Remove bookmark on page ${bookmark.location.pageNumber}`}
            onClick={() => void remove(bookmark.id)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
