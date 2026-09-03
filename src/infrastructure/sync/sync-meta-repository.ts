import {
  get,
  getAll,
  getAllByIndex,
  put,
  remove,
  STORE_SYNC_META,
  STORE_SYNC_SESSIONS,
} from '@/infrastructure/persistence/db';
import { clearMutationQueue } from './sync-queue-repository';
import type { DeviceSession } from './types';

export interface SyncMeta {
  accountId: string;
  pullCursor: number;
}

export interface CachedDeviceSession extends DeviceSession {
  id: string;
  serverRevision: number;
}

function sessionCacheId(bookId: string, deviceId: string): string {
  return `${bookId}:${deviceId}`;
}

export async function getSyncMeta(accountId: string): Promise<SyncMeta | undefined> {
  return get<SyncMeta>(STORE_SYNC_META, accountId);
}

export async function saveSyncMeta(meta: SyncMeta): Promise<void> {
  await put(STORE_SYNC_META, meta);
}

export async function clearSyncMeta(accountId: string): Promise<void> {
  await remove(STORE_SYNC_META, accountId);
}

export async function applyPulledSessions(
  sessions: Array<DeviceSession & { serverRevision?: number }>,
): Promise<void> {
  for (const session of sessions) {
    const id = sessionCacheId(session.bookId, session.deviceId);
    const cached: CachedDeviceSession = {
      id,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      bookId: session.bookId,
      location: session.location,
      progress: session.progress,
      lastActiveAt: session.lastActiveAt,
      contentVersion: session.contentVersion,
      serverRevision: session.serverRevision ?? 0,
    };
    await put(STORE_SYNC_SESSIONS, cached);
  }
}

export async function getCachedSessionsForBook(bookId: string): Promise<DeviceSession[]> {
  const cached = await getAllByIndex<CachedDeviceSession>(STORE_SYNC_SESSIONS, 'byBook', bookId);
  return cached.map(
    ({ deviceId, deviceName, bookId: id, location, progress, lastActiveAt, contentVersion }) => ({
      deviceId,
      deviceName,
      bookId: id,
      location,
      progress,
      lastActiveAt,
      contentVersion,
    }),
  );
}

export async function clearSessionCache(): Promise<void> {
  const all = await getAll<{ id: string }>(STORE_SYNC_SESSIONS);
  await Promise.all(all.map((session) => remove(STORE_SYNC_SESSIONS, session.id)));
}

export async function clearAllSyncData(): Promise<void> {
  await clearMutationQueue();
  await clearSessionCache();
  const metas = await getAll<{ accountId: string }>(STORE_SYNC_META);
  await Promise.all(metas.map((meta) => remove(STORE_SYNC_META, meta.accountId)));
}
