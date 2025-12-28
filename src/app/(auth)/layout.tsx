import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import { ThemeToggle } from '@/components/common';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden flex-col justify-between bg-primary p-12 lg:flex lg:w-1/2">
        <div>
          <Link href="/" className="flex items-center gap-2 text-primary-foreground">
            <Lightbulb className="h-8 w-8" />
            <span className="text-2xl font-bold">IdeaBoard</span>
          </Link>
        </div>

        <div className="space-y-6">
          <blockquote className="text-xl leading-relaxed text-primary-foreground/90">
            &ldquo;IdeaBoard has transformed how I organize my thoughts. The visual approach makes
            connections I never saw before.&rdquo;
          </blockquote>
          <div className="text-primary-foreground/70">
            <p className="font-medium">Sarah Chen</p>
            <p className="text-sm">UX Designer at Creative Labs</p>
          </div>
        </div>

        <div className="text-sm text-primary-foreground/50">
          © 2025 IdeaBoard. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="relative flex flex-1 items-center justify-center p-8">
        {/* Theme Toggle */}
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <Lightbulb className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">IdeaBoard</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
