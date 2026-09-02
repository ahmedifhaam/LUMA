# Specification - Cross-Device Sync and Reading Continuity

> [!summary]
> **Status:** Draft
> **Phase:** [[Phase 2 - Synchronization and Continuity]]
> **Capability:** [[Capability - Cross-Device Reading Continuity]]

## Purpose

Extend the local-first reading experience so a user's reading state can move between independently maintained devices and allow the user to continue reading on another device.

This document captures the behaviour established during product exploration. It is intentionally not implementation-ready because synchronization semantics and conflict behaviour have not yet been decided.

## Scope

### Established Direction

- Each device can maintain its own local reading state.
- A future backend can exchange relevant reading state between devices **for cloud-backed book sources**.
- Synchronization is an extension of local reading, not a prerequisite for reading.
- The user should be able to stop reading on one device and continue on another **when using a synchronized cloud source**.
- **Primary path (revised 2026-09-02):** continuity is bundled with cloud-backed book sources. See [[Decision - Continuity via Cloud-Backed Sources]].
- **Alternate path (deferred):** state-only synchronization for users who import the same file locally on each device without cloud storage.
- Logged-out users receive the full local Phase 1 experience with no sync.

### Deferred / Not Yet Decided

- Cloud storage of book content.
- Exact account model.
- Exact device identity model.
- Exact synchronization protocol.
- Exact conflict and convergence rules.
- Exact definition of which local data synchronizes.

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

## Current Acceptance Boundary

The following are established product outcomes but are not yet sufficient for implementation acceptance testing:

- A user can read on multiple devices independently.
- Reading state can later be synchronized.
- A recent reading session can be surfaced on another device.
- The user can continue from the recent synchronized reading location.
- Local reading continues when synchronization is unavailable.

## Dependencies

- [[Capability - Local-First Reading State]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Cloud as an Extension of Local Reading]]
- [[Phase 1 - Local Reading Foundation]]

## Open Questions

- What exact reading-state entities are synchronized?
- Is synchronization operation-based, state-based, or another model?
- How are concurrent progress changes resolved?
- How are annotation creation, edits, and deletions merged?
- What happens when two devices have divergent local copies of the same book?
- How is logical book identity established across devices?
- How is a reading location represented across PDF, EPUB, and future formats?
- How long is reading history retained?
- What exactly qualifies as a "recent" session for continuation?
- What happens when a user opens the book before synchronization completes?

## Specification Gate

Do not promote this document to `Specified` until the major synchronization and convergence questions above have deliberate product decisions.

**Alignment note (2026-09-02):** Primary continuity model is now defined in [[Decision - Continuity via Cloud-Backed Sources]] and [[Phase 2 - Synchronization and Continuity]]. Remaining open items: conflict rules, annotation merge, and connector implementation details.
