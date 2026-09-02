import { features } from '@/config/features';
import { LocalSyncStub } from './local-stub';
import type { SyncStateService } from './types';

function createSyncStateService(): SyncStateService {
  if (!features.cloudEnabled) {
    return new LocalSyncStub();
  }
  // Future: return remote sync implementation when cloud is enabled.
  return new LocalSyncStub();
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
