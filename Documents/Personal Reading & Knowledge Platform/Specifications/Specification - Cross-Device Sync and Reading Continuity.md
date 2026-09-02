# Specification - Cross-Device Sync and Reading Continuity

> [!summary]
> **Status:** Specified for Phase 2 MVP
> **Phase:** [[Phase 2 - Synchronization and Continuity]]
> **Capability:** [[Capability - Cross-Device Reading Continuity]]

## 1. Purpose

Define the implementation-facing behaviour and boundaries for optional account-based synchronization and cross-device reading continuity.

The specification extends the local-first reader established in v1 and Phase 1.5. It does not redefine local reading, document rendering, or the existing PDF/EPUB reading engine.

The Phase 2 MVP synchronizes reading position/session metadata for books opened through supported cloud-backed sources. The first connector target is Google Drive.

## 2. Non-Negotiable Invariants

1. Local reading works without an account.
2. Local reading works without network access.
3. Local book import never implies cloud upload.
4. Local reading state is saved immediately on the current device.
5. Synchronization is asynchronous and must not block reader interaction.
6. Authentication is required only for account/cloud/sync features.
7. Cloud source identity is separate from logical book identity.
8. Device-local reading tracks are independent.
9. Cross-device continuation is an explicit user choice.
10. Sync retries are idempotent.
11. Pull progress is cursor-based and must not skip unapplied remote records.
12. Remote data must be authorized against the authenticated account.
13. Provider secrets and credentials must never be persisted in repository source or static assets.

## 3. Scope

### 3.1 Included in MVP

- Optional account/session management.
- Stable per-installation device identity.
- Cloud-backed book source abstraction.
- Google Drive as the first external source target.
- Logical book identity associated with a source.
- Format-neutral synchronized reading location.
- Reading session metadata.
- Persistent local pending sync queue.
- Persistent synchronization cursor/revision.
- Push of local reading sessions.
- Pull of remote reading sessions.
- Idempotent mutation handling.
- Recent-session discovery.
- Explicit continuation UX.
- Independent per-device tracks.
- Offline/retry behaviour.
- Source/content-version compatibility checks.

### 3.2 Deferred

- Bookmark synchronization.
- Highlight synchronization.
- Note synchronization.
- Annotation conflict/merge semantics.
- Generic state-only sync for independently imported local files.
- LUMA-managed book storage as a required source.
- Plugin ecosystem implementation.
- AI/knowledge graph features.
- OCR and format conversion.
- Final billing implementation.

## 4. Identity Model

### 4.1 Account Identity

`AccountId` identifies the LUMA user account.

It is the root authorization boundary for synchronized state.

### 4.2 Device Identity

Each installation/browser profile has a stable opaque `DeviceId`.

The device ID is not a credential and must not encode sensitive machine information.

The product may maintain a user-editable display name such as `Laptop` or `Phone`, but the display name is not the identity key.

### 4.3 Logical Book Identity

`LogicalBookId` identifies the product-level book across supported sources.

It is distinct from provider-specific identifiers.

A source-specific identifier can identify:

```text
Google Drive file ID
LUMA object ID
future plugin object ID
```

but must not by itself become the domain's logical book identity.

### 4.4 Source Identity

`SourceId` identifies the configured source relationship used to obtain a book.

Conceptually:

```text
Source
  accountId
  sourceType
  sourceId
  providerIdentity

BookReference
  logicalBookId
  sourceId
  providerObjectId
  contentVersion
```

## 5. Book Source Contract

The reader must consume a provider-neutral source interface.

Conceptual contract:

```text
BookSourceProvider
  connect()
  disconnect()
  listBooks()
  getMetadata(sourceObjectId)
  open(sourceObjectId)
  getVersion(sourceObjectId)
```

The exact TypeScript interface and error types are implementation decisions, but provider-specific APIs must not leak into reader UI components.

### Source Capabilities

A provider should be able to communicate whether it supports:

- listing;
- metadata retrieval;
- streaming/opening;
- version detection;
- reconnect;
- removal/disconnect.

## 6. Reading Location

The synchronized position must be format-neutral at the application boundary.

Conceptual structure:

```text
ReadingLocation
  format
  locator
  progress
  context?
```

### PDF

The PDF locator should preserve enough information to reopen the relevant page. Page index/number is the minimum required semantic information.

### EPUB

The EPUB locator should identify the relevant chapter/document and, where supported, a stable text position. A reflow-independent locator should be preferred over a raw character offset.

### Future Formats

New formats must implement mapping to/from the common `ReadingLocation` envelope without changing synchronization protocol semantics.

## 7. Reading Session

A synchronized reading session represents a device's reading activity for a logical book/source.

Conceptual fields:

