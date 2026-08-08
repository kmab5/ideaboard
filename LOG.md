# IdeaBoard — Update Log

The running record of what shipped, what's next, and the full history. The
newest release is summarized at the top; the detailed changelog is at the
bottom, newest first. The version here tracks `package.json` and
`src/lib/version.ts`. Starting with v0.7.0, each changelog entry also lists
the files that were added or modified.

**Current version: `0.15.0`** · Status: MVP complete · v1.1 complete · PRD export suite complete.

---

## Latest updates — v0.15.0

- **`.ibs` archive export** — a compressed full backup with an integrity checksum, alongside the existing readable `.json`. Pick a format from a story's Export menu.
- **Back up all** — one button downloads every story as `.ibs` files inside a single ZIP; importing that ZIP restores all of them.
- **Selected value for lists** — click a choice on a list component to make it the active one. Conditions then compare against *that* choice, so `weather == "rainy"` finally works; `includes` still checks the full set of options.
- **Show values** — the eye icon (or `P`) swaps every `{{reference}}` for its current value, so you can proofread a note the way a reader would see it.

> ⚠️ **Action required after deploying:** run `docs/database/migrations/005_list_selected_value.sql` in Supabase.

## Upcoming / planned

- **v1.2** — sharing & permissions, then real-time collaboration, then version history.
- **Nonce-based CSP** — built and reverted in v0.13.0; needs a decision on trading static rendering for it (see `SECURITY.md`).
- **Not implemented from the PRD:** password-protected exports, and embedding version history in `.ibs` (that feature doesn't exist yet).
- **Optional** — error monitoring (Sentry) — setup guidance provided.

---

## Changelog

### [0.15.0] — 2026-08-08

**`.ibs` archive format (PRD 4.9.2)**
- DEFLATE-compressed zip following the documented layout, with each entity as its own JSON file and a `manifest.json` carrying a SHA-256 checksum over the payload (the manifest is excluded from its own checksum).
- Import verifies the checksum and **warns rather than refuses** on a mismatch — a partially-edited archive stays recoverable, which matters more for a backup format than strictness does.
- 8 tests including a full round trip asserting boards keep their own notes and connections, note content survives verbatim, tampering is detected, and a manifest-less archive is rejected.
- Deliberately not implemented: asset embedding (images live in Supabase Storage and are referenced by URL — there is nothing local to embed), version-history inclusion (no such feature yet), and password protection.

**Bulk export/import (PRD 4.9.4)**
- "Back up all" exports every story as `.ibs` inside one ZIP with an index manifest; duplicate story titles get de-duplicated archive entry names.
- Import auto-detects `.json`, `.ibs`, or a bulk `.zip` — the dialog previews a bulk archive's story list before creating anything.
- Bulk import reports **partial success** (`Imported 4; failed: X`) instead of aborting the batch on one bad story.

**Selected value for list components**
- New `components.selected_value` column (migration `005`). Choices stay in `current_value`, so existing data needs no reshaping.
- Condition semantics refined: equality and ordering test the **selection**, `includes` tests the **choices**. Previously a list's `==` compared against the stringified array and effectively never matched. A list with nothing selected falls back to the old behaviour, so existing conditions keep working.
- Click a choice chip on the component card to select it, click again to clear.

**Show values**
- Toolbar toggle and `P` shortcut render `{{component}}` references as their current value, resolving a list to its selected choice. The chip's tooltip keeps the component name so context isn't lost.

**Files changed**
- Added: `src/lib/ibs.ts`, `src/lib/ibs.test.ts`, `docs/database/migrations/005_list_selected_value.sql`
- Modified: `src/lib/story-transfer.ts`, `src/lib/conditions.ts`, `src/lib/conditions.test.ts`, `src/lib/validations/component.ts`, `src/components/common/markdown-renderer.tsx`, `src/components/common/story-card.tsx`, `src/components/common/import-story-dialog.tsx`, `src/components/panels/component-panel.tsx`, `src/components/board/note-node.tsx`, `src/components/board/canvas.tsx`, `src/components/board/toolbar.tsx`, `src/app/(dashboard)/stories/page.tsx`, `src/app/guide/page.tsx`, `src/types/database.ts`, `docs/database/schema.sql`, `docs/MVP.md`, `src/lib/version.ts`, `package.json`
- Dependency added: `jszip` (required for the archive formats; audit remains clean)

### [0.14.0] — 2026-08-08

**All remaining v1.1 deferred features**

*Board linking & cross-board navigation (PRD 4.5)*
- `#Board` and `#Board/Container` tokens in note text render as clickable chips; clicking switches board (reusing the in-place swap, no page reload) and pans to the container.
- The bare form is **single-word by design**. An earlier draft allowed spaces and the parser swallowed whole sentences — `#Act One then rest` has no way to know the name ends at "One". Multi-word names use `#(Act One/The Vault)`, and `formatLink()` picks the right form automatically (round-trip tested).
- Unresolvable links render an amber warning chip, matching invalid `{{component}}` references, so a renamed board leaves a visible signal rather than dead text.
- Story-wide containers are loaded for resolution, so a link can target a board that isn't currently open.

*Container references (PRD 4.7.4)*
- A container-qualified link resolves **only** when the container is on the named board — a same-named container on another board is never silently targeted. Covered by a test.

*Container Panel (PRD 4.7.3)*
- Floating panel: search by name/description, inline name and description editing, expandable contents preview, go-to-container, go-to-note, and delete with keep-or-remove contents. Contents come from the same geometric membership used everywhere else, so the list always matches what's visually inside.

*Container collapse/expand (PRD 4.7.1)*
- Chevron in the container header. Collapsing renders at header height while leaving the stored height untouched, so expanding restores the original size. The notes inside are unaffected — they stay on the canvas, just unframed.

*Board folders, search, and overview (PRD 4.5)*
- One panel behind the grid icon in the tab strip: search across boards, per-board note counts, folder create/rename/delete, and move-board-to-folder.
- Note counts are fetched lazily when the panel opens, so opening a board never waits on them.
- Deleting a folder keeps its boards, which become unfiled (`boards.folder_id` is `ON DELETE SET NULL`).

**Docs**
- Guide gained a "Linking between boards" section, plus coverage of snap-to-grid, container collapse and the Container Panel, and the board overview.
- `MVP.md` records every deferred item as shipped, leaving only `.ibs` and bulk export/import outstanding from the PRD.

**Files changed**
- Added: `src/lib/links.ts`, `src/lib/links.test.ts`, `src/components/panels/container-panel.tsx`, `src/components/board/board-overview.tsx`
- Modified: `src/components/common/markdown-renderer.tsx`, `src/components/board/note-node.tsx`, `src/components/board/canvas.tsx`, `src/components/board/container-node.tsx`, `src/components/board/board-tabs.tsx`, `src/components/board/index.ts`, `src/components/panels/index.ts`, `src/app/(board)/board/[id]/page.tsx`, `src/app/guide/page.tsx`, `docs/MVP.md`, `src/lib/version.ts`, `package.json`

### [0.13.0] — 2026-08-08

**Fixes**
- **Middleware was never executing (security-relevant).** `middleware.ts` lived at the project root; Next.js expects `src/middleware.ts` in a `src/`-directory project and ignored it silently. Caught by observing that `/stories` returned 200 instead of redirecting, and that no Middleware bundle appeared in any build. Route protection, session refresh, and the v0.6.1 per-IP rate limiting had therefore never run. RLS and per-page auth checks meant nothing was actually exposed, but a whole defence-in-depth layer was dead. Verified after the fix: `/stories` and `/settings` return `307 → /login`, build reports `ƒ Middleware`.
- **Container resizing now sticks.** The v0.11.0 fix set an explicit `width`/`height` on the container's inner div to stop it shrinking — but `NodeResizer` resizes the *node wrapper*, so pinning the inner box meant it never followed the handles, which read as the resize being rejected outright. The inner box now fills the wrapper, and the resize result is run through a new `sanitizeResize` helper that clamps to the minimum, ignores non-finite values, and omits position rather than writing `NaN` when the resize callback doesn't supply `x`/`y`. 6 new tests.

**Features**
- **Snap to grid** — toolbar toggle and `Shift+G`, deliberately separate from grid *visibility* so you can align to an invisible grid or see dots without snapping. Snaps to the same 20px spacing as the dot background.
- **One-click undo for a technical note's Apply** — new `APPLY_TECHNICAL` history action records each affected component's value before and after, so a single undo restores them all. Capture is per-component, so several updates to the same component still restore the original value. Toast now hints "Ctrl+Z to undo".
- **Write-path rate limiting (`004_write_rate_limiting.sql`)** — closes the gap documented since v0.6.1. Enforced by a Postgres trigger on notes/connections/containers/components rather than by proxying mutations through API routes, which would have added latency to every debounced save and required rewriting the optimistic-update path. 600 writes/minute per user; DELETE exempt so cleanup always works; counters self-prune. Being in the database, it covers every client including direct REST API use — the exact case a server-side limiter would miss. Surfaced via `db-errors.ts` as "Too many changes at once" instead of a raw database error (5 tests).

**Nonce-based CSP — built, tested, reverted (deliberate)**
- Implemented per-request nonces in middleware with `'strict-dynamic'`, and confirmed the header emitted correctly with no `'unsafe-inline'`.
- Then measured the served HTML: statically prerendered pages ship **20 script tags with zero nonces**, because Next.js can only inject nonces into dynamically rendered pages. Under `'strict-dynamic'` all of them would be blocked and the app would not load.
- Reverted to the previously verified policy rather than ship a CSP that breaks the app. Adopting nonces requires `export const dynamic = 'force-dynamic'` app-wide, trading the public pages' static rendering for the mitigation — a product decision, now documented in `SECURITY.md` instead of made silently.

**Not implemented this release**
- The deferred v1.1 features (board linking, Container Panel, container references, collapse/expand, board folders/search/overview) were not started.

**Files changed**
- Added: `docs/database/migrations/004_write_rate_limiting.sql`, `src/lib/db-errors.ts`, `src/lib/db-errors.test.ts`
- Moved: `middleware.ts` → `src/middleware.ts`
- Modified: `src/components/board/container-node.tsx`, `src/components/board/canvas.tsx`, `src/components/board/toolbar.tsx`, `src/lib/containers.ts`, `src/lib/containers.test.ts`, `src/lib/constants.ts`, `src/lib/store/historyStore.ts`, `src/app/(board)/board/[id]/page.tsx`, `next.config.mjs`, `SECURITY.md`, `src/lib/version.ts`, `package.json`

### [0.12.0] — 2026-08-08

**Export/Import (final v1.1 feature — v1.1 complete)**
- Export a story to one self-contained `.ideaboard.json` document containing the story, its components, and every board with that board's notes, connections and containers. Available from the story menu on the dashboard.
- Import from a new dashboard button. The dialog validates the file and **previews its contents** (boards / notes / connections / containers / components) before creating anything, and lets you rename the story, warning if the title duplicates an existing one.
- **Import always creates a new story** with fresh ids (PRD "Import as New", P0) — nothing is overwritten or merged, so an export can be restored alongside the original.
- Ids meaningful only *inside* the document are deliberately preserved: a conditional note's branch ids (referenced by both `connections.branch_id` and `condition_data.branches[].id`) and a technical note's update ids. Remapping them would mean rewriting two structures in lockstep for no benefit. Component references in note content are by name, so they survive untouched.
- Inserts run parents-first (story → components → boards → containers → notes → connections); if any step fails the new story is deleted, cascading the partial import away rather than leaving a broken story behind.
- Validation rejects non-JSON, unrelated JSON, exports with no boards, malformed boards, and — with an actionable message — files written by a newer format version. Files over 25 MB are refused before parsing.
- 18 new unit tests covering export assembly, validation, id remapping, container remapping, dropped-endpoint connections, branch-id preservation, and filename slugging.

**Deviation from the docs**
- The PRD (4.9.3) specifies a `.zip` containing separate `manifest.json` / `story.json` / `components.json` / `boards/*.json` entries. This ships as a **single JSON file** with those same sections as top-level keys: identical data, still human-readable, and it avoids adding a zip library to the browser bundle. The `.ibs` binary format (4.9.2) and bulk export/import are not implemented — both recorded in `MVP.md`.

**Docs**
- Guide updated with an "Export & import" section.
- `MVP.md`: v1.1 marked complete, export/import implementation notes added, stale `.ibs`/`.zip` roadmap rows corrected.

**Files changed**
- Added: `src/lib/export-import.ts`, `src/lib/export-import.test.ts`, `src/lib/story-transfer.ts`, `src/components/common/import-story-dialog.tsx`
- Modified: `src/components/common/story-card.tsx`, `src/components/common/index.ts`, `src/app/(dashboard)/stories/page.tsx`, `src/app/guide/page.tsx`, `docs/MVP.md`, `src/lib/version.ts`, `package.json`

### [0.11.0] — 2026-08-08

**Fixes**
- **Containers no longer shrink on their own.** Size was being persisted from React Flow's `dimensions` changes, which fire on *measurement* as well as user resizes — and measured values are rounded by the zoom factor, so every render wrote back a slightly smaller box, compounding over time. Size now comes solely from `NodeResizer`'s `onResizeEnd`, and the container's DOM box is pinned to the stored dimensions so a re-measure can't override it.
- **Comparison operators widened.** `>`, `<`, `>=`, `<=` were only offered for `number` components. They're now available for strings and lists too, with defined semantics: numeric when both sides are numeric, item count for lists, lexicographic for other text. Booleans keep `==`/`!=` only, where ordering is meaningless. 6 new tests pin the behaviour.

**Debug sweep — three real bugs found and fixed**
- **Data-loss risk:** "delete container with contents" resolved contents from `notes.container_id`, but membership is *geometric* and that field is only written when a note is dragged. Notes created inside a container, or enclosed when one was drawn around them, had a null `container_id` — so they'd be silently left behind. Contents are now resolved from geometry, and a new effect keeps `container_id` in step whenever containers are created, moved, or resized.
- **Board duplication ignored containers**, and cloned notes kept `container_id` values pointing at the *original* board's containers — cross-board dangling references. `cloneBoardContents` now clones containers and remaps note membership to the copies (detaching cleanly if a container wasn't copied). 4 new tests.
- **Container names collide story-wide.** The schema enforces `UNIQUE (story_id, name)`, but creation only checked the current board and duplication cloned names verbatim — both would fail at insert once a second board had containers. Added a tested `uniqueContainerName` helper, applied to both paths against story-wide names.

