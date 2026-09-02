import { useEffect, useId, useRef } from 'react';
import { useAuthStore } from '@/application/auth/auth-store';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div className="auth-modal" data-testid="auth-modal">
      <button
        type="button"
        className="auth-modal__backdrop"
        aria-label="Close sign in dialog"
        onClick={() => {
          if (!loading) onClose();
        }}
      />
      <div
        className="auth-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="auth-modal__header">
          <div>
            <h2 className="auth-modal__title" id={titleId}>
              Sign in to LUMA Cloud
            </h2>
            <p className="auth-modal__subtitle">
              Sync reading progress across your devices.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--icon"
            aria-label="Close"
            disabled={loading}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form
          className="auth-modal__form"
          data-testid="auth-sign-in-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const username = String(data.get('username') ?? '');
            const password = String(data.get('password') ?? '');
            void signIn(username, password).then(() => onClose());
          }}
        >
          <label className="auth-modal__field">
            <span className="auth-modal__label">Username</span>
            <input
              ref={firstFieldRef}
              className="auth-modal__input"
              data-testid="auth-username"
              name="username"
              autoComplete="username"
              required
            />
          </label>
          <label className="auth-modal__field">
            <span className="auth-modal__label">Password</span>
            <input
              className="auth-modal__input"
              data-testid="auth-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error ? (
            <p className="auth-modal__error" data-testid="auth-error">
              {error}
            </p>
          ) : null}
          <div className="auth-modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={loading}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              data-testid="auth-submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
