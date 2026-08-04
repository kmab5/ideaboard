'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { AppIcon } from '@/components/icons';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="IdeaBoard home">
          <AppIcon className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight">IdeaBoard</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/#features"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            Features
          </Link>
          <Link
            href="/#how"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            How it works
          </Link>
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" className="hidden sm:inline-flex">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button>Get started</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
