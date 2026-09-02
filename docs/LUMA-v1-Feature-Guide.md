# LUMA v1.0 — Feature Guide

LUMA is a local-first reading app for large PDFs and EPUBs. This guide walks through every major capability in **v1.0**, with screenshots and a full walkthrough video captured automatically by Playwright.

> **Regenerate assets:** `npm run test:feature-guide`  
> Screenshots land in `docs/assets/feature-guide/screenshots/` and the video in `docs/assets/feature-guide/luma-v1-feature-tour.webm`.

---

## Full walkthrough video

<video src="./assets/feature-guide/luma-v1-feature-tour.webm" controls width="1280">
  Your browser does not support embedded video. [Download the tour](./assets/feature-guide/luma-v1-feature-tour.webm).
</video>

---

## 1. Library

LUMA stores books locally in the browser (IndexedDB). No account or network connection is required.

### Empty library

When you first open LUMA, the library is empty. Use **+ Add Book** to import a PDF or EPUB from your device.

![Empty library](./assets/feature-guide/screenshots/01-library-empty.png)

### Importing books

After importing a PDF, the book appears in the grid with its title, page count, and file size. Re-importing the same file (even under a different name) resolves to the same logical book and keeps reading state.

![Library with PDF](./assets/feature-guide/screenshots/02-library-pdf-imported.png)

### PDF and EPUB together

LUMA supports both PDF and EPUB. EPUB covers show a generated thumbnail when available.

![Library with PDF and EPUB](./assets/feature-guide/screenshots/03-library-pdf-and-epub.png)

### Scanned PDF detection

Image-only (scanned) PDFs are detected automatically and marked with a **Scanned** badge. Text search, selection, and highlighting may be unavailable for these documents.

![Scanned badge](./assets/feature-guide/screenshots/04-library-scanned-badge.png)

### Full library grid

Multiple books can coexist in the library. Each card offers **Open** and **Remove** actions.

![Full library](./assets/feature-guide/screenshots/05-library-full-grid.png)

---

## 2. PDF reader

### Default reading view

Opening a book launches the reader with a progress bar, toolbar, and bottom display controls. Only the visible page window is rendered — page count does not drive DOM size.

![PDF reader — default](./assets/feature-guide/screenshots/06-reader-pdf-default.png)

### Page navigation

Use the **‹ ›** buttons, keyboard arrows, or the **Go to page** field to move through the document. Reading position is saved automatically.

![PDF reader — page 2](./assets/feature-guide/screenshots/07-reader-pdf-page-two.png)

### Double-page spread

**Double** view shows two facing pages side by side — useful for books and magazines. Navigation advances by spread (pages 1–2 → 3–4).

![Double-page view](./assets/feature-guide/screenshots/08-reader-double-view.png)

### Continuous scroll

**Continuous** view stacks all pages vertically for scroll-based reading, similar to a web article.

![Continuous view](./assets/feature-guide/screenshots/09-reader-continuous-view.png)

### Zoom

Zoom in and out with the **+** / **−** controls in the bottom bar. Zoom level is shown as a percentage.

![Zoomed view](./assets/feature-guide/screenshots/10-reader-zoomed.png)

### Reading themes

Four themes are available: **Light**, **Sepia**, **Dark**, and **Slate**. Theme choice is remembered per session.

![Sepia theme](./assets/feature-guide/screenshots/11-reader-sepia-theme.png)

### Scanned PDF warning

When you open a scanned document, a red banner explains that text features may not work.

![Scanned warning](./assets/feature-guide/screenshots/18-reader-scanned-warning.png)

---

## 3. Table of contents

PDFs with an embedded outline (and all EPUBs) expose a **Contents** panel. Click any entry to jump directly to that section.

![Contents panel](./assets/feature-guide/screenshots/12-reader-contents-panel.png)

---

## 4. In-book search

Open the **Search** panel and type a query. LUMA highlights matching pages and lets you jump to each result. Search runs locally — no server round-trip.

![Search results](./assets/feature-guide/screenshots/13-reader-search-results.png)

---

## 5. Bookmarks

Click the bookmark icon in the toolbar to save the current page. All bookmarks appear in the **Bookmarks** panel for quick navigation.

![Bookmarks panel](./assets/feature-guide/screenshots/14-reader-bookmarks-panel.png)

---

## 6. Notes and highlights

The **Notes** panel lists annotations for the current book — highlights, notes, and bookmarks in one place.

![Notes panel](./assets/feature-guide/screenshots/15-reader-notes-panel.png)

---

## 7. Keyboard shortcuts

Press **?** in the reader (or use the **Keyboard shortcuts** button in the library header) to see all available shortcuts. Shortcuts are ignored while typing in a form field.

| Key | Action |
|-----|--------|
| `←` `→` | Previous / next page |
| `Home` `End` | First / last page |
| `+` `−` | Zoom in / out |
| `?` | Open shortcuts help |

![Keyboard shortcuts](./assets/feature-guide/screenshots/16-keyboard-shortcuts-help.png)

![Keyboard navigation](./assets/feature-guide/screenshots/17-reader-keyboard-navigation.png)

---

## 8. EPUB reader

### Chapter rendering

EPUB chapters render as reflowable HTML inside the same reader shell used for PDFs.

![EPUB chapter one](./assets/feature-guide/screenshots/19-epub-chapter-one.png)

### Chapter navigation

Use the **Contents** panel to switch between chapters. Page numbers reflect chapter position.

![EPUB chapter two](./assets/feature-guide/screenshots/20-epub-chapter-two.png)

### Text size

EPUB text size can be increased or decreased independently of page zoom.

![EPUB text size](./assets/feature-guide/screenshots/21-epub-text-size.png)

### Text highlighting

Select text in an EPUB chapter and click **Highlight**. Highlights are anchored to the text content, so they survive font-size changes and reflow.

![EPUB highlight](./assets/feature-guide/screenshots/22-epub-highlight.png)

Highlights appear in the **Notes** panel alongside other annotations.

![EPUB notes with highlight](./assets/feature-guide/screenshots/23-epub-notes-with-highlight.png)

---

## 9. Continue reading

The library shows a **Continue Reading** card for the most recently opened book, with progress percentage and a one-click resume.

![Continue reading](./assets/feature-guide/screenshots/24-library-continue-reading.png)

---

## 10. Fit modes and layout summary

| Control | Options | Description |
|---------|---------|-------------|
| **View** | Single · Double · Continuous | Page layout mode |
| **Fit** | Width · Screen | How pages scale to the viewport |
| **Zoom** | 50% – 200% | Fine-grained scale adjustment |
| **Theme** | Light · Sepia · Dark · Slate | Background and text colors |
| **Text size** | EPUB only | Reflowable font scaling |

---

## Technical notes

- **Local-first:** All books, reading state, bookmarks, highlights, and notes live in IndexedDB.
- **Content identity:** Books are deduplicated by SHA-256 hash of file bytes.
- **PWA:** LUMA installs as a progressive web app for offline use.
- **Test coverage:** The tour in `e2e/feature-guide.spec.ts` exercises the flows shown above and is the source of truth for these screenshots.

---

## What's next (Phase 2)

Cross-device sync and reading continuity are planned for Phase 2. See the [Phase 2 brief](../Documents/Personal%20Reading%20&%20Knowledge%20Platform/Phases/Phase%202%20-%20Synchronization%20and%20Continuity.md) for the draft specification.
