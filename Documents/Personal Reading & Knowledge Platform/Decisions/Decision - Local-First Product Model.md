# Decision - Local-First Product Model

> [!summary]
> **Status:** Decided
> **Date:** 2026-09-01
> **Product:** [[Product - Overview]]

## Context

The product began with a need to read very large PDFs efficiently in a browser while using client-side resources rather than server-side rendering. Later discussion introduced a backend for cross-device continuation, but the user explicitly preferred retaining a local-first model.

## Decision

The product will be designed as a **local-first reading platform**. Core reading functionality and reading state should work locally, while a future backend can provide synchronization and other cloud capabilities.

## Alternatives Considered

### Cloud/server-centric reading

The server could process documents and provide a cloud-controlled reading experience.

**Outcome:** Rejected as the product's foundational model because it conflicts with the desire to consume client resources and preserve local utility.

### Local-only product

Everything could remain exclusively on one device.

**Outcome:** Insufficient for the desired long-term product because cross-device continuation and future cloud capabilities are valuable.

### Local-first with optional synchronization

Each device can operate independently and later synchronize user state through a backend.

**Outcome:** Chosen.

## Rationale

This preserves the performance and ownership advantages of local processing while leaving a path to multi-device experiences.

## Consequences

- Local storage becomes a first-class concern.
- The data model must allow synchronization later without making synchronization mandatory for local use.
- Cloud processing should not be assumed for basic reading.
- Future sync conflicts and state convergence need deliberate product/technical design.

## Related Capabilities

- [[Capability - High-Performance Large Document Reading]]
- [[Capability - Local-First Reading State]]
- [[Capability - Cross-Device Reading Continuity]]

## Related Principles

- [[Principle - Local-First Reading]]

## History

This decision emerged after the product expanded from a lightweight large-PDF viewer into a multi-book reading platform with future cross-device continuity.
