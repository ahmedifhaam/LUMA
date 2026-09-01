# Decision - Git-Like Synchronizable Local State

> [!summary]
> **Status:** Decided
> **Date:** 2026-09-01
> **Product:** [[Product - Overview]]

## Context

The user wants each device to be independently usable and maintained locally, while allowing a future backend to consolidate state across devices. The desired mental model is similar to Git: each device can maintain its own state, changes can be exchanged later, and the overall state can converge.

## Decision

The product should use a **Git-like synchronization model for local reading state**, rather than treating one central backend database as the only authoritative runtime state.

The exact implementation is not decided. The important product-level decision is that each device can maintain its own local reading state and that the state must be designed for later synchronization and consolidation.

## Alternatives Considered

### Centralized runtime state

The device depends on the backend as the authoritative source for reading state.

**Outcome:** Rejected as the foundational model because it conflicts with local-first operation.

### Device-local state with no synchronization model

Each device remains independent permanently.

**Outcome:** Insufficient for the desired cross-device experience.

### Git-like local state with later synchronization

Each device maintains local state and exchanges changes with a backend when synchronization is available.

**Outcome:** Chosen as the product direction.

## Rationale

The approach combines offline independence with eventual cross-device continuity. It also allows a backend to be introduced later without redesigning the product around cloud dependence from the beginning.

## Consequences

- Reading state must be representable independently of a live backend.
- The future sync model must account for changes made independently on different devices.
- Semantic conflict handling is likely to matter; for example, reading position can reasonably follow the most recent reading session while annotations may accumulate independently.
- Exact synchronization mechanics remain an open technical-design question.

## Related Capabilities

- [[Capability - Local-First Reading State]]
- [[Capability - Cross-Device Reading Continuity]]
- [[Capability - Multi-Book Library and Reading Memory]]

## Related Questions

- [[Question - Exact Local Storage and Sync Model]]

## History

The Git analogy was introduced while discussing how to add a backend without abandoning local-first operation. It is a product-level mental model, not a decision to use Git itself as the synchronization technology.
