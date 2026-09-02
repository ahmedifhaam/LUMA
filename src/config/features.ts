export const features = {
  /** Cloud book sources, auth, and sync (Phase 2). Off by default. */
  cloudEnabled: import.meta.env.VITE_CLOUD_ENABLED === 'true',
} as const;
