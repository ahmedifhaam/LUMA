# Capability - Local Search and Annotations

> [!summary]
> **Status:** Specified
> **Product:** [[Product - Overview]]
> **Phase:** [[Phase 1 - Local Reading Foundation]]

## Purpose

Allow users to find and mark useful information in books while keeping search and annotation activity local and available offline.

## Description

The product should provide local text search, bookmarks, highlights, and notes as core reading tools. These are part of the user's relationship with a book and should persist independently of the transient reader session.

For large documents, text extraction/indexing may happen progressively in the background so initial reading does not have to wait for the entire document to be indexed.

## Why It Matters

Basic navigation alone is insufficient for serious reading. Search and annotations create durable reading context and establish the foundation for later personal knowledge capabilities.

## Scope

### In Scope

- Local search within supported text-bearing books.
- Search-result navigation to matching locations.
- Bookmarks.
- Highlights.
- Notes attached to supported reading locations/highlights.
- Persistent local annotation state.

### Deferred

- Cross-book semantic search.
- AI-assisted understanding.
- Automatic knowledge extraction.
- Synchronized annotations.

## Related Specifications

- [[Specification - Search and Annotations]]

## Related Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Book as the Core Product Object]]

## Open Questions

- Scanned/image-only document search behaviour.
- Exact query syntax/ranking.
- Exact persistent highlight representation.
- Whether notes participate in Phase 1 search.
