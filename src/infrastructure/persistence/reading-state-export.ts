import type { DocumentLocation } from '@/domain/document/types';
import { getDeviceId } from '@/infrastructure/device/device-id';
import { createReadingState } from '@/infrastructure/persistence/reading-state-id';
import { readingStateRepository } from './repositories';

export interface ReadingStateExport {
  version: number;
  deviceId: string;
  exportedAt: number;
  states: Array<{
    bookId: string;
    location: DocumentLocation;
    progress: number;
    lastOpenedAt: number;
    updatedAt: number;
  }>;
}

export async function exportDeviceReadingState(
  deviceId = getDeviceId(),
): Promise<ReadingStateExport> {
  const states = await readingStateRepository.listForDevice(deviceId);
  return {
    version: 2,
    deviceId,
    exportedAt: Date.now(),
    states: states.map((state) => ({
      bookId: state.bookId,
      location: state.location,
      progress: state.progress,
      lastOpenedAt: state.lastOpenedAt,
      updatedAt: state.updatedAt,
    })),
  };
}

export async function importDeviceReadingState(
  payload: ReadingStateExport,
  deviceId = getDeviceId(),
): Promise<void> {
  for (const entry of payload.states) {
    await readingStateRepository.save(
      createReadingState(entry.bookId, deviceId, {
        location: entry.location,
        progress: entry.progress,
        lastOpenedAt: entry.lastOpenedAt,
        updatedAt: entry.updatedAt,
      }),
    );
  }
}
