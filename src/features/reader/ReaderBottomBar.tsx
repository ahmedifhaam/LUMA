import type { PageFitMode, ViewMode } from './reader-layout';
import { ReaderLayoutControls } from './ReaderLayoutControls';

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
    <footer
      className="reader__bottom-bar"
      aria-label="Reading layout controls"
      data-testid="reader-bottom-bar"
    >
      <ReaderLayoutControls
        fitMode={fitMode}
        viewMode={viewMode}
        onFitModeChange={onFitModeChange}
        onViewModeChange={onViewModeChange}
      />
    </footer>
  );
}
