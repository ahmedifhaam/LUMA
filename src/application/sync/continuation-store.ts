import { create } from 'zustand';
import type { BookFormat } from '@/domain/book/types';
import type { DocumentLocation } from '@/domain/document/types';
import { fromReadingLocationEnvelope } from '@/domain/sync/reading-location';
import { features } from '@/config/features';
import { authService } from '@/infrastructure/auth';
import { getDeviceId } from '@/infrastructure/device/device-id';
import type { ContinuationOffer } from '@/infrastructure/sync/types';
import { fetchContinuationOffer } from './reading-sync';

interface ContinuationState {
  offer: ContinuationOffer;
  visible: boolean;
  checkOnOpen: (
    bookId: string,
    format: BookFormat,
    localLocation: DocumentLocation,
  ) => Promise<void>;
  accept: () => DocumentLocation | null;
  dismiss: () => void;
}

export const useContinuationStore = create<ContinuationState>((set, get) => ({
  offer: null,
  visible: false,

  async checkOnOpen(bookId, format, localLocation) {
    if (!features.cloudEnabled) {
      set({ offer: null, visible: false });
      return;
    }

    const session = await authService.getSession();
    const hasSession = session !== null;
    if (!hasSession) {
      set({ offer: null, visible: false });
      return;
    }

    const offer = await fetchContinuationOffer(
      bookId,
      getDeviceId(),
      format,
      localLocation,
      hasSession,
    );
    set({ offer, visible: offer !== null });
  },

  accept() {
    const { offer } = get();
    if (!offer) return null;

    const location = fromReadingLocationEnvelope(offer.session.location);
    set({ offer: null, visible: false });
    return location;
  },

  dismiss() {
    set({ visible: false });
  },
}));
