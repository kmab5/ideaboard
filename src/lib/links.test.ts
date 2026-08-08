import { describe, it, expect } from 'vitest';
import {
  formatLink,
  parseLinkBody,
  extractLinks,
  resolveLink,
  linkLabel,
  splitTextByLinks,
} from './links';

const boards = [
  { id: 'b1', title: 'Act One' },
  { id: 'b2', title: 'Side Quests' },
];

const containers = [
  { id: 'c1', name: 'The Vault', board_id: 'b1' },
  { id: 'c2', name: 'The Vault', board_id: 'b2' },
  { id: 'c3', name: 'Endings', board_id: 'b1' },
];

describe('parseLinkBody', () => {
  it('parses a board-only link', () => {
    expect(parseLinkBody('Act One')).toEqual({
      raw: 'Act One',
      boardName: 'Act One',
      containerName: null,
    });
  });

  it('parses a board/container link', () => {
    expect(parseLinkBody('Act One/The Vault')).toEqual({
      raw: 'Act One/The Vault',
      boardName: 'Act One',
      containerName: 'The Vault',
    });
  });

  it('treats a trailing slash as no container', () => {
    expect(parseLinkBody('Act One/').containerName).toBeNull();
  });
});

describe('extractLinks', () => {
  it('finds bare single-word links', () => {
    const links = extractLinks('See #Prologue and #Endings for more');
    expect(links.map((l) => l.boardName)).toEqual(['Prologue', 'Endings']);
  });

  it('finds container-qualified links', () => {
    const links = extractLinks('Go to #Prologue/Vault now');
    expect(links[0]).toMatchObject({ boardName: 'Prologue', containerName: 'Vault' });
  });

  it('stops the bare form at a space, so prose is not swallowed', () => {
    const links = extractLinks('Go to #Prologue then rest');
    expect(links).toHaveLength(1);
    expect(links[0].boardName).toBe('Prologue');
  });

  it('supports the parenthesised form for awkward names', () => {
    const links = extractLinks('Check #(Act One: Reprise/The Vault) here');
    expect(links[0]).toMatchObject({
      boardName: 'Act One: Reprise',
      containerName: 'The Vault',
    });
  });

  it('does not swallow sentence punctuation', () => {
    expect(extractLinks('Head to #Prologue.')[0].boardName).toBe('Prologue');
  });

  it('returns nothing when there are no links', () => {
    expect(extractLinks('just some prose')).toEqual([]);
  });

  it('ignores a bare hash', () => {
    expect(extractLinks('a # b')).toEqual([]);
  });

  it('does not treat a markdown heading as a link', () => {
    // Headings are consumed by the Markdown parser before this runs, but the
    // bare "# " form must not parse as a link regardless.
    expect(extractLinks('# Heading')).toEqual([]);
  });
});

describe('resolveLink', () => {
  it('resolves a board by name, case-insensitively', () => {
    const resolved = resolveLink(parseLinkBody('act one'), boards, containers);
    expect(resolved).toMatchObject({ boardId: 'b1', containerId: null, valid: true });
  });

  it('resolves a container on the named board', () => {
    const resolved = resolveLink(parseLinkBody('Act One/The Vault'), boards, containers);
    expect(resolved).toMatchObject({ boardId: 'b1', containerId: 'c1', valid: true });
  });

  it('does not match a same-named container on a different board', () => {
    const resolved = resolveLink(parseLinkBody('Side Quests/Endings'), boards, containers);
    // "Endings" exists, but on Act One — so this must not resolve.
    expect(resolved).toMatchObject({ boardId: 'b2', containerId: null, valid: false });
  });

  it('marks an unknown board invalid', () => {
    const resolved = resolveLink(parseLinkBody('Nowhere'), boards, containers);
    expect(resolved).toMatchObject({ boardId: null, valid: false });
  });
});

describe('linkLabel', () => {
  it('labels board and container links', () => {
    expect(linkLabel(parseLinkBody('Act One'))).toBe('Act One');
    expect(linkLabel(parseLinkBody('Act One/The Vault'))).toBe('Act One/The Vault');
  });
});

describe('splitTextByLinks', () => {
  it('splits text around links preserving order', () => {
    const segments = splitTextByLinks('Go to #Prologue then rest');
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: 'text', value: 'Go to ' });
    expect(segments[1].type).toBe('link');
    expect(segments[2]).toEqual({ type: 'text', value: ' then rest' });
  });

  it('returns a single text segment when there are no links', () => {
    expect(splitTextByLinks('nothing here')).toEqual([{ type: 'text', value: 'nothing here' }]);
  });

  it('handles a link at the very start and end', () => {
    const segments = splitTextByLinks('#(Act One)');
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('link');
  });
});

describe('formatLink', () => {
  it('uses the bare form for single-word names', () => {
    expect(formatLink('Prologue')).toBe('#Prologue');
    expect(formatLink('Prologue', 'Vault')).toBe('#Prologue/Vault');
  });

  it('parenthesises anything containing a space', () => {
    expect(formatLink('Act One')).toBe('#(Act One)');
    expect(formatLink('Act One', 'The Vault')).toBe('#(Act One/The Vault)');
  });

  it('round-trips through the parser', () => {
    const source = formatLink('Act One', 'The Vault');
    expect(extractLinks(source)[0]).toMatchObject({
      boardName: 'Act One',
      containerName: 'The Vault',
    });
  });
});
