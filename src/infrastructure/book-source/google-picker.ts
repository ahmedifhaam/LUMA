import { features } from '@/config/features';

declare global {
  interface Window {
    gapi?: {
      load: (name: string, cb: () => void) => void;
    };
    google?: {
      picker: {
        Action: { PICKED: string; CANCEL: string };
        DocsView: new () => {
          setIncludeFolders: (v: boolean) => unknown;
          setMimeTypes: (mime: string) => unknown;
        };
        PickerBuilder: new () => {
          addView: (view: unknown) => GooglePickerBuilder;
          setOAuthToken: (token: string) => GooglePickerBuilder;
          setDeveloperKey: (key: string) => GooglePickerBuilder;
          setAppId: (id: string) => GooglePickerBuilder;
          setCallback: (cb: (data: GooglePickerResponse) => void) => GooglePickerBuilder;
          build: () => { setVisible: (v: boolean) => void };
        };
        ViewId?: { DOCS: string };
      };
    };
  }
}

interface GooglePickerBuilder {
  addView: (view: unknown) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setAppId: (id: string) => GooglePickerBuilder;
  setCallback: (cb: (data: GooglePickerResponse) => void) => GooglePickerBuilder;
  build: () => { setVisible: (v: boolean) => void };
}

interface GooglePickerDocument {
  id: string;
  name: string;
  mimeType: string;
}

interface GooglePickerResponse {
  action: string;
  docs?: GooglePickerDocument[];
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensurePickerApi(): Promise<void> {
  await loadScript('https://apis.google.com/js/api.js');
  await new Promise<void>((resolve, reject) => {
    if (!window.gapi) {
      reject(new Error('Google API failed to load'));
      return;
    }
    window.gapi.load('picker', () => resolve());
  });
}

/**
 * Opens the Google Picker for PDF/EPUB under drive.file.
 * Returns selected file ids (empty if cancelled).
 *
 * Note: Google Picker traditionally wants an API key (`setDeveloperKey`).
 * For MVP we open Picker with OAuth token + client id app; if Picker requires
 * a developer key in your GCP project, add `VITE_GOOGLE_API_KEY` later.
 */
export async function openGoogleDrivePicker(accessToken: string): Promise<
  Array<{ id: string; name: string; mimeType: string }>
> {
  if (features.driveMock) {
    throw new Error('Use mock Drive picker UI when VITE_DRIVE_MOCK=true');
  }
  if (!features.googleClientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not configured');
  }

  await ensurePickerApi();
  const pickerNs = window.google?.picker;
  if (!pickerNs) {
    throw new Error('Google Picker API unavailable');
  }

  return new Promise((resolve) => {
    const view = new pickerNs.DocsView();
    view.setIncludeFolders(true);
    view.setMimeTypes('application/pdf,application/epub+zip');

    const builder = new pickerNs.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setCallback((data) => {
        if (data.action === pickerNs.Action.PICKED) {
          resolve(
            (data.docs ?? []).map((doc) => ({
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
            })),
          );
          return;
        }
        if (data.action === pickerNs.Action.CANCEL) {
          resolve([]);
        }
      });

    // App id is the numeric prefix of the OAuth client id.
    const appId = features.googleClientId.split('-')[0];
    if (appId) builder.setAppId(appId);

    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (apiKey) builder.setDeveloperKey(apiKey);

    builder.build().setVisible(true);
  });
}
