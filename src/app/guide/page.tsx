import Link from 'next/link';
import { ArrowLeft, Keyboard, Lightbulb } from 'lucide-react';
import { SiteHeader, SiteFooter } from '@/components/marketing';
import { APP_VERSION } from '@/lib/version';

export const metadata = {
  title: 'Guide | IdeaBoard',
  description: 'Learn how to use IdeaBoard: notes, connections, components, references, and more.',
};

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
      {children}
    </kbd>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex gap-3 rounded-lg border border-border/70 bg-muted/40 p-3 text-sm">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

const sections = [
  {
    id: 'getting-started',
    heading: 'Getting started',
    body: (
      <>
        <p>
          IdeaBoard organizes a story as <strong>Story → Board → Notes</strong>. Create an account,
          then create your first story from the dashboard — it opens onto an infinite canvas where
          all your work happens.
        </p>
        <ul>
          <li>
            <strong>Sign up</strong> with email and password, or continue with Google.
          </li>
          <li>
            <strong>New story</strong> from the dashboard gives you a fresh board.
          </li>
          <li>Every board autosaves as you work — there is no save button to remember.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'canvas',
    heading: 'The canvas',
    body: (
      <>
        <p>The board is an infinite canvas you can move around freely.</p>
        <ul>
          <li>
            <strong>Pan:</strong> drag empty space, or scroll.
          </li>
          <li>
            <strong>Zoom:</strong> pinch, or <Kbd>Ctrl</Kbd> + scroll. Controls sit in the corner.
          </li>
          <li>
            <strong>Fit to screen</strong> recenters everything you&apos;ve made.
          </li>
          <li>
            The toolbar adds notes, drawings, and connections, and opens the components panel.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'boards',
    heading: 'Boards',
    body: (
      <>
        <p>
          A story can hold as many boards as you need — useful for splitting a big project into
          separate canvases like &ldquo;Act 1&rdquo;, &ldquo;Side Quests&rdquo;, and
          &ldquo;Characters&rdquo;. Boards appear as tabs just under the story header.
        </p>
        <ul>
          <li>
            <strong>Switch</strong> boards by clicking a tab. The open board is remembered in the
            page URL, so you can bookmark or share a link straight to it.
          </li>
          <li>
            <strong>Create</strong> a board with the <span className="font-mono">+</span> button at
            the end of the tab strip.
          </li>
          <li>
            <strong>Rename</strong> by double-clicking a tab, or from its menu.{' '}
            <strong>Duplicate</strong> copies the board with all its notes and connections intact.
          </li>
          <li>
            <strong>Delete</strong> removes the board and everything on it. A story always keeps at
            least one board, so the last one can&apos;t be deleted.
          </li>
        </ul>
        <Tip>
          Components are shared across every board in a story — define{' '}
          <span className="font-mono">gold</span> once and reference it from any board.
        </Tip>
      </>
    ),
  },
  {
    id: 'notes',
    heading: 'Notes',
    body: (
      <>
        <p>
          Notes are the core building block. Add one from the toolbar or by double-tapping empty
          canvas, then double-click a note to edit it.
        </p>
        <ul>
          <li>
            <strong>Markdown:</strong> headings, <strong>bold</strong>, <em>italic</em>, lists, task
            lists, links, and tables all render as you&apos;d expect.
          </li>
          <li>
            <strong>Move &amp; resize:</strong> drag to reposition, drag a corner to resize.
          </li>
          <li>
            <strong>Color:</strong> pick from the note palette to group things visually.
          </li>
          <li>
            <strong>Lock</strong> a note to prevent accidental moves; <strong>delete</strong> from
            its menu.
          </li>
          <li>
            <strong>Images:</strong> add an image block inside a note (validated for type and size).
          </li>
        </ul>
        <Tip>
          Notes render Markdown, so <span className="font-mono">## A heading</span> and{' '}
          <span className="font-mono">- a list item</span> format automatically.
        </Tip>
      </>
    ),
  },
  {
    id: 'connections',
    heading: 'Connections',
    body: (
      <>
        <p>
          Connections turn a pile of notes into a map. Drag from the handle on one note to another
          to create a directional arrow showing which beat leads where.
        </p>
        <ul>
          <li>Arrows are directional — perfect for branching choices and story flow.</li>
          <li>Recolor or delete a connection from its controls.</li>
          <li>Deleting a note also removes the connections attached to it.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'drawings',
    heading: 'Drawings',
    body: (
      <p>
        When a sketch says it faster than words, add a <strong>drawing</strong> from the toolbar and
        draw freehand. A drawing behaves like a note: move it, resize it, and connect it to other
        notes — useful for maps, timelines, or the shape of a space.
      </p>
    ),
  },
  {
    id: 'containers',
    heading: 'Containers',
    body: (
      <>
        <p>
          A <strong>container</strong> is a named region of the canvas that groups the notes inside
          it — handy for marking out an act, a chapter, or a cluster of related scenes. Add one from
          the toolbar or press <span className="font-mono">C</span>.
        </p>
        <ul>
          <li>
            If you <strong>select some notes first</strong>, the new container is drawn around them
            automatically. Otherwise it appears at the centre of your view at a default size.
          </li>
          <li>
            <strong>Membership is automatic:</strong> a note belongs to whichever container its
            centre sits inside. Drag a note in or out and it joins or leaves — there&apos;s no
            &ldquo;add to container&rdquo; step. The header shows a live note count.
          </li>
          <li>
            <strong>Drag the header</strong> to move a container — everything inside moves with it.
            Drag the edges to resize. The body is click-through, so notes on top stay usable.
          </li>
          <li>
            <strong>Rename</strong> by double-clicking the name. Pick a colour, or lock a container
            to prevent accidental moves, from its menu.
          </li>
          <li>
            <strong>Deleting</strong> offers two choices: remove just the container and leave the
            notes on the canvas, or delete the container along with everything inside it.
          </li>
        </ul>
        <Tip>
          Containers can overlap or nest — if a note sits inside two, it belongs to the smaller one.
        </Tip>
      </>
    ),
  },
  {
    id: 'components',
    heading: 'Components',
    body: (
      <>
        <p>
          Components are the variables your story turns on — the things that change as a reader makes
          choices. Open the <strong>Components</strong> panel from the toolbar to manage them.
        </p>
        <ul>
          <li>
            <strong>Number</strong> — a count or score, e.g. <span className="font-mono">fuel</span>.
          </li>
          <li>
            <strong>String</strong> — a piece of text, e.g. the hero&apos;s name.
          </li>
          <li>
            <strong>Boolean</strong> — a true/false flag, e.g.{' '}
            <span className="font-mono">hasKey</span>.
          </li>
          <li>
            <strong>List</strong> — a set of choices, e.g. weather is one of{' '}
            <span className="font-mono">sunny, rainy, snowy</span>.
          </li>
        </ul>
        <p>
          For a <strong>list</strong>, open the component and use the choices editor to add, rename,
          reorder, or remove options. Each component also shows its current value, a{' '}
          <strong>&ldquo;used in N notes&rdquo;</strong> count, and a{' '}
          <strong>Reset to default</strong> action. Renaming a component updates every note that
          references it.
        </p>
      </>
    ),
  },
  {
    id: 'references',
    heading: 'Referencing components in notes',
    body: (
      <>
        <p>
          Inside a note, type <span className="font-mono">@</span> to open autocomplete and pick a
          component. IdeaBoard inserts a reference token like{' '}
          <span className="font-mono">{'{{fuel}}'}</span> that stays linked to the component.
        </p>
        <ul>
          <li>
            Valid references render as a <span className="mkt-chip">chip</span>; click one to jump to
            the components panel.
          </li>
          <li>
            If a referenced component is renamed, the token updates automatically. If it&apos;s
            deleted, the reference is flagged so you can fix it.
          </li>
          <li>The components panel shows exactly which notes use each component.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'conditional-notes',
    heading: 'Conditional notes',
    body: (
      <>
        <p>
          A <strong>conditional note</strong> routes to different notes depending on your
          components&apos; current values — useful for branches like &ldquo;only show this scene if
          the player has the key.&rdquo; Add one from the toolbar (or press{' '}
          <span className="font-mono">Shift+N</span>).
        </p>
        <ul>
          <li>
            Open <strong>Manage branches</strong> to define one or more branches. Each branch has a
            label, a target note, and one or more conditions (e.g.{' '}
            <span className="font-mono">hasKey == true</span>) — all conditions in a branch must be
            true for it to match.
          </li>
          <li>
            Branches are checked <strong>in order</strong>; the first one that matches wins. Add an{' '}
            <strong>else / default</strong> branch to catch everything else.
          </li>
          <li>
            The note shows every branch live: the <strong>currently active</strong> branch is
            highlighted, and its connection on the canvas is drawn thicker and solid — every other
            branch&apos;s connection is dashed and faded. Change a component&apos;s value in the
            panel and watch the active path update.
          </li>
          <li>
            If a branch&apos;s condition references a component that&apos;s been deleted, a warning
            icon appears on that branch.
          </li>
        </ul>
        <Tip>
          This is a planning and visualization aid — it shows you which path is live for the
          component values you&apos;ve set, not a runtime story engine.
        </Tip>
      </>
    ),
  },
  {
    id: 'technical-notes',
    heading: 'Technical notes',
    body: (
      <>
        <p>
          A <strong>technical note</strong> is the write side of a conditional note: it changes a
          component&apos;s value when a reader reaches it (e.g. adding to{' '}
          <span className="font-mono">gold</span>, or toggling{' '}
          <span className="font-mono">hasKey</span> to true). Add one from the toolbar or press{' '}
          <span className="font-mono">Alt+N</span> (<span className="font-mono">Option+N</span> on
          Mac).
        </p>
        <ul>
          <li>
            Open <strong>Manage updates</strong> to add one or more changes. Each update picks a
            component and an operation: <strong>Set</strong>, <strong>Add</strong>,{' '}
            <strong>Subtract</strong>, <strong>Multiply</strong>, <strong>Toggle</strong>, or{' '}
            <strong>Append</strong> — available operations depend on the component&apos;s type.
          </li>
          <li>
            The note previews each change live, showing the current value and what it would become
            (e.g. <span className="font-mono">15 → 25</span>).
          </li>
          <li>
            Click <strong>Apply</strong> to actually run the updates on the components now — useful
            for walking through a path and testing how your variables evolve. This edits the real
            component values, the same as editing them in the Components panel.
          </li>
        </ul>
        <Tip>
          Applying is for testing, not permanent — you can always adjust a value afterward in the
          Components panel, or use its <strong>Reset to default</strong> action.
        </Tip>
      </>
    ),
  },
  {
    id: 'undo-redo',
    heading: 'Undo & redo',
    body: (
      <>
        <p>
          Every board keeps a session history of your recent actions — creating, moving, resizing,
          editing, recoloring notes, and creating connections.
        </p>
        <ul>
          <li>
            <strong>Undo:</strong> <Kbd>Ctrl</Kbd> + <Kbd>Z</Kbd>
          </li>
          <li>
            <strong>Redo:</strong> <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>Z</Kbd> or{' '}
            <Kbd>Ctrl</Kbd> + <Kbd>Y</Kbd>
          </li>
        </ul>
        <Tip>History is per session — it resets when you reload the board.</Tip>
      </>
    ),
  },
  {
    id: 'account',
    heading: 'Your account',
    body: (
      <>
        <p>From Settings you can manage your profile and preferences.</p>
        <ul>
          <li>
            <strong>Profile:</strong> display name and bio.
          </li>
          <li>
            <strong>Avatar:</strong> pick a generated style or upload your own image.
          </li>
          <li>
            <strong>Theme:</strong> switch between light and dark from the toggle in the header.
          </li>
          <li>
            <strong>Privacy:</strong> boards are private to your account by default. You can delete
            your account and its data at any time.
          </li>
        </ul>
      </>
    ),
  },
];

export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
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
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">Guide</h1>
              <span className="rounded-full border border-violet-300 bg-violet-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-violet-700 dark:border-violet-800 dark:text-violet-300">
                v{APP_VERSION}
              </span>
            </div>
            <p className="measure mt-6 text-lg leading-relaxed text-muted-foreground">
              Everything IdeaBoard can do today, from your first note to wiring up the variables your
              story depends on. This guide grows with each release.
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-24" aria-label="On this page">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contents
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

          <div className="max-w-2xl">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 border-border/60 py-8 first:pt-0 [&:not(:last-child)]:border-b"
              >
                <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
                <div className="legal-prose mt-4">{section.body}</div>
              </section>
            ))}

            <div className="mt-10 flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
              <Keyboard className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
              <p>
                Looking for what changed recently? See the{' '}
                <Link
                  href="/#features"
                  className="font-medium text-violet-600 hover:underline dark:text-violet-400"
                >
                  feature overview
                </Link>{' '}
                on the home page. This guide is updated with every release.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
