import { create } from 'zustand';
import { apiBaseUrl, authHeaders } from '@/config/api';
import { features } from '@/config/features';
import { authService } from '@/infrastructure/auth';
import {
  getGoogleDriveConnector,
  type BookSourceStatus,
  type RemoteBookSummary,
} from '@/infrastructure/book-source/registry';
import { openGoogleDrivePicker } from '@/infrastructure/book-source/google-picker';
import { useLibraryStore } from '@/application/library/library-store';

interface DriveState {
  status: BookSourceStatus | null;
  files: RemoteBookSummary[];
  loading: boolean;
  error: string | null;
  pickerOpen: boolean;
  refreshStatus: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  openPickerAndImport: () => Promise<boolean>;
  importRemote: (remoteId: string) => Promise<void>;
  setPickerOpen: (open: boolean) => void;
  loadFiles: () => Promise<void>;
}

async function bearer(): Promise<string> {
  const session = await authService.getSession();
  if (!session?.token) throw new Error('Sign in required');
  return session.token;
}

/**
 * Fetches a short-lived access token for Google Picker.
 * In mock mode the API returns a placeholder; Picker is not used.
 */
async function fetchPickerAccessToken(): Promise<string> {
  const token = await bearer();
  // Re-use status endpoint path space: drive content uses stored refresh;
  // for Picker we expose a lightweight token endpoint.
  const response = await fetch(`${apiBaseUrl()}/auth/google/picker-token`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'Failed to get Drive access token for Picker');
  }
  const data = (await response.json()) as { accessToken: string };
  return data.accessToken;
}

export const useDriveStore = create<DriveState>((set, get) => ({
  status: null,
  files: [],
  loading: false,
  error: null,
  pickerOpen: false,

  setPickerOpen(open) {
    set({ pickerOpen: open });
  },

  async refreshStatus() {
    const connector = getGoogleDriveConnector();
    if (!connector) {
      set({ status: { connected: false, configured: false } });
      return;
    }
    try {
      const status = await connector.getStatus();
      set({ status, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  async connect() {
    const connector = getGoogleDriveConnector();
    if (!connector) throw new Error('Cloud features are disabled');
    set({ loading: true, error: null });
    try {
      const { redirectUrl } = await connector.connect();
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }
      await get().refreshStatus();
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },

  async disconnect() {
    const connector = getGoogleDriveConnector();
    if (!connector) return;
    set({ loading: true, error: null });
    try {
      await connector.disconnect();
      set({ status: { connected: false, configured: true, mock: features.driveMock }, files: [], loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },

  async loadFiles() {
    const connector = getGoogleDriveConnector();
    if (!connector) return;
    set({ loading: true, error: null });
    try {
      const files = await connector.listRemoteBooks();
      set({ files, loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
    }
  },

  async importRemote(remoteId) {
    const connector = getGoogleDriveConnector();
    if (!connector) throw new Error('Cloud features are disabled');
    set({ loading: true, error: null });
    try {
      await connector.importFromRemote(remoteId);
      await useLibraryStore.getState().loadLibrary();
      set({ loading: false, pickerOpen: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },

  async openPickerAndImport(): Promise<boolean> {
    const connector = getGoogleDriveConnector();
    if (!connector) throw new Error('Cloud features are disabled');

    if (features.driveMock) {
      await get().loadFiles();
      set({ pickerOpen: true });
      return false;
    }

    set({ loading: true, error: null });
    try {
      const accessToken = await fetchPickerAccessToken();
      const picked = await openGoogleDrivePicker(accessToken);
      if (picked.length === 0) {
        set({ loading: false });
        return false;
      }
      for (const doc of picked) {
        await connector.registerRemoteBook?.(doc.id);
        await connector.importFromRemote(doc.id);
      }
      await useLibraryStore.getState().loadLibrary();
      set({ loading: false });
      return true;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },
}));
