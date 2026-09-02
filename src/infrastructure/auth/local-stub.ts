import type { AuthService, AuthSession } from './types';

const CLOUD_DISABLED_MESSAGE = 'Cloud features are not enabled';

export class LocalAuthStub implements AuthService {
  async getSession(): Promise<AuthSession> {
    return null;
  }

  async signIn(_username: string, _password: string): Promise<AuthSession> {
    throw new Error(CLOUD_DISABLED_MESSAGE);
  }

  async signOut(): Promise<void> {
    // no-op when cloud is disabled
  }

  onSessionChange(_cb: (session: AuthSession) => void): () => void {
    return () => {};
  }
}
