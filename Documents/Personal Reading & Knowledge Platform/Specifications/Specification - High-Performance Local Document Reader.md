# Specification - High-Performance Local Document Reader

> [!summary]
> **Status:** Specified
> **Phase:** [[Phase 1 - Local Reading Foundation]]
> **Capability:** [[Capability - High-Performance Large Document Reading]]

## Purpose

Provide a browser-based reader that can open and navigate very large documents, including PDFs of approximately 15,000 pages, without creating UI or memory costs proportional to the total page count.

The reader must use the user's device for document processing and remain responsive while reading.

## Scope

### In Scope

- Open a local document from the user's device.
- Display document page count and current page.
- Navigate directly to a page.
- Continuous reading/scrolling.
- Render only pages needed for the current viewing context.
- Maintain a small prefetch window around the visible pages.
- Release pages that are no longer within the active/cache window.
- Adapt resource usage for desktop and mobile devices.
- Zoom and fit-to-view reading behaviour.
- PDF text selection where supported by the document.
- Display the document's existing outline/table of contents when available.

### Explicitly Excluded

- Server-side PDF rendering.
- Uploading the document to a backend as a prerequisite for reading.
- Rendering all document pages simultaneously.
- Cloud storage of document content in Phase 1.
- Cross-device synchronization.

## Behaviour

### Opening

1. User selects a supported local document.
2. The application opens the document locally.
3. The application obtains the document's page count and basic navigation metadata without rendering all pages.
4. The application displays the first relevant page(s) for the current reading position.
5. Rendering of additional pages occurs on demand.

### Page Rendering

- Only pages inside the active viewport and a limited prefetch window are rendered.
- Rendering must not require creating persistent UI elements for all pages.
- When the viewport changes substantially, obsolete rendering work should be cancellable or discardable.
- Rendered page resources outside the cache policy must be released so memory usage remains bounded.
- The viewer may render more aggressively on capable desktop devices and more conservatively on mobile devices.

### Navigation

The user can:

- Scroll through the document.
- Jump to a page number.
- Navigate using the document outline when available.
- Return to the previously persisted reading location.

A direct jump to a distant page must not require rendering the intervening pages.

### Responsiveness

UI interaction and scrolling must remain independent from heavy document processing. Heavy parsing, text extraction, indexing, and rendering work should not block the browser's main UI thread where practical.

## Product Rules

1. Document size/page count must not cause the application to instantiate or render the entire document UI.
2. Reading must remain available without a network connection after the local document has been provided to the application.
3. The application must prefer client-side processing for normal reading operations.
4. A 15,000-page document is a supported stress case for the reader architecture, not a special document mode.
5. Mobile support uses the same reader behaviour but may use tighter caching/prefetch limits.

## Performance Acceptance Criteria

- A 15,000-page PDF can be opened without attempting to render all 15,000 pages.
- The application can jump from an early page to a distant page without rendering every page between the two locations.
- Scrolling through a large document does not cause the number of live rendered page views to grow with total pages visited.
- Pages outside the active/cache window are eligible for release.
- Heavy document work does not intentionally block the main UI thread.
- The reader remains usable on mobile devices using conservative resource limits.

Exact latency, memory, frame-rate, and device-specific thresholds remain performance-validation questions and should be established through testing rather than invented here.

## Technical Constraints

The current implementation direction is a browser application using a client-side PDF engine such as PDF.js, browser workers for heavy processing, and canvas-based page rendering. The exact library/version and rendering implementation remain engineering decisions unless separately decided.

## Dependencies

- [[Capability - Local-First Reading State]]
- [[Specification - Local Reading State and Progress]]
- [[Specification - Search and Annotations]]

## Related Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Book as the Core Product Object]]

## Open Questions

- Exact supported document formats in Phase 1.
- Quantitative performance targets for representative desktop and mobile devices.
- Whether the initial release should support only PDF or introduce another format immediately.
