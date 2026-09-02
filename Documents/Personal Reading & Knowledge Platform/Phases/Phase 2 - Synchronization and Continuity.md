# Phase 2 - Synchronization and Continuity

> [!summary]
> **Status:** Defined — implementation planning
> **Development branch:** `v2`
> **Product:** [[Product - Overview]]
> **Depends on:** [[Phase 1.5 - Local Source Model and Per-Device State]]
> **Primary specification:** [[Specification - Cross-Device Sync and Reading Continuity]]

## Goal

Introduce optional account-based cloud book sources and cross-device reading continuity without weakening the local-first reading model established by v1 and Phase 1.5.

The Phase 2 MVP is intentionally narrow:

1. Optional account identity.
2. At least one cloud-backed book source, with Google Drive as the preferred first connector.
3. Synchronized reading position/session metadata for cloud-backed books.
4. Explicit continuation from a recent session on another device.
5. Independent per-device reading tracks so synchronization does not silently overwrite local reading state.

The backend is an extension of the reader, not a prerequisite for reading.

## Development Branch

Phase 2 work happens on the **`v2`** branch. **`v1.0`** is frozen for production bug fixes only — no Phase 2 features land there.

| Branch | Purpose | Deploys to Pages |
|--------|---------|------------------|
| **`v1.0`** | Production / hotfixes | Yes (auto on push) |
| **`v2`** | Phase 2 development | No (until v2 ships) |
| **`main`** | Integration trunk; receives merges from feature branches | No |

Feature branches for Phase 2 should target **`v2`**, not `v1.0`.

## Product Invariants

These rules are non-negotiable for Phase 2:

- Logged-out users can continue using the complete local v1 experience.
- Local-only books remain readable without network access.
- Importing a local book never implies uploading it.
- A device always retains its local reading state even when sync is unavailable.
- Sync is asynchronous and must never block page/chapter navigation.
- Cross-device continuation is explicit; opening a book on another device must not silently replace that device's current position.
- Cloud source identity and logical book identity are distinct concepts.
- Reading position is the first synchronized entity; annotations are intentionally deferred.
- Synchronization must be idempotent and resilient to retries.
- No credentials, access tokens, refresh tokens, or other secrets may be committed to the repository or shipped in a static client bundle.

## Why This Phase Exists

Phase 1 established a performant local reader. Phase 1.5 established source metadata and per-device reading state. The next product value is continuity: a user should be able to stop reading on one device and continue from a synchronized cloud-backed source on another.

The cloud source is important because it solves two problems together:

- the second device can obtain the same book without requiring a local file transfer;
- the user's reading position can be associated with the same account and logical book.

A future state-only synchronization mode remains possible, but it is not the primary Phase 2 path because it requires a reliable way to establish that independently imported files are the same logical book.

## Book Source Model

Every book is associated with a source provider.

| Source | Phase 2 role | Content location | Cross-device continuity |
|---|---|---|---|
| Local | Existing/free | Current device | No |
| Google Drive | First connector | User's Drive | Yes |
| LUMA Cloud | Future paid source | LUMA-managed storage | Yes |
| App-managed upload | Future | LUMA-managed storage | Yes |
| Plugin source | Future | Third-party provider | Provider-dependent |

The client should depend on a `BookSourceProvider` abstraction rather than directly embedding Google Drive assumptions into the reader.

### Logical Book Identity

The same logical book must be distinguishable from a specific provider object.

Conceptually:

```text
LogicalBook
  ├── title / author / format metadata
  └── one or more BookSources
        ├── local source
        ├── Google Drive source
        └── future LUMA/plugin source
```

For Phase 2, the source identity must contain enough information to reopen the content through the selected provider. The exact persistent identifier format is implementation-defined by the connector.

## Account and Device Identity

### Account

An account represents the user's cloud/synchronization identity.

The client must not assume that the account identity is the same as a Google Drive identity. Provider identities are external credentials/identities; the LUMA account is the product identity.

### Device

Each installation/browser profile receives a stable device identifier stored locally.

