import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleDriveConnector } from './google-drive-connector';

const mockGetSession = vi.fn();
const mockImportBookFromBytes = vi.fn();

vi.mock('@/infrastructure/auth', () => ({
  authService: {
    getSession: () => mockGetSession(),
    signOut: vi.fn(),
  },
}));

vi.mock('@/config/features', () => ({
  features: { cloudEnabled: true, driveMock: true, googleClientId: '' },
}));

vi.mock('@/config/api', () => ({
  apiBaseUrl: () => 'http://localhost:3000',
  authHeaders: (token: string | null) =>
    token ? { Authorization: `Bearer ${token}` } : {},
}));

vi.mock('@/application/library/import-book-from-bytes', () => ({
  importBookFromBytes: (...args: unknown[]) => mockImportBookFromBytes(...args),
}));

describe('GoogleDriveConnector', () => {
  const connector = new GoogleDriveConnector();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', username: 'testuser' },
      token: 'tok',
    });
  });

  it('reports connected status from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            connected: true,
            email: 'mock-drive@example.com',
            mock: true,
            configured: true,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ files: [] }),
        }),
    );

    await expect(connector.getStatus()).resolves.toEqual({
      connected: true,
      email: 'mock-drive@example.com',
      mock: true,
      configured: true,
      degraded: false,
      reason: null,
    });
  });

  it('starts connect and returns redirect URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ url: 'http://localhost:5173/?googleDrive=connected&mock=1' }),
      }),
    );

    await expect(connector.connect()).resolves.toEqual({
      redirectUrl: 'http://localhost:5173/?googleDrive=connected&mock=1',
    });
  });

  it('imports remote bytes as a google-drive sourced book', async () => {
    const bytes = new ArrayBuffer(8);
    mockImportBookFromBytes.mockResolvedValue({
      book: {
        id: 'fp',
        title: 'Mock',
        source: 'google-drive',
        sourceRef: { remoteId: 'mock-drive-pdf-1' },
      },
      isDuplicate: false,
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'X-Luma-File-Name'
              ? 'Mock Drive Book.pdf'
              : name === 'X-Luma-Content-Version'
                ? 'mock-pdf-v1'
                : null,
        },
        arrayBuffer: async () => bytes,
      }),
    );

    const book = await connector.importFromRemote('mock-drive-pdf-1');
    expect(mockImportBookFromBytes).toHaveBeenCalledWith(
      bytes,
      'Mock Drive Book.pdf',
      {
        source: 'google-drive',
        sourceRef: {
          remoteId: 'mock-drive-pdf-1',
          fileName: 'Mock Drive Book.pdf',
          contentVersion: 'mock-pdf-v1',
        },
      },
    );
    expect(book.source).toBe('google-drive');
  });
});
