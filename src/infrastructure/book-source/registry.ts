import { features } from '@/config/features';
import { GoogleDriveConnector } from './google-drive-connector';
import type { BookSourceConnector } from './types';

export function getBookSourceConnectors(): BookSourceConnector[] {
  if (!features.cloudEnabled) {
    return [];
  }
  return [new GoogleDriveConnector()];
}

export function getGoogleDriveConnector(): GoogleDriveConnector | null {
  if (!features.cloudEnabled) return null;
  return new GoogleDriveConnector();
}

export type { BookSourceConnector, BookSourceStatus, RemoteBookSummary } from './types';
