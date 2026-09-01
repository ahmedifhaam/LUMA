// Generates the PWA PNG icons without external image tooling.
// Draws a simple "page on a dark background" mark so the installable app has
// valid maskable icons. Regenerate with: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const BG = [11, 15, 25]; // #0b0f19
const PAGE = [229, 231, 235]; // #e5e7eb
const ACCENT = [99, 102, 241]; // #6366f1

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'latin1');
  const body = Buffer.concat([typeBuf, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function makePng(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  const margin = Math.round(size * 0.18);
  const accentH = Math.round(size * 0.16);
  let pos = 0;
  for (let y = 0; y < size; y += 1) {
    raw[pos] = 0; // filter type 0
    pos += 1;
    for (let x = 0; x < size; x += 1) {
      let color = BG;
      const inPage = x >= margin && x < size - margin && y >= margin && y < size - margin;
      if (inPage) color = y < margin + accentH ? ACCENT : PAGE;
      raw[pos] = color[0];
      raw[pos + 1] = color[1];
      raw[pos + 2] = color[2];
      pos += 3;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const file = join(OUT_DIR, `pwa-${size}.png`);
  writeFileSync(file, makePng(size));
  console.log(`wrote ${file}`);
}
