// =============================================================================
// .ibs archive format (PRD 4.9.2)
// =============================================================================
// `.ibs` ("IdeaBoard Story") is a DEFLATE-compressed zip laying each entity out
// as its own JSON file, with a manifest carrying a SHA-256 checksum:
//
//   manifest.json
//   story.json
//   components.json
//   boards/{board-id}.json
//   containers/{container-id}.json
//   notes/{note-id}.json
//   connections/{connection-id}.json
//
// The `.ideaboard.json` portable format (see export-import.ts) remains the
// simpler, human-readable option; `.ibs` is the full-fidelity archive. Both
// import to the same in-memory shape, so downstream code handles one thing.
//
// NOT implemented from the spec: embedded assets (images live in Supabase
// Storage and are referenced by URL, so there is nothing local to embed),
// version history (the feature doesn't exist yet), and password protection.

import JSZip from 'jszip';
import type { StoryExport } from './export-import';

export const IBS_FORMAT_VERSION = '1.0';
export const IBS_FILE_EXTENSION = '.ibs';

export interface IbsManifest {
  format_version: string;
  app_version: string;
  export_date: string;
  story_title: string;
  checksum: string;
  includes_history: boolean;
  includes_assets: boolean;
  total_boards: number;
  total_notes: number;
  total_components: number;
}

/** SHA-256 of a string, hex encoded. Uses the Web Crypto API. */
export async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * The bytes the checksum is computed over: the story payload, excluding the
 * manifest itself (which contains the checksum and so can't cover itself).
 */
export function checksumPayload(doc: StoryExport): string {
  return JSON.stringify({
    story: doc.story,
    components: doc.components,
    boards: doc.boards,
  });
}

/** Build a `.ibs` archive as a Blob. */
export async function buildIbsArchive(doc: StoryExport): Promise<Blob> {
  const zip = new JSZip();

  const manifest: IbsManifest = {
    format_version: IBS_FORMAT_VERSION,
    app_version: doc.manifest.app_version,
    export_date: doc.manifest.exported_at,
    story_title: doc.story.title,
    checksum: await sha256(checksumPayload(doc)),
    includes_history: false,
    includes_assets: false,
    total_boards: doc.manifest.counts.boards,
    total_notes: doc.manifest.counts.notes,
    total_components: doc.manifest.counts.components,
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('story.json', JSON.stringify(doc.story, null, 2));
  zip.file('components.json', JSON.stringify(doc.components, null, 2));

  const boardsDir = zip.folder('boards')!;
  const notesDir = zip.folder('notes')!;
  const connectionsDir = zip.folder('connections')!;
  const containersDir = zip.folder('containers')!;

  doc.boards.forEach((board, index) => {
    // Board ids aren't carried in the portable shape, so index the files. The
    // order is what links a board to its notes on the way back in.
    const boardKey = `${index}`;
    boardsDir.file(
      `${boardKey}.json`,
      JSON.stringify(
        {
          index,
          title: board.title,
          description: board.description,
          sort_order: board.sort_order,
          viewport_x: board.viewport_x,
          viewport_y: board.viewport_y,
          viewport_zoom: board.viewport_zoom,
        },
        null,
        2
      )
    );

    board.notes.forEach((note) =>
      notesDir.file(`${boardKey}__${note.id}.json`, JSON.stringify(note, null, 2))
    );
    board.connections.forEach((connection) =>
      connectionsDir.file(
        `${boardKey}__${connection.id}.json`,
        JSON.stringify(connection, null, 2)
      )
    );
    board.containers.forEach((container) =>
      containersDir.file(
        `${boardKey}__${container.id}.json`,
        JSON.stringify(container, null, 2)
      )
    );
  });

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

export interface IbsReadResult {
  doc: StoryExport;
  manifest: IbsManifest;
  /** False when the recomputed checksum doesn't match the manifest. */
  checksumValid: boolean;
}

/** Read a `.ibs` archive back into the shared export shape. */
export async function readIbsArchive(
  data: Blob | ArrayBuffer | Uint8Array
): Promise<IbsReadResult> {
  // Normalize to an ArrayBuffer: JSZip can't read a Node Blob directly, which
  // matters for tests and any server-side use.
  const buffer =
    data instanceof ArrayBuffer || data instanceof Uint8Array
      ? data
      : await (data as Blob).arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('This .ibs file is missing its manifest and cannot be read.');
  }

  const manifest = JSON.parse(await manifestFile.async('string')) as IbsManifest;

  const storyFile = zip.file('story.json');
  if (!storyFile) throw new Error('This .ibs file is missing its story data.');
  const story = JSON.parse(await storyFile.async('string')) as StoryExport['story'];

  const componentsFile = zip.file('components.json');
  const components = componentsFile
    ? (JSON.parse(await componentsFile.async('string')) as StoryExport['components'])
    : [];

  // Reassemble boards in their recorded index order.
  const boardEntries: { index: number; data: Record<string, unknown> }[] = [];
  for (const file of zip.folder('boards')?.file(/\.json$/) ?? []) {
    boardEntries.push({
      index: Number(file.name.split('/').pop()?.replace('.json', '') ?? 0),
      data: JSON.parse(await file.async('string')),
    });
  }
  boardEntries.sort((a, b) => a.index - b.index);

  const collect = async (dir: string) => {
    const grouped = new Map<string, unknown[]>();
    for (const file of zip.folder(dir)?.file(/\.json$/) ?? []) {
      const base = file.name.split('/').pop() ?? '';
      const boardKey = base.split('__')[0];
      const parsed = JSON.parse(await file.async('string'));
      grouped.set(boardKey, [...(grouped.get(boardKey) ?? []), parsed]);
    }
    return grouped;
  };

  const notesByBoard = await collect('notes');
  const connectionsByBoard = await collect('connections');
  const containersByBoard = await collect('containers');

  const boards: StoryExport['boards'] = boardEntries.map((entry) => {
    const key = String(entry.index);
    const d = entry.data as Record<string, never>;
    return {
      title: (d.title as string) ?? 'Untitled board',
      description: (d.description as string | null) ?? null,
      sort_order: (d.sort_order as number) ?? entry.index,
      viewport_x: (d.viewport_x as number) ?? 0,
      viewport_y: (d.viewport_y as number) ?? 0,
      viewport_zoom: (d.viewport_zoom as number) ?? 1,
      notes: (notesByBoard.get(key) ?? []) as StoryExport['boards'][number]['notes'],
      connections: (connectionsByBoard.get(key) ??
        []) as StoryExport['boards'][number]['connections'],
      containers: (containersByBoard.get(key) ??
        []) as StoryExport['boards'][number]['containers'],
    };
  });

  const doc: StoryExport = {
    manifest: {
      format: 'ideaboard-story',
      version: 1,
      exported_at: manifest.export_date,
      app_version: manifest.app_version,
      counts: {
        boards: boards.length,
        notes: boards.reduce((sum, b) => sum + b.notes.length, 0),
        connections: boards.reduce((sum, b) => sum + b.connections.length, 0),
        containers: boards.reduce((sum, b) => sum + b.containers.length, 0),
        components: components.length,
      },
    },
    story,
    components,
    boards,
  };

  const checksumValid = manifest.checksum
    ? (await sha256(checksumPayload(doc))) === manifest.checksum
    : true;

  return { doc, manifest, checksumValid };
}

/** Filename-safe slug used for `.ibs` and bulk entries. */
export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'story'
  );
}
