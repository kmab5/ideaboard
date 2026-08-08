// =============================================================================
// Board helpers (multi-board per story)
// =============================================================================

import type { Note, Connection, Container } from '@/types/database';

/**
 * Remap a board's contents onto a new board, giving every row a fresh id and
 * rewiring references so the copy is fully self-contained:
 *
 * - notes get new ids
 * - connections are rewired to the cloned notes
 * - containers get new ids, and each note's `container_id` is remapped to the
 *   cloned container (otherwise a duplicated board's notes would still point
 *   at the *original* board's containers)
 *
 * Connections whose source or target note isn't part of the copied set are
 * dropped rather than left dangling — this can happen if a connection
 * references a note that was deleted between the two fetches.
 *
 * `newId` is injected so tests can use deterministic ids.
 */
export function cloneBoardContents(
  notes: Note[],
  connections: Connection[],
  newBoardId: string,
  newId: () => string,
  containers: Container[] = []
): { notes: Note[]; connections: Connection[]; containers: Container[] } {
  const noteIdMap = new Map<string, string>();
  const containerIdMap = new Map<string, string>();

  const clonedContainers = containers.map((container) => {
    const id = newId();
    containerIdMap.set(container.id, id);
    return { ...container, id, board_id: newBoardId };
  });

  const clonedNotes = notes.map((note) => {
    const id = newId();
    noteIdMap.set(note.id, id);
    return {
      ...note,
      id,
      board_id: newBoardId,
      // Point at the cloned container, or detach if it wasn't copied.
      container_id: note.container_id ? (containerIdMap.get(note.container_id) ?? null) : null,
    };
  });

  const clonedConnections = connections
    .map((connection) => {
      const source_note_id = noteIdMap.get(connection.source_note_id);
      const target_note_id = noteIdMap.get(connection.target_note_id);
      if (!source_note_id || !target_note_id) return null;
      return {
        ...connection,
        id: newId(),
        board_id: newBoardId,
        source_note_id,
        target_note_id,
      };
    })
    .filter((c): c is Connection => c !== null);

  return { notes: clonedNotes, connections: clonedConnections, containers: clonedContainers };
}

/**
 * Pick which board should be open: the one named by the URL if it belongs to
 * this story, otherwise the first board. Returns null when there are none.
 */
export function resolveActiveBoard<T extends { id: string }>(
  boards: T[],
  requestedId: string | null
): T | null {
  if (boards.length === 0) return null;
  return boards.find((b) => b.id === requestedId) ?? boards[0];
}
