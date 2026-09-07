# IdeaBoard design system

The visual language, and how it relates to the [kmab brand kit](https://github.com/kmab5/kmab-brand).

## Relationship to kmab

IdeaBoard is **inspired by** the kmab brand, not a copy of it. What's inherited is
structure and discipline; what's changed is the signature hue, so the two read as
related work rather than the same product.

| | kmab | IdeaBoard |
| --- | --- | --- |
| Primary | `#B24BFF` — bright, magenta-leaning purple | `#6D4AFF` — deeper, bluer indigo-violet |
| Secondary | `#3DE08A` green | same green, as `signal` |
| Tertiary | `#F5C451` amber | same amber, as `highlight` |
| Light surface | paper `#F7F5EF` | same paper |
| Dark surface | warm near-black `#0E0E11` | same warm near-black |
| Body text (dark) | `#EDEBE4` warm off-white | same |
| Labels | mono, uppercase, `0.10em` tracking | same |
| Display type | tight negative tracking | same scale, same tracking |
| Headings | lowercase throughout | sentence case, except nav |

The deliberate divergences:

- **The primary hue.** kmab's purple sits at roughly 280° with high chroma; IdeaBoard's
  sits at 252° and is darker. Side by side they're clearly cousins, but a IdeaBoard
  screenshot doesn't read as a kmab screenshot.
- **Casing.** Lowercase headings are one of kmab's most recognisable signatures.
  Adopting it wholesale would make IdeaBoard look like a kmab sub-brand rather than
  its own product, so it's applied only to the marketing nav — enough to feel like
  kin, not enough to borrow the identity.
- **Fonts.** The brand kit specifies Inter Display / Inter / PT Mono. IdeaBoard ships
  Geist Sans and Geist Mono, which occupy the same grotesque + mono territory and are
  already bundled locally. The *type system* (scale, tracking, mono labels) matches the
  brand kit; swapping the families in is a font-file drop-in. The kit deliberately
  doesn't redistribute font binaries, so there was nothing to vendor.

## Tokens

Semantic tokens live in `src/app/globals.css` as HSL triples, consumed through
Tailwind's `hsl(var(--token))` bindings. Never hardcode a hex in a component when a
token exists.

Palette scales are in `tailwind.config.ts`:

- `brand-*` — IdeaBoard's indigo-violet. Primary actions, active states, conditional
  notes, container defaults.
- `signal-*` — green. Affirmative states and board/container links.
- `highlight-*` — amber. Warnings, invalid references, technical-note accents.

Note colours (`NOTE_COLORS` in `src/lib/constants.ts`) are intentionally soft pastels
rather than brand colours: they're user-chosen categorisation, and saturated brand hues
would fight the UI chrome for attention.

## Type

| Class | Use |
| --- | --- |
| `.display-1` | Page-level hero headings |
| `.display-2` | Section headings |
| `.display-3` | Sub-section and card headings |
| `.prose-body` | Long-form body copy |
| `.label-mono` | Eyebrows, section markers, version badges |

Display sizes are `clamp()`-based, so they scale without breakpoint jumps. Tracking
tightens as size increases, which is why the classes exist rather than composing
Tailwind utilities per heading.

## Contrast

Every brand pairing was measured against WCAG 2.1 before shipping. Two failed on first
pass and were corrected rather than accepted:

- Link chips: `signal-700` on a green tint was 3.29:1 → moved to `signal-800` (5.14:1).
- Warning chips: `highlight-700` on an amber tint was 3.0:1 → moved to `highlight-800`
  (4.71:1).

Current measurements for the load-bearing pairs:

| Pair | Ratio | Level |
| --- | --- | --- |
| Body text on paper | 15.72 | AAA |
| Body text on dark | 16.16 | AAA |
| White on `brand-600` (CTA) | 6.75 | AA |
| `brand-600` eyebrow on paper | 6.20 | AA |
| `brand-400` on dark | 5.72 | AA |
| Link chip (light / dark) | 5.14 / 12.93 | AA / AAA |
| Warning chip (light / dark) | 4.71 / 13.59 | AA / AAA |
| Muted text on paper | 5.44 | AA |

Amber and green are the two hues that lose contrast fastest on light backgrounds. If
you add a new accent use, measure it — don't assume the 500 shade is safe on a tint.

## Conventions

- Semantic tokens over literal colours; `brand-*` over `violet-*`.
- Mono labels are uppercase with wide tracking — that combination is the brand's most
  recognisable text device, so use it for markers, never for body copy.
- Radii are tighter than the shadcn default (`0.375rem`): the canvas is a tool, and
  softer corners made it read as a card deck.
- The dark palette is warm-neutral, not blue-black. Pure `#000` and pure `#fff` are
  both avoided.
