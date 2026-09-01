/**
 * Content fingerprinting for document identity (Phase 1 brief section 4).
 *
 * The fingerprint is derived from document *content*, never from filename/path,
 * so the same book imported again is recognized and its reading state reused.
 */

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Compute the SHA-256 fingerprint of raw document bytes.
 *
 * Uses the platform SubtleCrypto digest, which hashes the buffer without
 * retaining additional full copies of the file in memory.
 */
export async function computeFingerprint(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(digest);
}
