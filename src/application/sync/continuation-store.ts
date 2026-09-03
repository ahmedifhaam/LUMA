import { create } from 'zustand';
import type { Book, BookFormat } from '@/domain/book/types';
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
    book: Pick<Book, 'id' | 'source' | 'format'>,
    localLocation: DocumentLocation,
  ) => Promise<void>;
  accept: () => DocumentLocation | null;
  dismiss: () => void;
}

export const useContinuationStore = create<ContinuationState>((set, get) => ({
  offer: null,
  visible: false,

  async checkOnOpen(book, localLocation) {
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

    const format = (book.format ?? 'pdf') as BookFormat;
    const offer = await fetchContinuationOffer(
      book.id,
      getDeviceId(),
      format,
      localLocation,
      hasSession,
      book,
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
