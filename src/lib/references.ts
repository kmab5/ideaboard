// =============================================================================
// Component reference helpers
// =============================================================================
// References are stored inline in note content as `{{ComponentName}}` tokens.
// These helpers extract and rewrite them, and are shared by the component panel
// (usage counts / rename propagation) and the board (reference-table sync).

import type { NoteContent } from '@/types/database';

const REFERENCE_PATTERN = /\{\{([^}]+)\}\}/g;

/** Extract the plain text from a note's content blocks. */
export function getNoteText(content: NoteContent | null | undefined): string {
  if (!content?.blocks?.length) return '';
  return content.blocks
    .filter((block) => block.type === 'paragraph' || block.type === 'text')
    .map((block) => (typeof block.content === 'string' ? block.content : ''))
    .join('\n\n');
}

/** Unique component names referenced by a note (order-preserving, trimmed). */
export function extractReferenceNames(content: NoteContent | null | undefined): string[] {
  const text = getNoteText(content);
  const names = new Set<string>();
  for (const match of text.matchAll(REFERENCE_PATTERN)) {
    const name = match[1].trim();
    if (name) names.add(name);
  }
  return [...names];
}

/** Whether a note references the given component name (case-insensitive). */
export function noteReferencesComponent(
  content: NoteContent | null | undefined,
  componentName: string
): boolean {
  const target = componentName.toLowerCase();
  return extractReferenceNames(content).some((name) => name.toLowerCase() === target);
}

/**
 * Return a copy of content with every `{{oldName}}` token rewritten to
 * `{{newName}}` (case-insensitive match on the name). Used to propagate
 * component renames across notes (PRD 4.6.4).
 */
export function renameReferenceInContent(
  content: NoteContent,
  oldName: string,
  newName: string
): NoteContent {
  const target = oldName.trim().toLowerCase();
  return {
    ...content,
    blocks: content.blocks.map((block) => {
      if ((block.type !== 'paragraph' && block.type !== 'text') || typeof block.content !== 'string') {
        return block;
      }
      const rewritten = block.content.replace(REFERENCE_PATTERN, (whole, rawName: string) =>
        rawName.trim().toLowerCase() === target ? `{{${newName}}}` : whole
      );
      return { ...block, content: rewritten };
    }),
  };
}
