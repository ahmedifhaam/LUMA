export const features = {
  /** Cloud book sources, auth, and sync (Phase 2). Off by default. */
  cloudEnabled: import.meta.env.VITE_CLOUD_ENABLED === 'true',
  /**
   * Use mock Google Drive connect/list/import (CI and local without OAuth).
   * Pair with API `GOOGLE_MOCK=true`.
   */
  driveMock: import.meta.env.VITE_DRIVE_MOCK === 'true',
  /** Public OAuth client id for Google Picker (never a client secret). */
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
} as const;
