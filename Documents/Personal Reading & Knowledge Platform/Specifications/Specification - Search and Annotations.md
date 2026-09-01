# Specification - Search and Annotations

> [!summary]
> **Status:** Specified
> **Phase:** [[Phase 1 - Local Reading Foundation]]
> **Capability:** [[Capability - High-Performance Large Document Reading]]

## Purpose

Allow users to find and mark useful information in a book without requiring server-side document processing.

## Scope

### In Scope

- Full-text search within a supported book where text is available.
- Search results associated with the relevant page/location.
- Navigation from a search result to the corresponding location in the reader.
- Text selection where supported by the document.
- Highlighting selected text.
- Bookmarks associated with a book location.
- Notes associated with a book location or highlight.
- Persistence of annotations locally.
- Display of existing annotations when returning to a book.

### Explicitly Excluded

- Cross-book semantic search.
- AI-assisted search or explanation.
- Cloud synchronization of annotations.
- Collaborative annotations.
- Automatic knowledge extraction.

## Behaviour

### Search

1. User enters a search query for the current book.
2. The application searches locally available/indexed text.
3. Results identify the matching page/location.
4. Selecting a result navigates directly to the relevant page/location.
5. Search processing should not require sending the book to a server.

For large documents, text extraction/indexing may occur progressively in the background rather than blocking initial reading.

### Highlight

1. User selects text in a supported document.
2. User chooses the highlight action.
3. The highlight is associated with the relevant book location.
4. The highlight is persisted locally.
5. Returning to the relevant location displays the highlight.

### Bookmark

1. User marks the current book location as a bookmark.
2. The bookmark is persisted locally.
3. The user can later select the bookmark to return to that location.

### Notes

A user may attach a note to a supported location/highlight. The note is persisted locally and restored when the book is reopened.

## Product Rules

1. Search should operate locally in Phase 1.
2. Search/indexing must not prevent the user from beginning to read.
3. Annotations belong to the book and reading state, not to a temporary reader session.
4. Annotations must remain available offline.
5. The original document does not need to be modified to persist user annotations.
6. Annotation behaviour must remain compatible with the future synchronization model.

## Acceptance Criteria

- A user can search text within a supported text-bearing book.
- Search results identify pages/locations and allow direct navigation.
- Searching a very large book does not require uploading the book to a server.
- A user can highlight supported selected text.
- A user can create and revisit bookmarks.
- A user can create notes associated with supported reading locations/highlights.
- Highlights, bookmarks, and notes survive application/browser restart.
- Annotations remain available without network connectivity.
- Existing annotations are restored when the associated book is reopened.

## Dependencies

- [[Specification - High-Performance Local Document Reader]]
- [[Specification - Local Reading State and Progress]]
- [[Specification - Local Book Library]]

## Related Decisions

- [[Decision - Local-First Product Model]]
- [[Decision - Book as the Core Product Object]]

## Open Questions

- Exact search query syntax and ranking.
- Behaviour for scanned/image-only pages without extractable text.
- Exact highlight representation required to survive changes in rendering/zoom.
- Whether notes are included in search in Phase 1.
