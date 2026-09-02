/**
 * Document source abstraction (Phase 1 brief section 2.5 / rule 4).
 *
 * File/reference handling is hidden here so the rest of the app depends on raw
 * bytes, not on how those bytes were obtained. Phase 1 reads a user-selected
 * local file; browser-persistent copies are stored separately for offline reopen.
 */

/**
 * File-picker filter for PDF and EPUB.
 * Include both MIME types and extensions — extension-only `.epub` is ignored on
 * some platforms (notably Windows Chrome), which hides EPUB files in the dialog.
 */
export const IMPORT_FILE_ACCEPT =
  'application/pdf,.pdf,application/epub+zip,.epub';

export interface SelectedSource {
  name: string;
  bytes: ArrayBuffer;
}

export async function readFileSource(file: File): Promise<SelectedSource> {
  const bytes = await file.arrayBuffer();
  return { name: file.name, bytes };
}
