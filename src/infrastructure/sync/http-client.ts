import { apiBaseUrl, authHeaders } from '@/config/api';
import { findContinuationOffer } from './continuation';
import type {
  ContinuationOffer,
  DeviceSession,
  ReadingLocationEnvelope,
  ReadingStatePush,
  SyncStateService,
} from './types';

const TOKEN_KEY = 'luma-auth-token';

function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function mapSession(raw: {
  deviceId: string;
  deviceName: string;
  bookId: string;
  location: ReadingLocationEnvelope;
  progress: number;
  lastActiveAt: number;
}): DeviceSession {
  return {
    deviceId: raw.deviceId,
    deviceName: raw.deviceName,
    bookId: raw.bookId,
    location: raw.location,
    progress: raw.progress,
    lastActiveAt: raw.lastActiveAt,
  };
}

export class HttpSyncStateService implements SyncStateService {
  async pushReadingState(bookId: string, state: ReadingStatePush): Promise<void> {
    const token = readToken();
    if (!token) return;

    const response = await fetch(`${apiBaseUrl()}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({
        bookId,
        deviceId: state.deviceId,
        deviceName: state.deviceName,
        location: state.location,
        progress: state.progress,
        lastActiveAt: state.lastActiveAt,
        mutationId: `${state.deviceId}:${bookId}:${state.lastActiveAt}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to push reading state');
    }
  }

  async pullReadingState(bookId: string): Promise<DeviceSession[]> {
    const token = readToken();
    if (!token) return [];

    const url = new URL(`${apiBaseUrl()}/sync/pull`);
    url.searchParams.set('cursor', '0');
    url.searchParams.set('bookId', bookId);

    const response = await fetch(url, { headers: authHeaders(token) });
    if (!response.ok) return [];

    const data = (await response.json()) as {
      sessions: Array<{
        deviceId: string;
        deviceName: string;
        bookId: string;
        location: ReadingLocationEnvelope;
        progress: number;
        lastActiveAt: number;
      }>;
    };

    return data.sessions.map(mapSession);
  }

  async getContinuationOffer(
    bookId: string,
    currentDeviceId: string,
  ): Promise<ContinuationOffer> {
    const sessions = await this.pullReadingState(bookId);
    const current = sessions.find((s) => s.deviceId === currentDeviceId);
    const currentLocation = current?.location ?? {
      format: 'pdf' as const,
      locator: { pageNumber: 1, yOffset: 0 },
    };

    return findContinuationOffer(
      sessions,
      currentDeviceId,
      currentLocation,
      Date.now(),
    );
  }

  async syncNow(): Promise<void> {
    // Pull is on-demand per book; coordinator can expand this later.
  }
}
