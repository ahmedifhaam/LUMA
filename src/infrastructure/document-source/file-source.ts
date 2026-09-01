/**
 * Document source abstraction (Phase 1 brief section 2.5 / rule 4).
 *
 * File/reference handling is hidden here so the rest of the app depends on raw
 * bytes, not on how those bytes were obtained. Phase 1 reads a user-selected
 * local file; browser-persistent copies are stored separately for offline reopen.
 */

export interface SelectedSource {
  name: string;
  bytes: ArrayBuffer;
}

export async function readFileSource(file: File): Promise<SelectedSource> {
  const bytes = await file.arrayBuffer();
  return { name: file.name, bytes };
}
