# IdeaBoard - Copilot Instructions

## Architecture Overview

IdeaBoard is a Next.js 14 visual whiteboard app using React Flow for the canvas, Supabase for backend (auth, database, storage), and Zustand for client-side state.

**Data Flow:**
1. User auth via Supabase → middleware validates session → pages fetch data via `createClient()` from `@/lib/supabase/client`
2. Stories contain Boards → Boards contain Notes and Connections (visual graph)
3. React Flow renders Notes as custom nodes and Connections as custom edges
4. Zustand stores (`src/lib/store/`) manage UI and cache state; Supabase is source of truth

**Route Groups:**
- `(auth)/` - Login/register pages
- `(dashboard)/` - Stories list, settings (authenticated)
- `(board)/` - Canvas/whiteboard view per story

## Key Patterns

### Supabase Client Usage
```typescript
// Client components: src/lib/supabase/client.ts
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Server components: src/lib/supabase/server.ts
import { createClient } from '@/lib/supabase/server';
```

### Zustand Stores
Stores at `src/lib/store/` - import from barrel file:
```typescript
import { useStoryStore, useBoardStore, useComponentStore, useUserStore } from '@/lib/store';
```

### Validation with Zod
All input validation schemas in `src/lib/validations/`. Export inferred types:
```typescript
import { createNoteSchema, type CreateNoteInput } from '@/lib/validations';
```

### React Flow Custom Nodes/Edges
Board components in `src/components/board/`:
- `note-node.tsx` - Main note card (supports markdown, images, colors)
- `drawing-node.tsx` - Freehand drawing with tldraw
- `connection-edge.tsx` - Directional arrows between notes

Node/edge types registered in `canvas.tsx`:
```typescript
const nodeTypes = { noteNode: NoteNode, drawingNode: DrawingNode };
const edgeTypes = { connectionEdge: ConnectionEdge };
```

### Component Organization
- `src/components/ui/` - shadcn/ui primitives (new-york style)
- `src/components/common/` - Shared app components (Navbar, StoryCard, etc.)
- `src/components/board/` - Canvas-specific components
- `src/components/auth/` - Auth forms
- Barrel exports via `index.ts` in each folder

## Database & Types

- Schema: `docs/database/schema.sql`
- TypeScript types: `src/types/database.ts` (mirrors SQL enums/tables)
- RLS policies enforce user-owned data access

Key entities: `Profile`, `Story`, `Board`, `Note`, `Connection`, `Component`

## Commands

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Production build
pnpm lint         # ESLint
```

## Conventions

- Path alias: `@/*` maps to `src/*`
- Use `sonner` for toast notifications: `import { toast } from 'sonner'`
- Icons from `lucide-react`
- Tailwind for styling; use `cn()` from `@/lib/utils` for conditional classes
- Forms use `react-hook-form` + `zod` resolvers
- All database timestamps are ISO strings (from Supabase)

## Testing

- Unit tests: Vitest (`tests/unit/`)
- E2E tests: Playwright (`tests/e2e/`)
- API tests: Postman collection at `docs/database/tests/`
