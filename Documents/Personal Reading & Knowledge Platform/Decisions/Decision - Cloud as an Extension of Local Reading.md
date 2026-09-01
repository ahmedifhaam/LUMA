# Decision - Cloud as an Extension of Local Reading

> [!summary]
> **Status:** Decided
> **Date:** 2026-09-01
> **Product:** [[Product - Overview]]

## Context

The product is intended to evolve toward cross-device continuation and potentially cloud storage, but the local-first reading experience should remain useful independently.

## Decision

A future backend and cloud layer should **extend** the local reading experience rather than replace it.

The cloud may eventually synchronize reading state and optionally store book content, but cloud storage of books is not a prerequisite for the initial product.

## Alternatives Considered

### Cloud-first library

Books and reading state are fundamentally cloud-managed.

**Outcome:** Not chosen.

### Local-only library

Books and reading state remain entirely device-specific.

**Outcome:** Not chosen as the long-term direction because cross-device continuation is desired.

### Local-first with optional cloud capabilities

Local state remains primary; synchronization and cloud storage can be introduced later.

**Outcome:** Chosen.

## Rationale

This allows the product to support large local files, offline use, privacy, and client-side performance while retaining a path to account-based synchronization, backup, and multi-device availability.

## Consequences

- Cloud book storage is a future capability rather than an initial requirement.
- Synchronization should focus on user state before requiring synchronization of large document content.
- Users may eventually choose local-only, synchronized-state, or cloud-backed content models.

## Related Capabilities

- [[Capability - Local-First Reading State]]
- [[Capability - Cross-Device Reading Continuity]]

## Related Questions

- [[Question - Book Content Ownership and Cloud Storage Model]]
