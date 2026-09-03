import { useDriveStore } from '@/application/library/drive-store';

/** Mock / fallback file chooser when Google Picker is unavailable (CI). */
export function DriveFilePickerModal() {
  const open = useDriveStore((s) => s.pickerOpen);
  const files = useDriveStore((s) => s.files);
  const loading = useDriveStore((s) => s.loading);
  const error = useDriveStore((s) => s.error);
  const setPickerOpen = useDriveStore((s) => s.setPickerOpen);
  const importRemote = useDriveStore((s) => s.importRemote);

  if (!open) return null;

  return (
    <div className="modal-backdrop" data-testid="drive-picker-modal" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drive-picker-title"
      >
        <header className="modal__header">
          <h2 id="drive-picker-title">Add from Google Drive</h2>
          <button
            type="button"
            className="btn btn--icon"
            aria-label="Close"
            data-testid="drive-picker-close"
            onClick={() => setPickerOpen(false)}
          >
            ×
          </button>
        </header>
        <div className="modal__body">
          {error ? <p className="library__error">{error}</p> : null}
          {loading && files.length === 0 ? <p>Loading Drive files…</p> : null}
          {files.length === 0 && !loading ? (
            <p>No PDF or EPUB files available yet. Pick files after connecting Drive.</p>
          ) : (
            <ul className="drive-picker__list" data-testid="drive-picker-list">
              {files.map((file) => (
                <li key={file.remoteId}>
                  <button
                    type="button"
                    className="drive-picker__item"
                    data-testid={`drive-file-${file.remoteId}`}
                    disabled={loading}
                    onClick={() => void importRemote(file.remoteId)}
                  >
                    <span className="drive-picker__title">{file.title}</span>
                    <span className="drive-picker__name">{file.name ?? file.remoteId}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
