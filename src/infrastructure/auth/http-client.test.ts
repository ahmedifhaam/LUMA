import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HttpAuthService } from './http-client';

vi.mock('@/config/api', () => ({
  apiBaseUrl: () => 'http://localhost:3000',
  authHeaders: (token: string | null) =>
    token ? { Authorization: `Bearer ${token}` } : {},
}));

describe('HttpAuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('notifies listeners when /auth/me fails (expired session)', async () => {
    localStorage.setItem('luma-auth-token', 'expired');
    const listener = vi.fn();
    const auth = new HttpAuthService();
    auth.onSessionChange(listener);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );

    await expect(auth.getSession()).resolves.toBeNull();
    expect(localStorage.getItem('luma-auth-token')).toBeNull();
    expect(listener).toHaveBeenCalledWith(null);
  });
});
