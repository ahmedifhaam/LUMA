# Question - Exact Local Storage and Sync Model

> [!summary]
> **Status:** Open
> **Product:** [[Product - Overview]]

## Context

The product direction is a Git-like synchronizable local state model, but no concrete synchronization technology or database design has been selected.

## Why It Matters

The synchronization model must support independent device operation, offline changes, eventual convergence, and future backend introduction without compromising local-first behaviour.

## Options / Considerations

The Git analogy is a conceptual model rather than a decision to use Git itself. Possible future designs may include change-based synchronization and semantic conflict handling, but the implementation approach is not established.

## Current Answer

Not decided.

## Related Knowledge

- [[Decision - Git-Like Synchronizable Local State]]
- [[Capability - Local-First Reading State]]
- [[Capability - Cross-Device Reading Continuity]]