```text
ReadingSession
  id
  accountId
  deviceId
  logicalBookId
  sourceId
  contentVersion
  format
  location
  progress
  startedAt
  lastActivityAt
  sequence
  serverRevision
  schemaVersion
```

Not every field must be exposed directly in the UI.

The model must support identifying which device generated a session and when it was last active.

## 8. Per-Device Reading Tracks

Each device continues to own a local latest reading position.

Example:

```text
Device A local cursor = page 52
Device B local cursor = page 12
```

Synchronizing Device A must not replace Device B's local cursor with page 52.

Remote sessions are additional continuity information rather than a command to overwrite local state.

## 9. Synchronization Architecture

The intended dependency direction is:

```text
Reader UI
   ↓
Application Services
   ↓
Local Repositories ──────── Sync Coordinator
   │                              │
   │                              ├── Pending Queue
   │                              ├── Push
   │                              ├── Pull
   │                              ├── Cursor
   │                              └── Retry
   │                              ↓
   │                         Sync API
   │                              ↓
   │                          Backend
   │
BookSourceProvider
   ↓
Google Drive Connector
```

The reader should not depend directly on the sync transport.

## 10. Local Persistence Requirements

The client must persist:

- device identity;
- account/session association as appropriate;
- cloud source metadata;
- synchronized book reference metadata;
- local reading state;
- pending sync mutations;
- last successfully applied remote cursor/revision.

Existing IndexedDB storage remains the natural local persistence mechanism for the browser implementation, but repository abstractions should prevent the application layer from depending directly on IndexedDB APIs.

## 11. Sync Queue

Each local synchronized reading update produces a durable pending mutation.

Conceptual mutation:

```text
SyncMutation
  mutationId
  accountId
  deviceId
  logicalBookId
  sourceId
  mutationType
  payload
  createdAt
  attemptCount
```

`mutationId` is the idempotency key.

### Queue Rules

- Enqueue locally before attempting network delivery.
- Do not discard on transient failure.
- Retry with bounded backoff.
- Remove only after confirmed server acceptance.
- Duplicate submission of the same mutation must be semantically harmless.

## 12. Push Protocol

The logical operation is:

```text
push(mutations[]) -> accepted/rejected results + server revisions
```

The server must:

1. authenticate the account;
2. authorize the referenced source/book;
3. validate the mutation schema;
4. validate the content version where required;
5. apply the mutation exactly once semantically using `mutationId`;
6. assign server ordering/revision;
7. return an acknowledgement.

A client timeout after acceptance must be safe to retry.

## 13. Pull Protocol

The logical operation is:

```text
pull(cursor) -> changes[] + nextCursor
```

The client must:

1. load its persisted cursor;
2. request changes after that cursor;
3. apply received changes locally;
4. persist the resulting state;
5. advance the cursor only after successful application.

If application crashes before step 5, the same changes may be received again. Local application must therefore be idempotent.

## 14. Synchronization Loop

The coordinator should conceptually perform:

```text
while eligible:
  if authenticated and online:
      push pending mutations
      pull changes after cursor
      apply remote changes
      persist cursor
  else:
      remain local-only / pending
```

The actual scheduling mechanism may use application lifecycle events, connectivity events, reader activity, and bounded background attempts. It must not create an aggressive polling loop.

## 15. Conflict Semantics

The MVP deliberately avoids a single globally merged reading cursor.

Two devices reading the same book concurrently produce separate tracks.

```text
Laptop 09:00 -> 30%
Phone  09:05 -> 10%
Laptop 09:15 -> 35%
```

All meaningful sessions can remain available to the account. The continuation policy selects a candidate session rather than mutating another device's local cursor.

### Same-Device Rapid Updates

The client may coalesce very frequent local position changes before network synchronization, provided that doing so does not prevent recovery of the latest meaningful position.

### Cross-Device Concurrent Updates

No last-write-wins overwrite of device-local state is required for the MVP.

## 16. Recent Session Selection

The application needs a deterministic policy for selecting a continuation candidate.

Initial policy:

1. Match the same `logicalBookId`.
2. Match a compatible `sourceId`/source relationship.
3. Reject incompatible content versions.
4. Prefer a session from another device when the current device has no newer local activity.
5. Prefer the greatest `lastActivityAt` among valid candidates.
6. Do not automatically overwrite the current device's local position.

The "recent" threshold should be configurable at the application layer. Client default: **7 days** (`src/infrastructure/sync/continuation.ts`).

## 17. Continuation UX Requirements

When a synchronized remote session is available, the UI should communicate:

- which device was last active;
- approximate location/progress;
- when it was last active when useful;
- explicit actions to continue or start from the current device's position.

Example semantics:

```text
Continue from Tablet — Chapter 12, 34%

[Continue] [Start from this device]
```

