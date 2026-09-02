import { features } from '@/config/features';
import { HttpAuthService } from './http-client';
import { LocalAuthStub } from './local-stub';
import type { AuthService } from './types';

function createAuthService(): AuthService {
  if (!features.cloudEnabled) {
    return new LocalAuthStub();
  }
  return new HttpAuthService();
}

export const authService: AuthService = createAuthService();

export type { AuthService, AuthSession, AuthUser } from './types';
