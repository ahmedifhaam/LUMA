// Generates sample PDFs for manual/e2e testing (not committed to the app).
//   node scripts/make-sample-pdfs.mjs <outDir>
// Produces:
//   sample-book.pdf  - multi-page text PDF (text-friendly)
//   scanned-book.pdf - pages with no extractable text (image-only path)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

function buildPdf(pages) {
  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length; // 1-based object number
  };

  const fontNum = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  const kids = [];
  const pagesNumRef = objects.length + 1 + pages.length * 2 + 1; // filled later via placeholder
  // We will know the Pages object number after we add page/content objects, so
  // create content + page objects first, then the Pages node, then patch kids.
  const pageObjectNumbers = [];
  for (const content of pages) {
    const stream = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    const contentNum = add(stream);
    const pageNum = add('__PAGE_PLACEHOLDER__');
    pageObjectNumbers.push({ pageNum, contentNum });
    kids.push(pageNum);
  }

  const pagesNum = add(
    `<< /Type /Pages /Count ${pages.length} /Kids [${kids
      .map((k) => `${k} 0 R`)
      .join(' ')}] >>`,
  );

  // Patch page objects now that we know the Pages parent number.
  for (const { pageNum, contentNum } of pageObjectNumbers) {
    objects[pageNum - 1] =
      `<< /Type /Page /Parent ${pagesNum} 0 R ` +
      `/MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 ${fontNum} 0 R >> >> ` +
      `/Contents ${contentNum} 0 R >>`;
  }

  const catalogNum = add(`<< /Type /Catalog /Pages ${pagesNum} 0 R >>`);
  void pagesNumRef;

  // Serialize with an xref table.
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, index) => {
    offsets[index] = pdf.length;
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalogNum} 0 R >>\n` +
    `startxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}

function textPage(n, total) {
  const lines = [
    `LUMA Sample Book`,
    `Page ${n} of ${total}`,
    ``,
    `This is machine-readable text on page ${n}.`,
    `Reading state, navigation, and progress are tested here.`,
  ];
  const body = lines
    .map((line, i) => `BT /F1 ${i === 0 ? 28 : 16} Tf 72 ${700 - i * 34} Td (${line}) Tj ET`)
    .join('\n');
  // A big page number near the bottom for easy visual verification.
  return `${body}\nBT /F1 120 Tf 230 300 Td (${n}) Tj ET`;
}

function imagePage(n) {
  // Only vector graphics, no text operators -> no extractable text.
  const colors = ['0.85 0.25 0.25', '0.25 0.5 0.85', '0.3 0.7 0.4'];
  const c = colors[n % colors.length];
  return `${c} rg 72 200 468 460 re f 1 1 1 rg 120 360 372 140 re f`;
}

const outDir = process.argv[2] || '/tmp';

const TEXT_PAGES = 50;
const textPdf = buildPdf(
  Array.from({ length: TEXT_PAGES }, (_, i) => textPage(i + 1, TEXT_PAGES)),
);
writeFileSync(join(outDir, 'sample-book.pdf'), textPdf);

const scannedPdf = buildPdf(Array.from({ length: 5 }, (_, i) => imagePage(i + 1)));
writeFileSync(join(outDir, 'scanned-book.pdf'), scannedPdf);

console.log(`Wrote sample-book.pdf (${TEXT_PAGES} pages) and scanned-book.pdf to ${outDir}`);
