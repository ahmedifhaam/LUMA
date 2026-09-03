import { apiBaseUrl, authHeaders } from '@/config/api';
import { features } from '@/config/features';
import type { Book } from '@/domain/book/types';
import { authService } from '@/infrastructure/auth';
import { importBookFromBytes } from '@/application/library/import-book-from-bytes';
import type {
  BookSourceConnector,
  BookSourceStatus,
  RemoteBookSummary,
} from './types';

function driveMockEnabled(): boolean {
  return (
    features.driveMock ||
    import.meta.env.VITE_DRIVE_MOCK === 'true' ||
    import.meta.env.VITE_GOOGLE_MOCK === 'true'
  );
}

async function authToken(): Promise<string> {
  const session = await authService.getSession();
  if (!session?.token) {
    throw new Error('Sign in to LUMA Cloud before connecting Google Drive');
  }
  return session.token;
}

export class GoogleDriveConnector implements BookSourceConnector {
  readonly kind = 'google-drive' as const;

  async getStatus(): Promise<BookSourceStatus> {
    const token = await authToken().catch(() => null);
    if (!token) return { connected: false, configured: true, mock: driveMockEnabled() };

    const response = await fetch(`${apiBaseUrl()}/auth/google/status`, {
      headers: authHeaders(token),
    });
    if (response.status === 401) {
      await authService.signOut();
      return { connected: false, configured: true, mock: driveMockEnabled() };
    }
    if (!response.ok) {
      return {
        connected: false,
        configured: true,
        mock: driveMockEnabled(),
        degraded: true,
        reason: 'Unable to reach Google Drive status',
      };
    }
    const status = (await response.json()) as BookSourceStatus;
    if (!status.connected) return status;

    // Probe list endpoint — connected but failing calls → degraded.
    const list = await fetch(`${apiBaseUrl()}/drive/files`, {
      headers: authHeaders(token),
    });
    if (list.status === 401) {
      await authService.signOut();
      return { connected: false, configured: true, mock: driveMockEnabled() };
    }
    if (!list.ok) {
      return {
        ...status,
        degraded: true,
        reason: 'Google Drive is temporarily unavailable. Local copies remain readable.',
      };
    }
    return { ...status, degraded: false, reason: null };
  }

  async isAvailable(): Promise<boolean> {
    const status = await this.getStatus();
    return status.connected;
  }

  async connect(): Promise<{ redirectUrl?: string }> {
    const token = await authToken();
    const response = await fetch(`${apiBaseUrl()}/auth/google/start`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Failed to start Google Drive connect');
    }
    const data = (await response.json()) as { url: string; mock?: boolean };
    return { redirectUrl: data.url };
  }

  async disconnect(): Promise<void> {
    const token = await authToken();
    await fetch(`${apiBaseUrl()}/auth/google/disconnect`, {
      method: 'POST',
      headers: authHeaders(token),
    });
  }

  async listRemoteBooks(): Promise<RemoteBookSummary[]> {
    const token = await authToken();
    const response = await fetch(`${apiBaseUrl()}/drive/files`, {
      headers: authHeaders(token),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Failed to list Drive books');
    }
    const data = (await response.json()) as { files: RemoteBookSummary[] };
    return data.files;
  }

  async registerRemoteBook(remoteId: string): Promise<RemoteBookSummary> {
    const token = await authToken();
    const response = await fetch(`${apiBaseUrl()}/drive/files/register`, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId: remoteId }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Failed to register Drive file');
    }
    return (await response.json()) as RemoteBookSummary;
  }

  async importFromRemote(remoteId: string): Promise<Book> {
    const token = await authToken();
    const response = await fetch(
      `${apiBaseUrl()}/drive/files/${encodeURIComponent(remoteId)}/content`,
      { headers: authHeaders(token) },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Failed to download Drive file');
    }

    const fileName =
      response.headers.get('X-Luma-File-Name') ??
      `${remoteId}.pdf`;
    const contentVersion =
      response.headers.get('X-Luma-Content-Version') ?? undefined;
    const bytes = await response.arrayBuffer();

    const result = await importBookFromBytes(bytes, fileName, {
      source: 'google-drive',
      sourceRef: {
        remoteId,
        fileName,
        contentVersion,
      },
    });
    return result.book;
  }

  async getContentVersion(remoteId: string): Promise<string> {
    const token = await authToken();
    const response = await fetch(
      `${apiBaseUrl()}/drive/files/${encodeURIComponent(remoteId)}/version`,
      { headers: authHeaders(token) },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Failed to read Drive content version');
    }
    const data = (await response.json()) as { contentVersion: string };
    return data.contentVersion;
  }
}
