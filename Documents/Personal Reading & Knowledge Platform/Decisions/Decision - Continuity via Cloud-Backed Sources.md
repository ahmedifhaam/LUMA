# Decision - Continuity via Cloud-Backed Sources

> [!summary]
> **Status:** Decided
> **Date:** 2026-09-02
> **Product:** [[Product - Overview]]

## Context

Phase 1 delivers a fully local, account-free reading experience. The product will later offer paid capabilities built around optional cloud book sources and cross-device continuity.

An earlier Phase 2 draft assumed reading **state** could synchronize across devices even when book **content** remained local on each device (import separately, match by content hash). Product discussion on 2026-09-02 clarified a simpler primary path: users who want continuity opt into a **cloud-backed book source**, and the service delivers both the book and synchronized reading state.

The free tier must remain equivalent to Phase 1 indefinitely: local import, local storage, no login required.

## Decision

Cross-device **reading continuity** is offered primarily through **cloud-backed book sources**, not as a requirement to upload or match local files across devices manually.

When a user selects a cloud-backed source for a book, the product may:

- Store or reference the book in that source (LUMA cloud, Google Drive, app-managed storage, or a future plugin source).
- Synchronize reading state associated with that book and the user's account.
- Offer continuation on another device from a recent reading session on a synchronized source.

When a user keeps a book **local-only**, behaviour remains Phase 1: per-device import, per-device state, no backend dependency.

Authentication is required only for cloud and continuity features. **Logged-out users receive the full Phase 1 experience.**

Initial authentication may use username/password. OAuth providers (e.g. Google) may be added later for cloud-connected users.

## Alternatives Considered

### State-only sync without cloud book delivery

Each device imports the same file locally; only reading position and annotations sync via content hash identity.

**Outcome:** Not chosen as the **primary** continuity path. May be revisited later for power users who refuse cloud book storage.

### Mandatory cloud for all users

Every book must be uploaded or linked to an account before reading.

**Outcome:** Rejected. Conflicts with local-first principles and the free tier.

### Centralized runtime state (no local independence)

Devices read state only from the server while online.

**Outcome:** Rejected. Local reading and offline use remain mandatory.

### Cloud-backed continuity (chosen)

Continuity is bundled with optional cloud sources; local-only remains the default free path.

**Outcome:** Chosen.

## Rationale

- **Clear product story:** “Want to continue on another device? Add the book to a cloud source.”
- **Simpler identity:** Logical book identity is tied to account + source reference, not cross-device hash matching alone.
- **Monetization alignment:** Paid tier can fund storage, sync, and connectors without degrading the free local experience.
- **Preserves local-first:** No account, no cloud, no paywall on core reading.

## Consequences

- Phase 2 implementation is **deferred** until after Phase 1.5 local modelling work; no backend is required immediately after v1.
- The data model must represent **book source** (local, LUMA cloud, Google Drive, plugin, etc.) and show **source indicators** in the library UI.
- Reading state must support **per-device progress** as well as optional **cross-device continuation** when sync is enabled.
- Annotation sync is **not** required for the first continuity release; position sync is sufficient for MVP.
- Google Drive and plugin sources reduce pressure to host all bytes on LUMA infrastructure at launch.
- A future **state-only sync** mode remains compatible with [[Decision - Git-Like Synchronizable Local State]] but is not the default user path.

## Related Capabilities

- [[Capability - Local-First Reading State]]
- [[Capability - Cross-Device Reading Continuity]]
- [[Capability - Multi-Book Library and Reading Memory]]

## Related Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Cloud as an Extension of Local Reading]]
- [[Decision - Git-Like Synchronizable Local State]]

## Related Phases

- [[Phase 1 - Local Reading Foundation]]
- [[Phase 1.5 - Local Source Model and Per-Device State]]
- [[Phase 2 - Synchronization and Continuity]]

## History

Recorded after product review on 2026-09-02 following v1.0 release of the local reading foundation.
