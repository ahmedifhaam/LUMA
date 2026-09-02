# Capability - Cross-Device Reading Continuity

> [!summary]
> **Status:** Candidate
> **Product:** [[Product - Overview]]
> **Phase:** [[Phase 2 - Synchronization and Continuity]]
> **Decision:** [[Decision - Continuity via Cloud-Backed Sources]]

## Purpose

Allow a user to stop reading on one device and continue on another without losing their reading position or surrounding reading context.

## Description

The desired experience is similar in spirit to Apple Handoff: a recent reading session on one device becomes available on another device, allowing the user to continue from the latest meaningful location.

**Primary path (decided 2026-09-02):** Cross-device continuity is offered through **cloud-backed book sources**. When a user adds a book via a cloud source (LUMA cloud, Google Drive, app-managed storage, or a future plugin), both book content and reading state synchronize through the user's account. See [[Decision - Continuity via Cloud-Backed Sources]] and [[Phase 2 - Synchronization and Continuity]].

**Per-device tracks:** Each device maintains its own reading progress by default. Cross-device continuation is an **explicit user choice** — device-local state is never overwritten automatically.

**Alternate path (deferred):** State-only synchronization for users who import the same file locally on each device without cloud storage. Not the primary user journey.

## Why It Matters

The user explicitly wants reading continuity across devices. It is a natural extension of the local-first model rather than a replacement for it. The free tier remains local-only forever; continuity is an optional, account-gated convenience for cloud-backed books.

## Current Understanding

- **Cloud-backed books:** Content and reading state sync through the user's account and chosen source. Logical book identity is tied to account + source reference.
- **Local-only books:** Phase 1 behaviour — per-device import, per-device state, no backend dependency.
- **Reading location:** Represented in a format-agnostic envelope `{ format, locator }` — PDF uses page index + optional scroll offset; EPUB uses a CFI string. See [[Specification - Cross-Device Sync and Reading Continuity]].
- **Recent session:** A session qualifies for continuation if it ended within the last 7 days and has a position different from this device's current track.
- **Sync MVP scope:** Reading position and per-device session metadata only; annotation sync is deferred.

The most recent reading session is used to decide what to offer as the continuation point. Historical sessions should not necessarily be lost merely because one location becomes current.

## Scope

### Future / Candidate

- Cross-device reading progress for cloud-backed books.
- Continue-reading from another device via explicit continuation prompt.
- Recent reading session awareness (7-day window).
- Per-device reading tracks with optional cross-device continuation.
- Synchronized reading position and per-device session metadata.

### Deferred

- State-only sync without cloud book delivery (alternate path for power users).
- Annotation, bookmark, highlight, and note synchronization.
- Rich handoff experiences beyond reading continuity.

## Related Decisions

- [[Decision - Continuity via Cloud-Backed Sources]]
- [[Decision - Local-First Product Model]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Cloud as an Extension of Local Reading]]

## Open Questions

- Which annotations and history should merge automatically when annotation sync is added?
- What should happen when the same book exists locally under different files or versions?
- Exact account model, device identity model, and connector implementation details.
- Pricing model and feature flags for paid tier.
