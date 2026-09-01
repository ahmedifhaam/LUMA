# Specification - Local Book Library

> [!summary]
> **Status:** Specified
> **Phase:** [[Phase 1 - Local Reading Foundation]]
> **Capability:** [[Capability - Multi-Book Library and Reading Memory]]

## Purpose

Provide a local, book-centric library that allows the user to manage multiple books and quickly return to books they have started or previously opened.

The library is the product-level container around the reader; the product is not defined as a single-document viewer.

## Scope

### In Scope

- Add a local book/document to the library.
- Display multiple books in a library.
- Identify a book independently of its currently open reader view.
- Display basic book information available from the source document or supplied by the user.
- Show reading progress for books with established progress.
- Provide a Continue Reading entry point for unfinished/recent books.
- Open a selected book in the reader.
- Preserve the relationship between a book and its local reading state.

### Explicitly Excluded

- User accounts.
- Cloud synchronization.
- Cloud book storage.
- Cross-device library synchronization.
- Advanced recommendation or social-library features.
- AI-generated organization.

## Behaviour

### Adding a Book

1. User selects a local supported document.
2. The application creates or identifies the corresponding local book entry.
3. The book becomes available in the local library.
4. The document remains usable locally without requiring upload to a server.

### Opening a Book

Selecting a book opens the reader at its persisted reading location when one exists. A book without prior reading state opens at its initial reading location.

### Continue Reading

The library should surface books with recent or incomplete reading activity so the user can return directly to the relevant reading position.

### Multiple Books

The user can have multiple books in the library. Opening one book must not require loading or rendering the contents of other books.

## Product Rules

1. A book is a first-class product object, not merely an open PDF session.
2. Library metadata and reading state are local in Phase 1.
3. A library entry must remain useful when the network is unavailable.
4. The presence of many books must not cause all books to be loaded into the active document-reading engine.
5. Cloud synchronization is not required for Phase 1 library operation.

## Acceptance Criteria

- A user can add more than one supported local book/document.
- The library displays multiple books without opening all of their document contents.
- Selecting a book opens that book in the reader.
- Reopening a previously read book returns to its persisted reading location.
- A book's progress is visible in the library once reading progress exists.
- The library works without a backend connection.
- Adding additional books does not require loading all existing books into the active reader.

## Dependencies

- [[Specification - High-Performance Local Document Reader]]
- [[Specification - Local Reading State and Progress]]

## Related Decisions

- [[Decision - Book as the Core Product Object]]
- [[Decision - Local-First Product Model]]

## Open Questions

- Exact book metadata fields and cover handling.
- Whether duplicate local documents should create one book or multiple book entries.
- Exact library sorting/filtering options.