**Security audit (see `SECURITY.md`)**
- Dependencies: **0 known vulnerabilities** (production and full tree).
- **IDB-008 (Low):** a container's `board_id` wasn't constrained to belong to its `story_id` (same for `notes.container_id` vs its board). Not a disclosure issue — rows stay invisible to other users — but a real integrity gap. Fixed by triggers in migration `003_container_integrity.sql`.
- **IDB-009 (Informational):** container names and board titles had no client-side length cap, surfacing raw database errors. Added `maxLength` and a `container.ts` Zod schema mirroring the DB constraints.
- Re-verified: RLS on containers uses `user_owns_story` with both USING and WITH CHECK; no `dangerouslySetInnerHTML`/`eval`; no hardcoded secrets; all six security headers present; `X-Powered-By` absent; unauthenticated account deletion → 401; cross-origin → 403.

**Files changed**
- Added: `docs/database/migrations/003_container_integrity.sql`, `src/lib/validations/container.ts`
- Modified: `src/components/board/container-node.tsx`, `src/components/board/canvas.tsx`, `src/components/board/board-tabs.tsx`, `src/app/(board)/board/[id]/page.tsx`, `src/lib/conditions.ts`, `src/lib/conditions.test.ts`, `src/lib/containers.ts`, `src/lib/containers.test.ts`, `src/lib/boards.ts`, `src/lib/boards.test.ts`, `src/lib/validations/index.ts`, `SECURITY.md`, `docs/MVP.md`, `src/lib/version.ts`, `package.json`