A device record is used for:

- identifying the source of a reading session;
- presenting continuation choices such as `Desktop` or `Phone`;
- maintaining independent device tracks;
- diagnosing synchronization behaviour.

Device identity must not expose sensitive machine information. A human-readable device name may be editable later; the stable identifier should remain opaque.

## Reading State Model

Phase 2 introduces a format-neutral reading-location envelope.

Conceptual model:

```text
ReadingLocation
  ├── format: pdf | epub | future
  ├── locator: format-specific payload
  ├── progress: normalized 0..1
  └── optional human-readable context
```

Examples of format-specific locator payloads:

- PDF: page index/page number plus optional intra-page position.
- EPUB: stable chapter/document identifier plus text/CFI-like locator where supported.

The reader should continue using its existing format-specific location logic internally. The application layer maps that local representation to and from the synchronized `ReadingLocation` envelope.

## Reading Session Model

The MVP should synchronize session metadata rather than treating one mutable global cursor as the complete truth.

Conceptual entity:

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
  sequence/revision
  schemaVersion
```

The exact persistence model may differ between client and server, but the semantic fields above must be representable.

### Per-Device Tracks

Each device keeps its own latest local position. The synchronization service also retains enough session information to identify recent activity from other devices.

Example:

```text
Laptop track -> Chapter 12, 34%
Phone track  -> Chapter 7, 18%
Tablet track -> Chapter 20, 61%
```

Opening the book on the laptop still starts from the laptop's local track. A continuation surface can offer the tablet's recent position without destroying the laptop position.

## Synchronization Architecture

```text
┌─────────────────────────────── LUMA Client ───────────────────────────────┐
│                                                                           │
│  UI / Reader                                                             │
│       │                                                                   │
│       ▼                                                                   │
│  Application Services                                                     │
│       │                    │                                              │
│       ▼                    ▼                                              │
│  Local Repositories       Sync Coordinator                                │
│  (IndexedDB)                    │                                         │
│       │                         ├── pending mutation queue                │
│       │                         ├── push                                  │
│       │                         ├── pull                                  │
│       │                         └── cursor/retry state                     │
│       │                         │                                         │
│       ▼                         ▼                                         │
│  Local Reader State       Sync API / Backend                              │
│                                                                           │
│  BookSourceProvider ──────► Google Drive Connector                        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

The sync coordinator owns synchronization orchestration. Reader components should not make arbitrary network calls.

## Client Responsibilities

### Reader/UI

- Continue rendering and navigating using local state.
- Save reading position locally immediately.
- Surface cloud-source state and authentication state.
- Show continuation choices when synchronized remote sessions are available.

### Local Repository

- Persist local book/source metadata.
- Persist per-device reading state.
- Persist pending sync mutations.
- Persist the last successful remote cursor/revision.
- Remain usable offline.

### Sync Coordinator

- Detect authenticated/cloud-backed records eligible for sync.
- Convert local state changes into sync mutations.
- Queue mutations while offline.
- Retry safely after failures.
- Push pending changes.
- Pull remote changes using a persistent cursor/revision.
- Apply remote records without destroying unrelated local tracks.
- Record the last successful synchronization point.

### Book Source Provider

- Resolve/open content from a configured source.
- Report source capabilities and source identity.
- Hide provider-specific APIs from the reader/application layer.

## Synchronization State Machine

A cloud-backed reading record can conceptually move through:

```text
LOCAL_ONLY
   │ authenticated + eligible source
   ▼
PENDING_SYNC
   │ network available
   ▼
SYNCING
   ├── success ──► SYNCED
   └── failure ──► PENDING_SYNC / BACKOFF
                         │
                         └── retry
```

Authentication expiry is a separate condition. It must not invalidate local reading state.

## Local Pending Queue

The client should persist pending synchronization work rather than relying on an in-memory queue.

A queue item should conceptually contain:

- local mutation ID;
- account ID;
- logical book ID;
- source ID;
- device ID;
- mutation type/version;
- reading location/session payload;
- creation time;
- retry metadata.

