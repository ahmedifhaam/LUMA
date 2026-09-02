# Specification - Cross-Device Sync and Reading Continuity

> [!summary]
> **Status:** Draft
> **Phase:** [[Phase 2 - Synchronization and Continuity]]
> **Capability:** [[Capability - Cross-Device Reading Continuity]]
> **Decision:** [[Decision - Continuity via Cloud-Backed Sources]]

## Purpose

Extend the local-first reading experience so a user's reading state can move between independently maintained devices and allow the user to continue reading on another device.

This document captures the behaviour established during product exploration. Several convergence and continuity questions are now decided (see below); connector implementation details and annotation merge semantics remain open.

## Scope

### Established Direction

- Each device can maintain its own local reading state.
- A future backend can exchange relevant reading state between devices **for cloud-backed book sources**.
- Synchronization is an extension of local reading, not a prerequisite for reading.
- The user should be able to stop reading on one device and continue on another **when using a synchronized cloud source**.
- **Primary path (revised 2026-09-02):** continuity is bundled with cloud-backed book sources. See [[Decision - Continuity via Cloud-Backed Sources]].
- **Alternate path (deferred):** state-only synchronization for users who import the same file locally on each device without cloud storage.
- Logged-out users receive the full local Phase 1 experience with no sync.

### Sync MVP Scope

Aligned with [[Phase 2 - Synchronization and Continuity]]:

| Entity | Phase 2 MVP | Later |
|--------|-------------|-------|
| Reading position | Yes | — |
| Per-device session metadata | Yes | — |
| Bookmarks | Deferred | Phase 2+ |
| Highlights | Deferred | Phase 2+ |
| Notes | Deferred | Phase 2+ |

### Deferred / Not Yet Decided

- Cloud storage of book content (connector-specific details).
- Exact account model.
- Exact device identity model.
- Exact synchronization protocol.
- Annotation merge semantics (creation, edits, deletions).
- Connector implementation details (Google Drive OAuth scopes, LUMA cloud API, plugin adapter contracts).
- Pricing model and feature flags for paid tier.

## Behaviour

### Local Independence

A device must remain usable when disconnected from the synchronization service. Local reading and local state changes continue without waiting for synchronization.

### Synchronization

When connectivity is available, a device should be able to exchange relevant local reading-state changes with the synchronization service.

Synchronization should allow independently made changes on multiple devices to eventually converge without requiring the user to manually copy an entire local database.

### Reading Continuity

When a user opens a **cloud-backed** book on another synchronized device, the application should be able to identify a recent reading position from another device and offer continuation from that location.

The product should preserve reading activity history rather than treating a device's latest position as the only historical information.

**Per-device tracks:** A user may maintain independent reading progress on different devices (e.g. reading from the beginning on one device and from the end on another). Cross-device continuation is offered as an explicit choice, not an automatic overwrite of device-local state.

## Product Rules

1. Synchronization must not make local reading dependent on the backend.
2. Local changes must be retained when offline and remain available until synchronization is possible.
3. **Cloud-backed books:** content and reading state sync through the user's account and chosen source.
4. **Local-only books:** no network required; no upload implied; per-device state only unless a future state-only sync mode is added.
5. Cross-device continuation should use the user's logical book identity and a format-appropriate reading location.
6. Synchronization must account for changes made independently on multiple devices.
7. Authentication is required only for cloud and sync features; logged-out users are unaffected.

## Decided Defaults

The following defaults apply for MVP unless superseded by a later decision.

### Conflict rules

**Last-write-wins** on reading position, keyed by timestamp. When two devices write position simultaneously, the most recent write wins for the synchronized position record.

A **device-local track is never overwritten** unless the user explicitly chooses cross-device continuation. Concurrent writes update the shared synchronized position but do not change this device's local cursor without user action.

### Recent session

A session qualifies for the continuation prompt if:

1. It ended within the **last 7 days**, and
2. Its position is **different from this device's current track** for the same book.

