import { useEffect, useRef, useState } from 'react';
import { features } from '@/config/features';
import { useAuthStore } from '@/application/auth/auth-store';
import { useDriveStore } from '@/application/library/drive-store';
import { AuthModal } from '@/features/auth/AuthModal';
import { CLOUD_PROMO, HOW_TO_TIPS } from './app-menu-sections';

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden focusable="false">
      <circle cx="8" cy="3" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="13" r="1.25" fill="currentColor" />
    </svg>
  );
}

interface AppMenuProps {
  onOpenShortcuts: () => void;
}

export function AppMenu({ onOpenShortcuts }: AppMenuProps) {
  const cloudEnabled = features.cloudEnabled;
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const initialize = useAuthStore((s) => s.initialize);

  const driveStatus = useDriveStore((s) => s.status);
  const driveLoading = useDriveStore((s) => s.loading);
  const refreshDriveStatus = useDriveStore((s) => s.refreshStatus);
  const connectDrive = useDriveStore((s) => s.connect);
  const disconnectDrive = useDriveStore((s) => s.disconnect);

  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cloudNotice, setCloudNotice] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!cloudEnabled || !session) return;
    void refreshDriveStatus();
  }, [cloudEnabled, session, refreshDriveStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const driveResult = params.get('googleDrive');
    if (!driveResult) return;
    void refreshDriveStatus();
    params.delete('googleDrive');
    params.delete('mock');
    params.delete('reason');
    const next = params.toString();
    const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', url);
  }, [refreshDriveStatus]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setDrawerMode(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    setCloudNotice(null);
  }

  function openSignIn() {
    closeMenu();
    setAuthOpen(true);
  }

  function handleShortcuts() {
    closeMenu();
    onOpenShortcuts();
  }

  async function handleConnectDrive() {
    try {
      await connectDrive();
      closeMenu();
    } catch {
      // Error surfaced via drive store
    }
  }

  async function handleDisconnectDrive() {
    try {
      await disconnectDrive();
    } catch {
      // Error surfaced via drive store
    }
  }

  return (
    <div className="app-menu" ref={rootRef}>
      <button
        type="button"
        className={`btn btn--icon app-menu__trigger${menuOpen ? ' btn--active' : ''}`}
        data-testid="app-menu-trigger"
        aria-label="App menu"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <MenuIcon />
      </button>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="app-menu__backdrop"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <div
            className={`app-menu__panel${drawerMode ? ' app-menu__panel--drawer' : ' app-menu__panel--popover'}`}
            data-testid="app-menu-panel"
            role="menu"
          >
            {drawerMode ? (
              <div className="app-menu__head">
                <span className="app-menu__title">Menu</span>
                <button
                  type="button"
                  className="btn btn--icon"
                  data-testid="app-menu-close"
                  aria-label="Close menu"
                  onClick={closeMenu}
                >
                  ×
                </button>
              </div>
            ) : null}

            <div className="app-menu__body">
              {cloudEnabled ? (
                <section className="app-menu__section" data-testid="app-menu-account">
                  <h3 className="app-menu__section-label">Account</h3>
                  {session ? (
                    <p className="app-menu__account">
                      Signed in as{' '}
                      <span data-testid="auth-user-label">{session.user.username}</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="app-menu__item"
                      role="menuitem"
                      data-testid="app-menu-sign-in"
                      onClick={openSignIn}
                    >
                      Sign in to LUMA Cloud
                    </button>
                  )}
                </section>
              ) : null}

              {cloudEnabled && session ? (
                <>
                  <div className="app-menu__divider" />
                  <section className="app-menu__section" data-testid="app-menu-drive">
                    <h3 className="app-menu__section-label">Google Drive</h3>
                    {driveStatus?.connected ? (
                      <>
                        <p className="app-menu__account" data-testid="drive-connected-label">
                          {driveStatus.degraded ? 'Degraded' : 'Connected'}
                          {driveStatus.email ? ` as ${driveStatus.email}` : ''}
                          {driveStatus.mock ? ' (mock)' : ''}
                        </p>
                        {driveStatus.degraded && driveStatus.reason ? (
                          <p className="app-menu__notice" data-testid="drive-degraded-reason">
                            {driveStatus.reason}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className="app-menu__item"
                          role="menuitem"
                          data-testid="app-menu-drive-disconnect"
                          disabled={driveLoading}
                          onClick={() => void handleDisconnectDrive()}
                        >
                          Disconnect Google Drive
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="app-menu__item"
                        role="menuitem"
                        data-testid="app-menu-drive-connect"
                        disabled={driveLoading || driveStatus?.configured === false}
                        onClick={() => void handleConnectDrive()}
                      >
                        {driveLoading ? 'Connecting…' : 'Connect Google Drive'}
                      </button>
                    )}
                  </section>
                </>
              ) : null}

              {cloudEnabled ? (
                <>
                  <div className="app-menu__divider" />
                  <section className="app-menu__section">
                    <h3 className="app-menu__section-label">{CLOUD_PROMO.title}</h3>
                    <div className="app-menu__cloud-card">
                      <div className="app-menu__cloud-headline">
                        <strong>{CLOUD_PROMO.headline}</strong>
                        <span className="app-menu__cloud-badge">{CLOUD_PROMO.badge}</span>
                      </div>
                      <p className="app-menu__cloud-body">{CLOUD_PROMO.body}</p>
                      <button
                        type="button"
                        className="btn btn--primary btn--small"
                        data-testid="app-menu-cloud-upgrade"
                        onClick={() =>
                          setCloudNotice('LUMA Cloud upgrades are coming soon.')
                        }
                      >
                        {CLOUD_PROMO.cta}
                      </button>
                      {cloudNotice ? (
                        <p className="app-menu__notice">{cloudNotice}</p>
                      ) : null}
                    </div>
                  </section>
                </>
              ) : null}

              <div className="app-menu__divider" />
              <section className="app-menu__section" data-testid="app-menu-how-to">
                <h3 className="app-menu__section-label">How to use</h3>
                <ul className="app-menu__tips">
                  {HOW_TO_TIPS.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>

              <div className="app-menu__divider" />
              <button
                type="button"
                className="app-menu__item"
                role="menuitem"
                data-testid="open-shortcuts"
                onClick={handleShortcuts}
              >
                Keyboard shortcuts →
              </button>

              {cloudEnabled && session ? (
                <>
                  <div className="app-menu__divider" />
                  <button
                    type="button"
                    className="app-menu__item app-menu__item--destructive"
                    role="menuitem"
                    data-testid="auth-sign-out"
                    onClick={() => {
                      void signOut();
                      closeMenu();
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {cloudEnabled ? (
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      ) : null}
    </div>
  );
}
