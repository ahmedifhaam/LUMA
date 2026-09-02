import { READER_SHORTCUT_HELP } from '@/features/reader/reader-shortcuts';

interface KeyboardShortcutsViewProps {
  onBack: () => void;
}

export function KeyboardShortcutsView({ onBack }: KeyboardShortcutsViewProps) {
  return (
    <div className="shortcuts-page">
      <header className="shortcuts-page__header">
        <button className="btn btn--ghost" onClick={onBack}>
          ← Back
        </button>
        <div>
          <h1 className="shortcuts-page__title">Keyboard shortcuts</h1>
          <p className="shortcuts-page__subtitle">
            Available while reading a book on desktop. Shortcuts are ignored while
            typing in a form field.
          </p>
        </div>
      </header>

      <div className="shortcuts-page__groups">
        {READER_SHORTCUT_HELP.map((group) => (
          <section key={group.title} className="shortcuts-group">
            <h2 className="shortcuts-group__title">{group.title}</h2>
            <dl className="shortcuts-list">
              {group.shortcuts.map((entry) => (
                <div key={entry.description} className="shortcuts-list__row">
                  <dt className="shortcuts-list__keys">
                    {entry.keys.map((keyLabel) => (
                      <kbd key={keyLabel} className="kbd">
                        {keyLabel}
                      </kbd>
                    ))}
                  </dt>
                  <dd className="shortcuts-list__desc">{entry.description}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
