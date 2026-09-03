import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Book } from '@/domain/book/types';
import type { DocumentLocation } from '@/domain/document/types';
import type { ContinuationOffer } from '@/infrastructure/sync/types';
import {
  buildReadingStatePush,
  canSyncReadingState,
  fetchContinuationOffer,
  pushReadingStateIfEligible,
} from './reading-sync';

const mockPushReadingState = vi.fn();
const mockGetContinuationOffer = vi.fn();

vi.mock('@/infrastructure/sync', () => ({
  syncStateService: {
    pushReadingState: (...args: unknown[]) => mockPushReadingState(...args),
    getContinuationOffer: (...args: unknown[]) => mockGetContinuationOffer(...args),
  },
}));

vi.mock('@/config/features', () => ({
  features: { cloudEnabled: true },
}));

vi.mock('@/infrastructure/device/device-id', () => ({
  getDeviceId: () => 'device-test',
  getDeviceDisplayName: () => 'Test Reader',
}));

const localBook: Book = {
  id: 'book-abc',
  title: 'Sample',
  author: null,
  pageCount: 100,
  byteLength: 1024,
  hasText: true,
  format: 'pdf',
  sourceName: 'sample.pdf',
  source: 'local',
  createdAt: 0,
  lastOpenedAt: null,
  coverThumbnail: null,
};

const driveBook: Book = {
  ...localBook,
  source: 'google-drive',
  sourceRef: { remoteId: 'drive-1', fileName: 'sample.pdf', contentVersion: 'v1' },
};

const location: DocumentLocation = { pageNumber: 5, yOffset: 0.25 };

describe('reading sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('canSyncReadingState', () => {
    it('is true for google-drive books when signed in', () => {
      expect(canSyncReadingState(true, driveBook)).toBe(true);
    });

    it('is false for local books even when signed in', () => {
      expect(canSyncReadingState(true, localBook)).toBe(false);
    });

    it('is false without a session', () => {
      expect(canSyncReadingState(false, driveBook)).toBe(false);
    });
  });

  describe('buildReadingStatePush', () => {
    it('builds a push payload with envelope and device display name', () => {
      expect(buildReadingStatePush('device-test', location, 0.42, 'pdf')).toEqual({
        deviceId: 'device-test',
        deviceName: 'Test Reader',
        location: { format: 'pdf', locator: { pageNumber: 5, yOffset: 0.25 } },
        progress: 0.42,
        lastActiveAt: Date.parse('2026-01-15T12:00:00Z'),
      });
    });
  });

  describe('pushReadingStateIfEligible', () => {
    it('pushes reading state for cloud-backed books', async () => {
      mockPushReadingState.mockResolvedValue(undefined);

      await pushReadingStateIfEligible(driveBook, location, 0.42, true);

      expect(mockPushReadingState).toHaveBeenCalledWith('book-abc', {
        deviceId: 'device-test',
        deviceName: 'Test Reader',
        location: { format: 'pdf', locator: { pageNumber: 5, yOffset: 0.25 } },
        progress: 0.42,
        lastActiveAt: Date.parse('2026-01-15T12:00:00Z'),
      });
    });

    it('skips push for local books', async () => {
      await pushReadingStateIfEligible(localBook, location, 0.42, true);
      expect(mockPushReadingState).not.toHaveBeenCalled();
    });

    it('skips push when there is no session', async () => {
      await pushReadingStateIfEligible(driveBook, location, 0.42, false);
      expect(mockPushReadingState).not.toHaveBeenCalled();
    });
  });

  describe('fetchContinuationOffer', () => {
    it('fetches an offer using the local location envelope', async () => {
      const offer: ContinuationOffer = {
        fromDeviceName: 'Phone',
        session: {
          deviceId: 'device-phone',
          deviceName: 'Phone',
          bookId: 'book-abc',
          location: { format: 'pdf', locator: { pageNumber: 20, yOffset: 0 } },
          progress: 0.2,
          lastActiveAt: Date.now(),
        },
      };
      mockGetContinuationOffer.mockResolvedValue(offer);

      const result = await fetchContinuationOffer(
        'book-abc',
        'device-test',
        'pdf',
        location,
        true,
        driveBook,
      );

      expect(mockGetContinuationOffer).toHaveBeenCalledWith('book-abc', 'device-test', {
        format: 'pdf',
        locator: { pageNumber: 5, yOffset: 0.25 },
      });
      expect(result).toEqual(offer);
    });

    it('returns null when not eligible to sync', async () => {
      const result = await fetchContinuationOffer(
        'book-abc',
        'device-test',
        'pdf',
        location,
        true,
        localBook,
      );

      expect(mockGetContinuationOffer).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
