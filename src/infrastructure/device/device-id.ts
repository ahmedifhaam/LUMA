const DEVICE_ID_KEY = 'luma-device-id';
const DEVICE_NAME_KEY = 'luma-device-name';

const DEFAULT_DEVICE_NAME = 'LUMA Reader';

/** Stable id for this browser installation, used for per-device reading state. */
export function getDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

/** @internal Test helper */
export function setDeviceIdForTests(deviceId: string): void {
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
}

/** @internal Test helper */
export function resetDeviceIdForTests(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
}

/** Human-readable name for this device, shown in continuation offers. */
export function getDeviceDisplayName(): string {
  return localStorage.getItem(DEVICE_NAME_KEY) ?? DEFAULT_DEVICE_NAME;
}

/** @internal Test helper */
export function setDeviceDisplayName(name: string): void {
  localStorage.setItem(DEVICE_NAME_KEY, name);
}
