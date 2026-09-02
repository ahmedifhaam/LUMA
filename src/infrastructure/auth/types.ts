export interface AuthUser {
  id: string;
  username: string;
}

export type AuthSession = { user: AuthUser; token: string } | null;

export interface AuthService {
  getSession(): Promise<AuthSession>;
  signIn(username: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  onSessionChange(cb: (session: AuthSession) => void): () => void;
}
