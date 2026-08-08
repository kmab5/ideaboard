import { describe, it, expect } from 'vitest';
import { cloneBoardContents, resolveActiveBoard } from './boards';
import type { Note, Connection } from '@/types/database';

function makeNote(id: string): Note {
  return {
    id,
    board_id: 'board-1',
    type: 'normal',
    title: `Note ${id}`,
    content: { blocks: [] },
    position_x: 0,
    position_y: 0,
    width: 200,
    height: 150,
    color: '#FFFFFF',
    is_collapsed: false,
    is_locked: false,
    z_index: 0,
    condition_data: null,
    technical_data: null,
    container_id: null,
    created_at: '',
    updated_at: '',
  } as unknown as Note;
}

function makeConnection(id: string, source: string, target: string): Connection {
  return {
    id,
    board_id: 'board-1',
    source_note_id: source,
    target_note_id: target,
    source_anchor: 'bottom',
    target_anchor: 'top',
    label: null,
    color: '#6b7280',
    style: 'solid',
    thickness: 2,
    arrow_type: 'single',
    curvature: 'curved',
    branch_label: null,
    branch_order: null,
    branch_id: null,
    created_at: '',
    updated_at: '',
  } as unknown as Connection;
}

/** Deterministic id generator for assertions. */
function sequentialIds() {
  let n = 0;
  return () => `new-${++n}`;
}

describe('cloneBoardContents', () => {
  it('gives every note a new id and the new board id', () => {
    const notes = [makeNote('a'), makeNote('b')];
    const result = cloneBoardContents(notes, [], 'board-2', sequentialIds());

    expect(result.notes.map((n) => n.id)).toEqual(['new-1', 'new-2']);
    expect(result.notes.every((n) => n.board_id === 'board-2')).toBe(true);
    // Original notes are untouched.
    expect(notes[0].id).toBe('a');
  });

  it('rewires connections to the cloned note ids', () => {
    const notes = [makeNote('a'), makeNote('b')];
    const connections = [makeConnection('c1', 'a', 'b')];
    const result = cloneBoardContents(notes, connections, 'board-2', sequentialIds());

    const [noteA, noteB] = result.notes;
    expect(result.connections).toHaveLength(1);
    expect(result.connections[0].source_note_id).toBe(noteA.id);
    expect(result.connections[0].target_note_id).toBe(noteB.id);
    expect(result.connections[0].board_id).toBe('board-2');
    expect(result.connections[0].id).not.toBe('c1');
  });

  it('drops connections whose endpoints are missing rather than leaving them dangling', () => {
    const notes = [makeNote('a')];
    const connections = [makeConnection('c1', 'a', 'ghost')];
    const result = cloneBoardContents(notes, connections, 'board-2', sequentialIds());

    expect(result.connections).toEqual([]);
  });

  it('preserves other connection properties, including branch metadata', () => {
    const notes = [makeNote('a'), makeNote('b')];
    const connection = { ...makeConnection('c1', 'a', 'b'), branch_id: 'branch-x', color: '#ff0000' };
    const result = cloneBoardContents(notes, [connection], 'board-2', sequentialIds());

    expect(result.connections[0].branch_id).toBe('branch-x');
    expect(result.connections[0].color).toBe('#ff0000');
  });

  it('handles an empty board', () => {
    expect(cloneBoardContents([], [], 'board-2', sequentialIds())).toEqual({
      notes: [],
      connections: [],
    });
  });
});

describe('resolveActiveBoard', () => {
  const boards = [{ id: 'b1' }, { id: 'b2' }];

  it('returns the requested board when it exists', () => {
    expect(resolveActiveBoard(boards, 'b2')).toEqual({ id: 'b2' });
  });

  it('falls back to the first board for an unknown id', () => {
    expect(resolveActiveBoard(boards, 'nope')).toEqual({ id: 'b1' });
  });

  it('falls back to the first board when none requested', () => {
    expect(resolveActiveBoard(boards, null)).toEqual({ id: 'b1' });
  });

  it('returns null when there are no boards', () => {
    expect(resolveActiveBoard([], 'b1')).toBeNull();
  });
});
