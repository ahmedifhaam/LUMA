# Phase 2 - Synchronization and Continuity

> [!summary]
> **Status:** Proposed (revised 2026-09-02)
> **Product:** [[Product - Overview]]
> **Depends on:** [[Phase 1.5 - Local Source Model and Per-Device State]]

## Goal

Introduce **optional, account-based** cloud book sources and **cross-device reading continuity** for users who opt in — while keeping the **free, local-only** experience equivalent to Phase 1 for users who do not log in.

## Product Principle

> **Free = local forever. Paid = convenience: cloud storage, connectors, and continuity.**

Phase 2 must not make the backend a prerequisite for reading. Logged-out users and local-only books behave exactly as in v1.

## Why This Phase Exists

Phase 1 (and 1.5) establish local ownership, performance, and per-device state. The next product need is **optional continuity**: a user who stores a book in a cloud source can stop on one device and continue on another, with progress synchronized through their account.

See [[Decision - Continuity via Cloud-Backed Sources]] for the primary continuity model.

## Expected Outcome

A logged-in user can:

1. Add a book via a **cloud-backed source** (see book sources below).
2. Read on device A; open the same book on device B from that source.
3. See a **continuation prompt** based on a recent synchronized reading session.
4. Maintain **per-device reading tracks** when desired (e.g. read from the beginning at home and from the end at work on different devices).

A logged-out user (or a user who never uses cloud sources) sees **no change** from Phase 1.

## Book Sources

| Source | Tier (initial intent) | Role in continuity |
|--------|----------------------|-------------------|
| **Local (device)** | Free | No cross-device continuity; Phase 1 behaviour |
| **LUMA cloud** | Paid | Hosted storage + sync; primary upsell |
| **Google Drive** | Paid / connector | User's storage; LUMA syncs state + serves via connector |
| **App-managed upload** | Paid | Bytes stored in LUMA app storage bucket |
| **Plugin sources** | Future | Third-party connectors behind `DocumentSource` adapter |

Every book displays a **source icon** in the library so users always know where content lives.

## Authentication

- **Logged out:** Full Phase 1 feature set; no cloud, no sync.
- **Logged in:** Unlocks cloud sources, continuity, and paid capabilities.
- **Initial auth:** Username/password (sufficient to differentiate users in early releases).
- **Later:** Google OAuth and additional providers for cloud-connected accounts.

Backend hosting choice (self-hosted API vs. Supabase vs. other) is **deferred** until implementation; **design API contracts first** in the client (`Auth`, `BookSource`, `SyncState`).

## Reading State and Sync Scope

### Per-device progress (required)

Each device maintains its own reading cursor per book. Opening a book defaults to **this device's** last position.

### Cross-device continuation (cloud sources only)

When sync is available, the app may surface: *"Continue from [Device name] — Chapter 12, 34%"* based on the most recent session on a synchronized source.

Users may explicitly choose to **start fresh on this device** without overwriting other devices' tracks.

### Sync MVP scope

| Entity | Phase 2 MVP | Later |
|--------|-------------|-------|
| Reading position | Yes | — |
| Per-device session metadata | Yes | — |
| Bookmarks | Deferred | Phase 2+ |
| Highlights | Deferred | Phase 2+ |
| Notes | Deferred | Phase 2+ |

Position-only sync reduces merge complexity for the first release. Annotation sync follows once cloud book delivery is stable.

### Optional future path: state-only sync

Users who import the same file locally on multiple devices without cloud storage may eventually sync state via content hash identity. This is **not** the primary Phase 2 path but remains compatible with [[Decision - Git-Like Synchronizable Local State]].

## Included Capabilities

- [[Capability - Cross-Device Reading Continuity]]
- Account-based identity (minimal username/password initially).
- Cloud book source connectors (at least one non-local source before GA).
- Synchronized reading position for cloud-backed books.
- Source icons and source-aware library UX (extends Phase 1.5).

## Included Specification

- [[Specification - Cross-Device Sync and Reading Continuity]] — requires revision to reflect cloud-backed primary path before promotion to `Specified`.

## Explicitly Excluded

- Making the backend mandatory for basic reading.
- Requiring login to use the app.
- Requiring every book to use LUMA-hosted storage (Drive and plugins are first-class).
- Annotation sync in MVP.
- Cross-book knowledge graph.
- AI features.
- Final billing/pricing implementation (may ship behind feature flags).

## Deferred

- Google OAuth (after username/password MVP).
- Self-hosted API packaging.
- Full annotation merge semantics.
- State-only sync without cloud book delivery.
- OCR and format conversion.

## Dependencies

- [[Phase 1 - Local Reading Foundation]]
- [[Phase 1.5 - Local Source Model and Per-Device State]]
- [[Capability - Local-First Reading State]]
- [[Decision - Local-First Product Model]]
- [[Decision - Cloud as an Extension of Local Reading]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Continuity via Cloud-Backed Sources]]

## Suggested Implementation Order

1. **API design** — client-side interfaces for auth, book sources, sync; no hosting yet.
2. **Auth MVP** — username/password; gated routes for cloud features only.
3. **First cloud connector** — prefer **Google Drive** before LUMA-hosted storage to reduce hosting cost and rights surface.
4. **Position sync** — per-device + cross-device continuation for cloud-backed books.
5. **LUMA cloud storage** — paid upsell once connector pattern is proven.
6. **Annotation sync** — after position sync is reliable.

## Continuity Demo Targets

1. **First demo:** Same book, two browser profiles on one machine (fast iteration).
2. **Acceptance demo:** Real phone + desktop with one cloud-backed book.

## Exit Criteria

Not yet defined at implementation level. At product level, Phase 2 should demonstrate:

- Logged-out users are unaffected.
- A logged-in user with a cloud-backed book can continue reading on a second device from a synchronized position.
- Per-device tracks remain independent unless the user opts into cross-device continuation.
- Local-only books never require network access.

## Open Questions

- Pricing model and feature flags for paid tier.
- LUMA cloud storage limits, retention, and takedown policy.
- Google Drive OAuth scopes and offline token refresh.
- Device naming in continuation UI ("Ahmed's iPhone").
- Conflict rules when two devices write position simultaneously (last-write-wins vs. explicit user choice).
- Whether plugin sources are in-house only or third-party SDK.

## Revision History

- **2026-09-02:** Revised after v1.0 release. Primary continuity path changed from state-only sync to cloud-backed sources; auth gating and paid tier framing added; Phase 1.5 inserted as prerequisite. See [[Decision - Continuity via Cloud-Backed Sources]] and [[History - Product Evolution 2026-09-02]].