### [0.10.0] — 2026-08-08

**Containers (fourth v1.1 feature)**
- Containers are named canvas regions that group the notes inside them. Created from the toolbar or with `C`; if notes are selected, the container is fitted around them, otherwise it lands at the viewport centre.
- **Geometric, auto-tracked membership** (PRD 4.7.2): a note belongs to the container holding its centre — no explicit add/remove step. Overlapping containers resolve to the smallest match (intuitive nesting), with deterministic tie-breaking by z-index then id. Extracted to `src/lib/containers.ts` with 15 unit tests.
- Dragging a container's header moves every note that was inside it at drag start. The body is click-through and containers paint behind notes, so notes on top stay directly interactive.
- Resize, rename (double-click), recolour, and lock. Deleting offers keep-contents or delete-with-contents; surviving notes detach automatically via `ON DELETE SET NULL`.
- Fixed a latent hazard while wiring this up: the existing "remove deleted notes" effect filtered nodes against the notes list, which would have silently deleted every container node — container nodes are now preserved and synced by their own effect.
- No migration needed — the `containers` table and `notes.container_id` were already in the schema.

**Docs**
- Guide updated with a new "Containers" section.
- `MVP.md`: v1.1 progress table and containers implementation notes, including what was deliberately deferred (Container Panel, container references, collapse/expand, mini-boards).

**Files changed**
- Added: `src/lib/containers.ts`, `src/lib/containers.test.ts`, `src/components/board/container-node.tsx`
- Modified: `src/components/board/canvas.tsx`, `src/components/board/toolbar.tsx`, `src/components/board/index.ts`, `src/app/(board)/board/[id]/page.tsx`, `src/lib/constants.ts`, `src/app/guide/page.tsx`, `docs/MVP.md`, `src/lib/version.ts`, `package.json`

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
