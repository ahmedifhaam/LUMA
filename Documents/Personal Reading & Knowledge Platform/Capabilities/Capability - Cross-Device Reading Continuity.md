# Capability - Cross-Device Reading Continuity

> [!summary]
> **Status:** Candidate
> **Product:** [[Product - Overview]]
> **Phase:** [[Phase 2 - Synchronization and Continuity]]

## Purpose

Allow a user to stop reading on one device and continue on another without losing their reading position or surrounding reading context.

## Description

The desired experience is similar in spirit to Apple Handoff: a recent reading session on one device becomes available on another device, allowing the user to continue from the latest meaningful location.

This depends on synchronization of reading state but does not necessarily require the book content itself to be stored in the cloud.

## Why It Matters

The user explicitly wants reading continuity across devices. It is a natural extension of the local-first model rather than a replacement for it.

## Current Understanding

A reading location needs to represent more than a simple page number where appropriate. The exact representation for different formats is not yet decided.

The most recent reading session may be useful for deciding what to offer as the continuation point. Historical sessions should not necessarily be lost merely because one location becomes current.

## Scope

### Future / Candidate

- Cross-device reading progress.
- Continue-reading from another device.
- Recent reading session awareness.
- Synchronization of relevant annotations and reading state.

### Deferred

- Full cloud content synchronization.
- Rich handoff experiences beyond reading continuity.

## Related Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Cloud as an Extension of Local Reading]]

## Open Questions

- What is the canonical definition of a reading location across PDF, EPUB, and other formats?
- Which device/session wins when devices have diverged?
- Which annotations and history should merge automatically?
- What should happen when the same book exists locally under different files or versions?
