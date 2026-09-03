import { pool } from '../db.js';
import {
  googleClientId,
  googleClientSecret,
  googleMockEnabled,
  googleRedirectUri,
} from './config.js';

export interface GoogleTokenRow {
  account_id: string;
  access_token: string;
  refresh_token: string | null;
  expiry: Date;
  scope: string;
  connected_email: string | null;
}

export async function getGoogleTokens(accountId: string): Promise<GoogleTokenRow | null> {
  const result = await pool.query<GoogleTokenRow>(
    `SELECT account_id, access_token, refresh_token, expiry, scope, connected_email
     FROM google_tokens WHERE account_id = $1`,
    [accountId],
  );
  return result.rows[0] ?? null;
}

export async function upsertGoogleTokens(
  accountId: string,
  tokens: {
    accessToken: string;
    refreshToken: string | null;
    expiresIn: number;
    scope: string;
    email?: string | null;
  },
): Promise<void> {
  const expiry = new Date(Date.now() + tokens.expiresIn * 1000);
  await pool.query(
    `INSERT INTO google_tokens (account_id, access_token, refresh_token, expiry, scope, connected_email, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (account_id) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, google_tokens.refresh_token),
       expiry = EXCLUDED.expiry,
       scope = EXCLUDED.scope,
       connected_email = COALESCE(EXCLUDED.connected_email, google_tokens.connected_email),
       updated_at = NOW()`,
    [
      accountId,
      tokens.accessToken,
      tokens.refreshToken,
      expiry,
      tokens.scope,
      tokens.email ?? null,
    ],
  );
}

export async function deleteGoogleTokens(accountId: string): Promise<void> {
  await pool.query(`DELETE FROM google_tokens WHERE account_id = $1`, [accountId]);
  await pool.query(`DELETE FROM drive_file_grants WHERE account_id = $1`, [accountId]);
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  if (googleMockEnabled()) {
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      scope: 'https://www.googleapis.com/auth/drive.file',
      token_type: 'Bearer',
    };
  }

  const body = new URLSearchParams({
    code,
    client_id: googleClientId(),
    client_secret: googleClientSecret(),
    redirect_uri: googleRedirectUri(),
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token exchange failed: ${response.status} ${text}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  if (googleMockEnabled()) {
    return {
      access_token: 'mock-access-token-refreshed',
      expires_in: 3600,
      scope: 'https://www.googleapis.com/auth/drive.file',
      token_type: 'Bearer',
    };
  }

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: googleClientId(),
    client_secret: googleClientSecret(),
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token refresh failed: ${response.status} ${text}`);
  }

  return (await response.json()) as TokenResponse;
}

/** Returns a valid access token, refreshing when needed. */
export async function getValidAccessToken(accountId: string): Promise<string | null> {
  if (googleMockEnabled()) {
    const row = await getGoogleTokens(accountId);
    return row ? 'mock-access-token' : null;
  }

  const row = await getGoogleTokens(accountId);
  if (!row) return null;

  if (row.expiry.getTime() > Date.now() + 60_000) {
    return row.access_token;
  }

  if (!row.refresh_token) {
    return null;
  }

  const refreshed = await refreshAccessToken(row.refresh_token);
  await upsertGoogleTokens(accountId, {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? row.refresh_token,
    expiresIn: refreshed.expires_in,
    scope: refreshed.scope ?? row.scope,
  });
  return refreshed.access_token;
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string | null> {
  if (googleMockEnabled()) return 'mock-drive@example.com';

  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { email?: string };
  return data.email ?? null;
}
