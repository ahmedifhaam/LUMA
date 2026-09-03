export interface ReadingLocationEnvelope {
  format: 'pdf' | 'epub';
  locator: Record<string, unknown>;
}

export interface DeviceSession {
  deviceId: string;
  deviceName: string;
  bookId: string;
  location: ReadingLocationEnvelope;
  progress: number;
  lastActiveAt: number;
  /** Provider content revision when known (Drive md5 / modifiedTime). */
  contentVersion?: string;
}

export type ContinuationOffer = {
  fromDeviceName: string;
  session: DeviceSession;
  /** True when remote contentVersion differs from the local book's version. */
  incompatibleContentVersion?: boolean;
} | null;

export interface ReadingStatePush {
  deviceId: string;
  deviceName: string;
  location: ReadingLocationEnvelope;
  progress: number;
  lastActiveAt: number;
  contentVersion?: string;
}

export type SyncBookStatus = 'idle' | 'pending' | 'synced' | 'error' | 'offline';

export interface SyncStateService {
  pushReadingState(bookId: string, state: ReadingStatePush): Promise<void>;
  pullReadingState(bookId: string): Promise<DeviceSession[]>;
  getContinuationOffer(
    bookId: string,
    currentDeviceId: string,
    currentLocation: ReadingLocationEnvelope,
    localContentVersion?: string | null,
  ): Promise<ContinuationOffer>;
  syncNow(): Promise<void>;
  getBookSyncStatus?(bookId: string): Promise<SyncBookStatus>;
}

export class SyncAuthError extends Error {
  readonly status = 401;
  constructor(message = 'Authentication expired') {
    super(message);
    this.name = 'SyncAuthError';
  }
}
