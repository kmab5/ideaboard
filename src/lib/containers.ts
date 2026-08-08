// =============================================================================
// Containers
// =============================================================================
// A container is a named region of the canvas that groups the notes sitting
// inside it (PRD 4.7). Membership is *geometric and auto-tracked*: a note
// belongs to a container when its centre falls inside that container's bounds,
// so dragging a note in or out changes its membership without any explicit
// "add to container" step. `notes.container_id` persists the result so it can
// be queried, but geometry is always the source of truth.

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContainerLike extends Bounds {
  id: string;
  z_index?: number;
}

export interface NoteLike {
  id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

/** Centre point of a note, used for membership tests. */
export function noteCenter(note: NoteLike): { x: number; y: number } {
  return {
    x: note.position_x + note.width / 2,
    y: note.position_y + note.height / 2,
  };
}

/** Whether a point falls within bounds (inclusive of the top/left edges). */
export function containsPoint(bounds: Bounds, point: { x: number; y: number }): boolean {
  return (
    point.x >= bounds.x &&
    point.x < bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y < bounds.y + bounds.height
  );
}

/** Area of a container, used to break ties between overlapping containers. */
function area(bounds: Bounds): number {
  return Math.max(0, bounds.width) * Math.max(0, bounds.height);
}

/**
 * Find which container a note belongs to.
 *
 * When containers overlap, the *smallest* one wins — that's the intuitive
 * reading of nesting (a note inside a small box that sits within a big box
 * belongs to the small box). Ties are broken by higher z_index, then by id so
 * the result is deterministic.
 */
export function containerForNote<T extends ContainerLike>(
  note: NoteLike,
  containers: T[]
): T | null {
  const center = noteCenter(note);
  const matches = containers.filter((container) => containsPoint(container, center));
  if (matches.length === 0) return null;

  return matches.reduce((best, candidate) => {
    const bestArea = area(best);
    const candidateArea = area(candidate);
    if (candidateArea !== bestArea) return candidateArea < bestArea ? candidate : best;
    const bestZ = best.z_index ?? 0;
    const candidateZ = candidate.z_index ?? 0;
    if (candidateZ !== bestZ) return candidateZ > bestZ ? candidate : best;
    return candidate.id < best.id ? candidate : best;
  });
}

/** All notes whose centre falls inside the given container. */
export function notesInContainer<T extends NoteLike>(
  container: ContainerLike,
  notes: T[],
  allContainers: ContainerLike[]
): T[] {
  return notes.filter((note) => containerForNote(note, allContainers)?.id === container.id);
}

/**
 * Compute the `container_id` each note should have, returning only the notes
 * whose membership actually changed. Callers persist just these, so a drag
 * doesn't rewrite every note on the board.
 */
export function membershipChanges<T extends NoteLike & { container_id: string | null }>(
  notes: T[],
  containers: ContainerLike[]
): { noteId: string; containerId: string | null }[] {
  const changes: { noteId: string; containerId: string | null }[] = [];
  for (const note of notes) {
    const containerId = containerForNote(note, containers)?.id ?? null;
    if (containerId !== note.container_id) {
      changes.push({ noteId: note.id, containerId });
    }
  }
  return changes;
}

/**
 * Bounds that fit all the given notes, plus padding. Used when creating a
 * container around a selection. Returns null when there's nothing to fit.
 */
export function boundsAroundNotes(notes: NoteLike[], padding = 40): Bounds | null {
  if (notes.length === 0) return null;

  const minX = Math.min(...notes.map((n) => n.position_x));
  const minY = Math.min(...notes.map((n) => n.position_y));
  const maxX = Math.max(...notes.map((n) => n.position_x + n.width));
  const maxY = Math.max(...notes.map((n) => n.position_y + n.height));

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    // Extra top padding leaves room for the container's header strip.
    height: maxY - minY + padding * 2,
  };
}