### Continue

Map the synchronized `ReadingLocation` to the current reader and open it.

### Start From This Device

Keep the current device's local position and do not delete the remote track.

## 18. Cloud Source Lifecycle

A source can be:

```text
Disconnected
Connected
Available
Degraded
Revoked
```

Temporary source failure must not delete local book metadata or local reading state.

If authorization is revoked, the UI should explain that the source needs reconnection. Existing synchronized history should not be destroyed merely because the provider is temporarily unavailable.

## 19. Google Drive Connector

Google Drive is the first connector target.

The connector is responsible for:

- OAuth/provider authorization;
- discovering eligible book files;
- retrieving metadata;
- opening/streaming content as supported;
- detecting source/content version changes;
- handling reconnect/disconnect;
- translating provider errors into provider-neutral application errors.

The connector must use the narrowest feasible Drive permission scope.

The exact Google OAuth flow and token lifecycle are an implementation decision. Confidential client secrets must never be embedded in the browser application.

## 20. Authentication Behaviour

### Logged Out

- Local reader available.
- Local library available.
- Local PDF/EPUB state available.
- No cloud synchronization.
- No account required.

### Logged In

- Local functionality remains available.
- Cloud sources may be connected.
- Synchronization may run for eligible cloud-backed books.

### Session Expired

- Preserve local reading state.
- Keep pending local sync mutations.
- Suspend authenticated network operations.
- Prompt for re-authentication when the user attempts cloud/sync operations.

## 21. Data Boundary

| Data | Local | Sync MVP |
|---|---:|---:|
| Local PDF/EPUB bytes | Yes | No |
| Local library metadata | Yes | No, unless represented by a cloud reference |
| Cloud source identity | Yes | Yes |
| Logical book reference | Yes | Yes |
| Reading position | Yes | Yes |
| Progress | Yes | Yes |
| Device identity/display metadata | Yes | Yes, limited |
| Reading session timestamps | Yes | Yes |
| Bookmarks | Yes | No |
| Highlights | Yes | No |
| Notes | Yes | No |
| UI preferences | Yes | No |
| Credentials/access tokens | Protected runtime storage | Never as synchronized domain data |

## 22. Content Version Compatibility

A synchronized location must not be applied blindly to incompatible content.

When opening a remote session:

```text
same/compatible version
    -> map location and continue

unknown version
    -> use conservative fallback / do not silently corrupt position

incompatible version
    -> explain that the old continuation point cannot be safely restored
```

Provider-specific versioning may use file revision IDs, hashes, modification/version metadata, or another stable mechanism.

## 23. Error Handling

### Network Offline

Continue local reading and queue mutations.

### Sync Service Failure

Do not block the reader. Keep mutations pending and retry later.

### Push Timeout

Retry using the same mutation ID.

### Pull Failure

Keep the previous cursor and retry later.

### Invalid Remote Data

Reject the invalid record, record an observable error, and do not advance the cursor past unapplied data unless the protocol explicitly supports quarantining/skipping with a durable server-defined mechanism.

### Cloud Source Failure

Preserve local metadata/state and show the source as unavailable/degraded.

## 24. Security Requirements

- Every account-scoped backend request must be authenticated.
- Every account-scoped resource must be authorized server-side.
- Provider object IDs must not be treated as authorization proof.
- Client-side IDs are not trusted security boundaries.
- Access tokens must not be logged.
- Refresh tokens must not be synchronized as reading data.
- OAuth client secrets must not be shipped to the browser.
- No credentials or tokens may be committed to Git.
- Error messages must not leak provider tokens or authorization headers.
- Source disconnect/revocation must be handled without destructive local cleanup.

## 25. API Direction

The initial logical API can be represented as:

```text
POST /auth/session
POST /auth/logout
GET  /me

GET  /devices
POST /devices
PATCH /devices/{deviceId}

GET  /books
GET  /books/{logicalBookId}

POST /sync/push
GET  /sync/pull?cursor=...
```

These paths are illustrative. The important contract is the operation semantics, not the URL naming.

The client should expose application-level abstractions:

```text
AuthService
BookSourceProvider
ReadingSyncService
```

## 26. Conceptual Backend Model

```text
Account
  id
  identity

Device
  id
  accountId
  displayName
  createdAt
  lastSeenAt

BookReference
  logicalBookId
  accountId
  sourceId
  providerObjectId
  contentVersion

ReadingSession
  id
  accountId
  deviceId
  logicalBookId
  sourceId
  contentVersion
  location
  progress
  startedAt
  lastActivityAt
  serverRevision
```

The implementation may normalize or denormalize these records as appropriate.

## 27. Acceptance Criteria

### Local-First Regression

