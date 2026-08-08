// =============================================================================
// Story export / import
// =============================================================================
// A story is exported as a single self-contained JSON document containing the
// story, its components, and every board with that board's notes, connections
// and containers. Importing always creates a *new* story with fresh ids, so an
// export can be restored alongside the original without collisions.
//
// DEVIATION FROM DOCS: the PRD (4.9.3) describes a `.zip` containing separate
// `manifest.json` / `story.json` / `components.json` / `boards/*.json` files.
// We use one JSON file with those same sections as top-level keys instead: it
// carries identical data, stays human-readable, and avoids pulling a zip
// library into the browser bundle. The `.ibs` binary format (4.9.2) and bulk
// export are not implemented.

import type { Board, Component, Connection, Container, Note, Story } from '@/types/database';

export const EXPORT_FORMAT_VERSION = 1;
export const EXPORT_FILE_EXTENSION = '.ideaboard.json';

export interface ExportedBoard {
  title: string;
  description: string | null;
  sort_order: number;
  viewport_x: number;
  viewport_y: number;
  viewport_zoom: number;
  notes: Note[];
  connections: Connection[];
  containers: Container[];
}

export interface StoryExport {
  manifest: {
    format: 'ideaboard-story';
    version: number;
    exported_at: string;
    app_version: string;
    counts: {
      boards: number;
      notes: number;
      connections: number;
      containers: number;
      components: number;
    };
  };
  story: {
    title: string;
    description: string | null;
    created_at: string | null;
  };
  components: Component[];
  boards: ExportedBoard[];
}

export interface BoardBundle {
  board: Board;
  notes: Note[];
  connections: Connection[];
  containers: Container[];
}

/** Assemble the export document. Pure — callers supply already-fetched rows. */
export function buildStoryExport(
  story: Pick<Story, 'title' | 'description' | 'created_at'>,
  components: Component[],
  boards: BoardBundle[],
  appVersion: string,
  now: () => string = () => new Date().toISOString()
): StoryExport {
  const exportedBoards: ExportedBoard[] = boards.map(
    ({ board, notes, connections, containers }) => ({
      title: board.title,
      description: board.description ?? null,
      sort_order: board.sort_order,
      viewport_x: board.viewport_x,
      viewport_y: board.viewport_y,
      viewport_zoom: board.viewport_zoom,
      notes,
      connections,
      containers,
    })
  );

  return {
    manifest: {
      format: 'ideaboard-story',
      version: EXPORT_FORMAT_VERSION,
      exported_at: now(),
      app_version: appVersion,
      counts: {
        boards: exportedBoards.length,
        notes: exportedBoards.reduce((sum, b) => sum + b.notes.length, 0),
        connections: exportedBoards.reduce((sum, b) => sum + b.connections.length, 0),
        containers: exportedBoards.reduce((sum, b) => sum + b.containers.length, 0),
        components: components.length,
      },
    },
    story: {
      title: story.title,
      description: story.description ?? null,
      created_at: story.created_at ?? null,
    },
    components,
    boards: exportedBoards,
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: StoryExport;
}

/**
 * Validate a parsed JSON object as a story export. Deliberately strict about
 * shape but tolerant about extra keys, so a file exported by a newer patch
 * release still imports.
 */
export function validateStoryExport(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'File is not a valid JSON object.' };
  }

  const doc = raw as Partial<StoryExport>;

  if (!doc.manifest || doc.manifest.format !== 'ideaboard-story') {
    return { valid: false, error: 'This does not look like an IdeaBoard story export.' };
  }

  if (typeof doc.manifest.version !== 'number') {
    return { valid: false, error: 'Export is missing a format version.' };
  }

  if (doc.manifest.version > EXPORT_FORMAT_VERSION) {
    return {
      valid: false,
      error: `This file was made by a newer version of IdeaBoard (format ${doc.manifest.version}). Update the app and try again.`,
    };
  }

  if (!doc.story || typeof doc.story.title !== 'string' || !doc.story.title.trim()) {
    return { valid: false, error: 'Export is missing a story title.' };
  }

  if (!Array.isArray(doc.boards)) {
    return { valid: false, error: 'Export is missing its boards.' };
  }

  if (doc.boards.length === 0) {
    return { valid: false, error: 'Export contains no boards.' };
  }

  for (const board of doc.boards) {
    if (typeof board?.title !== 'string') {
      return { valid: false, error: 'A board in this export is missing its title.' };
    }
    if (!Array.isArray(board.notes) || !Array.isArray(board.connections)) {
      return { valid: false, error: `Board "${board.title}" is missing notes or connections.` };
    }
  }

  if (doc.components !== undefined && !Array.isArray(doc.components)) {
    return { valid: false, error: 'Export has a malformed components list.' };
  }

  return { valid: true, data: doc as StoryExport };
}

