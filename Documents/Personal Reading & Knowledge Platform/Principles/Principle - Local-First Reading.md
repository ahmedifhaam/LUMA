# Principle - Local-First Reading

> [!summary]
> **Status:** Decided
> **Date:** 2026-09-01
> **Product:** [[Product - Overview]]

## Principle

The product should remain useful locally wherever practical. The reading experience and user reading state should not fundamentally depend on a backend or continuous network connection.

A future backend should extend the local experience with synchronization, continuity, backup, and optional cloud storage rather than become a prerequisite for basic reading.

## Why It Matters

The user explicitly preferred a design that consumes client-side resources instead of requiring server-side PDF processing. The user also wants a future backend for continuing on other devices, while retaining the local-first model.

This principle preserves both goals instead of making them competing architectural directions.

## Implications

- Large-document reading should primarily be performed on the client.
- Reading state should exist locally on each device.
- Offline reading and annotation should remain meaningful.
- Synchronization should be additive rather than foundational to basic reading.
- Cloud storage of book content should be optional rather than assumed.

## Related Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Cloud as an Extension of Local Reading]]

## Related Capabilities

- [[Capability - Local-First Reading State]]
- [[Capability - Cross-Device Reading Continuity]]
