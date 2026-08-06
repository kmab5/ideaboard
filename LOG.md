# IdeaBoard — Update Log

The running record of what shipped, what's next, and the full history. The
newest release is summarized at the top; the detailed changelog is at the
bottom, newest first. The version here tracks `package.json` and
`src/lib/version.ts`.

**Current version: `0.6.0`** · Status: **MVP complete.** Full security audit passed; 0 known dependency vulnerabilities.

---

## Latest updates — v0.6.0

- **MVP complete.** The last open items — E2E coverage for auth flows and board operations — are now implemented (13 new Playwright tests across `e2e/auth.spec.ts` and `e2e/board.spec.ts`).
- **Full security audit conducted; 7 findings fixed.** Including a **high-severity cross-tenant flaw** that let any authenticated user delete or overwrite another user's note images. Documented in `SECURITY.md`.
- **Dependency vulnerabilities: 19 production / 25 total → 0.**
- **Account deletion implemented** — it was promised in the Privacy Policy, Terms, and Guide but did not exist. Now a real Danger Zone in Settings backed by a server route.
- **Security headers added** (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy); `X-Powered-By` removed.

> ⚠️ **Action required after deploying:** run `docs/database/migrations/001_security_hardening.sql` in Supabase, and set `SUPABASE_SERVICE_ROLE_KEY` in Vercel. The storage vulnerability lives in database policies — application code alone does not close it.

## Upcoming / planned

- **Nonce-based CSP** to remove `'unsafe-inline'`/`'unsafe-eval'` from `script-src` (the main outstanding hardening item).
- **CI hardening** — add `pnpm audit` and Dependabot to the pipeline; run E2E against a seeded test project.
- **Components, next steps** — an optional *selected value* for list components, and a note "show values" toggle previewing `{{fuel}}` as its current value.
- **Optional** — error monitoring (Sentry), application-level rate limiting, snap-to-grid.
- **Post-MVP (v1.1+)** — conditional & technical notes, containers, multi-board per story, export/import; then real-time collaboration and sharing (v1.2).

---

## Changelog

### [0.6.0] — 2026-08-06

**Security audit (see `SECURITY.md` for the full report)**
- **IDB-001 (High):** `note-attachments` storage policies checked only that the caller was authenticated, so any user could delete or overwrite **any other user's** note images. Uploads now namespace under `<user_id>/…` and policies enforce folder ownership.
- **IDB-002 (Medium):** buckets had no server-side size/MIME limits, making the client-side upload validation bypassable. Limits added; SVG excluded.
- **IDB-003 (Medium):** no security headers. Added CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; removed `X-Powered-By`.
- **IDB-004 (Medium, compliance):** account deletion was promised in legal docs but unimplemented. Added `POST /api/account/delete` (session-derived target, storage cleanup, cascade delete) plus a type-`DELETE`-to-confirm Danger Zone.
- **IDB-005 (Low):** added a same-origin check to the destructive delete endpoint.
- **IDB-006 (Low):** broadened `.gitignore` to cover all `.env.*` files.
- **IDB-007 (High, aggregate):** dependency vulnerabilities reduced from 19 production / 25 total to **0**, via `pnpm.overrides`, direct bumps (`uuid`, `@dicebear/*`), and an explicit `vite` pin.
- Verified clean: RLS on all 11 tables, no `dangerouslySetInnerHTML`/`eval`, no raw-HTML Markdown rendering, parameterized queries, server-verified sessions, open-redirect guard, anti-enumeration on password reset, and no committed secrets.

**MVP completion**
- Added `e2e/auth.spec.ts` (7 tests: registration validation, generic login errors, anti-enumeration, protected-route redirects, open-redirect guard, logout, deletion confirmation).
- Added `e2e/board.spec.ts` (6 tests: note creation, Markdown rendering, auto-save across reload, undo, component creation, persistence across navigation).
- Added `e2e/helpers.ts`; authenticated suites skip unless `E2E_EMAIL`/`E2E_PASSWORD` are set.

