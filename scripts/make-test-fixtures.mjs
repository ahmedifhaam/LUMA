/**
 * Generates PDF and EPUB fixtures for Playwright e2e tests.
 *   node scripts/make-test-fixtures.mjs [outDir]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { buildPdf, imagePage, textPage } from './pdf-builder.mjs';

const outDir = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '../e2e/fixtures');
mkdirSync(outDir, { recursive: true });

// --- PDF fixtures ---
const samplePdf = buildPdf(
  Array.from({ length: 12 }, (_, i) => textPage(i + 1, 12)),
);
writeFileSync(join(outDir, 'sample-book.pdf'), samplePdf);

const scannedPdf = buildPdf(Array.from({ length: 3 }, (_, i) => imagePage(i + 1)));
writeFileSync(join(outDir, 'scanned-book.pdf'), scannedPdf);

// TOC PDF (inline, same as make-toc-pdf but fewer pages for speed)
import { execFileSync } from 'node:child_process';
execFileSync(
  process.execPath,
  [join(dirname(fileURLToPath(import.meta.url)), 'make-toc-pdf.mjs'), join(outDir, 'toc-book.pdf'), '24'],
  { stdio: 'inherit' },
);

// --- EPUB fixture ---
const chapter1 = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter One</title></head>
<body>
  <h1>Chapter One</h1>
  <p>The quick brown fox jumps over the lazy dog. LUMA EPUB fixture text.</p>
  <p>Machine-readable content for search and selection tests.</p>
</body>
</html>`;

const chapter2 = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter Two</title></head>
<body>
  <h1>Chapter Two</h1>
  <p>Second chapter with more searchable EPUB content for LUMA tests.</p>
</body>
</html>`;

const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Navigation</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <ol>
      <li><a href="chapter1.xhtml">Chapter One</a></li>
      <li><a href="chapter2.xhtml">Chapter Two</a></li>
    </ol>
  </nav>
</body>
</html>`;

const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>LUMA Sample EPUB</dc:title>
    <dc:creator>LUMA Tests</dc:creator>
    <dc:identifier id="uid">luma-sample-epub</dc:identifier>
    <meta property="dcterms:modified">2026-01-01T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="c1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="c2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="cover" href="cover.svg" media-type="image/svg+xml" properties="cover-image"/>
  </manifest>
  <spine>
    <itemref idref="c1"/>
    <itemref idref="c2"/>
  </spine>
</package>`;

const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
  <rect width="200" height="300" fill="#4338ca"/>
  <text x="100" y="150" text-anchor="middle" fill="white" font-size="24" font-family="serif">LUMA</text>
</svg>`;

const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opencode:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

const zip = new JSZip();
zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
zip.folder('META-INF').file('container.xml', container);
const oebps = zip.folder('OEBPS');
oebps.file('content.opf', opf);
oebps.file('nav.xhtml', nav);
oebps.file('chapter1.xhtml', chapter1);
oebps.file('chapter2.xhtml', chapter2);
oebps.file('cover.svg', coverSvg);

const epubBytes = await zip.generateAsync({ type: 'nodebuffer' });
writeFileSync(join(outDir, 'sample-book.epub'), epubBytes);

console.log(`Test fixtures written to ${outDir}`);