/** Rows ready to insert, with fresh ids and rewired relationships. */
export interface ImportPlan {
  story: { id: string; title: string; description: string | null };
  components: Component[];
  boards: Board[];
  containers: Container[];
  notes: Note[];
  connections: Connection[];
}

/**
 * Turn a validated export into rows to insert, assigning new ids throughout.
 *
 * Ids that are only meaningful *inside* the document are deliberately left
 * alone: a conditional note's branch ids (referenced by `connections.branch_id`
 * and by `condition_data.branches[].id`) and a technical note's update ids.
 * Remapping those would mean rewriting two structures in lockstep for no gain,
 * since they never collide across stories.
 *
 * Component references in note content are by *name*, so they survive intact.
 */
export function buildImportPlan(
  doc: StoryExport,
  userId: string,
  newId: () => string,
  titleOverride?: string
): ImportPlan {
  const storyId = newId();

  const components: Component[] = (doc.components ?? []).map((component, index) => ({
    ...component,
    id: newId(),
    story_id: storyId,
    sort_order: component.sort_order ?? index,
  }));

  const boards: Board[] = [];
  const containers: Container[] = [];
  const notes: Note[] = [];
  const connections: Connection[] = [];

  doc.boards.forEach((exported, boardIndex) => {
    const boardId = newId();

    boards.push({
      id: boardId,
      story_id: storyId,
      folder_id: null,
      title: exported.title,
      description: exported.description ?? null,
      sort_order: exported.sort_order ?? boardIndex,
      viewport_x: exported.viewport_x ?? 0,
      viewport_y: exported.viewport_y ?? 0,
      viewport_zoom: exported.viewport_zoom ?? 1,
    } as Board);

    const containerIdMap = new Map<string, string>();
    (exported.containers ?? []).forEach((container) => {
      const id = newId();
      containerIdMap.set(container.id, id);
      containers.push({ ...container, id, story_id: storyId, board_id: boardId });
    });

    const noteIdMap = new Map<string, string>();
    exported.notes.forEach((note) => {
      const id = newId();
      noteIdMap.set(note.id, id);
      notes.push({
        ...note,
        id,
        board_id: boardId,
        container_id: note.container_id ? (containerIdMap.get(note.container_id) ?? null) : null,
      });
    });

    exported.connections.forEach((connection) => {
      const source = noteIdMap.get(connection.source_note_id);
      const target = noteIdMap.get(connection.target_note_id);
      // Drop connections whose endpoints didn't come across rather than
      // inserting rows that would violate the foreign keys.
      if (!source || !target) return;
      connections.push({
        ...connection,
        id: newId(),
        board_id: boardId,
        source_note_id: source,
        target_note_id: target,
      });
    });
  });

  return {
    story: {
      id: storyId,
      title: (titleOverride ?? doc.story.title).trim(),
      description: doc.story.description ?? null,
    },
    components,
    boards,
    containers,
    notes,
    connections,
  };
}

/** Filename-safe slug for the downloaded file. */
export function exportFileName(title: string, now: () => Date = () => new Date()): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'story';
  const date = now().toISOString().slice(0, 10);
  return `${slug}-${date}${EXPORT_FILE_EXTENSION}`;
}
