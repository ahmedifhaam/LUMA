# Capability - Local-First Reading State

> [!summary]
> **Status:** Explored
> **Product:** [[Product - Overview]]
> **Phase:** [[Phase 1 - Local Reading Foundation]]

## Purpose

Maintain the user's library and reading-related state locally so the product remains useful without requiring a backend.

## Description

Each device should be capable of maintaining its own local representation of reading state, including progress and annotations. The local state should later be suitable for synchronization rather than being designed as an isolated one-device model.

## Why It Matters

Local-first operation is a deliberate product principle. It supports offline use, client-side performance, user ownership, and a future path to synchronization without making cloud services a prerequisite.

## Current Understanding

The local state may include:

- Book metadata relevant to the local library.
- Reading position and progress.
- Bookmarks.
- Highlights.
- Notes.
- Reading history.

The exact local database technology and schema are not decided.

## Scope

### In Scope / Emerging

- Local persistence of reading state.
- Offline usefulness.
- State designed with future synchronization in mind.

### Deferred

- Cross-device synchronization.
- Cloud backup/storage.

## Related Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Cloud as an Extension of Local Reading]]

## Open Questions

- What state must be synchronized versus remain device-local?
- How should state conflicts be resolved?
- What local storage abstraction should support browser, desktop, and mobile environments?
