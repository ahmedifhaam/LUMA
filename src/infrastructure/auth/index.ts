import { features } from '@/config/features';
import { LocalAuthStub } from './local-stub';
import type { AuthService } from './types';

function createAuthService(): AuthService {
  if (!features.cloudEnabled) {
    return new LocalAuthStub();
  }
  // Future: return remote auth implementation when cloud is enabled.
  return new LocalAuthStub();
}

export const authService: AuthService = createAuthService();

export type { AuthService, AuthSession, AuthUser } from './types';
