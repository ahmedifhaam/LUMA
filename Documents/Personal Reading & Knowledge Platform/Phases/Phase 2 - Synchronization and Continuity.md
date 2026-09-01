# Phase 2 - Synchronization and Continuity

> [!summary]
> **Status:** Proposed
> **Product:** [[Product - Overview]]

## Goal

Extend the local-first reading experience so independently maintained devices can synchronize relevant reading state and allow the user to continue reading on another device.

## Why This Phase Exists

Phase 1 deliberately establishes local ownership and offline usefulness without a backend. The next product need is continuity: the same user should be able to stop reading on one device and continue on another without turning the cloud into a prerequisite for reading.

## Expected Outcome

A user can maintain local reading state independently on multiple devices. When synchronization is available, relevant changes can be exchanged and the user can discover a recent reading session from another device and continue from its reading location.

## Included Capabilities

- [[Capability - Cross-Device Reading Continuity]]
- Synchronization of relevant local reading state.

## Included Specification

- [[Specification - Cross-Device Sync and Reading Continuity]] — Draft; not implementation-ready.

## Explicitly Excluded

- Making the backend mandatory for basic reading.
- Requiring every book to be uploaded to the cloud.
- Assuming cloud book storage is necessary for state synchronization.
- Treating synchronization as a replacement for local persistence.

## Deferred

- Cloud storage of book content.
- Final cloud library/content model.
- Cross-book knowledge synchronization beyond the reading state required for continuity.

## Dependencies

- [[Capability - Local-First Reading State]]
- [[Decision - Git-Like Synchronizable Local State]]
- [[Decision - Cloud as an Extension of Local Reading]]
- [[Phase 1 - Local Reading Foundation]]

## Exit Criteria

Not yet defined at implementation level. At product level, Phase 2 should demonstrate that local reading remains independent while synchronized state can converge sufficiently to support reliable cross-device continuation.

## Open Questions

- Exact synchronization semantics.
- Conflict/convergence behaviour for independently changed state.
- Account and device identity model.
- Which reading-state entities synchronize.
- Logical book identity across devices.
- Format-specific reading-location representation.
- Whether and how annotations synchronize.
- Definition of the most recent/relevant reading session.
