import {
  formatZoomPercent,
  READER_THEMES,
  TEXT_SIZE_STEPS,
  type ReaderThemeId,
  ZOOM_STEPS,
  zoomMultiplier,
} from './reader-display';
import { TextLargerIcon, TextSmallerIcon, ZoomInIcon, ZoomOutIcon } from './reader-display-icons';

interface ReaderDisplayControlsProps {
  zoomIndex: number;
  textSizeIndex: number;
  themeId: ReaderThemeId;
  textSizingEnabled: boolean;
  onZoomIndexChange: (index: number) => void;
  onTextSizeIndexChange: (index: number) => void;
  onThemeChange: (themeId: ReaderThemeId) => void;
}

export function ReaderDisplayControls({
  zoomIndex,
  textSizeIndex,
  themeId,
  textSizingEnabled,
  onZoomIndexChange,
  onTextSizeIndexChange,
  onThemeChange,
}: ReaderDisplayControlsProps) {
  const zoomAtMin = zoomIndex <= 0;
  const zoomAtMax = zoomIndex >= ZOOM_STEPS.length - 1;
  const textAtMin = textSizeIndex <= 0;
  const textAtMax = textSizeIndex >= TEXT_SIZE_STEPS.length - 1;

  return (
    <>
      <div className="reader__bottom-group">
        <div className="reader__segmented" role="group" aria-label="Zoom level">
          <button
            type="button"
            className="reader__segment reader__segment--icon"
            aria-label="Zoom out"
            title="Zoom out"
            disabled={zoomAtMin}
            data-testid="zoom-out"
            onClick={() => onZoomIndexChange(zoomIndex - 1)}
          >
            <ZoomOutIcon className="reader__layout-icon" />
          </button>
          <span className="reader__zoom-label" data-testid="zoom-level">
            {formatZoomPercent(zoomMultiplier(zoomIndex))}
          </span>
          <button
            type="button"
            className="reader__segment reader__segment--icon"
            aria-label="Zoom in"
            title="Zoom in"
            disabled={zoomAtMax}
            data-testid="zoom-in"
            onClick={() => onZoomIndexChange(zoomIndex + 1)}
          >
            <ZoomInIcon className="reader__layout-icon" />
          </button>
        </div>
      </div>

      {textSizingEnabled && (
        <div className="reader__bottom-group">
          <div className="reader__segmented" role="group" aria-label="Text size">
            <button
              type="button"
              className="reader__segment reader__segment--icon"
              aria-label="Decrease text size"
              title="Decrease text size"
              disabled={textAtMin}
              data-testid="text-smaller"
              onClick={() => onTextSizeIndexChange(textSizeIndex - 1)}
            >
              <TextSmallerIcon className="reader__layout-icon" />
            </button>
            <button
              type="button"
              className="reader__segment reader__segment--icon"
              aria-label="Increase text size"
              title="Increase text size"
              disabled={textAtMax}
              data-testid="text-larger"
              onClick={() => onTextSizeIndexChange(textSizeIndex + 1)}
            >
              <TextLargerIcon className="reader__layout-icon" />
            </button>
          </div>
        </div>
      )}

      <div className="reader__bottom-group">
        <div className="reader__segmented" role="group" aria-label="Reading theme">
          {READER_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`reader__segment reader__segment--theme${
                themeId === theme.id ? ' reader__segment--active' : ''
              }`}
              aria-label={theme.label}
              title={theme.label}
              aria-pressed={themeId === theme.id}
              data-testid={`theme-${theme.id}`}
              onClick={() => onThemeChange(theme.id)}
            >
              <span
                className="reader__theme-swatch"
                style={{ background: theme.pageBackground, color: theme.textColor }}
                aria-hidden
              >
                Aa
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
