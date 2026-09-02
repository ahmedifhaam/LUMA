# Question - Book Content Ownership and Cloud Storage Model

> [!summary]
> **Status:** Open
> **Product:** [[Product - Overview]]

## Context

The user wants cloud storage to be possible in the future, while keeping the initial reading experience local-first and avoiding unnecessary server processing or uploads of large book files.

## Why It Matters

Large books can be expensive to upload, store, and synchronize. The product should preserve local ownership and allow cloud storage to be an optional extension rather than an accidental requirement.

## Options / Considerations

Potential future modes discussed conceptually:

- Local-only book content.
- Cloud-backed book content.
- Hybrid local/offline copy with cloud availability.

## Current Answer

**Partially decided (2026-09-02).** See [[Decision - Continuity via Cloud-Backed Sources]].

- **Free / local-only:** Book content stays on the device only. No upload, no account. This is the permanent default and matches Phase 1.
- **Paid / continuity:** Users opt into cloud-backed sources. Content may live in LUMA cloud, Google Drive, app-managed storage, or future plugin sources. Continuity (book + synchronized position) is offered through those sources, not by requiring every user to upload files.
- **Hybrid:** A user may have both local-only books and cloud-backed books in the same library, distinguished by source icons.

Hosting economics, exact storage limits, and legal/takedown policy for LUMA cloud remain open.

## Related Knowledge

- [[Decision - Cloud as an Extension of Local Reading]]
- [[Capability - Local-First Reading State]]
- [[Capability - Cross-Device Reading Continuity]]
