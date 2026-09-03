export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleMockEnabled(): boolean {
  return process.env.GOOGLE_MOCK === 'true' || process.env.DRIVE_MOCK === 'true';
}

export function googleClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error('GOOGLE_CLIENT_ID is not configured');
  return id;
}

export function googleClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error('GOOGLE_CLIENT_SECRET is not configured');
  return secret;
}

export function googleRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/auth/google/callback'
  );
}

export function frontendOrigin(): string {
  return process.env.FRONTEND_ORIGIN ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173';
}

/** Narrowest scope for Picker-selected files only. */
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
