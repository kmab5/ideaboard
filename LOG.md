# IdeaBoard — Update Log

The running record of what shipped, what's next, and the full history. The
newest release is summarized at the top; the detailed changelog is at the
bottom, newest first. The version here tracks `package.json` and
`src/lib/version.ts`. Starting with v0.7.0, each changelog entry also lists
the files that were added or modified.

**Current version: `0.9.0`** · Status: **MVP complete; v1.1 underway.** Conditional Notes, Technical Notes, and Multi-Board shipped.

---

## Latest updates — v0.9.0

- **Multi-board per story shipped.** A story can now hold as many boards as you need, switchable from a tab strip under the header — split a project into "Act 1", "Side Quests", "Characters", and so on.
- Create, rename (double-click a tab), **duplicate** (copies every note and connection), and delete boards. A story always keeps at least one board.
- The open board lives in the URL (`?b=<boardId>`), so boards are linkable and survive a refresh.
- Components stay story-level, so they're shared across every board — define `gold` once, use it anywhere.

## Upcoming / planned

- **Containers** (next in the v1.1 order), then **Export/Import**.
- **Board linking** (`#boardname`) and cross-board navigation — PRD P0 features that build on multi-board; deferred to their own pass along with board folders, search, and the board-overview dashboard.
- **Nonce-based CSP** to remove `'unsafe-inline'`/`'unsafe-eval'` from `script-src`.
- **Closing the write-path rate-limit gap** would require proxying board mutations through Next.js API routes — tracked as future work.
- **Components, next steps** — an optional *selected value* for list components, and a note "show values" toggle previewing `{{fuel}}` as its current value.
- **Optional** — error monitoring (Sentry), snap-to-grid, one-click undo for a technical note's "Apply".
- **v1.2** — real-time collaboration and sharing, then version history.

---

## Changelog

### [0.9.0] — 2026-08-06

**Multi-board per story (third v1.1 feature)**
- A story now loads all of its boards instead of only the first. The open board is tracked in the URL as `?b=<boardId>`, making boards linkable and refresh-safe; an unknown or missing id falls back to the story's first board.
- New `BoardTabs` tab strip: switch, create, rename (double-click or menu), duplicate, and delete boards.
- **Duplicate** clones a board with all of its notes and connections, remapping every id and rewiring connections to the cloned notes. Connections with a missing endpoint are dropped rather than left dangling. Extracted to `src/lib/boards.ts` and unit-tested (9 tests) since it's the most error-prone part of the feature.
- Switching boards swaps canvas data in place rather than reloading the page; `<Canvas>` is keyed on board id so React Flow rebuilds cleanly instead of reconciling two unrelated node sets. A spinner overlays the canvas during the swap.
- Deleting the last board is blocked in both the UI and the handler, so a story can never end up with zero boards. Board deletion cascades to its notes and connections but leaves the story's components untouched.
- Boards state is held in the board page rather than a Zustand store, since only the page and tab bar read it (components differ — deeply nested nodes consume those).
- No migration needed: the `boards` table already supported multiple rows per story.

**Docs**
- Guide updated with a new "Boards" section.
- `MVP.md`: v1.1 progress table updated, multi-board implementation notes added, and the now-obsolete "One board per story" MVP row annotated.

**Files changed**
- Added: `src/components/board/board-tabs.tsx`, `src/lib/boards.ts`, `src/lib/boards.test.ts`
- Modified: `src/app/(board)/board/[id]/page.tsx`, `src/components/board/index.ts`, `src/app/guide/page.tsx`, `docs/MVP.md`, `src/lib/version.ts`, `package.json`

### [0.8.0] — 2026-08-06

