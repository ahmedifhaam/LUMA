/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUD_ENABLED?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_DRIVE_MOCK?: string;
  readonly VITE_GOOGLE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
