const DEVICE_ID_KEY = 'luma-device-id';

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
