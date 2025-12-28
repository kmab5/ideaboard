# IdeaBoard

A visual whiteboard application for organizing ideas, creating mind maps, and building interactive narratives.

![IdeaBoard](public/icon.png)

## Features

- 🎨 **Infinite Canvas** - Drag, zoom, and pan across an unlimited workspace
- 📝 **Visual Notes** - Create and customize note cards with different colors
- 🔗 **Smart Connections** - Link ideas with directional arrows (straight, curved, or elbowed)
- 📚 **Story Organization** - Group related boards into stories/projects
- 🧩 **Component Library** - Reusable elements for consistent design
- 🌓 **Dark/Light Mode** - Easy on the eyes, day or night
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ☁️ **Cloud Sync** - Your data syncs automatically via Supabase

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Canvas:** React Flow
- **Backend:** Supabase (Auth, Database, Storage)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/kmab5/ideaboard.git
cd ideaboard

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Description |
| ---------- | ------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | Your app URL (for OAuth redirects) |

## Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/ERD.md)
- [MVP Specification](docs/MVP.md)
- [Product Requirements](docs/PRD.md)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Privacy Policy](PRIVACY.md)
