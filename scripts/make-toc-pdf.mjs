// Generates a text PDF WITH a table of contents (outline), for exercising the
// Contents panel. Not part of the app bundle.
//   node scripts/make-toc-pdf.mjs <outFile> [pages]
import { writeFileSync } from 'node:fs';
import { textPage } from './pdf-builder.mjs';

const outFile = process.argv[2] || '/tmp/luma-samples/toc-book.pdf';
const pageCount = Number(process.argv[3] || 40);

const objects = [];
const add = (body) => {
  objects.push(body);
  return objects.length;
};

const fontNum = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

// Page + content objects.
const pageObjNums = [];
const kids = [];
for (let i = 1; i <= pageCount; i += 1) {
  const content = textPage(i, pageCount);
  const contentNum = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const pageNum = add('__PLACEHOLDER__');
  pageObjNums.push({ pageNum, contentNum });
  kids.push(pageNum);
}

const pagesNum = add(
  `<< /Type /Pages /Count ${pageCount} /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] >>`,
);
for (const { pageNum, contentNum } of pageObjNums) {
  objects[pageNum - 1] =
    `<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 612 792] ` +
    `/Resources << /Font << /F1 ${fontNum} 0 R >> >> /Contents ${contentNum} 0 R >>`;
}

// Outline: one entry per "chapter", every 10 pages.
const chapters = [];
for (let p = 1; p <= pageCount; p += 10) chapters.push(p);
const outlinesNum = add('__PLACEHOLDER__');
const itemNums = chapters.map(() => add('__PLACEHOLDER__'));
chapters.forEach((startPage, idx) => {
  const pageRef = kids[startPage - 1];
  const parts = [
    `/Title (Chapter ${idx + 1} — page ${startPage})`,
    `/Parent ${outlinesNum} 0 R`,
    `/Dest [${pageRef} 0 R /Fit]`,
  ];
  if (idx > 0) parts.push(`/Prev ${itemNums[idx - 1]} 0 R`);
  if (idx < itemNums.length - 1) parts.push(`/Next ${itemNums[idx + 1]} 0 R`);
  objects[itemNums[idx] - 1] = `<< ${parts.join(' ')} >>`;
});
objects[outlinesNum - 1] =
  `<< /Type /Outlines /First ${itemNums[0]} 0 R ` +
  `/Last ${itemNums[itemNums.length - 1]} 0 R /Count ${itemNums.length} >>`;

const catalogNum = add(
  `<< /Type /Catalog /Pages ${pagesNum} 0 R /Outlines ${outlinesNum} 0 R >>`,
);

let pdf = '%PDF-1.4\n';
const offsets = [];
objects.forEach((body, index) => {
  offsets[index] = pdf.length;
  pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefStart = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

writeFileSync(outFile, Buffer.from(pdf, 'latin1'));
console.log(`Wrote ${outFile} (${pageCount} pages, ${chapters.length} outline entries)`);