The queue must support idempotent replay. A network timeout after server acceptance must not cause duplicate semantic sessions when the client retries.

## Push Semantics

The client sends new reading-session mutations to the synchronization service.

The server should:

1. authenticate the account;
2. validate the source/book relationship;
3. validate schema and content version fields;
4. accept the mutation using its idempotency key;
5. assign a server ordering/revision;
6. make the record visible to subsequent pull operations.

The server must not require the client to know its final global revision before submitting a mutation.

## Pull Semantics

The client maintains a persistent synchronization cursor.

A pull operation asks for records after the last successfully applied cursor. The client applies records transactionally where practical, then advances the cursor only after successful local application.

This prevents a crash between fetching and applying changes from causing permanent gaps.

The exact wire protocol can be REST initially; the semantic contract must not depend on the transport.

## Conflict Semantics

Phase 2 does **not** attempt to merge multiple devices into one globally authoritative cursor.

Instead, concurrent activity is represented as independent device/session tracks.

For example:

```text
Device A: 10:00 -> page 50
Device B: 10:02 -> page 12
Device A: 10:05 -> page 52
```

The service retains the sessions/tracks needed to determine recent activity. The continuation UI can select the most recent meaningful session while each device retains its own local position.

This avoids destructive last-write-wins behaviour where opening or reading on one device unexpectedly changes another device's local cursor.

### Recent Session Selection

The initial product policy should prefer:

1. sessions for the same logical book and synchronized source;
2. sessions newer than the local device's last known synchronized activity;
3. most recent `lastActivityAt`;
4. a session from another device when it represents meaningful progress.

The exact threshold for "recent" should be configurable rather than hard-coded into UI components.

## Content Version Handling

A reading location is meaningful only relative to a compatible document version.

A synchronized session should therefore carry a `contentVersion` or equivalent source revision.

If a cloud source changes:

- identical content should preserve the location where possible;
- incompatible content should not blindly apply an old location;
- the UI should explain when continuation is unavailable because the source version changed.

The exact content-version algorithm is connector-specific and remains an implementation decision.

## Continuation UX

### Logged Out

No authentication is required. Local books continue to behave as in v1.

### Logged In, Local Book

The book remains local-only. No upload is implied. Local state remains per-device.

### Logged In, Cloud Book

The library shows the source and synchronization status. Reading continues locally and sync occurs in the background.

### Opening on Another Device

If a recent remote session exists, present a non-destructive choice such as:

```text
Continue from Tablet — Chapter 12, 34%

[Continue there]   [Start from this device]
```

The exact visual design is implementation-specific, but the semantics are required:

- explicit choice;
- no silent overwrite;
- preserve the device-local position when the user chooses a fresh start.

## Cloud Source Lifecycle

The source lifecycle should be explicit:

```text
Not Connected
     │
     ▼
Connected
     │
     ├── source selected
     ▼
Available
     │
     ├── source access revoked / unavailable
     ▼
Degraded
     │
     └── reconnect
```

A source becoming temporarily unavailable must not delete local metadata or reading state.

## Google Drive Connector

Google Drive is the preferred first external source because it provides cloud-backed content without requiring LUMA to host book bytes in the first connector release.

The connector boundary should include operations conceptually equivalent to:

```text
connect()
listBooks()
getMetadata(sourceObjectId)
open(sourceObjectId)
getVersion(sourceObjectId)
disconnect()
```

The exact Google API calls, OAuth flow, token storage mechanism, and scopes must be implemented behind this boundary.

Use the narrowest feasible Google Drive permission scope. A browser/static client must not contain a confidential OAuth client secret.

## Backend Contract Direction

The backend contract should be designed before choosing the backend technology.

Conceptual operations:

```text
Authentication
  POST /auth/session
  POST /auth/logout
  GET  /me

Devices
  GET  /devices
  POST /devices
  PATCH /devices/{deviceId}

Books / references
  GET  /books
  GET  /books/{logicalBookId}

Sync
  POST /sync/push
  GET  /sync/pull?cursor=...
```

