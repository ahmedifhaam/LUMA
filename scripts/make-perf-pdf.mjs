// Generates a large text PDF for the performance harness (Phase 1 brief 2.10).
//   node scripts/make-perf-pdf.mjs <outFile> [pageCount]
// Default page count models the large-document stress target.
import { writeFileSync } from 'node:fs';
import { buildPdf, textPage } from './pdf-builder.mjs';

const outFile = process.argv[2] || '/tmp/luma-perf.pdf';
const pageCount = Number(process.argv[3] || 15000);

const pdf = buildPdf(
  Array.from({ length: pageCount }, (_, i) => textPage(i + 1, pageCount)),
);
writeFileSync(outFile, pdf);

console.log(
  `Wrote ${outFile} (${pageCount} pages, ${(pdf.length / 1024 / 1024).toFixed(1)} MB)`,
);
