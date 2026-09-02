import { create } from 'zustand';
import { features } from '@/config/features';
import { authService, type AuthSession } from '@/infrastructure/auth';

interface AuthState {
  enabled: boolean;
  session: AuthSession;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  enabled: features.cloudEnabled,
  session: null,
  loading: false,
  error: null,

  async initialize() {
    if (!features.cloudEnabled) return;
    set({ loading: true, error: null });
    try {
      const session = await authService.getSession();
      set({ session, loading: false });
    } catch {
      set({ session: null, loading: false });
    }

    authService.onSessionChange((session) => set({ session }));
  },

  async signIn(username, password) {
    set({ loading: true, error: null });
    try {
      const session = await authService.signIn(username, password);
      set({ session, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      });
      throw error;
    }
  },

  async signOut() {
    await authService.signOut();
    set({ session: null, error: null });
  },
}));
