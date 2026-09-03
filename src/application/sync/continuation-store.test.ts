import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContinuationOffer } from '@/infrastructure/sync/types';
import { useContinuationStore } from './continuation-store';

const mockFetchContinuationOffer = vi.fn();
const mockGetSession = vi.fn();

vi.mock('./reading-sync', () => ({
  fetchContinuationOffer: (...args: unknown[]) => mockFetchContinuationOffer(...args),
}));

vi.mock('@/infrastructure/auth', () => ({
  authService: {
    getSession: () => mockGetSession(),
  },
}));

vi.mock('@/config/features', () => ({
  features: { cloudEnabled: true },
}));

vi.mock('@/infrastructure/device/device-id', () => ({
  getDeviceId: () => 'device-test',
}));

const cloudBook = {
  id: 'book-abc',
  source: 'google-drive' as const,
  format: 'pdf' as const,
};

const offer: ContinuationOffer = {
  fromDeviceName: 'Work Laptop',
  session: {
    deviceId: 'device-other',
    deviceName: 'Work Laptop',
    bookId: 'book-abc',
    location: { format: 'pdf', locator: { pageNumber: 20, yOffset: 0.15 } },
    progress: 0.42,
    lastActiveAt: Date.now(),
  },
};

describe('continuation-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'u1', username: 'test' }, token: 'tok' });
    useContinuationStore.setState({ offer: null, visible: false });
  });

  it('dismiss hides the banner without changing the offer', async () => {
    mockFetchContinuationOffer.mockResolvedValue(offer);

    await useContinuationStore
      .getState()
      .checkOnOpen(cloudBook, { pageNumber: 1, yOffset: 0 });

    expect(useContinuationStore.getState().visible).toBe(true);
    useContinuationStore.getState().dismiss();
    expect(useContinuationStore.getState().visible).toBe(false);
    expect(useContinuationStore.getState().offer).toEqual(offer);
  });

  it('accept converts the offer location and clears the offer', async () => {
    mockFetchContinuationOffer.mockResolvedValue(offer);

    await useContinuationStore
      .getState()
      .checkOnOpen(cloudBook, { pageNumber: 1, yOffset: 0 });

    const location = useContinuationStore.getState().accept();

    expect(location).toEqual({ pageNumber: 20, yOffset: 0.15 });
    expect(useContinuationStore.getState().offer).toBeNull();
    expect(useContinuationStore.getState().visible).toBe(false);
  });
});
