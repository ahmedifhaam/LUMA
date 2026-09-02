import type { PageFitMode, ViewMode } from './reader-layout';
import type { ReaderThemeId } from './reader-display';
import { ReaderDisplayControls } from './ReaderDisplayControls';
import { ReaderLayoutControls } from './ReaderLayoutControls';

interface ReaderBottomBarProps {
  fitMode: PageFitMode;
  viewMode: ViewMode;
  zoomIndex: number;
  textSizeIndex: number;
  themeId: ReaderThemeId;
  textSizingEnabled: boolean;
  onFitModeChange: (mode: PageFitMode) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onZoomIndexChange: (index: number) => void;
  onTextSizeIndexChange: (index: number) => void;
  onThemeChange: (themeId: ReaderThemeId) => void;
}

export function ReaderBottomBar({
  fitMode,
  viewMode,
  zoomIndex,
  textSizeIndex,
  themeId,
  textSizingEnabled,
  onFitModeChange,
  onViewModeChange,
  onZoomIndexChange,
  onTextSizeIndexChange,
  onThemeChange,
}: ReaderBottomBarProps) {
  return (
    <footer
      className="reader__bottom-bar"
      aria-label="Reading controls"
      data-testid="reader-bottom-bar"
    >
      <ReaderDisplayControls
        zoomIndex={zoomIndex}
        textSizeIndex={textSizeIndex}
        themeId={themeId}
        textSizingEnabled={textSizingEnabled}
        onZoomIndexChange={onZoomIndexChange}
        onTextSizeIndexChange={onTextSizeIndexChange}
        onThemeChange={onThemeChange}
      />
      <ReaderLayoutControls
        fitMode={fitMode}
        viewMode={viewMode}
        onFitModeChange={onFitModeChange}
        onViewModeChange={onViewModeChange}
      />
    </footer>
  );
}
