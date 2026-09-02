import { features } from '@/config/features';
import type { BookSourceConnector } from './types';

export function getBookSourceConnectors(): BookSourceConnector[] {
  if (!features.cloudEnabled) {
    return [];
  }
  // Future: register cloud connectors (Google Drive, LUMA cloud, etc.).
  return [];
}

export type { BookSourceConnector } from './types';
