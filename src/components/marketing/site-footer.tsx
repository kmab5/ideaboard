import Link from 'next/link';
import { AppIcon } from '@/components/icons';

const linkGroups = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How it works', href: '/#how' },
      { label: 'Guide', href: '/guide' },
      { label: 'Get started', href: '/register' },
      { label: 'Log in', href: '/login' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-xs">
          <Link href="/" className="flex items-center gap-2.5">
            <AppIcon className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight">IdeaBoard</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A visual canvas for branching stories. Map your paths, wire them together, and keep every
            variable in view.
          </p>
        </div>

        {linkGroups.map((group) => (
          <div key={group.heading}>
            <h2 className="text-sm font-semibold">{group.heading}</h2>
            <ul className="mt-4 space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} IdeaBoard</p>
          <p>Built for people who write in branches.</p>
        </div>
      </div>
    </footer>
  );
}