These are logical operations, not a commitment to exact URLs or REST. The client should depend on application interfaces such as:

```text
AuthService
BookSourceProvider
ReadingSyncService
```

## Conceptual Server Model

The minimal server-side model is:

```text
Account
  ├── Device*
  ├── BookReference*
  └── ReadingSession*

BookReference
  ├── logicalBookId
  ├── sourceType
  ├── sourceIdentity
  └── contentVersion

ReadingSession
  ├── accountId
  ├── deviceId
  ├── logicalBookId
  ├── sourceId
  ├── location
  ├── progress
  ├── activity timestamps
  └── server revision
```

This is deliberately conceptual. Backend technology, database schema, ORM, hosting, and deployment are open implementation decisions.

## Authentication and Security Requirements

- Authentication is required only for cloud/sync features.
- Local reading must work without an account.
- Authentication failure must not erase local state.
- Access tokens must be stored using the platform/browser mechanism appropriate to the chosen authentication architecture; exact implementation is deferred.
- Tokens/secrets must never be hard-coded in source, static assets, tests, documentation, or Git history.
- Google Drive access must use the minimum scope required by the connector.
- Provider authorization and LUMA account identity must remain conceptually separate.
- Server endpoints must authorize every account-scoped resource.
- A device must not be able to read another account's sessions by guessing IDs.

## Failure and Offline Behaviour

| Failure | Required behaviour |
|---|---|
| No network | Continue reading; queue sync work |
| Sync API unavailable | Continue reading; retry later |
| Push timeout | Retry idempotently |
| Pull failure | Keep previous cursor; retry later |
| Auth expired | Keep local state; request re-auth only for cloud operations |
| Cloud source unavailable | Preserve local metadata/state; show degraded source state |
| Source deleted | Do not silently delete local reading history |
| Incompatible content version | Do not blindly apply remote location |

## Data Synchronization Boundary

### Phase 2 MVP synchronizes

- logical book reference needed for continuity;
- cloud source identity/metadata required to reopen the source;
- reading position/location;
- normalized progress;
- device/session metadata;
- timestamps and synchronization revisions/cursors.

### Phase 2 MVP does not synchronize

- PDF/EPUB bytes for local books;
- bookmarks;
- highlights;
- notes;
- arbitrary local UI preferences;
- browser/device private data;
- application caches;
- credentials or provider secrets.

## Testing Strategy

### Unit Tests

Cover:

- reading-location serialization/deserialization;
- PDF/EPUB location mapping;
- source identity mapping;
- sync queue enqueue/dequeue;
- idempotency handling;
- cursor advancement;
- retry/backoff decisions;
- recent-session selection;
- content-version compatibility;
- independent per-device tracks.

### Integration Tests

Cover:

- local state + sync coordinator;
- push followed by pull;
- duplicate mutation submission;
- interrupted pull before cursor advancement;
- authentication expiry;
- cloud source failure;
- concurrent activity from two devices.

### End-to-End Tests

At minimum:

1. Logged-out local PDF reading remains functional.
2. Logged-out local EPUB reading remains functional.
3. User connects a cloud source.
4. Device A reads a cloud-backed book and syncs.
5. Device B opens the same cloud-backed book.
6. Device B sees a continuation option.
7. Choosing continuation opens the synchronized location.
8. Choosing start-fresh preserves Device B's local track.
9. Device A's track remains intact after Device B activity.
10. Offline reading continues and later synchronizes.

## Suggested Implementation Milestones

### M1 — Contracts and domain model

- Finalize `ReadingLocation` envelope.
- Finalize logical book/source identity model.
- Define `ReadingSession` semantics.
- Define client `AuthService`, `BookSourceProvider`, and `ReadingSyncService` boundaries.
- Add serialization and unit-test coverage.

### M2 — Local sync infrastructure

