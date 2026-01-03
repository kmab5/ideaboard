# IdeaBoard

A visual note-organizing application for capturing, organizing, and connecting ideas on an infinite digital whiteboard.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

IdeaBoard empowers users to think visually by placing movable notes on a canvas and establishing relationships between ideas using directional arrows. Perfect for brainstorming, mind mapping, story planning, and interactive fiction development.

### Key Features

- **Infinite Canvas** - Pan and zoom across an unlimited workspace
- **Markdown Notes** - Rich text formatting with bold, italic, lists, headings, task lists, links, and tables
- **Drawing Mode** - Freehand sketching with drawings treated as connectable nodes
- **Image Attachments** - Upload images directly into notes
- **Directional Connections** - Link ideas with customizable arrows
- **Components System** - Define variables and reference them throughout your project with `@mentions`
- **Containers** - Named regions for organizing related content
- **Multi-board Support** - Organize complex projects across multiple canvases

### Target Users

- ChoiceScript and interactive fiction authors
- UX designers and product managers
- Students and researchers
- Writers and storytellers
- Anyone who thinks visually

## Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Flow** - Canvas/node-based UI
- **react-markdown** - Markdown rendering
- **tldraw** - Drawing functionality

### Backend

- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication (email/password, Google OAuth)
  - Storage (avatars, attachments)
  - Row Level Security

### Deployment

- **Vercel** - Frontend hosting
- **Supabase** - Backend hosting

## Documentation

| Document | Description |
| ---------- | ------------- |
| [PRD.md](PRD.md) | Product Requirements Document |
| [MVP.md](MVP.md) | MVP Requirements & Tech Stack |
| [docs/api.md](docs/api.md) | API Documentation |
| [docs/erd.md](docs/erd.md) | Entity Relationship Diagram |
| [database/schema.sql](database/schema.sql) | PostgreSQL Schema |
| [PRIVACY.md](PRIVACY.md) | Privacy Policy |
| [TERMS.md](TERMS.md) | Terms and Conditions |

## Getting Started

### Prerequisites

- Node.js >= 18.17.0
- pnpm >= 8.0.0
- Git
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ideaboard.git
cd ideaboard

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your Supabase credentials

# Run development server
pnpm dev
```

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=IdeaBoard
```

## Project Structure

```bash
ideaboard/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes
│   ├── (dashboard)/         # Dashboard routes
│   └── (board)/             # Board editor routes
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── board/               # Canvas components
│   └── panels/              # Floating panels
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── store/               # Zustand stores
│   └── hooks/               # Custom hooks
├── types/                   # TypeScript types
├── docs/                    # Documentation
├── database/                # Database schema
└── tests/                   # Test files
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Legal

- [Privacy Policy](PRIVACY.md)
- [Terms and Conditions](TERMS.md)

---

Built with ❤️ for visual thinkers
