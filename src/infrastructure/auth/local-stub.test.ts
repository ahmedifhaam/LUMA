import { describe, expect, it } from 'vitest';
import { LocalAuthStub } from './local-stub';

describe('LocalAuthStub', () => {
  const auth = new LocalAuthStub();

  it('returns null session', async () => {
    await expect(auth.getSession()).resolves.toBeNull();
  });

  it('rejects signIn with cloud disabled message', async () => {
    await expect(auth.signIn('user', 'pass')).rejects.toThrow('Cloud features are not enabled');
  });

  it('signOut is a no-op', async () => {
    await expect(auth.signOut()).resolves.toBeUndefined();
  });

  it('onSessionChange returns an unsubscribe no-op', () => {
    const cb = () => {};
    const unsubscribe = auth.onSessionChange(cb);
    expect(() => unsubscribe()).not.toThrow();
  });
});
