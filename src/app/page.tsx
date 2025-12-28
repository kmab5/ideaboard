'use client';

import Link from 'next/link';
import { ArrowRight, Layers, Link2, Sparkles, Zap, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { AppIcon } from '@/components/icons';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm transition-all duration-300">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 transition-all duration-300 sm:py-4 md:px-6">
          <div className="flex items-center gap-2 transition-all duration-200">
            <AppIcon className="h-9 w-9 transition-all duration-200 sm:h-10 sm:w-10" />
            <span className="text-lg font-bold tracking-tight transition-all duration-200 sm:text-xl">
              IdeaBoard
            </span>
          </div>
          <div className="flex items-center gap-2 transition-all duration-200 sm:gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hidden transition-all duration-200 sm:flex">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-sm shadow-lg transition-all duration-200 sm:text-base">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 transition-all duration-300 sm:py-24 md:py-36">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/4 top-1/4 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition-all duration-500 sm:h-72 sm:w-72" />
            <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-all duration-500 sm:h-96 sm:w-96" />
          </div>

          <div className="container mx-auto px-4 text-center transition-all duration-300 md:px-6">
            <div className="mx-auto mb-4 w-fit rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 sm:mb-6 sm:px-4 sm:py-1.5 sm:text-sm">
              ✨ Organize ideas visually
            </div>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight transition-all duration-300 sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Turn your ideas into
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                visual stories
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground transition-all duration-300 sm:mb-10 sm:text-lg md:text-xl">
              IdeaBoard is a visual whiteboard for organizing your thoughts. Create infinite
              canvases, connect notes, and build interactive narratives with ease.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 transition-all duration-200 sm:flex-row sm:gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 px-6 shadow-lg transition-all duration-200 hover:shadow-xl sm:px-8"
                >
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-6 transition-all duration-200 sm:px-8"
                >
                  Log in
                </Button>
              </Link>
            </div>

            {/* Hero illustration placeholder */}
            <div className="mx-auto mt-16 max-w-4xl">
              <div className="relative rounded-2xl border bg-gradient-to-b from-muted/50 to-muted p-2 shadow-2xl">
                <div className="aspect-video rounded-xl bg-gradient-to-br from-background to-muted/50">
                  <div className="flex h-full items-center justify-center">
                    <div className="flex flex-wrap items-center justify-center gap-4 p-8">
                      {/* Simulated notes */}
                      <div className="rotate-[-3deg] rounded-lg border bg-yellow-100 p-4 shadow-md transition-transform hover:rotate-0 dark:bg-yellow-900/20">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          💡 Big Idea
                        </div>
                      </div>
                      <div className="rotate-[2deg] rounded-lg border bg-blue-100 p-4 shadow-md transition-transform hover:rotate-0 dark:bg-blue-900/20">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          📝 Notes
                        </div>
                      </div>
                      <div className="rotate-[-1deg] rounded-lg border bg-green-100 p-4 shadow-md transition-transform hover:rotate-0 dark:bg-green-900/20">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          🔗 Connected
                        </div>
                      </div>
                      <div className="rotate-[3deg] rounded-lg border bg-purple-100 p-4 shadow-md transition-transform hover:rotate-0 dark:bg-purple-900/20">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          ✨ Stories
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y bg-muted/30 py-16 transition-all duration-300 sm:py-24">
          <div className="container mx-auto px-4 transition-all duration-300 md:px-6">
            <div className="mb-10 text-center transition-all duration-300 sm:mb-16">
              <h2 className="mb-3 text-2xl font-bold tracking-tight transition-all duration-300 sm:mb-4 sm:text-3xl md:text-4xl">
                Everything you need to organize ideas
              </h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground transition-all duration-200 sm:text-lg">
                Powerful features designed to help you capture, connect, and develop your thoughts.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-4 transition-all duration-300 sm:grid-cols-2 sm:gap-5 md:gap-6 lg:grid-cols-3">
              <div className="group rounded-2xl border bg-background p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 transition-transform group-hover:scale-110">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Infinite Canvas</h3>
                <p className="text-muted-foreground">
                  Unlimited space to spread your ideas. Pan, zoom, and navigate freely across your
                  board.
                </p>
              </div>
              <div className="group rounded-2xl border bg-background p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 transition-transform group-hover:scale-110">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Visual Connections</h3>
                <p className="text-muted-foreground">
                  Draw connections between notes to map relationships and create flow diagrams.
                </p>
              </div>
              <div className="group rounded-2xl border bg-background p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 transition-transform group-hover:scale-110">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Story Components</h3>
                <p className="text-muted-foreground">
                  Add variables and logic to your stories. Create interactive narratives with
                  dynamic content.
                </p>
              </div>
              <div className="group rounded-2xl border bg-background p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 transition-transform group-hover:scale-110">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Built for performance. Smooth interactions even with hundreds of notes and
                  connections.
                </p>
              </div>
              <div className="group rounded-2xl border bg-background p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 transition-transform group-hover:scale-110">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Collaboration Ready</h3>
                <p className="text-muted-foreground">
                  Share your boards and work together. Perfect for teams and creative collaboration.
                </p>
              </div>
              <div className="group rounded-2xl border bg-background p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 transition-transform group-hover:scale-110">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Secure by Default</h3>
                <p className="text-muted-foreground">
                  Your ideas are safe with us. Enterprise-grade security and privacy protection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 transition-all duration-300 sm:py-24">
          <div className="container mx-auto px-4 text-center transition-all duration-300 md:px-6">
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-3 text-2xl font-bold tracking-tight transition-all duration-300 sm:mb-4 sm:text-3xl md:text-4xl">
                Ready to organize your ideas?
              </h2>
              <p className="mb-6 text-base text-muted-foreground transition-all duration-200 sm:mb-8 sm:text-lg">
                Get started for free. No credit card required.
              </p>
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 px-6 shadow-lg transition-all duration-200 sm:px-8"
                >
                  Create your first board
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 transition-all duration-300 sm:py-12">
        <div className="container mx-auto px-4 transition-all duration-300 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 transition-all duration-200 sm:gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <AppIcon className="h-8 w-8" />
              <span className="font-semibold">IdeaBoard</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} IdeaBoard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
