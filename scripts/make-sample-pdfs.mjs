// Generates sample PDFs for manual/e2e testing (not committed to the app).
//   node scripts/make-sample-pdfs.mjs <outDir>
// Produces:
//   sample-book.pdf  - multi-page text PDF (text-friendly)
//   scanned-book.pdf - pages with no extractable text (image-only path)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPdf, imagePage, textPage } from './pdf-builder.mjs';

const outDir = process.argv[2] || '/tmp';

const TEXT_PAGES = 50;
const textPdf = buildPdf(
  Array.from({ length: TEXT_PAGES }, (_, i) => textPage(i + 1, TEXT_PAGES)),
);
writeFileSync(join(outDir, 'sample-book.pdf'), textPdf);

const scannedPdf = buildPdf(Array.from({ length: 5 }, (_, i) => imagePage(i + 1)));
writeFileSync(join(outDir, 'scanned-book.pdf'), scannedPdf);

console.log(
  `Wrote sample-book.pdf (${TEXT_PAGES} pages) and scanned-book.pdf to ${outDir}`,
);
