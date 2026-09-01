# Product - Current State

> [!summary]
> **Status:** Candidate / Explored
> **Product:** [[Product - Overview]]
> **Last Updated:** 2026-09-01

## Current Vision

Build a local-first personal reading and knowledge platform that can handle very large books/documents efficiently, manage a multi-book library, preserve reading state locally, and eventually synchronize that state across devices and optionally store book content in the cloud.

## Current Problem Understanding

The immediate pain is poor performance when opening very large PDFs, with an example of approximately 15,000 pages causing many readers to become slow or crash.

The broader opportunity is not simply faster PDF rendering. The product should help serious readers read, understand, remember, and return to information across a collection of books.

## Current Capabilities

### Specified for Phase 1

- [[Capability - High-Performance Large Document Reading]]
- [[Capability - Multi-Book Library and Reading Memory]]
- [[Capability - Local-First Reading State]]
- [[Capability - Local Search and Annotations]]

### Explored / Future

- [[Capability - Cross-Device Reading Continuity]]
- [[Capability - Personal Knowledge From Reading]]

### Maturity Notes

No capability is currently known to be implemented or verified. Phase 1 product behaviour has now been specified sufficiently to begin implementation. Phase 2 remains at proposed/draft specification maturity.

## Current Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Book as the Core Product Object]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Cloud as an Extension of Local Reading]]

## Current Scope Direction

Phase 1 is now the implementation foundation: local multi-book reading, large-document performance, local search/annotations, and persistent reading state.

Phase 2 is intended to add synchronization and cross-device continuity without making the backend a prerequisite for reading.

Cloud storage of book content, AI-assisted understanding, and deeper cross-book knowledge capabilities remain future directions.

## Open Questions

- [[Question - Initial Product and Market Positioning]]
- [[Question - Exact Local Storage and Sync Model]]
- [[Question - Book Content Ownership and Cloud Storage Model]]
- [[Question - Initial Supported Formats]]

## Known Constraints

- The client should perform as much reading work as practical rather than requiring server-side PDF rendering.
- Large document size must not translate into proportional UI memory/rendering cost.
- Local use should remain useful without an account or network connection.
- Phase 1 must not require a backend.

## Historical Evolution

The product began as a response to the difficulty of reading a 15,000-page PDF. It evolved from a potential lightweight PDF viewer into a broader book-centric reading platform, then toward a local-first system with synchronizable reading state and eventual personal knowledge capabilities.

See [[History - Product Evolution 2026-09-01]].