**Technical Notes (second v1.1 feature)**
- New note type `technical`: define one or more updates against a component — `set`, `add`, `subtract`, `multiply`, `toggle`, `append` — scoped to what makes sense for the component's type (e.g. booleans only get `set`/`toggle`; lists/strings get `append`).
- Each update previews live: the component's current value and what it would become (e.g. `15 → 25`), per PRD 4.2.1.4's "Change Preview" requirement.
- **Apply** writes the computed values to the real components through the same path as editing them in the Components panel — deliberately explicit and manual (unlike conditional notes' automatic live evaluation), since this is a testing aid for walking a path, not a runtime engine.
- Updates referencing a deleted component show an inline warning, matching the pattern already used for conditional-note branches and note references.
- Added `Alt+N` shortcut (checked via `e.code`, not `e.key`, since Option+N produces a special character on macOS) and a toolbar button.
- 15 new unit tests for the update engine (`src/lib/technical.test.ts`).

**Docs**
- Guide updated with a new "Technical notes" section.
- `MVP.md` updated: v1.1 progress table and implementation notes for both Conditional and Technical Notes.

**Files changed**
- Added: `src/lib/technical.ts`, `src/lib/technical.test.ts`, `src/components/board/technical-update-editor.tsx`, `src/components/board/technical-note-node.tsx`
- Modified: `src/components/board/canvas.tsx`, `src/components/board/toolbar.tsx`, `src/app/guide/page.tsx`, `docs/MVP.md`, `src/lib/version.ts`, `package.json`

### [0.7.0] — 2026-08-06

**Conditional Notes (first v1.1 feature)**
- New note type `conditional`: define one or more branches, each with a label, a target note, and AND-ed conditions against component values (`==`, `!=`, `>`, `>=`, `<`, `<=`, `includes`). Branches are checked in order; an optional else/default branch catches everything else.
- A branch's target is a real connection, correlated via a new `branch_id` column on `connections` — not a parallel/shadow data structure. Saving branches reconciles actual connections (create/update/delete) to match.
- Live visualization: the canvas evaluates every conditional note against current component values and highlights the active branch's connection (thicker, solid) while dimming inactive ones (dashed, faded) — updates immediately when a component's value changes, directly addressing the PRD's "hard to see how choices connect" pain point.
- Rule editor is type-aware: boolean components get a true/false picker, list components show their actual choices, numbers/strings get plain inputs. Branches referencing a deleted component show an inline warning.
- Added `Shift+N` shortcut and a toolbar button to create a conditional note.
- 22 new unit tests for the evaluation engine and data parsing (`src/lib/conditions.test.ts`).

**Docs**
- Guide updated with a new "Conditional notes" section.
- `MVP.md` updated with v1.1 progress tracking and implementation notes.

**Files changed**
- Added: `src/lib/conditions.ts`, `src/lib/conditions.test.ts`, `src/components/board/conditional-branch-editor.tsx`, `src/components/board/conditional-note-node.tsx`, `docs/database/migrations/002_conditional_notes.sql`
- Modified: `src/components/board/canvas.tsx`, `src/components/board/toolbar.tsx`, `src/components/board/connection-edge.tsx`, `src/types/database.ts`, `src/lib/validations/connection.ts`, `docs/database/schema.sql`, `src/app/guide/page.tsx`, `docs/MVP.md`, `src/lib/version.ts`, `package.json`

> **Action required after deploying:** run `docs/database/migrations/002_conditional_notes.sql` in Supabase (adds the `branch_id` column conditional notes depend on).

### [0.6.1] — 2026-08-06

**Rate limiting**
- Added `src/lib/rate-limit.ts` (Upstash Redis + `@upstash/ratelimit`, sliding window). Fails open when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are unset, so the app never breaks in dev/CI without credentials — verified via build and a live server run with the vars unset.
- `POST /api/account/delete`: 3 requests/hour, keyed by user id.
- All requests through middleware: 300/minute per IP, general abuse/DoS protection.
- Documented in `SECURITY.md` that this does **not** cover board/note/component writes or Supabase auth calls, which bypass the Next.js server entirely — a real architectural constraint, not an oversight.

**CI / dependency hygiene**
- `.github/workflows/ci.yml` now runs `pnpm audit --prod --audit-level high` before lint/type-check/test/build.
- Added `.github/dependabot.yml`: weekly PRs for npm/pnpm dependencies (patch/minor batched, majors separate) and GitHub Actions versions.

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
