import { beforeEach, describe, expect, it } from 'vitest';
import type { Book } from '@/domain/book/types';
import { closeDatabase } from '@/infrastructure/persistence/db';
import { sourceRepository } from '@/infrastructure/persistence/repositories';
import { useIsolatedTestDatabase } from '@/tests/isolated-db';
import { resolveBookBytes } from './registry';

async function resetTestDatabase(): Promise<void> {
  useIsolatedTestDatabase();
  await closeDatabase();
}

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    title: 'Test Book',
    author: null,
    pageCount: 10,
    byteLength: 100,
    hasText: true,
    format: 'pdf',
    sourceName: 'test.pdf',
    source: 'local',
    sourceRef: { fileName: 'test.pdf' },
    createdAt: 1,
    lastOpenedAt: null,
    coverThumbnail: null,
    ...overrides,
  };
}

describe('resolveBookBytes', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it('returns bytes from the local adapter', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    await sourceRepository.save({ bookId: 'book-1', bytes });

    const result = await resolveBookBytes(makeBook());
    expect(new Uint8Array(result)).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('throws when the local copy is missing', async () => {
    await expect(resolveBookBytes(makeBook())).rejects.toThrow(
      'This book has no locally stored copy. Re-import the file.',
    );
  });

  it('resolves cached bytes for google-drive books', async () => {
    const bytes = new Uint8Array([9, 8, 7]).buffer;
    await sourceRepository.save({ bookId: 'book-1', bytes });

    const result = await resolveBookBytes(
      makeBook({
        source: 'google-drive',
        sourceRef: { remoteId: 'drive-1', fileName: 'test.pdf', contentVersion: 'v1' },
      }),
    );
    expect(new Uint8Array(result)).toEqual(new Uint8Array([9, 8, 7]));
  });

  it('throws for unsupported book sources', async () => {
    await expect(
      resolveBookBytes(makeBook({ source: 'plugin', sourceRef: { pluginId: 'x' } })),
    ).rejects.toThrow('Unsupported book source: plugin');
  });
});
