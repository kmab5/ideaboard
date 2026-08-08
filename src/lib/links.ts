// =============================================================================
// Board & container links
// =============================================================================
// Notes can link to other boards and to containers using a `#` syntax
// (PRD 4.5 "Board Linking" and 4.7.4 "Container References"):
//
//   #Prologue                → the board named "Prologue"
//   #Prologue/Vault          → the container "Vault" on that board
//   #(Act One)               → parenthesised form, required for names with spaces
//   #(Act One/The Vault)     → …including the container form
//
// The bare form is deliberately a single word. Allowing spaces there is
// ambiguous — "#Act One then rest" has no way to know the name ends after
// "One" — so multi-word names use the parenthesised form, which the link
// picker inserts automatically.
//
// Names are matched case-insensitively. Unresolved links render as a warning
// rather than silently looking like ordinary text, mirroring how invalid
// `{{component}}` references behave.

export interface LinkTarget {
  /** Raw text between the `#` and the end of the token. */
  raw: string;
  boardName: string;
  containerName: string | null;
}

export interface ResolvedLink extends LinkTarget {
  boardId: string | null;
  containerId: string | null;
  /** True when the board (and container, if named) both exist. */
  valid: boolean;
}

export interface LinkableBoard {
  id: string;
  title: string;
}

export interface LinkableContainer {
  id: string;
  name: string;
  board_id: string | null;
}

// Parenthesised form first so `#(A/B)` isn't truncated by the bare form.
// The bare form excludes spaces (see the note above) and so naturally stops at
// sentence punctuation: "see #Prologue." keeps the full stop out of the name.
export const LINK_PATTERN = /#\(([^)]+)\)|#([A-Za-z0-9][A-Za-z0-9_-]*(?:\/[A-Za-z0-9_-]+)?)/g;

/** Split a link body into its board and optional container parts. */
export function parseLinkBody(body: string): LinkTarget {
  const trimmed = body.trim();
  const slash = trimmed.indexOf('/');

  if (slash === -1) {
    return { raw: trimmed, boardName: trimmed, containerName: null };
  }

  return {
    raw: trimmed,
    boardName: trimmed.slice(0, slash).trim(),
    containerName: trimmed.slice(slash + 1).trim() || null,
  };
}

/** Every link found in a block of text, in order, without duplicates removed. */
export function extractLinks(text: string): LinkTarget[] {
  const links: LinkTarget[] = [];
  for (const match of text.matchAll(LINK_PATTERN)) {
    const body = (match[1] ?? match[2] ?? '').trim();
    if (!body) continue;
    links.push(parseLinkBody(body));
  }
  return links;
}

/**
 * Resolve a link against the story's boards and containers.
 *
 * A container-qualified link only resolves when the container actually sits on
 * the named board — otherwise `#Act One/The Vault` would silently jump to a
 * same-named container somewhere else entirely.
 */
export function resolveLink(
  target: LinkTarget,
  boards: LinkableBoard[],
  containers: LinkableContainer[]
): ResolvedLink {
  const board = boards.find((b) => b.title.toLowerCase() === target.boardName.toLowerCase());

  if (!board) {
    return { ...target, boardId: null, containerId: null, valid: false };
  }

  if (!target.containerName) {
    return { ...target, boardId: board.id, containerId: null, valid: true };
  }

  const container = containers.find(
    (c) =>
      c.board_id === board.id && c.name.toLowerCase() === target.containerName!.toLowerCase()
  );

  return {
    ...target,
    boardId: board.id,
    containerId: container?.id ?? null,
    valid: Boolean(container),
  };
}

/**
 * Render a link target back into source text, parenthesising when the bare
 * form would be ambiguous (i.e. any name containing a space).
 */
export function formatLink(boardName: string, containerName?: string | null): string {
  const body = containerName ? `${boardName}/${containerName}` : boardName;
  return /\s/.test(body) ? `#(${body})` : `#${body}`;
}

/** Display label for a link chip. */
export function linkLabel(target: LinkTarget): string {
  return target.containerName ? `${target.boardName}/${target.containerName}` : target.boardName;
}

/**
 * Split text into plain runs and link tokens, so a renderer can walk the
 * result without re-implementing the regex.
 */
export type LinkSegment =
  | { type: 'text'; value: string }
  | { type: 'link'; target: LinkTarget };

export function splitTextByLinks(text: string): LinkSegment[] {
  const segments: LinkSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const body = (match[1] ?? match[2] ?? '').trim();
    if (!body) continue;

    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, start) });
    }
    segments.push({ type: 'link', target: parseLinkBody(body) });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}
