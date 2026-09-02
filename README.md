# LUMA

Local-first, high-performance reading for very large documents — starting with **PDF**.

LUMA is the working implementation of the **Personal Reading & Knowledge Platform**,
**Phase 1 – Local Reading Foundation**. The full product brief lives in
[`Documents/Personal Reading & Knowledge Platform`](./Documents/Personal%20Reading%20&%20Knowledge%20Platform),
copied from the product knowledge base. Read
[`Phases/Phase 1 - Local Reading Foundation.md`](./Documents/Personal%20Reading%20&%20Knowledge%20Platform/Phases/Phase%201%20-%20Local%20Reading%20Foundation.md)
before making architectural changes.

## Phase 1 in one paragraph

The smallest coherent, browser-first reading app for local books. It must open
unusually large PDFs (target: ~15,000 pages) without rendering every page, keep
reading state and annotations locally (offline, no backend), and hide the PDF
engine behind a document abstraction so future formats/native shells can reuse the
domain. See the brief for the full scope, performance targets, and acceptance
criteria.

## Tech stack

TypeScript · React · Vite · PWA · PDF.js · IndexedDB · Zustand · Vitest ·
React Testing Library · Playwright · ESLint · Prettier.

## Getting started

Requirements: Node.js >= 20.

```bash
npm ci          # install exact, locked dependencies
npm run dev      # start the dev server at http://localhost:5173
```

## Scripts

| Command                | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Start the Vite dev server (port 5173).              |
| `npm run build`        | Type-check and build the production PWA to `dist/`. |
| `npm run preview`      | Preview the production build (port 4173).           |
| `npm run typecheck`    | Project-wide TypeScript check (no emit).            |
| `npm run lint`         | ESLint over the codebase.                           |
| `npm run format`       | Apply Prettier formatting.                          |
| `npm run format:check` | Verify formatting without writing.                  |
| `npm run test`         | Run unit tests (Vitest) once.                       |
| `npm run test:watch`   | Run unit tests in watch mode.                       |
| `npm run test:e2e`     | Run Playwright end-to-end tests (see note).         |
| `npm run test:feature-guide` | Capture screenshots + video for the [v1 feature guide](./docs/LUMA-v1-Feature-Guide.md). |
| `npm run test:e2e:phase2` | Phase 2 e2e (starts Docker Compose API stack, screen recordings). |
| `npm run docker:up`    | Start local Postgres + LUMA API (`docker compose up -d --wait`). |
| `npm run docker:down`  | Stop the local API stack.                           |
| `npm run dev:cloud`    | Vite dev server with Phase 2 cloud features enabled. |

> **Playwright browsers:** `npm run test:e2e` requires browsers once per machine:
> `npx playwright install chromium`. The dev server is started automatically by
> the Playwright config.

## Phase 2 local stack (v2 branch)

Phase 2 adds an optional API for auth and reading-state sync. The free local
reader still works without it.

**Requirements:** Docker (for Postgres + API).

```bash
cp .env.example .env.local   # optional reference
npm run docker:up            # Postgres :5432, API :3000
npm run dev:cloud            # Vite with cloud features at :5173
```

Seeded dev account (when `SEED_TEST_USER=true` in compose): **`testuser` / `testpass`**

```bash
npm run test:e2e:phase2      # Playwright + screen recordings
```

Recordings are saved to `e2e/artifacts/pr-videos/`. On PRs to `v2`, CI uploads
them as workflow artifacts and posts a comment with download links.

| Service  | URL |
| -------- | --- |
| Frontend | http://localhost:5173 |
| API      | http://localhost:3000 |
| Postgres | localhost:5432 (`luma` / `luma`) |

## What works today (Phase 1 vertical slice)

- Import a local PDF into a persistent library (IndexedDB).
- Content-based document identity (SHA-256): re-importing the same file — even
  renamed — resolves to the same logical book and keeps its reading state.
- Virtualized reader: only the visible page window (plus a small overscan) is
  rendered, so page count does not drive DOM node count. Jumping directly to a
  distant page does not render intervening pages.
- Direct page navigation, scroll reading, and a reading-progress indicator.
- Reading position is persisted (debounced) and restored on reopen.
- Image-only / scanned PDFs are detected and show the required red warning banner.
- Installable PWA app shell for offline use.

See the **[LUMA v1.0 Feature Guide](./docs/LUMA-v1-Feature-Guide.md)** for a screenshot- and video-backed tour of every capability.

The document engine (PDF.js), file source, and persistence are each behind
adapters, per the Phase 1 architecture rules. Remaining Phase 1 capabilities
(in-book search index, bookmarks/highlights/notes UI, the ~15,000-page
performance harness, optional EPUB) build on these seams.

## Project structure

```text
src/
├── app/                 # App shell, routing, global styles
├── domain/              # Engine-agnostic contracts (document, book)
├── application/         # Use cases + stores (library, reader, identity)
├── infrastructure/      # PDF.js engine, document source, IndexedDB persistence
├── features/            # UI features (library, reader)
└── tests/               # Test setup
Documents/               # Product knowledge base (Phase 1 brief and specs)
e2e/                     # Playwright end-to-end tests
```
