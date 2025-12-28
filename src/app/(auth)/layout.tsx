import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import { ThemeToggle } from '@/components/common';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen transition-all duration-300">
      {/* Left Panel - Branding */}
      <div className="hidden flex-col justify-between bg-primary p-8 transition-all duration-300 ease-in-out lg:flex lg:w-1/2 lg:p-12">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-primary-foreground transition-all duration-200"
          >
            <Lightbulb className="h-6 w-6 transition-all duration-200 sm:h-8 sm:w-8" />
            <span className="text-xl font-bold transition-all duration-200 sm:text-2xl">
              IdeaBoard
            </span>
          </Link>
        </div>

        <div className="space-y-4 transition-all duration-200 sm:space-y-6">
          <blockquote className="text-lg leading-relaxed text-primary-foreground/90 transition-all duration-200 sm:text-xl">
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
      <div className="relative flex flex-1 items-center justify-center p-4 transition-all duration-300 ease-in-out sm:p-6 md:p-8">
        {/* Theme Toggle */}
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md transition-all duration-200">
          {/* Mobile Logo */}
          <div className="mb-6 text-center transition-all duration-200 sm:mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 transition-all duration-200">
              <Lightbulb className="h-6 w-6 text-primary transition-all duration-200 sm:h-8 sm:w-8" />
              <span className="text-xl font-bold transition-all duration-200 sm:text-2xl">
                IdeaBoard
              </span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
