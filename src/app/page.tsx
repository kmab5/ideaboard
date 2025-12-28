'use client';

import Link from 'next/link';
import { ArrowRight, Layers, Link2, Sparkles, Layout, Zap, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/theme-toggle';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Layout className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">IdeaBoard</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:flex">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="shadow-lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 md:py-36">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="container mx-auto px-4 text-center md:px-6">
            <div className="mx-auto mb-6 w-fit rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
              ✨ Organize ideas visually
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Turn your ideas into
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                visual stories
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              IdeaBoard is a visual whiteboard for organizing your thoughts. Create infinite
              canvases, connect notes, and build interactive narratives with ease.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="gap-2 px-8 shadow-lg transition-all hover:shadow-xl">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="px-8">
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
        <section className="border-y bg-muted/30 py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Everything you need to organize ideas
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Powerful features designed to help you capture, connect, and develop your thoughts.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <section className="py-24">
          <div className="container mx-auto px-4 text-center md:px-6">
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Ready to organize your ideas?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Get started for free. No credit card required.
              </p>
              <Link href="/register">
                <Button size="lg" className="gap-2 px-8 shadow-lg">
                  Create your first board
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Layout className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">IdeaBoard</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 IdeaBoard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
