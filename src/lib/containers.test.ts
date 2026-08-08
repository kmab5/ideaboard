import { describe, it, expect } from 'vitest';
import {
  noteCenter,
  containsPoint,
  containerForNote,
  notesInContainer,
  membershipChanges,
  boundsAroundNotes,
  uniqueContainerName,
  sanitizeResize,
} from './containers';

const container = (id: string, x: number, y: number, width: number, height: number, z = 0) => ({
  id,
  x,
  y,
  width,
  height,
  z_index: z,
});

const note = (id: string, x: number, y: number, containerId: string | null = null) => ({
  id,
  position_x: x,
  position_y: y,
  width: 100,
  height: 100,
  container_id: containerId,
});

describe('noteCenter', () => {
  it('returns the middle of the note', () => {
    expect(noteCenter(note('a', 0, 0))).toEqual({ x: 50, y: 50 });
  });
});

describe('containsPoint', () => {
  const bounds = { x: 0, y: 0, width: 100, height: 100 };

  it('includes points inside and on the top-left edges', () => {
    expect(containsPoint(bounds, { x: 50, y: 50 })).toBe(true);
    expect(containsPoint(bounds, { x: 0, y: 0 })).toBe(true);
  });

  it('excludes points outside and on the bottom-right edges', () => {
    expect(containsPoint(bounds, { x: 100, y: 50 })).toBe(false);
    expect(containsPoint(bounds, { x: -1, y: 50 })).toBe(false);
  });
});

describe('containerForNote', () => {
  it('returns the container whose bounds hold the note centre', () => {
    const c = container('c1', 0, 0, 500, 500);
    expect(containerForNote(note('n', 100, 100), [c])?.id).toBe('c1');
  });

  it('returns null when the note is outside every container', () => {
    const c = container('c1', 0, 0, 100, 100);
    expect(containerForNote(note('n', 900, 900), [c])).toBeNull();
  });

  it('uses the note centre, not its corner', () => {
    // Note spans 450..550; its centre (500) sits outside a container ending at 480.
    const c = container('c1', 0, 0, 480, 480);
    expect(containerForNote(note('n', 450, 450), [c])).toBeNull();
  });

  it('prefers the smallest container when they overlap (nesting)', () => {
    const big = container('big', 0, 0, 1000, 1000);
    const small = container('small', 0, 0, 300, 300);
    expect(containerForNote(note('n', 100, 100), [big, small])?.id).toBe('small');
  });

  it('breaks equal-size ties by higher z_index', () => {
    const a = container('a', 0, 0, 500, 500, 1);
    const b = container('b', 0, 0, 500, 500, 5);
    expect(containerForNote(note('n', 100, 100), [a, b])?.id).toBe('b');
  });
});

describe('notesInContainer', () => {
  it('returns only the notes belonging to that container', () => {
    const c1 = container('c1', 0, 0, 300, 300);
    const c2 = container('c2', 1000, 1000, 300, 300);
    const notes = [note('a', 10, 10), note('b', 1010, 1010), note('c', 5000, 5000)];

    expect(notesInContainer(c1, notes, [c1, c2]).map((n) => n.id)).toEqual(['a']);
    expect(notesInContainer(c2, notes, [c1, c2]).map((n) => n.id)).toEqual(['b']);
  });

  it('respects nesting — a note in the inner container is not in the outer one', () => {
    const big = container('big', 0, 0, 1000, 1000);
    const small = container('small', 0, 0, 300, 300);
    const notes = [note('inner', 10, 10), note('outer', 600, 600)];

    expect(notesInContainer(small, notes, [big, small]).map((n) => n.id)).toEqual(['inner']);
    expect(notesInContainer(big, notes, [big, small]).map((n) => n.id)).toEqual(['outer']);
  });
});

describe('membershipChanges', () => {
  it('reports only notes whose container actually changed', () => {
    const c = container('c1', 0, 0, 300, 300);
    const notes = [
      note('unchanged', 10, 10, 'c1'), // already correct
      note('entered', 20, 20, null), // now inside
      note('left', 900, 900, 'c1'), // moved out
    ];

    expect(membershipChanges(notes, [c])).toEqual([
      { noteId: 'entered', containerId: 'c1' },
      { noteId: 'left', containerId: null },
    ]);
  });

  it('returns nothing when membership is already correct', () => {
    const c = container('c1', 0, 0, 300, 300);
    expect(membershipChanges([note('a', 10, 10, 'c1')], [c])).toEqual([]);
  });

  it('clears membership when all containers are gone', () => {
    expect(membershipChanges([note('a', 10, 10, 'c1')], [])).toEqual([
      { noteId: 'a', containerId: null },
    ]);
  });
});

describe('boundsAroundNotes', () => {
  it('fits all notes with padding', () => {
    const notes = [note('a', 100, 100), note('b', 300, 200)];
    const bounds = boundsAroundNotes(notes, 10);

    expect(bounds).toEqual({ x: 90, y: 90, width: 320, height: 220 });
  });

  it('returns null for an empty selection', () => {
    expect(boundsAroundNotes([])).toBeNull();
  });
});

describe('uniqueContainerName', () => {
  it('returns the base name when it is free', () => {
    expect(uniqueContainerName('Act 1', [])).toBe('Act 1');
  });

  it('suffixes when the name is taken', () => {
    expect(uniqueContainerName('Act 1', ['Act 1'])).toBe('Act 1 2');
  });

  it('keeps incrementing past existing suffixes', () => {
    expect(uniqueContainerName('Act 1', ['Act 1', 'Act 1 2', 'Act 1 3'])).toBe('Act 1 4');
  });

  it('is case-insensitive, matching a case-insensitive uniqueness expectation', () => {
    expect(uniqueContainerName('act 1', ['ACT 1'])).toBe('act 1 2');
  });
});

describe('sanitizeResize', () => {
  const current = { width: 400, height: 300 };

  it('rounds and keeps a valid resize', () => {
    expect(sanitizeResize({ width: 500.4, height: 320.6, x: 10.2, y: 20.8 }, current)).toEqual({
      width: 500,
      height: 321,
      position_x: 10,
      position_y: 21,
    });
  });

  it('falls back to the current size when width/height are missing', () => {
    expect(sanitizeResize({}, current)).toEqual({ width: 400, height: 300 });
  });

  it('ignores NaN and non-finite dimensions rather than writing them', () => {
    expect(sanitizeResize({ width: NaN, height: Infinity }, current)).toEqual({
      width: 400,
      height: 300,
    });
  });

  it('omits position entirely when x/y are absent, instead of writing NaN', () => {
    const result = sanitizeResize({ width: 500, height: 400 }, current);
    expect(result.position_x).toBeUndefined();
    expect(result.position_y).toBeUndefined();
  });

  it('clamps below-minimum sizes up to the minimum', () => {
    expect(sanitizeResize({ width: 10, height: 10 }, current)).toEqual({
      width: 200,
      height: 160,
    });
  });

  it('accepts a zero position, which is a legitimate coordinate', () => {
    const result = sanitizeResize({ width: 500, height: 400, x: 0, y: 0 }, current);
    expect(result.position_x).toBe(0);
    expect(result.position_y).toBe(0);
  });
});