**Docs**
- New `SECURITY.md` (threat model, findings, verified-secure matrix, known limitations, deploy checklist).
- New `docs/database/migrations/001_security_hardening.sql`.
- `MVP.md` marked complete.

### [0.5.0] — 2026-08-04

**Components**
- Added a choices editor for `list` components (add / rename / reorder / remove), wired into both the create and edit flows in the components panel.
- Component cards now render list choices as chips instead of an opaque "[N items]" count; value formatting joins list items.

**Guide**
- New `/guide` route documenting getting started, the canvas, notes, connections, drawings, components, references, undo/redo, and account settings, with a sticky table of contents and a version badge.
- Added "Guide" to the marketing header and footer.

**Project**
- Introduced `src/lib/version.ts` as the version source of truth; bumped `package.json` to `0.5.0`.
- Added this `LOG.md`.
- Updated `docs/MVP.md` to reflect real status.

### [0.4.0] — 2026-08-02

**Marketing surfaces overhaul**
- Rebuilt the landing, privacy, and terms pages around the product's own canvas aesthetic (dot grid, real note colors, drawn connections), with honest, audience-specific copy for interactive-fiction authors.
- Removed prior anti-patterns (gradient text, emoji-as-icons, identical card grids) and false feature claims.
- Added shared marketing components (`SiteHeader`, `SiteFooter`, `CanvasHero`, `LegalPage`) and a marketing CSS layer with reduced-motion-safe entrance choreography.
- **Fixed the app font**: Geist was loaded but never applied (Tailwind fell back to system fonts); wired `font-sans`/`font-mono` to Geist. Styled the legal docs directly (the `@tailwindcss/typography` plugin was never installed).

### [0.3.1] — 2026-08-02

- Fixed a production build failure on Vercel: `metadataBase` threw on a scheme-less `NEXT_PUBLIC_APP_URL`. Added `getSiteUrl()` to normalize the value (adds a scheme, falls back to `VERCEL_URL` then localhost) so a misconfigured env var can't break the build.

### [0.3.0] — 2026-08-02

**Correctness & robustness**
- Undo/redo of note **move and resize** now applies visually (the canvas reconciles position/size from state without fighting live drags).
- Save failures now surface via toast and roll back the optimistic change across note/connection create, update, and delete.
- Added a global error boundary (`app/error.tsx` + `app/global-error.tsx`).

**@ References (Phase 10) — completed**
- `@` autocomplete in the note editor inserts linked `{{name}}` tokens.
- Valid references render as clickable chips (open the panel); invalid ones are flagged.
- Component panel shows "used in N notes", reference lists with click-to-navigate, and rename propagation across notes.
- Best-effort sync of the `component_references` table on content save.

**Maintainability & performance**
- Centralized note/connection palettes, sizes, and delays in `lib/constants.ts`.
- `getViewportCenter` uses React Flow's `screenToFlowPosition`.
- Extracted a shared `ensureProfile()` helper (removed triplicated profile creation).
- Parallelized board data loading (5 sequential round-trips → 3).

### [0.2.0] — 2026-08-02

**Framework & security hardening**
- Upgraded Next.js 14 → 15 (kept React 18).
- Fixed an OAuth open-redirect (`sanitizeRedirectPath`), added image-upload validation for notes and avatars, and corrected an avatar bug (DiceBear preview vs. saved URL mismatch) via local SVG data-URIs.
- Removed an unused dependency that was the main vulnerability source.

**Tooling**
- Added Vitest unit tests, a Playwright smoke test, GitHub Actions CI (lint → type-check → test → build), Husky + lint-staged, and pinned the package manager.

### [0.1.0] — 2026-01-14

- Initial MVP build: authentication, profiles & avatars, story management, the infinite canvas, notes (Markdown), drawings, image attachments, connections, the components system, auto-save, and undo/redo (MVP Phases 1–9 and 11).
