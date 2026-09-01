# History - Product Evolution 2026-09-01

> [!summary]
> **Product:** [[Product - Overview]]
> **Date:** 2026-09-01

## Previous State

The product idea began as a lightweight browser application for opening and reading a very large PDF (approximately 15,000 pages) without the crashes and sluggishness experienced with conventional readers.

The early discussion focused on client-side rendering, virtualization, caching, search, bookmarks, highlighting, and a lightweight browser experience.

## Change

The product direction expanded in two important steps:

1. The application should be a broader book-centric library and reading experience rather than only a PDF viewer.
2. The product should be local-first but designed from the beginning so each device can maintain its own reading state and later synchronize through a backend.

A future Apple Handoff-like experience was also identified: stop reading on one device and continue on another from a recent meaningful reading location.

## New State

The current product direction is a personal reading and knowledge platform:

- Large-document performance is the initial wedge.
- Books are the primary product concept rather than PDFs.
- Local reading and state are foundational.
- Synchronization is a future extension of local state.
- Cloud storage may eventually be offered, but is not required initially.
- The longer-term differentiation is helping users build knowledge from reading rather than merely managing a library.

## Decisions Created

- [[Decision - Local-First Product Model]]
- [[Decision - Book as the Core Product Object]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Cloud as an Extension of Local Reading]]

## Resulting Capabilities

- [[Capability - High-Performance Large Document Reading]]
- [[Capability - Multi-Book Library and Reading Memory]]
- [[Capability - Local-First Reading State]]
- [[Capability - Cross-Device Reading Continuity]]
- [[Capability - Personal Knowledge From Reading]]

## Historical Note

The Git analogy refers to the desired property of independently maintained local state with later change synchronization and convergence. It is not a decision to use Git as the product's synchronization technology.
