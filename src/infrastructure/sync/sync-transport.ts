import { apiBaseUrl, authHeaders } from '@/config/api';
import type { DeviceSession, ReadingLocationEnvelope } from './types';
import { SyncAuthError } from './types';
import type { SyncMutation } from './mutation';

export interface SyncTransport {
  pushMutation(token: string, mutation: SyncMutation): Promise<void>;
  pullChanges(token: string, cursor: number, bookId?: string): Promise<{
    sessions: DeviceSession[];
    nextCursor: number;
  }>;
}

function mapSession(raw: {
  deviceId: string;
  deviceName: string;
  bookId: string;
  location: ReadingLocationEnvelope;
  progress: number;
  lastActiveAt: number;
  contentVersion?: string | null;
}): DeviceSession {
  return {
    deviceId: raw.deviceId,
    deviceName: raw.deviceName,
    bookId: raw.bookId,
    location: raw.location,
    progress: raw.progress,
    lastActiveAt: raw.lastActiveAt,
    contentVersion: raw.contentVersion ?? undefined,
  };
}

function assertOk(response: Response, action: string): void {
  if (response.status === 401) {
    throw new SyncAuthError();
  }
  if (!response.ok && response.status !== 204) {
    throw new Error(`${action} failed: ${response.status}`);
  }
}

export class HttpSyncTransport implements SyncTransport {
  async pushMutation(token: string, mutation: SyncMutation): Promise<void> {
    const response = await fetch(`${apiBaseUrl()}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({
        bookId: mutation.bookId,
        deviceId: mutation.deviceId,
        deviceName: mutation.deviceName,
        location: mutation.location,
        progress: mutation.progress,
        lastActiveAt: mutation.lastActiveAt,
        mutationId: mutation.mutationId,
        contentVersion: mutation.contentVersion,
      }),
    });

    assertOk(response, 'Push');
  }

  async pullChanges(
    token: string,
    cursor: number,
    bookId?: string,
  ): Promise<{ sessions: DeviceSession[]; nextCursor: number }> {
    const url = new URL(`${apiBaseUrl()}/sync/pull`);
    url.searchParams.set('cursor', String(cursor));
    if (bookId) url.searchParams.set('bookId', bookId);

    const response = await fetch(url, { headers: authHeaders(token) });
    assertOk(response, 'Pull');

    const data = (await response.json()) as {
      sessions: Array<{
        deviceId: string;
        deviceName: string;
        bookId: string;
        location: ReadingLocationEnvelope;
        progress: number;
        lastActiveAt: number;
        contentVersion?: string | null;
      }>;
      nextCursor: number;
    };

    return {
      sessions: data.sessions.map(mapSession),
      nextCursor: data.nextCursor,
    };
  }
}

export class InMemorySyncTransport implements SyncTransport {
  private sessions = new Map<string, DeviceSession>();
  private seenMutations = new Set<string>();
  private revision = 0;

  async pushMutation(_token: string, mutation: SyncMutation): Promise<void> {
    if (this.seenMutations.has(mutation.mutationId)) return;
    this.seenMutations.add(mutation.mutationId);
    this.revision += 1;
    const key = `${mutation.bookId}:${mutation.deviceId}`;
    this.sessions.set(key, {
      deviceId: mutation.deviceId,
      deviceName: mutation.deviceName,
      bookId: mutation.bookId,
      location: mutation.location,
      progress: mutation.progress,
      lastActiveAt: mutation.lastActiveAt,
      contentVersion: mutation.contentVersion,
    });
  }

  async pullChanges(
    _token: string,
    cursor: number,
    bookId?: string,
  ): Promise<{ sessions: DeviceSession[]; nextCursor: number }> {
    const sessions = [...this.sessions.values()].filter((session) =>
      bookId ? session.bookId === bookId : true,
    );
    return { sessions, nextCursor: Math.max(this.revision, cursor) };
  }

  snapshot(): DeviceSession[] {
    return [...this.sessions.values()];
  }
}
