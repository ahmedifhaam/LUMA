import type { DocumentLocation } from '@/domain/document/types';
import { useContinuationStore } from '@/application/sync/continuation-store';

interface ContinuationPromptProps {
  onContinue: (location: DocumentLocation) => void;
}

export function ContinuationPrompt({ onContinue }: ContinuationPromptProps) {
  const visible = useContinuationStore((s) => s.visible);
  const offer = useContinuationStore((s) => s.offer);
  const accept = useContinuationStore((s) => s.accept);
  const dismiss = useContinuationStore((s) => s.dismiss);

  if (!visible || !offer) return null;

  const progress = Math.round(offer.session.progress * 100);

  return (
    <div className="continuation-prompt" data-testid="continuation-prompt">
      <span className="continuation-prompt__text">
        Continue from {offer.fromDeviceName} — {progress}%
      </span>
      <div className="continuation-prompt__actions">
        <button
          type="button"
          className="btn btn--primary"
          data-testid="continuation-continue"
          onClick={() => {
            const location = accept();
            if (location) onContinue(location);
          }}
        >
          Continue
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          data-testid="continuation-dismiss"
          onClick={() => dismiss()}
        >
          Start from this device
        </button>
      </div>
    </div>
  );
}
