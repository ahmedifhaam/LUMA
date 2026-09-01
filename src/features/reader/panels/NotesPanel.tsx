import { useState } from 'react';
import { useAnnotationsStore } from '@/application/annotations/annotations-store';

interface NotesPanelProps {
  currentPage: number;
  onNavigate: (pageNumber: number) => void;
}

export function NotesPanel({ currentPage, onNavigate }: NotesPanelProps) {
  const annotations = useAnnotationsStore((s) => s.annotations);
  const addNote = useAnnotationsStore((s) => s.addNote);
  const remove = useAnnotationsStore((s) => s.remove);
  const [draft, setDraft] = useState('');

  const items = annotations.filter((a) => a.type === 'note' || a.type === 'highlight');

  async function submit() {
    const text = draft.trim();
    if (!text) return;
    await addNote({ pageNumber: currentPage, yOffset: 0 }, text);
    setDraft('');
  }

  return (
    <div className="notes-panel">
      <form
        className="notes-panel__add"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <textarea
          className="panel__textarea"
          placeholder={`Add a note on page ${currentPage}…`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          className="btn btn--small btn--primary"
          type="submit"
          disabled={!draft.trim()}
        >
          Add note
        </button>
      </form>

      {items.length === 0 ? (
        <p className="panel__empty">
          No notes or highlights yet. Select text in the page to create a highlight.
        </p>
      ) : (
        <ul className="annotation-list">
          {items.map((item) => (
            <li key={item.id} className="annotation-item annotation-item--stacked">
              <button
                className="annotation-item__main"
                onClick={() => onNavigate(item.location.pageNumber)}
              >
                <span className="annotation-item__page">
                  {item.type === 'highlight' ? 'Highlight' : 'Note'} · page{' '}
                  {item.location.pageNumber}
                </span>
                {item.quote && (
                  <span className="annotation-item__quote">“{item.quote}”</span>
                )}
                {item.note && <span className="annotation-item__note">{item.note}</span>}
              </button>
              <button
                className="annotation-item__remove"
                aria-label="Remove annotation"
                onClick={() => void remove(item.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
