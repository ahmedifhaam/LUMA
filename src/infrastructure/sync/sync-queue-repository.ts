import {
  getAll,
  getAllByIndex,
  put,
  remove,
  STORE_SYNC_QUEUE,
} from '@/infrastructure/persistence/db';
import type { SyncMutation } from './mutation';

export async function enqueueMutation(mutation: SyncMutation): Promise<void> {
  const existing = await getAllByIndex<SyncMutation>(
    STORE_SYNC_QUEUE,
    'byBookDevice',
    mutation.bookDeviceKey,
  );
  for (const item of existing) {
    await remove(STORE_SYNC_QUEUE, item.mutationId);
  }
  await put(STORE_SYNC_QUEUE, mutation);
}

export async function listReadyMutations(now: number): Promise<SyncMutation[]> {
  const all = await getAll<SyncMutation>(STORE_SYNC_QUEUE);
  return all
    .filter((mutation) => mutation.nextAttemptAt <= now)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function listPendingMutations(): Promise<SyncMutation[]> {
  return getAll<SyncMutation>(STORE_SYNC_QUEUE);
}

export async function updateMutation(mutation: SyncMutation): Promise<void> {
  await put(STORE_SYNC_QUEUE, mutation);
}

export async function removeMutation(mutationId: string): Promise<void> {
  await remove(STORE_SYNC_QUEUE, mutationId);
}

export async function clearMutationQueue(): Promise<void> {
  const all = await getAll<SyncMutation>(STORE_SYNC_QUEUE);
  await Promise.all(all.map((mutation) => remove(STORE_SYNC_QUEUE, mutation.mutationId)));
}

export async function getPendingMutationsForBookDevice(
  bookDeviceKey: string,
): Promise<SyncMutation[]> {
  return getAllByIndex<SyncMutation>(STORE_SYNC_QUEUE, 'byBookDevice', bookDeviceKey);
}
