# History - Product Evolution 2026-09-02

> [!summary]
> **Product:** [[Product - Overview]]
> **Date:** 2026-09-02

## Previous State

Phase 1 local reading foundation reached v1.0 (library, PDF/EPUB reader, annotations, layouts, PWA).

Phase 2 was drafted as **state synchronization** across devices, explicitly **without** requiring cloud book storage. Open questions remained on backend choice, auth method, annotation sync scope, and demo targets.

## Change

Product direction was clarified after v1.0:

1. **No backend soon.** The free product stays account-free and local-only, equivalent to v1 indefinitely.
2. **Paid tier later** bundles optional cloud book sources and cross-device continuity.
3. **Primary continuity path** is cloud-backed sources (LUMA cloud, Google Drive, app storage, future plugins) — not manual import + hash-matched state sync.
4. **Per-device reading progress** is a first-class requirement (e.g. different reading tracks on home vs. work devices).
5. **Source icons** in the library show where each book's content lives.
6. **Auth gating:** logged out = Phase 1; logged in = cloud and sync features. Username/password first; Google OAuth later.
7. **Sync MVP** is position-only; annotations deferred.
8. **Phase 1.5** inserted as a no-backend bridge: source model, per-device state, icons.

## New State

```text
Free (no login)     →  Local import, local state, offline — forever
Phase 1.5 (next)    →  Source model + per-device state + icons (still no backend)
Phase 2 (paid)      →  Login, cloud connectors, continuity when cloud source used
Phase 2+            →  Annotation sync, more plugins, optional state-only sync
```

## Decisions Created

- [[Decision - Continuity via Cloud-Backed Sources]]

## Documents Revised

- [[Phase 2 - Synchronization and Continuity]]
- [[Specification - Cross-Device Sync and Reading Continuity]] (alignment note)
- [[Question - Book Content Ownership and Cloud Storage Model]] (partial answer)

## Documents Created

- [[Phase 1.5 - Local Source Model and Per-Device State]]

## Resulting Implications

- Original Phase 2 "state-only sync" remains a **future optional** path, not the default user journey.
- [[Decision - Git-Like Synchronizable Local State]] and [[Decision - Cloud as an Extension of Local Reading]] are unchanged in principle; continuity mechanics are now more specific.
- Implementation should not begin on backend until Phase 1.5 client model is in place.
