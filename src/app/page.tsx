'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteHeader, SiteFooter, CanvasHero } from '@/components/marketing';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Small product vignettes — miniatures of real IdeaBoard surfaces, so the
// marketing visuals are the product itself rather than stock decoration.
// ---------------------------------------------------------------------------

function NoteMarkdownVignette() {
  return (
    <div className="mkt-dotgrid flex h-full items-center justify-center rounded-xl border border-border/70 bg-card p-6">
      <div className="w-56 rotate-[-2deg] rounded-lg border border-black/10 bg-[#FFF9C4] p-4 text-gray-900 shadow-lg shadow-black/5">
        <p className="text-sm font-bold">## The Archivist</p>
        <p className="mt-2 text-xs leading-relaxed text-gray-700">
          She keeps every ending you didn&apos;t choose.
        </p>
        <ul className="mt-2 space-y-1 text-xs text-gray-700">
          <li className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-500" /> knows the vault code
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-500" /> lies about the map
          </li>
        </ul>
      </div>
    </div>
  );
}

function ConnectionVignette() {
  return (
    <div className="mkt-dotgrid relative flex h-full items-center justify-center rounded-xl border border-border/70 bg-card p-6">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path d="M 26 40 Q 50 30 72 44" fill="none" stroke="#7c3aed" strokeWidth={0.7} pathLength={1} className="mkt-draw" style={{ ['--dash' as string]: 1 }} />
        <path d="M 26 44 Q 50 74 70 62" fill="none" stroke="#0891b2" strokeWidth={0.7} pathLength={1} className="mkt-draw" style={{ ['--dash' as string]: 1, animationDelay: '0.2s' }} />
      </svg>
      <div className="absolute left-[10%] top-[34%] rounded-lg border border-black/10 bg-[#BBDEFB] px-3 py-2 text-xs font-semibold text-gray-900 shadow-md">
        Ask her name
      </div>
      <div className="absolute right-[8%] top-[30%] rounded-lg border border-black/10 bg-[#C8E6C9] px-3 py-2 text-xs font-semibold text-gray-900 shadow-md">
        Trust her
      </div>
      <div className="absolute right-[10%] bottom-[20%] rounded-lg border border-black/10 bg-[#FFCCBC] px-3 py-2 text-xs font-semibold text-gray-900 shadow-md">
        Walk away
      </div>
    </div>
  );
}

