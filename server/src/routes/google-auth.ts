import { Router } from 'express';
import jwt from 'jsonwebtoken';
import {
  GOOGLE_DRIVE_SCOPE,
  frontendOrigin,
  googleClientId,
  googleConfigured,
  googleMockEnabled,
  googleRedirectUri,
} from '../google/config.js';
import {
  deleteGoogleTokens,
  exchangeCodeForTokens,
  fetchGoogleUserEmail,
  getGoogleTokens,
  getValidAccessToken,
  upsertGoogleTokens,
} from '../google/tokens.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod';

export const googleAuthRouter = Router();

interface OAuthState {
  accountId: string;
  username: string;
  nonce: string;
}

googleAuthRouter.get('/status', requireAuth, async (req: AuthedRequest, res) => {
  const accountId = req.auth!.sub;
  if (googleMockEnabled()) {
    const row = await getGoogleTokens(accountId);
    res.json({
      connected: Boolean(row),
      email: row?.connected_email ?? null,
      mock: true,
      configured: true,
    });
    return;
  }

  if (!googleConfigured()) {
    res.json({ connected: false, email: null, mock: false, configured: false });
    return;
  }

  const row = await getGoogleTokens(accountId);
  res.json({
    connected: Boolean(row),
    email: row?.connected_email ?? null,
    mock: false,
    configured: true,
  });
});

googleAuthRouter.post('/start', requireAuth, async (req: AuthedRequest, res) => {
  const accountId = req.auth!.sub;
  const username = req.auth!.username;

  if (googleMockEnabled()) {
    await upsertGoogleTokens(accountId, {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      scope: GOOGLE_DRIVE_SCOPE,
      email: 'mock-drive@example.com',
    });
    res.json({
      url: `${frontendOrigin()}/?googleDrive=connected&mock=1`,
      mock: true,
    });
    return;
  }

  if (!googleConfigured()) {
    res.status(503).json({ error: 'Google Drive OAuth is not configured on the server' });
    return;
  }

  const state = jwt.sign(
    { accountId, username, nonce: crypto.randomUUID() } satisfies OAuthState,
    JWT_SECRET,
    { expiresIn: '10m' },
  );

  const params = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: GOOGLE_DRIVE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });

  res.json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    mock: false,
  });
});

googleAuthRouter.get('/callback', async (req, res) => {
  const origin = frontendOrigin();
  const error = typeof req.query.error === 'string' ? req.query.error : null;
  if (error) {
    res.redirect(`${origin}/?googleDrive=error&reason=${encodeURIComponent(error)}`);
    return;
  }

  const code = typeof req.query.code === 'string' ? req.query.code : null;
  const state = typeof req.query.state === 'string' ? req.query.state : null;
  if (!code || !state) {
    res.redirect(`${origin}/?googleDrive=error&reason=missing_code`);
    return;
  }

  try {
    const payload = jwt.verify(state, JWT_SECRET) as OAuthState;
    const tokens = await exchangeCodeForTokens(code);
    const email = await fetchGoogleUserEmail(tokens.access_token);
    await upsertGoogleTokens(payload.accountId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresIn: tokens.expires_in,
      scope: tokens.scope ?? GOOGLE_DRIVE_SCOPE,
      email,
    });
    res.redirect(`${origin}/?googleDrive=connected`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'callback_failed';
    res.redirect(`${origin}/?googleDrive=error&reason=${encodeURIComponent(message)}`);
  }
});

googleAuthRouter.post('/disconnect', requireAuth, async (req: AuthedRequest, res) => {
  await deleteGoogleTokens(req.auth!.sub);
  res.status(204).end();
});

/** Short-lived access token for Google Picker (never exposes client secret). */
googleAuthRouter.get('/picker-token', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const accessToken = await getValidAccessToken(req.auth!.sub);
    if (!accessToken) {
      res.status(401).json({ error: 'Google Drive is not connected' });
      return;
    }
    res.json({ accessToken });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to obtain Drive token',
    });
  }
});
