import { apiBaseUrl, authHeaders } from '@/config/api';
import type { AuthService, AuthSession } from './types';

const TOKEN_KEY = 'luma-auth-token';

type SessionListener = (session: AuthSession) => void;

export class HttpAuthService implements AuthService {
  private listeners = new Set<SessionListener>();

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private storeToken(token: string | null): void {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  private notify(session: AuthSession): void {
    for (const listener of this.listeners) listener(session);
  }

  async getSession(): Promise<AuthSession> {
    const token = this.readToken();
    if (!token) return null;

    const response = await fetch(`${apiBaseUrl()}/auth/me`, {
      headers: authHeaders(token),
    });

    if (!response.ok) {
      this.storeToken(null);
      this.notify(null);
      return null;
    }

    const data = (await response.json()) as { user: { id: string; username: string } };
    return { user: data.user, token };
  }

  async signIn(username: string, password: string): Promise<AuthSession> {
    const response = await fetch(`${apiBaseUrl()}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Sign in failed');
    }

    const session = (await response.json()) as NonNullable<AuthSession>;
    this.storeToken(session.token);
    this.notify(session);
    return session;
  }

  async signOut(): Promise<void> {
    const token = this.readToken();
    if (token) {
      await fetch(`${apiBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: authHeaders(token),
      }).catch(() => undefined);
    }
    this.storeToken(null);
    this.notify(null);
  }

  onSessionChange(cb: (session: AuthSession) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Clear local session without calling logout (e.g. expired token on sync 401). */
  clearSessionLocally(): void {
    this.storeToken(null);
    this.notify(null);
  }
}