- [ ] Logged-out user can import and read a PDF.
- [ ] Logged-out user can import and read an EPUB.
- [ ] Local reading works with network disabled.
- [ ] Local-only books are never uploaded automatically.
- [ ] Existing local reading state survives authentication failure.

### Account

- [ ] User can create/sign into an account through the selected authentication architecture.
- [ ] User can sign out.
- [ ] Session expiry does not erase local state.

### Cloud Source

- [ ] User can connect Google Drive.
- [ ] User can discover supported book files.
- [ ] User can open a cloud-backed book.
- [ ] Source metadata identifies the provider/source.
- [ ] Source failure is represented without destructive cleanup.

### Synchronization

- [ ] Device identity is stable across application restarts.
- [ ] Local reading updates enqueue durable sync work.
- [ ] Pending work survives restart/offline periods.
- [ ] Push retries are idempotent.
- [ ] Pull cursor survives restart.
- [ ] Pull application is idempotent.
- [ ] Remote sessions become visible on another device.

### Continuity

- [ ] Device B can identify a recent session from Device A.
- [ ] User can explicitly continue from Device A's position.
- [ ] User can start from Device B's local position instead.
- [ ] Starting fresh does not delete Device A's track.
- [ ] Concurrent activity does not silently overwrite another device's local cursor.

### Content Compatibility

- [ ] Compatible source versions restore a synchronized location.
- [ ] Incompatible versions are not blindly mapped.

## 28. Test Plan

### Unit

- `ReadingLocation` serialization.
- PDF location mapping.
- EPUB location mapping.
- source identity mapping.
- session serialization.
- queue persistence.
- idempotency keys.
- cursor advancement.
- recent-session selection.
- content-version compatibility.
- independent device tracks.

### Integration

- local repository + sync coordinator;
- push/pull lifecycle;
- duplicate mutation submission;
- timeout/retry;
- interrupted pull;
- authentication expiry;
- source revocation;
- two-device concurrent reading;
- source version change.

### End-to-End

- logged-out local PDF;
- logged-out local EPUB;
- connect Drive;
- open cloud-backed book on Device A;
- read and synchronize;
- open on Device B;
- show continuation;
- continue;
- start fresh;
- verify both device tracks;
- offline read then reconnect;
- verify no regression to Phase 1 behaviour.

## 28.1 Client Contracts (Phase 1.5)

Phase 2 client-side API contracts are implemented on **`v2`** (stub backends only; no hosting yet):

| Concern | Location | Notes |
|---------|----------|-------|
| **Auth** | `src/infrastructure/auth/` | `AuthService` interface; `LocalAuthStub` when cloud disabled |
| **Sync state** | `src/infrastructure/sync/` | `SyncStateService` interface; `ReadingLocationEnvelope`; `LocalSyncStub` when cloud disabled |
| **Continuation logic** | `src/infrastructure/sync/continuation.ts` | Pure `findContinuationOffer()` — 7-day window, different device, different position |
| **Book source connectors** | `src/infrastructure/book-source/` | `BookSourceConnector` interface; empty registry when cloud disabled |

Feature flag: `VITE_CLOUD_ENABLED=true` (default off). Document byte resolution remains in `src/infrastructure/document-source/`.

## 29. Implementation Readiness

The product-level decisions required to begin implementation are now established:

- cloud-backed sources are the primary continuity path;
- local-first behaviour is invariant;
- account and device identity are defined conceptually;
- logical book/source identity is separated;
- reading location is format-neutral at the sync boundary;
- reading sessions and per-device tracks are defined;
- push/pull, cursor, queue, and idempotency semantics are defined;
- continuation is explicit and non-destructive;
- Google Drive is the first connector target;
- annotation synchronization is deferred.

The following remain implementation choices rather than product-definition blockers:

- backend technology/hosting;
- database/ORM;
- authentication provider;
- exact OAuth flow;
- exact API URLs/transport;
- token persistence mechanism;
- retention policy;
- recent-session threshold (client default: 7 days);
- device naming details;
- provider-specific content-version implementation;
- retry/backoff constants.

## 30. Post-MVP Gate: Annotation Sync

Annotation synchronization should begin only after reading-position synchronization is reliable.

Before starting annotation sync, verify:

- account identity is stable;
- logical book identity is stable;
- source/content versioning is sufficient;
- server revision/cursor semantics are proven;
- mutation idempotency is proven;
- cross-device session history is reliable.

Highlights and notes require a separate specification for creation, edit, deletion, anchoring, reflow, and conflict semantics.

## Revision History

- **2026-09-02 (sync):** Merged Phase 1.5 completion from `v1.0`; added §28.1 Client Contracts referencing shipped stub implementations.
- **2026-09-02:** Promoted from draft to implementation-ready Phase 2 MVP specification.
