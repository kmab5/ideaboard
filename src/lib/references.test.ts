import { describe, it, expect } from 'vitest';
import {
  getNoteText,
  extractReferenceNames,
  noteReferencesComponent,
  renameReferenceInContent,
} from './references';
import type { NoteContent } from '@/types/database';

const content = (text: string): NoteContent => ({
  blocks: [
    { type: 'paragraph', content: text },
    { type: 'image', content: 'https://example.com/x.png' },
  ],
});

describe('getNoteText', () => {
  it('joins paragraph/text blocks and ignores images', () => {
    expect(getNoteText(content('Hello {{gold}}'))).toBe('Hello {{gold}}');
  });

  it('handles empty content', () => {
    expect(getNoteText(null)).toBe('');
    expect(getNoteText({ blocks: [] })).toBe('');
  });
});

describe('extractReferenceNames', () => {
  it('extracts unique trimmed names', () => {
    const c = content('Start {{health}} then {{ gold }} and {{health}} again');
    expect(extractReferenceNames(c)).toEqual(['health', 'gold']);
  });

  it('returns empty when there are no references', () => {
    expect(extractReferenceNames(content('no refs here'))).toEqual([]);
  });
});

describe('noteReferencesComponent', () => {
  it('matches case-insensitively', () => {
    const c = content('has {{Health}}');
    expect(noteReferencesComponent(c, 'health')).toBe(true);
    expect(noteReferencesComponent(c, 'gold')).toBe(false);
  });
});

describe('renameReferenceInContent', () => {
  it('rewrites matching tokens only', () => {
    const c = content('{{health}} and {{gold}}');
    const renamed = renameReferenceInContent(c, 'health', 'hp');
    expect(getNoteText(renamed)).toBe('{{hp}} and {{gold}}');
  });

  it('is case-insensitive on the old name', () => {
    const c = content('{{Health}}');
    expect(getNoteText(renameReferenceInContent(c, 'health', 'hp'))).toBe('{{hp}}');
  });

  it('leaves non-text blocks untouched', () => {
    const c = content('{{health}}');
    const renamed = renameReferenceInContent(c, 'health', 'hp');
    expect(renamed.blocks[1]).toEqual({ type: 'image', content: 'https://example.com/x.png' });
  });
});
