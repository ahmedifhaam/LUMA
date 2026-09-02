import { features } from '@/config/features';
import { HttpSyncStateService } from './http-client';
import { LocalSyncStub } from './local-stub';
import type { SyncStateService } from './types';

function createSyncStateService(): SyncStateService {
  if (!features.cloudEnabled) {
    return new LocalSyncStub();
  }
  return new HttpSyncStateService();
}

export const syncStateService: SyncStateService = createSyncStateService();

export { findContinuationOffer, CONTINUATION_WINDOW_MS } from './continuation';
export type {
  ContinuationOffer,
  DeviceSession,
  ReadingLocationEnvelope,
  ReadingStatePush,
  SyncStateService,
} from './types';
