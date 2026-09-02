import type { ContinuationOffer, DeviceSession, ReadingStatePush, SyncStateService } from './types';

export class LocalSyncStub implements SyncStateService {
  async pushReadingState(_bookId: string, _state: ReadingStatePush): Promise<void> {
    // no-op when cloud is disabled
  }

  async pullReadingState(_bookId: string): Promise<DeviceSession[]> {
    return [];
  }

  async getContinuationOffer(_bookId: string, _currentDeviceId: string): Promise<ContinuationOffer> {
    return null;
  }

  async syncNow(): Promise<void> {
    // no-op when cloud is disabled
  }
}
