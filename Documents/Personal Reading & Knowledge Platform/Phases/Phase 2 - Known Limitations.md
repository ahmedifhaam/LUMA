# Phase 2 — Known Limitations

> [!summary]
> **Status:** Living document (M5–M8)
> **Branch:** `v2`
> **Related:** [[Phase 2 - Synchronization and Continuity]]

## Shipped in Phase 2 MVP path

- Optional LUMA account auth (dev username/password API).
- Google Drive connector with `drive.file` scope (Picker / mock list in CI).
- Cross-device reading continuation with explicit Continue / Start-from-this-device.
- Durable sync queue + cursor-based pull; contentVersion carried on sessions.
- Auth expiry clears the client session and stops sync retries.

## Known limitations

1. **CI uses Drive mock** (`GOOGLE_MOCK=true` by default in compose). Real Google OAuth is for local/manual and deployed environments with secrets.
2. **Google Picker may require `VITE_GOOGLE_API_KEY`** in some GCP projects; OAuth client ID alone is not always enough for Picker.
3. **Annotations are not synchronized** (bookmarks, highlights, notes stay per-device).
4. **Local books do not sync** — only cloud-backed sources (`google-drive`, future `luma-cloud` / `app-storage`).
5. **Drive reopen is cache-first** — bytes downloaded at import are stored in IndexedDB; if the local cache is cleared, re-import from Drive is required.
6. **Content-version policy is coarse** — mismatched Drive revisions block continuation rather than remapping locations.
7. **Dev JWT secret** defaults to `dev-secret-change-in-prod` — must be overridden for any shared deployment.
8. **No production deploy target for `main` yet** — Phase 2 ships on `v2`; releases will PR `v2` → `main` once hosting is configured.
9. **Phone acceptance** is covered by device-name simulation in e2e, not a dedicated mobile viewport tour yet.
10. **Billing / LUMA Cloud paid tier** UI is promotional only.

## Deferred (explicit)

See Phase 2 brief “Deferred / Explicitly Out of Scope”: annotation sync, mandatory login, automatic upload of local books, LUMA-hosted storage as a prerequisite, AI/social features.

## Security notes

- Never commit `GOOGLE_CLIENT_SECRET` or `.env.local`.
- Client bundle may include `VITE_GOOGLE_CLIENT_ID` (public) only — never the client secret.
- Tokens for Drive are stored server-side on the LUMA account row.
