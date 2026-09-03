import type { BookSourceKind } from '@/domain/book/source';
import type { Book } from '@/domain/book/types';

export interface RemoteBookSummary {
  remoteId: string;
  title: string;
  name?: string;
  mimeType?: string;
  contentVersion?: string;
}

export interface BookSourceStatus {
  connected: boolean;
  email?: string | null;
  /** True when using local/CI mock instead of real Google. */
  mock?: boolean;
  configured?: boolean;
}

/** Catalog and import connector for cloud-backed book sources (Phase 2). */
export interface BookSourceConnector {
  kind: BookSourceKind;
  getStatus(): Promise<BookSourceStatus>;
  /** Cloud connectors require authentication before becoming available. */
  isAvailable(): Promise<boolean>;
  /** Start provider OAuth / mock connect. May navigate away (returns redirect URL). */
  connect(): Promise<{ redirectUrl?: string }>;
  disconnect(): Promise<void>;
  listRemoteBooks(): Promise<RemoteBookSummary[]>;
  /**
   * Register a Picker-selected file id so it appears in listRemoteBooks
   * (required for drive.file scope).
   */
  registerRemoteBook?(remoteId: string): Promise<RemoteBookSummary>;
  /** Download remote bytes and import into the local library. */
  importFromRemote(remoteId: string): Promise<Book>;
  getContentVersion?(remoteId: string): Promise<string>;
}