function ComponentVignette() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-border/70 bg-card p-6">
      <div className="w-64 rounded-lg border border-border bg-background p-3 shadow-lg shadow-black/5">
        <p className="mb-3 text-xs font-semibold text-muted-foreground">Components</p>
        <div className="space-y-2">
          {[
            { name: 'trust', type: 'number', value: '3' },
            { name: 'hasKey', type: 'boolean', value: 'true' },
          ].map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between rounded-md border border-border/70 bg-muted/40 px-2.5 py-1.5"
            >
              <span className="font-mono text-xs font-semibold text-violet-600 dark:text-violet-400">
                @{c.name}
              </span>
              <span className="text-[0.7rem] text-muted-foreground">{c.type}</span>
              <span className="font-mono text-xs font-medium">{c.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-md border border-black/10 bg-[#E1BEE7] p-2.5 text-gray-900">
          <p className="text-xs">
            The lock clicks if{' '}
            <span className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.68rem] font-semibold text-violet-800">
              {'{{hasKey}}'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function DrawingVignette() {
  return (
    <div className="mkt-dotgrid flex h-full items-center justify-center rounded-xl border border-border/70 bg-card p-6">
      <div className="relative w-60 rounded-lg border border-black/10 bg-white p-4 shadow-lg shadow-black/5">
        <svg viewBox="0 0 200 90" className="w-full" aria-hidden>
          <path
            d="M 10 60 C 30 20, 55 20, 70 55 S 110 90, 130 50 S 175 15, 190 45"
            fill="none"
            stroke="#0891b2"
            strokeWidth={3}
            strokeLinecap="round"
            pathLength={1}
            className="mkt-draw"
            style={{ ['--dash' as string]: 1 }}
          />
          <circle cx="190" cy="45" r="4" fill="#ec4899" />
        </svg>
        <p className="mt-1 text-center text-xs font-medium text-gray-600">the river route</p>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: 'An infinite canvas that writes in Markdown',
    body: 'Drop a note anywhere and start typing. Headings, lists, bold, links — the notes render the Markdown you already know, so a scene reads like a scene, not a form field.',
    visual: <NoteMarkdownVignette />,
  },
  {
    title: 'Draw the branches, see the whole story',
    body: 'Connect notes to lay out every path a reader can take. Drag a line from one choice to the next and your outline becomes a map you can actually follow.',
    visual: <ConnectionVignette />,
  },
  {
    title: 'Track the variables your story turns on',
    body: 'Define components once — trust, fuel, whether they kept the key — then reference them inline with @ autocomplete. IdeaBoard shows where each one is used and flags references that no longer resolve.',
    visual: <ComponentVignette />,
  },
  {
    title: 'Sketch when words are the wrong tool',
    body: 'Some things are faster to draw. Add a freehand sketch note for a map, a timeline, or the shape of a room, right beside the prose it belongs to.',
    visual: <DrawingVignette />,
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Write your beats',
    body: 'Scatter notes for scenes, choices, and endings. No structure required yet — just get them onto the canvas.',
  },
  {
    n: '02',
    title: 'Wire the paths',
    body: 'Connect notes to show what leads where. Branches, loops, and dead ends become visible at a glance.',
  },
  {
    n: '03',
    title: 'Track what changes',
    body: 'Add components for the variables that matter and reference them in your notes. Your logic stays in sight, not in your head.',
  },
];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div data-reveal className={className} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Opt into reveal only when JS runs, so no-JS/headless render stays visible.
    root.classList.add('reveal-on');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );

    root.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mkt-dotgrid mkt-grid-fade absolute inset-0 opacity-60" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <h1
                className="mkt-rise text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl"
                style={{ animationDelay: '0.05s' }}
              >
                Your branching story, finally in one view
              </h1>
              <p
                className="mkt-rise mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
                style={{ animationDelay: '0.15s' }}
              >
                IdeaBoard is a visual canvas for interactive fiction. Map every scene and choice,
                connect the paths a reader can take, and keep the variables your plot depends on
                right where you can see them.
              </p>
              <div
                className="mkt-rise mt-8 flex flex-col gap-3 sm:flex-row"
                style={{ animationDelay: '0.25s' }}
              >
                <Link href="/register">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    Start for free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    See how it works
                  </Button>
                </Link>
              </div>
              <p
                className="mkt-rise mt-4 text-sm text-muted-foreground"
                style={{ animationDelay: '0.35s' }}
              >
                Free to start. Your boards are private to you by default.
              </p>
            </div>

            <div className="mkt-rise" style={{ animationDelay: '0.2s' }}>
              <CanvasHero />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Reveal>
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                From a tangle in your head to a map on the wall
              </h2>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                Three moves take you from blank canvas to a story you can trace end to end.
              </p>
            </Reveal>

            <ol className="mt-14 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 90}>
                  <li className="relative">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-semibold text-violet-500">
                        {step.n}
                      </span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Features — alternating rows */}
        <section id="features" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <Reveal>
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Everything a branching story needs, nothing it doesn&apos;t
              </h2>
            </Reveal>

            <div className="mt-16 space-y-16 sm:space-y-24">
              {FEATURES.map((feature, i) => {
                const flip = i % 2 === 1;
                return (
                  <Reveal key={feature.title}>
                    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                      <div className={cn('order-1', flip ? 'lg:order-2' : 'lg:order-1')}>
                        <h3 className="text-2xl font-semibold tracking-tight text-balance">
                          {feature.title}
                        </h3>
                        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                          {feature.body}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'order-2 aspect-[4/3]',
                          flip ? 'lg:order-1' : 'lg:order-2'
                        )}
                      >
                        {feature.visual}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Audience */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Made for people who write in branches
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Interactive fiction and ChoiceScript authors, Twine tinkerers, tabletop and RPG
                designers, game writers, and worldbuilders — anyone whose story stops being a line
                and starts being a shape.
              </p>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-violet-600 px-6 py-16 text-center sm:px-16">
              <div
                className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:24px_24px]"
                aria-hidden
              />
              <div className="relative mx-auto max-w-xl">
                <h2 className="text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
                  Start mapping your story today
                </h2>
                <p className="mt-4 text-lg text-violet-100">
                  Create your first board in under a minute. No credit card, no setup.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="w-full gap-2 bg-white text-violet-700 hover:bg-violet-50 sm:w-auto"
                    >
                      Create your first board
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-violet-100">
                  {['Free to start', 'Private by default', 'Works in your browser'].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
