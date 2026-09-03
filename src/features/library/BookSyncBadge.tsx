import { useEffect, useState } from 'react';
import type { Book } from '@/domain/book/types';
import { canSyncReadingState } from '@/application/sync/reading-sync';
import { useAuthStore } from '@/application/auth/auth-store';
import { syncStateService } from '@/infrastructure/sync';
import type { SyncBookStatus } from '@/infrastructure/sync/types';

const LABELS: Record<SyncBookStatus, string> = {
  idle: '',
  pending: 'Sync pending',
  synced: 'Synced',
  error: 'Sync error',
  offline: 'Offline — queued',
};

export function BookSyncBadge({ book }: { book: Book }) {
  const session = useAuthStore((s) => s.session);
  const [status, setStatus] = useState<SyncBookStatus>('idle');

  useEffect(() => {
    if (!canSyncReadingState(Boolean(session), book)) {
      setStatus('idle');
      return;
    }
    let cancelled = false;
    void syncStateService.getBookSyncStatus?.(book.id).then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, [book, session]);

  const label = LABELS[status];
  if (!label) return null;

  return (
    <span
      className={`book-sync-badge book-sync-badge--${status}`}
      data-testid={`book-sync-${book.id}`}
      data-sync-status={status}
    >
      {label}
    </span>
  );
}
