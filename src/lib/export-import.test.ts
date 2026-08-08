import { describe, it, expect } from 'vitest';
import {
  buildStoryExport,
  validateStoryExport,
  buildImportPlan,
  exportFileName,
  EXPORT_FORMAT_VERSION,
  type StoryExport,
} from './export-import';

const seq = () => {
  let n = 0;
  return () => `new-${++n}`;
};

const note = (id: string, extra: Record<string, unknown> = {}) =>
  ({
    id,
    board_id: 'b1',
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
    container_id: null,
    condition_data: null,
    technical_data: null,
    created_at: '',
    updated_at: '',
    ...extra,
  }) as never;

const connection = (id: string, source: string, target: string, extra = {}) =>
  ({
    id,
    board_id: 'b1',
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
    ...extra,
  }) as never;

const container = (id: string) =>
  ({
    id,
    story_id: 's1',
    board_id: 'b1',
    name: 'Act 1',
    description: null,
    position_x: 0,
    position_y: 0,
    width: 400,
    height: 300,
    color: '#7c3aed',
    background_opacity: 0.1,
    is_collapsed: false,
    is_locked: false,
    mini_board_data: { notes: [], connections: [], viewport: { x: 0, y: 0, zoom: 1 } },
    z_index: 0,
    created_at: '',
    updated_at: '',
  }) as never;

const board = (id: string) =>
  ({
    id,
    story_id: 's1',
    folder_id: null,
    title: 'Board One',
    description: null,
    sort_order: 0,
    viewport_x: 0,
    viewport_y: 0,
    viewport_zoom: 1,
  }) as never;

function makeExport(): StoryExport {
  return buildStoryExport(
    { title: 'My Story', description: 'desc', created_at: '2026-01-01' },
    [{ id: 'c1', story_id: 's1', name: 'gold', type: 'number', sort_order: 0 } as never],
    [
      {
        board: board('b1'),
        notes: [note('n1'), note('n2')],
        connections: [connection('x1', 'n1', 'n2')],
        containers: [container('ct1')],
      },
    ],
    '0.12.0',
    () => '2026-08-08T00:00:00Z'
  );
}

describe('buildStoryExport', () => {
  it('records accurate counts in the manifest', () => {
    const doc = makeExport();
    expect(doc.manifest.counts).toEqual({
      boards: 1,
      notes: 2,
      connections: 1,
      containers: 1,
      components: 1,
    });
    expect(doc.manifest.format).toBe('ideaboard-story');
    expect(doc.manifest.version).toBe(EXPORT_FORMAT_VERSION);
  });

  it('embeds board contents', () => {
    const doc = makeExport();
    expect(doc.boards[0].title).toBe('Board One');
    expect(doc.boards[0].notes).toHaveLength(2);
  });
});

describe('validateStoryExport', () => {
  it('accepts a well-formed export', () => {
    expect(validateStoryExport(makeExport()).valid).toBe(true);
  });

  it('rejects non-objects and unrelated JSON', () => {
    expect(validateStoryExport(null).valid).toBe(false);
    expect(validateStoryExport({ hello: 'world' }).valid).toBe(false);
  });

  it('rejects a newer format version with an actionable message', () => {
    const doc = makeExport();
    doc.manifest.version = EXPORT_FORMAT_VERSION + 1;
    const result = validateStoryExport(doc);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/newer version/i);
  });

  it('rejects an export with no boards', () => {
    const doc = makeExport();
    doc.boards = [];
    expect(validateStoryExport(doc).valid).toBe(false);
  });

  it('rejects a board missing its notes array', () => {
    const doc = makeExport();
    // @ts-expect-error deliberately malformed
    doc.boards[0].notes = undefined;
    expect(validateStoryExport(doc).valid).toBe(false);
  });

  it('rejects a missing story title', () => {
    const doc = makeExport();
    doc.story.title = '   ';
    expect(validateStoryExport(doc).valid).toBe(false);
  });
});

describe('buildImportPlan', () => {
  it('assigns fresh ids to story, boards, notes, connections and containers', () => {
    const plan = buildImportPlan(makeExport(), 'user-1', seq());

    expect(plan.story.id).toBe('new-1');
    expect(plan.notes.every((n) => n.id.startsWith('new-'))).toBe(true);
    expect(plan.notes.map((n) => n.id)).not.toContain('n1');
    expect(plan.boards[0].id).not.toBe('b1');
  });

  it('rewires connections to the new note ids', () => {
    const plan = buildImportPlan(makeExport(), 'user-1', seq());
    const noteIds = plan.notes.map((n) => n.id);

    expect(plan.connections).toHaveLength(1);
    expect(noteIds).toContain(plan.connections[0].source_note_id);
    expect(noteIds).toContain(plan.connections[0].target_note_id);
  });

  it('remaps note container_id onto the imported container', () => {
    const doc = makeExport();
    doc.boards[0].notes[0] = note('n1', { container_id: 'ct1' });

    const plan = buildImportPlan(doc, 'user-1', seq());
    expect(plan.notes[0].container_id).toBe(plan.containers[0].id);
    expect(plan.notes[0].container_id).not.toBe('ct1');
  });

  it('detaches a note whose container is missing from the export', () => {
    const doc = makeExport();
    doc.boards[0].containers = [];
    doc.boards[0].notes[0] = note('n1', { container_id: 'gone' });

    const plan = buildImportPlan(doc, 'user-1', seq());
    expect(plan.notes[0].container_id).toBeNull();
  });

  it('drops connections whose endpoints are missing rather than breaking FKs', () => {
    const doc = makeExport();
    doc.boards[0].connections = [connection('x1', 'n1', 'ghost')];

    const plan = buildImportPlan(doc, 'user-1', seq());
    expect(plan.connections).toEqual([]);
  });

  it('preserves branch ids so conditional notes keep their wiring', () => {
    const doc = makeExport();
    doc.boards[0].notes[0] = note('n1', {
      type: 'conditional',
      condition_data: { branches: [{ id: 'branch-1', label: 'yes', rules: [] }] },
    });
    doc.boards[0].connections = [connection('x1', 'n1', 'n2', { branch_id: 'branch-1' })];

    const plan = buildImportPlan(doc, 'user-1', seq());
    const conditional = plan.notes.find((n) => n.type === 'conditional');

    expect(
      (conditional?.condition_data as { branches: { id: string }[] }).branches[0].id
    ).toBe('branch-1');
    expect(plan.connections[0].branch_id).toBe('branch-1');
  });

  it('points every row at the new story and board', () => {
    const plan = buildImportPlan(makeExport(), 'user-1', seq());
    expect(plan.components.every((c) => c.story_id === plan.story.id)).toBe(true);
    expect(plan.boards.every((b) => b.story_id === plan.story.id)).toBe(true);
    expect(plan.notes.every((n) => n.board_id === plan.boards[0].id)).toBe(true);
    expect(plan.containers.every((c) => c.board_id === plan.boards[0].id)).toBe(true);
  });

  it('honours a title override', () => {
    const plan = buildImportPlan(makeExport(), 'user-1', seq(), 'Renamed Story');
    expect(plan.story.title).toBe('Renamed Story');
  });
});

describe('exportFileName', () => {
  it('slugifies the title and stamps the date', () => {
    expect(exportFileName('My Great Story!', () => new Date('2026-08-08'))).toBe(
      'my-great-story-2026-08-08.ideaboard.json'
    );
  });

  it('falls back when the title has no usable characters', () => {
    expect(exportFileName('***', () => new Date('2026-08-08'))).toBe(
      'story-2026-08-08.ideaboard.json'
    );
  });
});
