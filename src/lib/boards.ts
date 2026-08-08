// =============================================================================
// Board helpers (multi-board per story)
// =============================================================================

import type { Note, Connection } from '@/types/database';

/**
 * Remap a board's notes and connections onto a new board, giving every row a
 * fresh id and rewiring connections to point at the cloned notes.
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
  newId: () => string
): { notes: Note[]; connections: Connection[] } {
  const idMap = new Map<string, string>();

  const clonedNotes = notes.map((note) => {
    const id = newId();
    idMap.set(note.id, id);
    return { ...note, id, board_id: newBoardId };
  });

  const clonedConnections = connections
    .map((connection) => {
      const source_note_id = idMap.get(connection.source_note_id);
      const target_note_id = idMap.get(connection.target_note_id);
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

  return { notes: clonedNotes, connections: clonedConnections };
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
