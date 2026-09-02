import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  closeDatabase,
  resetDatabaseConnection,
  setTestDatabaseName,
} from '@/infrastructure/persistence/db';
import { SyncCoordinator } from './sync-coordinator';
import { InMemorySyncTransport } from './sync-transport';
import { listReadyMutations, updateMutation } from './sync-queue-repository';
import { getSyncMeta, getCachedSessionsForBook } from './sync-meta-repository';

const mockGetSession = vi.fn();

vi.mock('@/infrastructure/auth', () => ({
  authService: {
    getSession: () => mockGetSession(),
    onSessionChange: () => () => undefined,
  },
}));

const session = {
  user: { id: 'account-1', username: 'testuser' },
  token: 'token-abc',
};

describe('SyncCoordinator', () => {
  let transport: InMemorySyncTransport;
  let coordinator: SyncCoordinator;

  beforeEach(() => {
    setTestDatabaseName(`luma-sync-coordinator-${Date.now()}-${Math.random()}`);
    transport = new InMemorySyncTransport();
    coordinator = new SyncCoordinator(transport);
    mockGetSession.mockResolvedValue(session);
    vi.stubGlobal('navigator', { onLine: true });
  });

  afterEach(async () => {
    await closeDatabase();
    resetDatabaseConnection();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('enqueues, pushes, and clears pending mutations', async () => {
    await coordinator.pushReadingState('book-1', {
      deviceId: 'device-a',
      deviceName: 'Laptop',
      location: { format: 'pdf', locator: { pageNumber: 5, yOffset: 0 } },
      progress: 0.5,
      lastActiveAt: 100,
    });

    expect(await listReadyMutations(Date.now())).toHaveLength(0);
    expect(transport.snapshot()).toHaveLength(1);
  });

  it('pulls remote sessions and advances the cursor', async () => {
    await coordinator.pushReadingState('book-1', {
      deviceId: 'device-a',
      deviceName: 'Laptop',
      location: { format: 'pdf', locator: { pageNumber: 5, yOffset: 0 } },
      progress: 0.5,
      lastActiveAt: 100,
    });

    const remoteCoordinator = new SyncCoordinator(transport);
    mockGetSession.mockResolvedValue({
      user: { id: 'account-1', username: 'testuser' },
      token: 'token-xyz',
    });

    await remoteCoordinator.syncNow();

    const meta = await getSyncMeta('account-1');
    expect(meta?.pullCursor).toBeGreaterThan(0);

    const cached = await getCachedSessionsForBook('book-1');
    expect(cached.some((entry) => entry.deviceId === 'device-a')).toBe(true);
  });

  it('retries failed pushes without dropping the mutation', async () => {
    const failingTransport = {
      pushMutation: vi
        .fn()
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValue(undefined),
      pullChanges: vi.fn().mockResolvedValue({ sessions: [], nextCursor: 0 }),
    };

    const retryCoordinator = new SyncCoordinator(failingTransport);
    await retryCoordinator.pushReadingState('book-1', {
      deviceId: 'device-a',
      deviceName: 'Laptop',
      location: { format: 'pdf', locator: { pageNumber: 2, yOffset: 0 } },
      progress: 0.2,
      lastActiveAt: 200,
    });

    expect(failingTransport.pushMutation).toHaveBeenCalledTimes(1);
    const pendingAfterFailure = await listReadyMutations(Number.MAX_SAFE_INTEGER);
    expect(pendingAfterFailure).toHaveLength(1);
    expect(pendingAfterFailure[0]!.attemptCount).toBe(1);

    await updateMutation({ ...pendingAfterFailure[0]!, nextAttemptAt: Date.now() });
    await retryCoordinator.syncNow();

    expect(failingTransport.pushMutation).toHaveBeenCalledTimes(2);
    expect(await listReadyMutations(Number.MAX_SAFE_INTEGER)).toHaveLength(0);
  });

  it('skips sync when offline', async () => {
    vi.stubGlobal('navigator', { onLine: false });

    await coordinator.pushReadingState('book-1', {
      deviceId: 'device-a',
      deviceName: 'Laptop',
      location: { format: 'pdf', locator: { pageNumber: 1, yOffset: 0 } },
      progress: 0.1,
      lastActiveAt: 100,
    });

    expect(await listReadyMutations(Date.now())).toHaveLength(1);
    expect(transport.snapshot()).toHaveLength(0);
  });
});