- Add stable device identity.
- Add local sync metadata store.
- Add persistent pending mutation queue.
- Add persistent remote cursor.
- Implement sync coordinator without a real backend.

### M3 — Authentication

- Select authentication architecture/provider.
- Implement optional login/logout/session restoration.
- Keep all local reader paths independent from authentication.

### M4 — Backend sync API

- Implement account/device/session persistence.
- Implement idempotent push.
- Implement cursor-based pull.
- Implement authorization boundaries.
- Add integration tests for concurrent devices.

### M5 — Google Drive source

- Implement OAuth/provider connection.
- Implement source discovery and metadata.
- Implement book opening through provider abstraction.
- Implement source version detection.

### M6 — Cross-device continuity

- Connect cloud source to logical book model.
- Sync reading sessions.
- Implement recent-session selection.
- Add explicit continuation UX.
- Verify independent device tracks.

### M7 — Reliability and security hardening

- Offline/retry testing.
- Auth-expiry testing.
- Duplicate request testing.
- Cursor recovery testing.
- Source revocation handling.
- Security review of browser bundle and repository history.

### M8 — Acceptance release

- Desktop + phone acceptance demo.
- Verify logged-out regression behaviour.
- Verify local-only offline behaviour.
- Verify cloud source continuity.
- Document known limitations and deferred work.

## Phase 2 Exit Criteria

Phase 2 MVP is complete when:

- The local reader remains fully usable without an account.
- A user can authenticate without exposing secrets in the client.
- A supported cloud source can provide a book on more than one device.
- Device A can synchronize a reading session.
- Device B can discover that recent session.
- Device B can explicitly continue from it.
- Starting fresh on Device B does not destroy Device A's track.
- Offline local reading works during sync outages.
- Sync retries are idempotent.
- Pull cursors survive application restarts without gaps.
- Source/content version mismatches do not silently corrupt reading position.
- Automated tests cover the critical sync and continuity paths.

## Deferred / Explicitly Out of Scope

- Mandatory login.
- Automatic upload of local books.
- LUMA-hosted book storage as a Phase 2 prerequisite.
- Bookmark/highlight/note synchronization.
- Full annotation merge semantics.
- Generic state-only synchronization of independently imported local files.
- AI features.
- Social features.
- OCR and format conversion.
- Plugin ecosystem beyond the connector boundary.
- Final billing implementation.
- Offline cloud-source download semantics unless separately specified.

## Open Implementation Decisions

The following should be resolved during implementation without changing the product invariants:

- Backend technology and hosting.
- Authentication provider/architecture.
- Exact Google Drive OAuth flow and scopes.
- Token/session persistence strategy.
- Database schema and migration strategy.
- Sync retention policy.
- Recent-session threshold (client default: 7 days in `src/infrastructure/sync/continuation.ts`).
- Device naming UX.
- Content-version strategy per format/provider.
- Cloud source caching policy.
- Rate limits and retry/backoff values.
- Observability and error reporting.
- Pricing/feature-flag enforcement.

## Relationship to Later Phases

Phase 2 establishes the synchronization infrastructure needed for later annotation synchronization.

A future annotation phase can reuse:

- account identity;
- device identity;
- logical book identity;
- source identity;
- persistent sync cursors;
- idempotent mutation handling;
- per-device history;
- server revision ordering.

Annotation synchronization must be specified separately because highlight and note merge semantics are materially more complex than reading-position continuity.

## Revision History

- **2026-09-02 (branch):** Phase 2 development branch set to `v2`; `v1.0` reserved for production bug fixes.
- **2026-09-02 (sync):** Merged Phase 1.5 completion from `v1.0` — client contract stubs shipped; 7-day continuation default documented.
- **2026-09-02:** Expanded from product-level proposal into implementation-oriented Phase 2 plan. Defined cloud-backed continuity as the primary path, local-first invariants, source/account/device identity, reading-location/session models, sync architecture, queue/cursor semantics, conflict policy, Google Drive connector boundary, backend contract direction, security requirements, failure behaviour, testing strategy, milestones, and exit criteria.
