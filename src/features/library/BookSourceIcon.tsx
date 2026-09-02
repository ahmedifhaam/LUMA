import type { BookSourceKind } from '@/domain/book/source';
import { BOOK_SOURCE_ICONS, BOOK_SOURCE_LABELS } from '@/domain/book/source';

interface BookSourceIconProps {
  source: BookSourceKind;
  className?: string;
}

export function BookSourceIcon({ source, className = '' }: BookSourceIconProps) {
  return (
    <span
      className={`book-source-icon${className ? ` ${className}` : ''}`}
      title={BOOK_SOURCE_LABELS[source]}
      aria-label={BOOK_SOURCE_LABELS[source]}
      data-testid={`book-source-${source}`}
    >
      {BOOK_SOURCE_ICONS[source]}
    </span>
  );
}
