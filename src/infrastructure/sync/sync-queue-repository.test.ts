import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  closeDatabase,
  resetDatabaseConnection,
  setTestDatabaseName,
} from '@/infrastructure/persistence/db';
import { createSyncMutation } from './mutation';
import {
  clearMutationQueue,
  enqueueMutation,
  getPendingMutationsForBookDevice,
  listReadyMutations,
  removeMutation,
} from './sync-queue-repository';

describe('sync queue repository', () => {
  beforeEach(() => {
    setTestDatabaseName(`luma-sync-queue-${Date.now()}-${Math.random()}`);
  });

  afterEach(async () => {
    await closeDatabase();
    resetDatabaseConnection();
  });

  it('persists and lists ready mutations', async () => {
    const mutation = createSyncMutation('book-1', {
      deviceId: 'device-a',
      deviceName: 'Laptop',
      location: { format: 'pdf', locator: { pageNumber: 1, yOffset: 0 } },
      progress: 0.1,
      lastActiveAt: 100,
    });

    await enqueueMutation(mutation);
    const ready = await listReadyMutations(Date.now());

    expect(ready).toHaveLength(1);
    expect(ready[0]!.mutationId).toBe(mutation.mutationId);
  });

  it('coalesces pending mutations for the same book and device', async () => {
    await enqueueMutation(
      createSyncMutation('book-1', {
        deviceId: 'device-a',
        deviceName: 'Laptop',
        location: { format: 'pdf', locator: { pageNumber: 1, yOffset: 0 } },
        progress: 0.1,
        lastActiveAt: 100,
      }),
    );

    await enqueueMutation(
      createSyncMutation('book-1', {
        deviceId: 'device-a',
        deviceName: 'Laptop',
        location: { format: 'pdf', locator: { pageNumber: 5, yOffset: 0 } },
        progress: 0.5,
        lastActiveAt: 200,
      }),
    );

    const pending = await getPendingMutationsForBookDevice('book-1:device-a');
    expect(pending).toHaveLength(1);
    expect(pending[0]!.lastActiveAt).toBe(200);
  });

  it('removes mutations after acknowledgement', async () => {
    const mutation = createSyncMutation('book-1', {
      deviceId: 'device-a',
      deviceName: 'Laptop',
      location: { format: 'pdf', locator: { pageNumber: 1, yOffset: 0 } },
      progress: 0.1,
      lastActiveAt: 100,
    });

    await enqueueMutation(mutation);
    await removeMutation(mutation.mutationId);

    expect(await listReadyMutations(Date.now())).toHaveLength(0);
  });

  it('clears the entire queue', async () => {
    await enqueueMutation(
      createSyncMutation('book-1', {
        deviceId: 'device-a',
        deviceName: 'Laptop',
        location: { format: 'pdf', locator: { pageNumber: 1, yOffset: 0 } },
        progress: 0.1,
        lastActiveAt: 100,
      }),
    );

    await clearMutationQueue();
    expect(await listReadyMutations(Date.now())).toHaveLength(0);
  });
});
