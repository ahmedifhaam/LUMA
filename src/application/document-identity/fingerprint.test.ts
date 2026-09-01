import { describe, expect, it } from 'vitest';
import { computeFingerprint } from './fingerprint';

function bytesOf(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

describe('computeFingerprint', () => {
  it('produces a stable lowercase hex SHA-256', async () => {
    // Known SHA-256 of the ASCII string "abc".
    const fingerprint = await computeFingerprint(bytesOf('abc'));
    expect(fingerprint).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('is identical for identical content', async () => {
    const a = await computeFingerprint(bytesOf('same content'));
    const b = await computeFingerprint(bytesOf('same content'));
    expect(a).toBe(b);
  });

  it('differs for different content', async () => {
    const a = await computeFingerprint(bytesOf('content one'));
    const b = await computeFingerprint(bytesOf('content two'));
    expect(a).not.toBe(b);
  });
});
