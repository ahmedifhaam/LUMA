import { features } from '@/config/features';
import { HttpSyncTransport } from './sync-transport';
import { LocalSyncStub } from './local-stub';
import { SyncCoordinator } from './sync-coordinator';
import type { SyncStateService } from './types';

function createSyncStateService(): SyncStateService {
  if (!features.cloudEnabled) {
    return new LocalSyncStub();
  }

  const coordinator = new SyncCoordinator(new HttpSyncTransport());
  coordinator.initialize();
  return coordinator;
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
