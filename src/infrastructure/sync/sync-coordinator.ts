import { authService } from '@/infrastructure/auth';
import { findContinuationOffer } from './continuation';
import { createSyncMutation, syncBackoffMs, type SyncMutation } from './mutation';
import {
  applyPulledSessions,
  clearAllSyncData,
  getCachedSessionsForBook,
  getSyncMeta,
  saveSyncMeta,
} from './sync-meta-repository';
import {
  enqueueMutation,
  listReadyMutations,
  removeMutation,
  updateMutation,
} from './sync-queue-repository';
import type { SyncTransport } from './sync-transport';
import type {
  ContinuationOffer,
  DeviceSession,
  ReadingLocationEnvelope,
  ReadingStatePush,
  SyncStateService,
} from './types';

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine;
}

export class SyncCoordinator implements SyncStateService {
  private flushInFlight: Promise<void> | null = null;
  private syncInFlight: Promise<void> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  constructor(private readonly transport: SyncTransport) {}

  initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    window.addEventListener('online', () => {
      void this.syncNow();
    });

    authService.onSessionChange((session) => {
      if (session) {
        void this.syncNow();
      } else {
        void clearAllSyncData();
        this.clearRetryTimer();
      }
    });
  }

  async pushReadingState(bookId: string, state: ReadingStatePush): Promise<void> {
    const session = await authService.getSession();
    if (!session) return;

    const mutation = createSyncMutation(bookId, state);
    await enqueueMutation(mutation);
    await this.scheduleFlush();
  }

  async pullReadingState(bookId: string): Promise<DeviceSession[]> {
    await this.syncNow();
    return getCachedSessionsForBook(bookId);
  }

  async getContinuationOffer(
    bookId: string,
    currentDeviceId: string,
    currentLocation: ReadingLocationEnvelope,
  ): Promise<ContinuationOffer> {
    await this.syncNow();
    const sessions = await getCachedSessionsForBook(bookId);
    return findContinuationOffer(sessions, currentDeviceId, currentLocation, Date.now());
  }

  async syncNow(): Promise<void> {
    if (this.syncInFlight) {
      await this.syncInFlight;
      return;
    }

    this.syncInFlight = this.runSyncLoop().finally(() => {
      this.syncInFlight = null;
    });
    await this.syncInFlight;
  }

  private async runSyncLoop(): Promise<void> {
    const session = await authService.getSession();
    if (!session || !isOnline()) return;

    await this.flushPendingMutations(session.token, session.user.id);
    await this.pullRemoteChanges(session.token, session.user.id);
  }

  private async scheduleFlush(): Promise<void> {
    const session = await authService.getSession();
    if (!session || !isOnline()) {
      this.scheduleRetry();
      return;
    }
    await this.flushPendingMutations(session.token, session.user.id);
  }

  private async flushPendingMutations(token: string, accountId: string): Promise<void> {
    if (this.flushInFlight) {
      await this.flushInFlight;
      return;
    }

    this.flushInFlight = this.doFlush(token).finally(() => {
      this.flushInFlight = null;
    });
    await this.flushInFlight;
  }

  private async doFlush(token: string): Promise<void> {
    const now = Date.now();
    const ready = await listReadyMutations(now);

    for (const mutation of ready) {
      try {
        await this.transport.pushMutation(token, mutation);
        await removeMutation(mutation.mutationId);
      } catch {
        await this.markMutationFailed(mutation);
        this.scheduleRetry();
        return;
      }
    }

    this.clearRetryTimer();
  }

  private async markMutationFailed(mutation: SyncMutation): Promise<void> {
    const attemptCount = mutation.attemptCount + 1;
    await updateMutation({
      ...mutation,
      attemptCount,
      nextAttemptAt: Date.now() + syncBackoffMs(attemptCount),
    });
  }

  private async pullRemoteChanges(token: string, accountId: string): Promise<void> {
    const meta = (await getSyncMeta(accountId)) ?? { accountId, pullCursor: 0 };
    if (meta.accountId !== accountId) {
      meta.pullCursor = 0;
    }

    const { sessions, nextCursor } = await this.transport.pullChanges(token, meta.pullCursor);
    if (sessions.length > 0) {
      await applyPulledSessions(sessions);
    }

    if (nextCursor >= meta.pullCursor) {
      await saveSyncMeta({ accountId, pullCursor: nextCursor });
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.syncNow();
    }, 5_000);
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}
