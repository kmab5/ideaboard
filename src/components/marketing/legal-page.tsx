import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

export interface LegalSection {
  id: string;
  heading: string;
  body: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
  closing?: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, intro, sections, closing }: LegalPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Title block over a faint canvas field */}
        <div className="relative border-b border-border/60">
          <div className="mkt-dotgrid mkt-grid-fade absolute inset-0 opacity-70" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            <p className="measure mt-6 text-lg leading-relaxed text-muted-foreground">{intro}</p>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[220px_1fr]">
          {/* Table of contents */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24" aria-label="On this page">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                On this page
              </p>
              <ul className="space-y-2 border-l border-border">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="-ml-px block border-l-2 border-transparent py-0.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-violet-500 hover:text-foreground"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Sections */}
          <div className="max-w-2xl">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 border-border/60 py-8 first:pt-0 [&:not(:last-child)]:border-b"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm text-violet-500">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
                </div>
                <div className="legal-prose mt-4 pl-0 sm:pl-9">{section.body}</div>
              </section>
            ))}

            {closing && (
              <p className="mt-10 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                {closing}
              </p>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
