# Phase 1.5 - Local Source Model and Per-Device State

> [!summary]
> **Status:** Complete
> **Product:** [[Product - Overview]]
> **Depends on:** [[Phase 1 - Local Reading Foundation]]

## Goal

Extend the Phase 1 local reading foundation with a **book source model**, **per-device reading state**, and **library source indicators** — without introducing a backend, authentication, or paid features.

This phase prepares the client data model and UX for [[Phase 2 - Synchronization and Continuity]] while shipping visible improvements to the free product.

## Why This Phase Exists

Phase 2 continuity and cloud sources require concepts that do not exist in v1:

- Where a book's bytes live (device only today; cloud later).
- Distinct reading progress per device vs. a synchronized "continue elsewhere" cursor.
- Visual differentiation of book sources in the library.

Building these locally first avoids a large bang migration when auth and cloud connectors arrive.

## Expected Outcome

- Every book in the library has a recorded **source** (initially `local` only).
- The library shows a **source icon** per book so users know where content comes from.
- Reading position is stored **per device** (and per book), not only as a single global last position.
- Optional local **export/import** of reading state (JSON or similar) for manual backup — no server.
- Auth UI may be stubbed or hidden behind a feature flag; **logged-out behaviour remains identical to Phase 1**.

## Included

- `BookSource` domain type: `local` | `luma-cloud` | `google-drive` | `app-storage` | `plugin` (only `local` implemented).
- `sourceRef` on book records (path, remote id, plugin id — populated for local imports).
- Per-device reading state keyed by stable **device id** (generated locally, persisted in IndexedDB).
- Library UI: source badge/icon on book cards.
- Reader: default open behaviour uses **this device's** last position for the book.
- Document-source adapter seam extended so future connectors implement the same interface as local file import.
- `DocumentSourceAdapter` interface with `resolveBytes(book)`; local implementation wired through `resolveBookBytes` registry in the reader.

## Explicitly Excluded

- Backend API implementation.
- User accounts and login flows (except optional UI stub).
- Cloud upload, download, or sync.
- Cross-device continuation prompts.
- Paid tier / billing.
- Google Drive or plugin connectors (types only).

## Dependencies

- [[Phase 1 - Local Reading Foundation]]
- [[Decision - Book as the Core Product Object]]
- [[Decision - Continuity via Cloud-Backed Sources]]

## Exit Criteria

- All imported books are tagged `source: local` with a valid `sourceRef`.
- Source icon visible in library for every book.
- Reading on two browser profiles (or two device ids) on the same machine maintains **independent** last positions for the same book.
- Unit tests cover per-device state read/write and source metadata on `Book`.
- No regression to offline-only, account-free Phase 1 behaviour.

## Open Questions

- ~~Stable device id: `localStorage` UUID vs. derived fingerprint — prefer explicit UUID with regeneration rules.~~ **Resolved:** `localStorage` key `luma-device-id` holds a generated UUID per browser installation.
- ~~Whether "Continue reading" card uses device-local or latest-opened-across-sources logic (device-local for Phase 1.5).~~ **Resolved:** device-local via `readingStateRepository.listForDevice()`.
- Export format for manual state backup — implemented as JSON via reading-state export/import helpers.

## Revision History

| Date | Change |
|------|--------|
| 2026-09-02 | Phase complete: source icons (grid + continue card), per-device state, document source adapter seam, unit and e2e coverage. |
