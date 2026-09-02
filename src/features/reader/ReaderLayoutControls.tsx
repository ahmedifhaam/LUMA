import type { PageFitMode, ViewMode } from './reader-layout';
import { FIT_MODE_OPTIONS, VIEW_MODE_OPTIONS } from './reader-layout';
import {
  ContinuousScrollIcon,
  DoublePageIcon,
  FitScreenIcon,
  FitWidthIcon,
  SinglePageIcon,
} from './reader-layout-icons';

interface ReaderLayoutControlsProps {
  fitMode: PageFitMode;
  viewMode: ViewMode;
  onFitModeChange: (mode: PageFitMode) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

const FIT_ICONS = {
  width: FitWidthIcon,
  screen: FitScreenIcon,
} as const;

const VIEW_ICONS = {
  single: SinglePageIcon,
  double: DoublePageIcon,
  continuous: ContinuousScrollIcon,
} as const;

export function ReaderLayoutControls({
  fitMode,
  viewMode,
  onFitModeChange,
  onViewModeChange,
}: ReaderLayoutControlsProps) {
  return (
    <>
      <div className="reader__bottom-group">
        <div className="reader__segmented" role="group" aria-label="Page fit mode">
          {FIT_MODE_OPTIONS.map((option) => {
            const Icon = FIT_ICONS[option.id];
            return (
              <button
                key={option.id}
                type="button"
                className={`reader__segment reader__segment--icon${
                  fitMode === option.id ? ' reader__segment--active' : ''
                }`}
                aria-label={option.label}
                title={option.label}
                aria-pressed={fitMode === option.id}
                data-testid={`fit-mode-${option.id}`}
                onClick={() => onFitModeChange(option.id)}
              >
                <Icon className="reader__layout-icon" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="reader__bottom-group">
        <div className="reader__segmented" role="group" aria-label="Page view mode">
          {VIEW_MODE_OPTIONS.map((option) => {
            const Icon = VIEW_ICONS[option.id];
            return (
              <button
                key={option.id}
                type="button"
                className={`reader__segment reader__segment--icon${
                  viewMode === option.id ? ' reader__segment--active' : ''
                }`}
                aria-label={option.label}
                title={option.label}
                aria-pressed={viewMode === option.id}
                data-testid={`view-mode-${option.id}`}
                onClick={() => onViewModeChange(option.id)}
              >
                <Icon className="reader__layout-icon" />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
