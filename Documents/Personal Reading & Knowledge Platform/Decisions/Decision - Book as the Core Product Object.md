# Decision - Book as the Core Product Object

> [!summary]
> **Status:** Decided
> **Date:** 2026-09-01
> **Product:** [[Product - Overview]]

## Context

The initial product discussion focused on solving a large-PDF viewing problem. The discussion then recognized that a generic PDF reader or book library would have weak differentiation because many such applications already exist.

## Decision

The product should be **book-centric rather than PDF-reader-centric**. A book is the primary product concept, while PDF and future formats are sources/representations of book content.

## Alternatives Considered

### PDF reader as the product

Focus primarily on rendering, navigation, search, bookmarks, and highlighting for PDFs.

**Outcome:** Insufficient as the long-term product direction.

### Generic book library

Focus primarily on storing books, covers, collections, and basic reading progress.

**Outcome:** Considered too crowded and insufficiently differentiated.

### Book-centric reading and knowledge platform

Treat the book as the long-lived object around which reading, annotations, progress, understanding, and knowledge are organized.

**Outcome:** Chosen.

## Rationale

The product needs a stronger reason to exist than another library or PDF viewer. A book-centric model allows the product to grow from fast reading into reading memory and personal knowledge while remaining format-independent.

## Consequences

- The product should not be defined exclusively around PDF.
- Library, reading progress, annotations, and future knowledge features should relate to books.
- The initial large-PDF problem remains an important wedge, not the entire product identity.

## Related Capabilities

- [[Capability - Multi-Book Library and Reading Memory]]
- [[Capability - Personal Knowledge From Reading]]
- [[Capability - High-Performance Large Document Reading]]

## History

This decision represents the transition from the original lightweight PDF-reader idea toward a broader reading and knowledge platform.
