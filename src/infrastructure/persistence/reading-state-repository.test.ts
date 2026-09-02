import { beforeEach, describe, expect, it } from 'vitest';
import { createReadingState, readingStateId } from '@/infrastructure/persistence/reading-state-id';
import { closeDatabase } from '@/infrastructure/persistence/db';
import { readingStateRepository } from '@/infrastructure/persistence/repositories';
import {
  resetDeviceIdForTests,
  setDeviceIdForTests,
} from '@/infrastructure/device/device-id';
import {
  exportDeviceReadingState,
  importDeviceReadingState,
} from '@/infrastructure/persistence/reading-state-export';
import { useIsolatedTestDatabase } from '@/tests/isolated-db';

async function resetTestDatabase(): Promise<void> {
  useIsolatedTestDatabase();
  await closeDatabase();
}

describe('readingStateRepository', () => {
  beforeEach(async () => {
    await resetTestDatabase();
    resetDeviceIdForTests();
  });

  it('stores independent state per device for the same book', async () => {
    setDeviceIdForTests('device-home');
    await readingStateRepository.save(
      createReadingState('book-1', 'device-home', {
        location: { pageNumber: 3, yOffset: 0 },
        progress: 0.25,
        lastOpenedAt: 100,
      }),
    );

    setDeviceIdForTests('device-work');
    await readingStateRepository.save(
      createReadingState('book-1', 'device-work', {
        location: { pageNumber: 10, yOffset: 0 },
        progress: 0.8,
        lastOpenedAt: 200,
      }),
    );

    const home = await readingStateRepository.get('book-1', 'device-home');
    const work = await readingStateRepository.get('book-1', 'device-work');

    expect(home?.location.pageNumber).toBe(3);
    expect(work?.location.pageNumber).toBe(10);
    expect(readingStateId('book-1', 'device-home')).toBe('book-1::device-home');
  });

  it('lists only the current device states by default', async () => {
    setDeviceIdForTests('device-a');
    await readingStateRepository.save(
      createReadingState('book-a', 'device-a', {
        location: { pageNumber: 1, yOffset: 0 },
        progress: 0.1,
      }),
    );
    await readingStateRepository.save(
      createReadingState('book-b', 'device-b', {
        location: { pageNumber: 5, yOffset: 0 },
        progress: 0.5,
      }),
    );

    const forA = await readingStateRepository.listForDevice('device-a');
    expect(forA).toHaveLength(1);
    expect(forA[0]?.bookId).toBe('book-a');
  });

  it('exports and imports device reading state backup', async () => {
    setDeviceIdForTests('device-export');
    await readingStateRepository.save(
      createReadingState('book-1', 'device-export', {
        location: { pageNumber: 2, yOffset: 0.1 },
        progress: 0.2,
        lastOpenedAt: 50,
        updatedAt: 60,
      }),
    );

    const exported = await exportDeviceReadingState('device-export');
    await resetTestDatabase();
    resetDeviceIdForTests();
    setDeviceIdForTests('device-import');

    await importDeviceReadingState(exported, 'device-import');
    const restored = await readingStateRepository.get('book-1', 'device-import');
    expect(restored?.location).toEqual({ pageNumber: 2, yOffset: 0.1 });
    expect(restored?.progress).toBe(0.2);
  });
});
