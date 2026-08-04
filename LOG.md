# IdeaBoard — Update Log

The running record of what shipped, what's next, and the full history. The
newest release is summarized at the top; the detailed changelog is at the
bottom, newest first. The version here tracks `package.json` and
`src/lib/version.ts`.

**Current version: `0.5.0`** · Status: MVP feature-complete, hardening & test depth remaining.

---

## Latest updates — v0.5.0

- **List components are now fully editable.** Open any `list` component to add, rename, reorder, and remove its choices; choices also show as chips on the component card.
- **New Guide page (`/guide`)** covering every implemented feature, linked from the site header and footer. It carries the current version and is updated each release.
- **Versioning added to the repo** — a single source of truth in `src/lib/version.ts`, synced with `package.json`, plus this `LOG.md`.
- **Docs updated** — `MVP.md` milestones reconciled with what's actually shipped (Phase 10 complete, Phase 12 mostly complete, deployment live).

## Upcoming / planned

- **Test depth** — broaden automated coverage beyond unit tests + smoke E2E: auth flows, board CRUD, and component/reference flows.
- **Components, next steps** — optional *selected value* for list components (an active choice, not just the set), and a note "show values" toggle that previews `{{fuel}}` as its current value.
- **Optional polish** — error monitoring (Sentry), snap-to-grid on the canvas.
- **Post-MVP (v1.1+)** — conditional & technical notes, containers, multi-board per story, export/import; then real-time collaboration and sharing (v1.2).

---

## Changelog

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
