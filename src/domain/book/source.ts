/** Where a book's bytes are stored. Only `local` is implemented in Phase 1.5. */
export type BookSourceKind =
  | 'local'
  | 'luma-cloud'
  | 'google-drive'
  | 'app-storage'
  | 'plugin';

export interface BookSourceRef {
  /** Original import filename for local sources. */
  fileName?: string;
  /** Remote object id for cloud or app-managed storage. */
  remoteId?: string;
  /** Connector id when {@link BookSourceKind} is `plugin`. */
  pluginId?: string;
}

export const BOOK_SOURCE_LABELS: Record<BookSourceKind, string> = {
  local: 'This device',
  'luma-cloud': 'LUMA Cloud',
  'google-drive': 'Google Drive',
  'app-storage': 'App storage',
  plugin: 'Connected source',
};

export const BOOK_SOURCE_ICONS: Record<BookSourceKind, string> = {
  local: '⬤',
  'luma-cloud': '☁',
  'google-drive': '▲',
  'app-storage': '▣',
  plugin: '⎔',
};

export function defaultLocalSourceRef(fileName: string): BookSourceRef {
  return { fileName };
}

export function normalizeBookSource(
  book: { source?: BookSourceKind; sourceRef?: BookSourceRef; sourceName: string },
): { source: BookSourceKind; sourceRef: BookSourceRef } {
  const source = book.source ?? 'local';
  const sourceRef = book.sourceRef ?? defaultLocalSourceRef(book.sourceName);
  return { source, sourceRef };
}
