import type { ContinuationOffer, DeviceSession, ReadingLocationEnvelope, ReadingStatePush, SyncStateService } from './types';

export class LocalSyncStub implements SyncStateService {
  async pushReadingState(_bookId: string, _state: ReadingStatePush): Promise<void> {
    // no-op when cloud is disabled
  }

  async pullReadingState(_bookId: string): Promise<DeviceSession[]> {
    return [];
  }

  async getContinuationOffer(
    _bookId: string,
    _currentDeviceId: string,
    _currentLocation: ReadingLocationEnvelope,
  ): Promise<ContinuationOffer> {
    return null;
  }

  async syncNow(): Promise<void> {
    // no-op when cloud is disabled
  }
}
