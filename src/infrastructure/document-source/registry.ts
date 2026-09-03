import { normalizeBookSource } from '@/domain/book/source';
import type { Book } from '@/domain/book/types';
import { createCachedBytesAdapter } from './cached-bytes-adapter';
import type { DocumentSourceAdapter } from './types';

const adapters: Partial<Record<string, DocumentSourceAdapter>> = {
  local: createCachedBytesAdapter('local'),
  'google-drive': createCachedBytesAdapter('google-drive'),
  'luma-cloud': createCachedBytesAdapter('luma-cloud'),
  'app-storage': createCachedBytesAdapter('app-storage'),
};

export async function resolveBookBytes(book: Book): Promise<ArrayBuffer> {
  const { source } = normalizeBookSource(book);
  const adapter = adapters[source];
  if (!adapter) {
    throw new Error(`Unsupported book source: ${source}`);
  }
  return adapter.resolveBytes(book);
}
