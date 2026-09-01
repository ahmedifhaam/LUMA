# Specification - Local Reading State and Progress

> [!summary]
> **Status:** Specified
> **Phase:** [[Phase 1 - Local Reading Foundation]]
> **Capability:** [[Capability - Local-First Reading State]]

## Purpose

Persist the user's reading state locally so reading can continue across application sessions without requiring an account, backend, or network connection.

## Scope

### In Scope

- Current reading location per book.
- Reading progress per book.
- Last-read information.
- Basic reading history.
- Local persistence of bookmarks, highlights, and notes through the related annotation capability.
- State that can later be synchronized without requiring synchronization in Phase 1.

### Explicitly Excluded

- Cross-device synchronization.
- Cloud backup.
- Cloud storage of book content.
- Conflict resolution between devices.
- Account identity.

## Behaviour

### Reading Location

The application records the user's most recent meaningful reading location for each book.

When the user reopens the book, the reader restores that location.

For paginated documents, the location must at minimum identify the page. Additional position information may be retained where the reader supports it.

### Progress

The application maintains progress for each book and presents it as a user-facing indication of how far the user has progressed.

For a paginated document, page-based progress may be used initially. The exact progress semantics for non-paginated formats remain open.

### Reading History

The application records enough local information to identify recent reading activity and support the Continue Reading experience.

Detailed analytics are not part of this specification.

### Persistence

Reading state must survive application/browser restarts and remain available without network connectivity.

The local persistence mechanism must be abstracted sufficiently that a future synchronization capability can consume the state without requiring a redesign of the product-level reading model.

## Product Rules

1. Local reading state is authoritative for the device while operating offline.
2. Saving reading state must not depend on a successful network request.
3. A failure to synchronize, when synchronization exists in a future phase, must not prevent local reading or local state updates.
4. Reading state is associated with a book rather than only with a transient reader instance.
5. The design must not assume that the cloud is required for persistence.

## Acceptance Criteria

- Opening a book creates or updates local reading state.
- Leaving and reopening a book restores the latest persisted reading location.
- Progress is retained after restarting the application/browser.
- Recent reading activity can be used by the library's Continue Reading experience.
- Reading state remains available when the network is unavailable.
- The product can maintain independent reading state for multiple books.
- No account or backend is required to create, update, or read local reading state.

## Dependencies

- [[Specification - Local Book Library]]
- [[Specification - High-Performance Local Document Reader]]
- [[Specification - Search and Annotations]]

## Related Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Git-Like Synchronizable Local State]]

## Open Questions

- Exact definition of a meaningful reading-location save event.
- Exact progress calculation for different document formats.
- Exact amount and presentation of reading history.
- Exact local database/storage technology.
