# Product - Current State

> [!summary]
> **Status:** Candidate / Explored
> **Product:** [[Product - Overview]]
> **Last Updated:** 2026-09-02

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

Phase 1 local reading foundation is **implemented and released as v1.0**. **Phase 1.5 is in progress** (source model, per-device state, library source icons). Phase 2 is **proposed**; continuity model was revised 2026-09-02 (cloud-backed sources, auth-gated paid features). See [[History - Product Evolution 2026-09-02]].

## Current Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Book as the Core Product Object]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Cloud as an Extension of Local Reading]]
- [[Decision - Continuity via Cloud-Backed Sources]]

## Current Scope Direction

Phase 1 is the implementation foundation: local multi-book reading, large-document performance, local search/annotations, and persistent reading state. **v1.0 shipped** with PDF and EPUB support.

**Phase 1.5 (in progress):** book source model, per-device reading state, and library source icons — still no backend.

**Phase 2 (revised):** optional login, cloud book sources, and cross-device continuity for users who opt in. Free tier remains local-only forever. See [[Decision - Continuity via Cloud-Backed Sources]].

Phase 2+ adds annotation sync, more connectors, and optional state-only sync for power users.

Cloud storage of book content, AI-assisted understanding, and deeper cross-book knowledge capabilities remain future directions beyond Phase 2 MVP.

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

See [[History - Product Evolution 2026-09-02]] and [[History - Product Evolution 2026-09-01]].
