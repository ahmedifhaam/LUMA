import { useEffect, useState } from 'react';
import { useAuthStore } from '@/application/auth/auth-store';

export function AuthPanel() {
  const enabled = useAuthStore((s) => s.enabled);
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const initialize = useAuthStore((s) => s.initialize);
  const signIn = useAuthStore((s) => s.signIn);
  const signOut = useAuthStore((s) => s.signOut);

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!enabled) return null;

  if (session) {
    return (
      <div className="auth-panel" data-testid="auth-panel">
        <span className="auth-panel__user" data-testid="auth-user-label">
          {session.user.username}
        </span>
        <button
          type="button"
          className="auth-panel__button"
          data-testid="auth-sign-out"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-panel" data-testid="auth-panel">
      {!open ? (
        <button
          type="button"
          className="auth-panel__button auth-panel__button--primary"
          data-testid="auth-sign-in-button"
          onClick={() => setOpen(true)}
        >
          Sign in
        </button>
      ) : (
        <form
          className="auth-panel__form"
          data-testid="auth-sign-in-form"
          onSubmit={(event) => {
            event.preventDefault();
            void signIn(username, password).then(() => setOpen(false));
          }}
        >
          <input
            className="auth-panel__input"
            data-testid="auth-username"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
          <input
            className="auth-panel__input"
            data-testid="auth-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          <button
            type="submit"
            className="auth-panel__button auth-panel__button--primary"
            data-testid="auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Continue'}
          </button>
          <button
            type="button"
            className="auth-panel__button"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </form>
      )}
      {error ? (
        <p className="auth-panel__error" data-testid="auth-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
