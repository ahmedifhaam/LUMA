/**
 * Document engine abstraction.
 *
 * These contracts are defined in terms of document *capabilities*, not in terms
 * of any specific engine (PDF.js is only the first adapter). Future formats
 * (e.g. EPUB) must implement the same relevant contracts rather than inventing a
 * parallel reader architecture. See Phase 1 brief section 2.3.
 */

/** Content-based identity for a logical document, independent of filename/path. */
export interface DocumentIdentity {
  /** Lowercase hex SHA-256 of the raw document bytes. */
  fingerprint: string;
  /** Byte length of the source document. */
  byteLength: number;
}

export interface DocumentMetadata {
  title: string | null;
  author: string | null;
  pageCount: number;
  /**
   * Whether the document exposes usable machine-readable text. `false` implies a
   * scanned / image-only PDF for which search and highlighting are unavailable.
   */
  hasText: boolean;
}

/** Intrinsic (unscaled) geometry of a single page, in CSS pixels at scale 1. */
export interface PageGeometry {
  pageNumber: number;
  width: number;
  height: number;
}

/** A stable, engine-agnostic reading location used to anchor state & annotations. */
export interface DocumentLocation {
  pageNumber: number;
  /** Normalized [0,1] vertical offset within the page. */
  yOffset: number;
}

export interface RenderResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface RenderTask {
  readonly promise: Promise<RenderResult>;
  cancel(): void;
}

/**
 * An opened document. Owns the underlying engine resources and is responsible for
 * rendering individual pages on demand. Implementations must support cancellable,
 * direct page addressing (no requirement to render intervening pages).
 */
export interface OpenDocument {
  readonly identity: DocumentIdentity;
  readonly metadata: DocumentMetadata;
  getPageGeometry(pageNumber: number): Promise<PageGeometry>;
  renderPage(pageNumber: number, scale: number): RenderTask;
  extractPageText(pageNumber: number): Promise<string>;
  destroy(): Promise<void>;
}

/** Opens a raw byte source into an {@link OpenDocument}. */
export interface DocumentEngine {
  open(bytes: ArrayBuffer): Promise<OpenDocument>;
}
