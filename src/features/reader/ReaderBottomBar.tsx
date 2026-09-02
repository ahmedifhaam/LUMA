import type { PageFitMode, ViewMode } from './reader-layout';
import { FIT_MODE_OPTIONS, VIEW_MODE_OPTIONS } from './reader-layout';

interface ReaderBottomBarProps {
  fitMode: PageFitMode;
  viewMode: ViewMode;
  onFitModeChange: (mode: PageFitMode) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ReaderBottomBar({
  fitMode,
  viewMode,
  onFitModeChange,
  onViewModeChange,
}: ReaderBottomBarProps) {
  return (
    <footer className="reader__bottom-bar" aria-label="Reading layout controls">
      <div className="reader__bottom-group">
        <span className="reader__bottom-label">Fit</span>
        <div className="reader__segmented" role="group" aria-label="Page fit mode">
          {FIT_MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`reader__segment${fitMode === option.id ? ' reader__segment--active' : ''}`}
              aria-pressed={fitMode === option.id}
              onClick={() => onFitModeChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="reader__bottom-group">
        <span className="reader__bottom-label">View</span>
        <div className="reader__segmented" role="group" aria-label="Page view mode">
          {VIEW_MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`reader__segment${viewMode === option.id ? ' reader__segment--active' : ''}`}
              aria-pressed={viewMode === option.id}
              data-testid={`view-mode-${option.id}`}
              onClick={() => onViewModeChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