The most recent qualifying session across synchronized devices is offered first.

### Pre-sync open

When a user opens a cloud-backed book **before synchronization completes**:

1. The device opens to **this device's last position** (local track).
2. A continuation prompt appears **once sync completes** (non-blocking — reading is not interrupted).

### Reading location

Reading location is stored in a **format-agnostic envelope**:

```json
{ "format": "pdf" | "epub", "locator": <format-specific> }
```

| Format | Locator |
|--------|---------|
| **PDF** | Page index (0-based) + optional scroll offset within the page |
| **EPUB** | CFI string (canonical fragment identifier) |

The envelope allows the sync layer to transport position without format-specific branching in the protocol.

## Client Contracts

Phase 2 client-side API contracts are implemented (stub backends only; no hosting yet):

| Concern | Location | Notes |
|---------|----------|-------|
| **Auth** | `src/infrastructure/auth/` | `AuthService` interface; `LocalAuthStub` when cloud disabled |
| **Sync state** | `src/infrastructure/sync/` | `SyncStateService` interface; `ReadingLocationEnvelope`; `LocalSyncStub` when cloud disabled |
| **Continuation logic** | `src/infrastructure/sync/continuation.ts` | Pure `findContinuationOffer()` — 7-day window, different device, different position |
| **Book source connectors** | `src/infrastructure/book-source/` | `BookSourceConnector` interface; empty registry when cloud disabled |

Feature flag: `VITE_CLOUD_ENABLED=true` (default off). Document byte resolution remains in `src/infrastructure/document-source/`.

## Current Acceptance Boundary

The following are established product outcomes but are not yet sufficient for implementation acceptance testing:

- A user can read on multiple devices independently.
- Reading state can later be synchronized.
- A recent reading session can be surfaced on another device.
- The user can continue from the recent synchronized reading location.
- Local reading continues when synchronization is unavailable.

Connector implementation details (auth flows, API contracts, storage adapters) are required before acceptance testing can be defined.

## Dependencies

- [[Capability - Local-First Reading State]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Cloud as an Extension of Local Reading]]
- [[Decision - Continuity via Cloud-Backed Sources]]
- [[Phase 1 - Local Reading Foundation]]
- [[Phase 1.5 - Local Source Model and Per-Device State]]

## Open Questions

- What exact reading-state entities beyond MVP scope are synchronized in Phase 2+?
- Is synchronization operation-based, state-based, or another model?
- How are annotation creation, edits, and deletions merged?
- What happens when two devices have divergent local copies of the same book?
- How is logical book identity established across devices for state-only sync (deferred path)?
- How long is reading history retained beyond the 7-day continuation window?
- Google Drive OAuth scopes, offline token refresh, and connector adapter contracts.
- LUMA cloud storage limits, retention, and takedown policy.
- Pricing model and feature flags for paid tier.
- Device naming in continuation UI ("Ahmed's iPhone").

## Specification Gate

Do not promote this document to `Specified` until connector implementation details (auth, book source adapters, sync protocol) have deliberate product and technical decisions.

**Alignment note (2026-09-02):** Primary continuity model is defined in [[Decision - Continuity via Cloud-Backed Sources]] and [[Phase 2 - Synchronization and Continuity]].

**Decided (2026-09-02):**

- Primary path: cloud-backed sources (content + state through account).
- Per-device tracks with explicit cross-device continuation.
- Conflict rules: last-write-wins on position (timestamp-keyed); device-local track preserved unless user opts in.
- Recent session: 7-day window; position must differ from this device's track.
- Pre-sync open: local position first; non-blocking continuation prompt after sync.
- Reading location: `{ format, locator }` envelope (PDF page + offset; EPUB CFI).
- Sync MVP: position + per-device session metadata only.

**Still open:**

- Annotation merge semantics.
- Connector implementation details (Drive, LUMA cloud, plugin adapters).
- Pricing and feature flags.
