import type { BookSourceKind } from '@/domain/book/source';
import type { Book } from '@/domain/book/types';

/** Catalog and import connector for cloud-backed book sources (Phase 2). */
export interface BookSourceConnector {
  kind: BookSourceKind;
  /** Cloud connectors require authentication before becoming available. */
  isAvailable(): Promise<boolean>;
  listRemoteBooks?(): Promise<Array<{ remoteId: string; title: string }>>;
  importFromRemote(remoteId: string): Promise<Book>;
}
