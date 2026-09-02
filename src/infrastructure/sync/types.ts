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
}

export type ContinuationOffer = { fromDeviceName: string; session: DeviceSession } | null;

export interface ReadingStatePush {
  deviceId: string;
  deviceName: string;
  location: ReadingLocationEnvelope;
  progress: number;
  lastActiveAt: number;
}

export interface SyncStateService {
  pushReadingState(bookId: string, state: ReadingStatePush): Promise<void>;
  pullReadingState(bookId: string): Promise<DeviceSession[]>;
  getContinuationOffer(bookId: string, currentDeviceId: string): Promise<ContinuationOffer>;
  syncNow(): Promise<void>;
}
