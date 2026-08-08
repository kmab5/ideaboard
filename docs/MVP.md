# IdeaBoard - MVP Requirements

**Version:** 1.0
**Date:** January 14, 2026 (updated August 4, 2026)
**Status:** ✅ **MVP COMPLETE** · ✅ **v1.1 COMPLETE (incl. all deferred items)** — app version `0.14.0`, deployed, security-audited. See `LOG.md` and `SECURITY.md`.

---

## v1.1 progress (post-MVP) — ✅ complete

Per the roadmap ordering (conditional notes → technical notes → multi-board → containers → export/import):

| Feature | Status |
| --------- | -------- |
| Conditional Notes | ✅ Shipped (v0.7.0) |
| Technical Notes | ✅ Shipped (v0.8.0) |
| Multi-board per story | ✅ Shipped (v0.9.0) |
| Containers | ✅ Shipped (v0.10.0) |
| Export/Import | ✅ Shipped (v0.12.0) |

### Conditional Notes — implementation notes

- New note type `conditional`, rendered by `ConditionalNoteNode`. Branches are defined in `condition_data` (see `src/lib/conditions.ts` for the shape and evaluation engine) and evaluated live against the current component values.
- A branch's target is a real connection, correlated via a new `branch_id` column on `connections` (migration `002_conditional_notes.sql`) — not a separate parallel data structure.
- Branches are evaluated in order; first match wins. An optional else/default branch catches everything else.
- The canvas highlights the currently active branch's connection (thicker, solid) and dims inactive branches (dashed, faded) — this is a live visualization, re-evaluated whenever a component's value changes, not a runtime story engine.
- Deliberately out of scope for this pass: nested/compound OR logic (only AND within a branch; use multiple branches for OR-like behavior), and validating that every branch has a target before considering a conditional note "complete" (a branch with no target simply has no connection yet).

### Technical Notes — implementation notes

