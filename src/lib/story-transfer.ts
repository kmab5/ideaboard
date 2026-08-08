'use client';

import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';
import { APP_VERSION } from '@/lib/version';
import {
  buildStoryExport,
  buildImportPlan,
  validateStoryExport,
  exportFileName,
  type BoardBundle,
  type StoryExport,
} from '@/lib/export-import';

/** Fetch everything belonging to a story and assemble the export document. */
export async function exportStory(
  supabase: SupabaseClient,
  storyId: string
): Promise<StoryExport> {
  const [storyResult, componentsResult, boardsResult] = await Promise.all([
    supabase.from('stories').select('*').eq('id', storyId).single(),
    supabase.from('components').select('*').eq('story_id', storyId).order('sort_order'),
    supabase.from('boards').select('*').eq('story_id', storyId).order('sort_order'),
  ]);

  if (storyResult.error) throw storyResult.error;
  if (componentsResult.error) throw componentsResult.error;
  if (boardsResult.error) throw boardsResult.error;

  const boards = boardsResult.data ?? [];

  // Fetch each board's contents. Boards are typically few, so a request per
  // board is fine and keeps the queries simple.
  const bundles: BoardBundle[] = await Promise.all(
    boards.map(async (board) => {
      const [notes, connections, containers] = await Promise.all([
        supabase.from('notes').select('*').eq('board_id', board.id),
        supabase.from('connections').select('*').eq('board_id', board.id),
        supabase.from('containers').select('*').eq('board_id', board.id),
      ]);

      if (notes.error) throw notes.error;
      if (connections.error) throw connections.error;
      if (containers.error) throw containers.error;

      return {
        board,
        notes: notes.data ?? [],
        connections: connections.data ?? [],
        containers: containers.data ?? [],
      };
    })
  );

  return buildStoryExport(
    storyResult.data,
    componentsResult.data ?? [],
    bundles,
    APP_VERSION
  );
}

/** Trigger a browser download of the export document. */
export function downloadStoryExport(doc: StoryExport): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = exportFileName(doc.story.title);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Give the click a tick before releasing the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Read and validate a user-selected file. Throws with a readable message. */
export async function readStoryExportFile(file: File): Promise<StoryExport> {
  // Guard against someone selecting a huge unrelated file.
  const MAX_BYTES = 25 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error('That file is larger than 25 MB — it does not look like a story export.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  const result = validateStoryExport(parsed);
  if (!result.valid || !result.data) {
    throw new Error(result.error ?? 'That file is not a valid story export.');
  }
  return result.data;
}

/**
 * Import a validated export as a brand-new story owned by `userId`.
 *
 * Rows are inserted parents-first so foreign keys always resolve:
 * story → components → boards → containers → notes → connections.
 * If any step fails the new story is deleted, which cascades the rest away
 * rather than leaving a half-imported story behind.
 */
export async function importStory(
  supabase: SupabaseClient,
  doc: StoryExport,
  userId: string,
  titleOverride?: string
): Promise<{ storyId: string }> {
  const plan = buildImportPlan(doc, userId, uuidv4, titleOverride);

  const { error: storyError } = await supabase.from('stories').insert({
    id: plan.story.id,
    user_id: userId,
    title: plan.story.title,
    description: plan.story.description,
  });
  if (storyError) throw storyError;

  try {
    if (plan.components.length > 0) {
      const { error } = await supabase.from('components').insert(plan.components);
      if (error) throw error;
    }

    const { error: boardsError } = await supabase.from('boards').insert(plan.boards);
    if (boardsError) throw boardsError;

    if (plan.containers.length > 0) {
      const { error } = await supabase.from('containers').insert(plan.containers);
      if (error) throw error;
    }

    if (plan.notes.length > 0) {
      const { error } = await supabase.from('notes').insert(plan.notes);
      if (error) throw error;
    }

    if (plan.connections.length > 0) {
      const { error } = await supabase.from('connections').insert(plan.connections);
      if (error) throw error;
    }

    return { storyId: plan.story.id };
  } catch (error) {
    // Roll back: deleting the story cascades to everything created above.
    await supabase.from('stories').delete().eq('id', plan.story.id);
    throw error;
  }
}
