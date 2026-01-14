# IdeaBoard - MVP Requirements

**Version:** 1.0  
**Date:** January 14, 2026
**Status:** In Development

---

## 1. MVP Scope

### 1.1 Core Features for MVP

The MVP focuses on delivering the essential whiteboard experience with basic user management:

| Feature | Priority | Description |
| --------- | ---------- | ------------- |
| User Authentication | P0 | Email/password signup & login, Google OAuth |
| User Profile | P0 | Display name, DiceBear avatar |
| Story Management | P0 | Create, rename, delete stories |
| Single Board | P0 | One board per story (multi-board in v1.1) |
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
| Conditional Notes | v1.1 |
| Technical Notes | v1.1 |
| Containers | v1.1 |
| Multi-board per story | v1.1 |
| Export/Import (.ibs full) | v1.1 |
| Export/Import (.zip light) | v1.1 |
| Real-time collaboration | v1.2 |
| Sharing & permissions | v1.2 |
| Version history | v1.2 |
| Mobile apps | v2.0 |

---

## 2. Tech Stack

### 2.1 Frontend (Deployed on Vercel)

| Technology | Purpose | Version |
| ------------ | --------- | --------- |
| **Next.js 14** | React framework with App Router | ^14.0.0 |
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
| **tldraw** | Drawing/sketching library | ^2.0.0 |

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

### Phase 10: @ References (Week 10) 🔄 PARTIAL

#### 10.1 Autocomplete

- [ ] Detect @ trigger in editor
- [ ] Show component dropdown
- [ ] Filter by typed text
- [ ] Insert component reference

#### 10.2 Reference Display

- [x] Style inline references (chip/badge) - supports {{component}} syntax
- [x] Show component name in styled badge
- [ ] Click to view component
- [ ] Handle deleted components

#### 10.3 Reference Tracking

- [ ] Create component_references entries
- [ ] Update on note save
- [ ] Clean up stale references
- [ ] Show "used in X notes" count

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

### Phase 12: Polish & Deploy (Week 12) 🔄 IN PROGRESS

#### 12.1 Error Handling

- [ ] Global error boundary
- [x] Toast notifications (sonner)
- [x] Form error messages (react-hook-form + zod)
- [x] Network error handling (try/catch with toast)

#### 12.2 Loading States

- [x] Page loading component (PageLoader)
- [x] Button loading spinners
- [x] Optimistic UI updates

#### 12.3 Testing

- [ ] Unit tests (Vitest) - structure in place
- [ ] E2E tests (Playwright) - structure in place
- [ ] Test auth flows
- [ ] Test board operations

#### 12.4 Deployment

- [ ] Configure Vercel project
- [ ] Set environment variables
- [ ] Deploy to production
- [x] Test production build (pnpm build successful)
- [ ] Set up error monitoring (optional)

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