- New note type `technical`, rendered by `TechnicalNoteNode`. Updates are defined in `technical_data` (see `src/lib/technical.ts` for the shape and engine) — the write-side counterpart to a conditional note's read-only branches.
- Six operations: `set`, `add`, `subtract`, `multiply`, `toggle`, `append`, scoped per component type (e.g. booleans only get `set`/`toggle`).
- The note previews the computed new value live for every update (`current → new`), matching PRD 4.2.1.4's "Change Preview" requirement.
- **Apply** is a deliberate, explicit action (not automatic/live like conditional-note evaluation): clicking it writes the computed values to the actual components, the same write path as editing a value in the Components panel. This is a testing aid for walking a path manually, not a runtime engine — nothing applies itself.
- Deliberately out of scope for this pass: undo support specifically for "Apply" (a component's prior value can be restored via the Components panel's Reset-to-default or a manual edit, but there's no one-click "undo this apply").

### Multi-Board — implementation notes

- A story now loads *all* its boards; the open board is tracked in the URL as `?b=<boardId>` so a board is linkable and survives a refresh. An unknown or missing id falls back to the story's first board.
- Switching boards swaps notes/connections in place rather than reloading the page — the story and components already in memory are reused. `<Canvas>` is keyed on board id so React Flow rebuilds cleanly instead of reconciling two unrelated node sets.
- Boards state lives in the board page (not a Zustand store) because only the page and the tab bar read it — unlike components, which deeply nested nodes consume.
- **Duplicate** copies a board with its notes and connections, remapping every id and rewiring connections to the cloned notes; connections with a missing endpoint are dropped rather than left dangling. This logic is extracted to `src/lib/boards.ts` and unit-tested.
- A story always keeps at least one board — deleting the last one is blocked in both the UI and the handler.
- Components remain story-level and are therefore shared across every board, as the PRD specifies.
- Deliberately out of scope for this pass (all separate PRD features): board linking via `#boardname`, cross-board navigation, board folders, board search, and the board-overview dashboard with thumbnails.

### Containers — implementation notes

- Containers are canvas regions rendered as React Flow nodes *behind* notes (`zIndex: 0`), with a click-through body so notes stacked on top stay directly interactive. Only the header strip is draggable (`dragHandle`).
- **Membership is geometric and auto-tracked** (PRD 4.7.2 "Contents List"): a note belongs to the container whose bounds hold the note's *centre*. Dragging a note in or out changes membership with no explicit add/remove step. `notes.container_id` persists the result, but geometry is the source of truth.
- Overlapping containers resolve to the **smallest** match, which is the intuitive reading of nesting; ties break by z-index then id so the result is deterministic. All of this lives in `src/lib/containers.ts` and is unit-tested (15 tests).
- Dragging a container moves its contents: the delta is applied to every note that was inside at drag *start*, so notes aren't picked up mid-move.
- Deleting offers keep-contents or delete-with-contents. `notes.container_id` is `ON DELETE SET NULL`, so surviving notes detach automatically.
- Creating with notes selected fits the container around them; otherwise it lands at the viewport centre. Names are auto-numbered to avoid colliding with the database's per-board uniqueness constraint.
- No migration needed — the `containers` table and `notes.container_id` already existed in the schema.
- Deliberately out of scope for this pass: the floating **Container Panel** (PRD 4.7.3), container references (`#board/container`), collapse/expand, and the mini-board (`mini_board_data`) feature. Containers are also board-scoped here; the schema's story-level containers (`board_id IS NULL`) are unused.

### Export/Import — implementation notes

- A story exports to a **single self-contained JSON document** (`.ideaboard.json`) holding the story, its components, and every board with that board's notes, connections and containers.
- **Deviation from the PRD (4.9.3):** the docs describe a `.zip` with separate `manifest.json` / `story.json` / `components.json` / `boards/*.json` entries. We use one JSON file with those same sections as top-level keys — identical data, still human-readable, and it avoids pulling a zip library into the browser bundle. The `.ibs` binary format (4.9.2) and bulk export/import are not implemented.
- **Import always creates a new story** with fresh ids (PRD "Import as New", P0). Nothing is overwritten or merged, so an export can be restored alongside the original.
- Ids that are only meaningful *within* the document are deliberately preserved: a conditional note's branch ids (referenced both by `connections.branch_id` and `condition_data.branches[].id`) and a technical note's update ids. Remapping them would mean rewriting two structures in lockstep for no benefit, since they never collide across stories.
- Component references in note content are by **name**, so they survive the round trip untouched.
- Inserts run parents-first (story → components → boards → containers → notes → connections). If any step fails the new story is deleted, which cascades the partial import away rather than leaving a broken story behind.
- Validation rejects non-JSON, unrelated JSON, exports with no boards, malformed boards, and — with an actionable message — files written by a *newer* format version.
- The import dialog previews counts (boards/notes/connections/containers/components) before anything is created, and warns on a duplicate title.

### v1.1 deferred items — shipped in v0.14.0

Everything previously carried as "deferred from v1.1" is now implemented:

- **Board linking & cross-board navigation** (PRD 4.5) — `#Board` and `#Board/Container` in note text, rendered as clickable chips that switch boards and pan to the target. The bare form is deliberately single-word; multi-word names use `#(Act One/The Vault)`, since allowing spaces in the bare form makes "where does the name end" unanswerable. `formatLink()` emits the correct form automatically and is round-trip tested.
- **Container references** (PRD 4.7.4) — the `#Board/Container` half of the above. A container-qualified link only resolves when the container is actually on the named board, so a same-named container elsewhere is never silently targeted.
- **Container Panel** (PRD 4.7.3) — floating panel with search, inline name/description editing, contents preview, go-to-container, go-to-note, and delete with keep-or-remove contents.
- **Container collapse/expand** (PRD 4.7.1) — chevron in the header; collapsing renders the container at header height while leaving the stored height untouched, so expanding restores the original size.
- **Board folders, board search, and board overview** (PRD 4.5) — one panel behind the grid icon in the tab strip: search by name/description, per-board note counts (fetched lazily so the board never waits on them), folder create/rename/delete, and move-board-to-folder. Deleting a folder keeps its boards, which become unfiled (`boards.folder_id` is `ON DELETE SET NULL`).

Still not implemented, and now the only outstanding export-related items: the `.ibs` binary format and bulk export/import (PRD 4.9.2, 4.9.4).

---

## 1. MVP Scope

### 1.1 Core Features for MVP

The MVP focuses on delivering the essential whiteboard experience with basic user management:

| Feature | Priority | Description |
| --------- | ---------- | ------------- |
| User Authentication | P0 | Email/password signup & login, Google OAuth |
| User Profile | P0 | Display name, DiceBear avatar |
| Story Management | P0 | Create, rename, delete stories |
| Single Board | P0 | One board per story — superseded by multi-board in v0.9.0 |
| Normal Notes | P0 | Create, edit, move, resize, delete notes (Markdown) |
| Markdown Rendering | P0 | Bold, italic, lists, headings, task lists, links, tables |
| Drawing Mode | P0 | Freehand drawing as connectable node |
| Image Attachments | P0 | Upload images into notes (block element) |
| Connections | P0 | Directional arrows between notes/drawings |
| Canvas Navigation | P0 | Pan, zoom, fit-to-screen |
| Auto-save | P0 | Save changes automatically |
| Undo/Redo | P0 | Session-only history (30 actions), Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y. Tracks: create/move/resize notes, edit title/content, color changes, create connections |
| Components | P1 | Basic variables (number, string, boolean) |
| Component Panel | P1 | Floating panel to manage components |
| @ References | P1 | Reference components in notes |

### 1.2 Deferred to Post-MVP

| Feature | Target Version |
| --------- | ---------------- |
| Conditional Notes | ✅ Shipped in v0.7.0 (see LOG.md) |
| Technical Notes | ✅ Shipped in v0.8.0 (see LOG.md) |
| Containers | ✅ Shipped in v0.10.0 (see LOG.md) |
| Multi-board per story | ✅ Shipped in v0.9.0 (see LOG.md) |
| Export/Import (.ibs full) | Not implemented — see v0.12.0 notes |
| Export/Import (portable) | ✅ Shipped in v0.12.0 as a single JSON file |
| Real-time collaboration | v1.2 |
| Sharing & permissions | v1.2 |
| Version history | v1.2 |
| Mobile apps | v2.0 |

---

## 2. Tech Stack

### 2.1 Frontend (Deployed on Vercel)

| Technology | Purpose | Version |
| ------------ | --------- | --------- |
| **Next.js 15** | React framework with App Router | ^15.5.0 |
| **TypeScript** | Type safety | ^5.0.0 |
| **React 18** | UI library | ^18.2.0 |
| **Tailwind CSS** | Utility-first styling | ^3.4.0 |
| **shadcn/ui** | Component library (Radix-based) | latest |
| **React Flow** | Canvas/node-based UI for whiteboard | ^11.10.0 |
| **Zustand** | State management | ^4.4.0 |
| **React Query (TanStack)** | Server state & caching | ^5.0.0 |
| **Supabase JS Client** | Backend SDK | ^2.39.0 |
| **React Hook Form** | Form handling | ^7.49.0 |
| **Zod** | Schema validation | ^3.22.0 |
| **Lucide React** | Icons | ^0.300.0 |
| **DiceBear** | Avatar generation | ^7.0.0 |
| **react-markdown** | Markdown rendering | ^9.0.0 |
| **remark-gfm** | GitHub Flavored Markdown (tables, task lists) | ^4.0.0 |
| **Custom HTML5 Canvas** | Freehand drawing (replaced tldraw to cut bundle size & a vuln source) | — |

### 2.2 Backend (Supabase)

| Service | Purpose |
| --------- | --------- |
| **Supabase Auth** | Authentication (email/password, OAuth) |
| **Supabase Database** | PostgreSQL database |
| **Supabase Storage** | File storage (avatars, thumbnails, attachments) |
| **Supabase Realtime** | Real-time subscriptions (future) |
| **Row Level Security** | Data access control |

### 2.3 Development Tools

| Tool | Purpose |
| ------ | --------- |
| **pnpm** | Package manager |
| **ESLint** | Linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **lint-staged** | Pre-commit linting |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **Postman** | API testing |

### 2.4 Infrastructure

| Service | Purpose |
| --------- | --------- |
| **Vercel** | Frontend hosting & deployment |
| **Supabase** | Backend (Free tier) |
| **GitHub** | Version control |
| **GitHub Actions** | CI/CD |

---

## 3. Environment Setup

### 3.1 Prerequisites

```bash
# Required software
- Node.js >= 18.17.0
- pnpm >= 8.0.0
- Git
- VS Code (recommended)
```

### 3.2 VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "eamodio.gitlens",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### 3.3 Project Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/ideaboard.git
cd ideaboard

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Update .env.local with your Supabase credentials
# (see Environment Variables section below)

# 5. Run development server
pnpm dev

# 6. Open http://localhost:3000
```

### 3.4 Environment Variables

Create `.env.local` file:

```bash
# ===========================================
# Supabase Configuration
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Server-side only (for API routes if needed)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ===========================================
# App Configuration
# ===========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=IdeaBoard

# ===========================================
# OAuth (configured in Supabase Dashboard)
# ===========================================
# Google OAuth credentials are set in Supabase Dashboard
# No additional env vars needed for client

# ===========================================
# Feature Flags (optional)
# ===========================================
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false
```

Create `.env.example` (committed to git):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=IdeaBoard

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false
```

### 3.5 Supabase Setup

```bash
# 1. Create a new Supabase project at https://supabase.com

# 2. Go to SQL Editor and run the schema from:
#    database/schema.sql

# 3. Create storage buckets:
#    - avatars (public)
#    - thumbnails (public)

# 4. Enable Google OAuth in Authentication > Providers

# 5. Copy API keys from Settings > API
```

### 3.6 Project Structure

```bash
ideaboard/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── stories/
│   │   └── settings/
│   ├── (board)/             # Board editor routes
│   │   └── board/[id]/
│   ├── api/                 # API routes (if needed)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Auth components
│   ├── board/               # Board/canvas components
│   │   ├── Canvas.tsx
│   │   ├── Note.tsx
│   │   ├── Connection.tsx
│   │   └── Toolbar.tsx
│   ├── panels/              # Floating panels
│   │   └── ComponentPanel.tsx
│   └── common/              # Shared components
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── middleware.ts
│   ├── store/               # Zustand stores
│   │   ├── boardStore.ts
│   │   └── userStore.ts
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Utility functions
│   └── validations/         # Zod schemas
├── types/
│   ├── database.ts          # Supabase generated types
│   └── index.ts
├── styles/
│   └── globals.css
├── public/
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/
│   ├── api.md
│   └── erd.md
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### 3.7 Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage",
    "db:types": "supabase gen types typescript --project-id your-project-id > types/database.ts",
    "prepare": "husky install"
  }
}
```

---

## 4. Development Workflow

### 4.1 Git Branching Strategy

```bash
main           # Production-ready code
├── develop    # Integration branch
│   ├── feature/auth-system
│   ├── feature/board-canvas
│   ├── feature/notes-crud
│   └── fix/connection-bug
```

### 4.2 Commit Convention

```bash
# Format: <type>(<scope>): <description>

# Types:
feat     # New feature
fix      # Bug fix
docs     # Documentation
style    # Formatting (no code change)
refactor # Code restructuring
test     # Adding tests
chore    # Maintenance

# Examples:
feat(auth): add Google OAuth login
fix(board): resolve note drag offset
docs(api): update authentication endpoints
```

### 4.3 Pull Request Process

1. Create feature branch from `develop`
2. Make changes with atomic commits
3. Ensure tests pass (`pnpm test`)
4. Create PR to `develop`
5. Request code review
6. Squash and merge after approval

---

## 5. MVP Milestones

### Phase 1: Project Setup (Week 1) ✅ COMPLETE

#### 1.1 Initialize Project

- [x] Create Next.js 14 project with TypeScript
- [x] Configure Tailwind CSS
- [x] Install and configure shadcn/ui
- [x] Set up ESLint + Prettier
- [x] Configure Husky + lint-staged
- [x] Create folder structure

#### 1.2 Supabase Setup

- [x] Create Supabase project
- [x] Run database schema
- [x] Create storage buckets (avatars, thumbnails, note-attachments)
- [x] Install @supabase/supabase-js and @supabase/ssr
- [x] Create Supabase client utilities (client.ts, server.ts, middleware.ts)

---

### Phase 2: Authentication (Week 2) ✅ COMPLETE

#### 2.1 Auth Pages

- [x] Create `/login` page layout
- [x] Create `/register` page layout
- [x] Build LoginForm component
- [x] Build RegisterForm component
- [x] Add form validation (Zod + React Hook Form)
- [x] Add animated background with floating orbs

#### 2.2 Auth Logic

- [x] Implement email/password signup
- [x] Implement email/password login
- [x] Implement logout
- [x] Add Google OAuth button
- [x] Configure OAuth callback route
- [x] Create auth middleware (protect routes)

#### 2.3 Session Management

- [x] Set up auth state listener
- [x] Create useUser hook (via userStore)
- [x] Handle auth redirects
- [x] Add loading states

---

### Phase 3: User Profile (Week 3) ✅ COMPLETE

#### 3.1 Profile Setup

- [x] Create profile on signup (trigger)
- [x] Build ProfileForm component (in settings page)
- [x] Implement display name update
- [x] Add bio field

#### 3.2 Avatar System

- [x] Integrate DiceBear library
- [x] Build AvatarPicker component
- [x] Style selector (8-10 styles)
- [x] Generate random seed
- [x] Save avatar preferences to DB

#### 3.3 Custom Avatar Upload

- [x] Create avatar upload component
- [x] Implement file validation (size, type)
- [x] Upload to Supabase Storage
- [x] Update profile with avatar URL

---

### Phase 4: Story Management (Week 4) ✅ COMPLETE

#### 4.1 Story CRUD

- [x] Create story API/mutation
- [x] Implement createStory function
- [x] Implement updateStory function
- [x] Implement deleteStory function
- [x] Add confirmation dialog for delete

#### 4.2 Dashboard UI

- [x] Build `/stories` page
- [x] Create StoryCard component
- [x] Build StoryGrid/StoryList view
- [x] Add "New Story" button + modal (CreateStoryDialog)
- [x] Implement story rename inline edit
- [x] Add empty state

#### 4.3 Story Features

- [x] Add favorite toggle
- [x] Add archive functionality
- [x] Implement search/filter
- [x] Add sort options (recent, name, created)

---

### Phase 5: Canvas Foundation (Week 5) ✅ COMPLETE

#### 5.1 React Flow Setup

- [x] Install reactflow
- [x] Create Canvas wrapper component
- [x] Configure React Flow provider
- [x] Set up custom node types (noteNode, drawingNode)
- [x] Set up custom edge types (connectionEdge)

#### 5.2 Canvas Controls

- [x] Implement pan (drag background)
- [x] Implement zoom (scroll wheel)
- [x] Add zoom controls UI (+/- buttons)
- [x] Add fit-to-screen button
- [x] Save viewport position to DB

#### 5.3 Canvas UI

- [x] Add grid background (dots/lines toggle)
- [x] Create Minimap component
- [x] Build Toolbar component (collapsible)
- [x] Add keyboard shortcuts (V=select, H=pan, N=note, D=drawing, G=grid, +/-/0 for zoom)

---

### Phase 6: Notes - Basic (Week 6) ✅ COMPLETE

#### 6.1 Note Node Component

- [x] Create NoteNode component
- [x] Style note card (rounded, shadow)
- [x] Add color variants (9 colors)
- [x] Implement selected state
- [x] Add drag handle

#### 6.2 Note CRUD

- [x] Toolbar button to create note
- [x] Create note in database
- [x] Delete note (context menu)
- [x] Handle optimistic updates

#### 6.3 Note Positioning

- [x] Implement drag & drop
- [ ] Snap to grid (optional)
- [x] Save position on drag end
- [x] Debounce position updates (optimistic)

---

### Phase 7: Notes - Editing (Week 7) ✅ COMPLETE

#### 7.1 Rich Text Editor

- [x] Use react-markdown + remark-gfm
- [x] Create MarkdownRenderer component
- [x] Basic formatting (bold, italic, lists, headings, tables, task lists, links)
- [x] Handle focus/blur states

#### 7.2 Note Content

- [x] Double-click/double-tap to edit (with touch support)
- [x] Save content on blur
- [x] Auto-save while typing (optimistic updates)
- [x] Handle empty notes

#### 7.3 Note Sizing

- [x] Add resize handles (NodeResizer)
- [x] Implement resize logic with undo/redo tracking
- [x] Set min/max dimensions
- [x] Save size to database
- [x] Auto-resize when content exceeds bounds

#### 7.4 Note Styling

- [x] Build ColorPicker component (dropdown sub-menu)
- [x] Apply color to note (9 colors)
- [x] Add note title field (double-click to edit)
- [x] Lock/unlock functionality

---

### Phase 8: Connections (Week 8) ✅ COMPLETE

#### 8.1 Connection Creation

- [x] Add anchor points to notes (4 sides: top, bottom, left, right)
- [x] Drag from anchor to create edge
- [x] Connect to target anchor
- [x] Save connection to database

#### 8.2 Edge Component

- [x] Create custom ConnectionEdge component
- [x] Add arrow head (single, double, none options)
- [x] Support curved/straight/orthogonal (auto-switch based on grid visibility)
- [x] Implement edge selection

#### 8.3 Connection Features

- [x] Add connection labels (double-click to edit)
- [x] Implement label editing with inline input
- [x] Add color picker for edges (8 colors)
- [x] Line style (solid, dashed, dotted)
- [x] Line thickness options
- [x] Delete connection

---

### Phase 9: Components System (Week 9) ✅ COMPLETE

#### 9.1 Component Panel

- [x] Create floating ComponentPanel
- [x] Toggle panel visibility (toolbar button)
- [x] List all story components
- [x] Component search/filter by name and type

#### 9.2 Component CRUD

- [x] Create component form (dialog)
- [x] Support types: number, string, boolean, list
- [x] Edit component (name, value, description)
- [x] Delete component
- [x] Reset component to default value

#### 9.3 Component Display

- [x] Show component name with type icon
- [x] Show current value (editable inline)
- [x] Color tag badges by type
- [x] Sort/organize components

---

### Phase 10: @ References (Week 10) ✅ COMPLETE

#### 10.1 Autocomplete

- [x] Detect @ trigger in editor
- [x] Show component dropdown
- [x] Filter by typed text
- [x] Insert component reference (inserts linked `{{name}}` token)

#### 10.2 Reference Display

- [x] Style inline references (chip/badge)
- [x] Show component name in styled badge
- [x] Click to view component (opens the components panel)
- [x] Handle deleted components (flagged as invalid; rename propagates to notes)

#### 10.3 Reference Tracking

- [x] Create component_references entries
- [x] Update on note save
- [x] Clean up stale references (cascade on delete + best-effort resync)
- [x] Show "used in X notes" count

---

### Phase 11: Auto-save & State (Week 11) ✅ COMPLETE

#### 11.1 State Management

- [x] Set up Zustand stores (boardStore, storyStore, userStore, componentStore, historyStore)
- [x] Sync React Flow state with store
- [x] Implement undo/redo (historyStore with 30-action session history)

#### 11.1.1 Undo/Redo Implementation

- [x] Create historyStore (Zustand) with past/future stacks
- [x] Track CREATE_NOTE actions (note creation, drawing creation)
- [x] Track MOVE_NOTE actions (drag start/stop position tracking)
- [x] Track RESIZE_NOTE actions (resize start/end size tracking)
- [x] Track UPDATE_NOTE actions (title edits, content edits, color changes)
- [x] Track CREATE_CONNECTION actions
- [x] Track DELETE_NOTE actions (full state capture for restore)
- [x] Track DELETE_CONNECTION actions
- [x] Track UPDATE_CONNECTION actions (color, style changes)
- [x] Add keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
- [x] Add toolbar buttons with disabled states

#### 11.2 Auto-save

- [x] Optimistic updates (immediate save on action)
- [x] Manual save button (Ctrl+S)
- [x] Handle save errors (toast notifications)
- [x] Last-write-wins strategy

#### 11.3 Data Loading

- [x] Fetch board data on mount
- [x] Load notes and connections
- [x] Load components
- [x] Show loading spinner/skeleton

---

### Phase 12: Polish & Deploy (Week 12) ✅ COMPLETE

#### 12.1 Error Handling

- [x] Global error boundary (`app/error.tsx` + `app/global-error.tsx`)
- [x] Toast notifications (sonner)
- [x] Form error messages (react-hook-form + zod)
- [x] Network error handling (try/catch with toast + optimistic rollback)

#### 12.2 Loading States

- [x] Page loading component (PageLoader)
- [x] Button loading spinners
- [x] Optimistic UI updates

#### 12.3 Testing

- [x] Unit tests (Vitest) — 50 tests across navigation, upload, avatar, history, validations, references
- [x] E2E harness (Playwright) — smoke tests in place
- [x] Test auth flows (E2E) — `e2e/auth.spec.ts`, 7 tests
- [x] Test board operations (E2E) — `e2e/board.spec.ts`, 6 tests

#### 12.4 Deployment

- [x] Configure Vercel project
- [x] Set environment variables
- [x] Deploy to production (live at ideaboard-cs.vercel.app)
- [x] Test production build (pnpm build successful)
- [x] Security audit + hardening (see `SECURITY.md`, 7 findings fixed, 0 dependency vulnerabilities)
- [x] Account deletion / right to erasure
- [ ] Set up error monitoring (optional, deferred)

**MVP is complete.** Remaining items are optional hardening tracked in `SECURITY.md` and `LOG.md`: nonce-based CSP, CI dependency scanning, error monitoring, rate limiting, snap-to-grid.

> **Deploy prerequisites:** run `docs/database/migrations/001_security_hardening.sql` and set `SUPABASE_SERVICE_ROLE_KEY`.

---

## 6. Success Criteria for MVP

| Criteria | Target | Status |
| ---------- | -------- | -------- |
| User can sign up/login | ✓ Works | ✅ Complete |
| User can create a story | ✓ Works | ✅ Complete |
| User can create notes on canvas | ✓ Works | ✅ Complete |
| User can connect notes with arrows | ✓ Works | ✅ Complete |
| User can pan/zoom canvas | ✓ Works | ✅ Complete |
| User can draw on canvas | ✓ Works | ✅ Complete |
| User can manage components | ✓ Works | ✅ Complete |
| Undo/Redo works | ✓ Works | ✅ Complete |
| Changes auto-save | Immediate | ✅ Complete |
| Page load time | < 3s | ⏳ To verify |
| No critical bugs | 0 P0 bugs | ⏳ To verify |
| Core user flow completion | > 90% success | ⏳ To verify |

---

## 7. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
| ------ | ------------- | -------- | ------------ |
| React Flow performance | Medium | High | Virtualization, limit visible nodes |
| Supabase free tier limits | Low | Medium | Optimize queries, implement caching |
| Auth complexity | Low | Medium | Use Supabase Auth (battle-tested) |
| Scope creep | High | High | Strict MVP scope, defer features |
| Canvas state sync | Medium | High | Debounced saves, optimistic UI |

---

## 8. Dependencies & Versions

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "reactflow": "^11.10.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.300.0",
    "@dicebear/core": "^7.0.0",
    "@dicebear/collection": "^7.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.0.0",
    "prettier-plugin-tailwindcss": "^0.5.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"
  }
}
```

---

Last Updated: *January 14, 2026*
