import { describe, it, expect } from 'vitest';
import { buildIbsArchive, readIbsArchive, sha256, checksumPayload, slugifyTitle } from './ibs';
import { buildStoryExport } from './export-import';

const board = (title: string) =>
  ({
    id: 'b1',
    story_id: 's1',
    folder_id: null,
    title,
    description: null,
    sort_order: 0,
    viewport_x: 0,
    viewport_y: 0,
    viewport_zoom: 1,
  }) as never;

const note = (id: string) =>
  ({
    id,
    board_id: 'b1',
    type: 'normal',
    title: `Note ${id}`,
    content: { blocks: [{ type: 'paragraph', content: 'hello {{gold}}' }] },
    position_x: 10,
    position_y: 20,
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
  }) as never;

const connection = (id: string) =>
  ({
    id,
    board_id: 'b1',
    source_note_id: 'n1',
    target_note_id: 'n2',
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
  }) as never;

function makeDoc() {
  return buildStoryExport(
    { title: 'My Story', description: 'desc', created_at: '2026-01-01' },
    [{ id: 'c1', story_id: 's1', name: 'gold', type: 'number', current_value: 5 } as never],
    [
      {
        board: board('Act One'),
        notes: [note('n1'), note('n2')],
        connections: [connection('x1')],
        containers: [],
      },
      { board: board('Act Two'), notes: [note('n3')], connections: [], containers: [] },
    ],
    '0.15.0',
    () => '2026-08-08T00:00:00Z'
  );
}

describe('sha256', () => {
  it('produces a stable 64-char hex digest', async () => {
    const hash = await sha256('hello');
    expect(hash).toHaveLength(64);
    expect(hash).toBe(await sha256('hello'));
    expect(hash).not.toBe(await sha256('hello!'));
  });
});

describe('checksumPayload', () => {
  it('excludes the manifest, so the checksum can live inside it', () => {
    const payload = checksumPayload(makeDoc());
    expect(payload).not.toContain('exported_at');
    expect(payload).toContain('My Story');
  });
});

describe('.ibs round trip', () => {
  it('preserves story, components, boards, notes and connections', async () => {
    const original = makeDoc();
    const archive = await buildIbsArchive(original);
    const { doc, manifest, checksumValid } = await readIbsArchive(await archive.arrayBuffer());

    expect(checksumValid).toBe(true);
    expect(manifest.story_title).toBe('My Story');
    expect(manifest.total_notes).toBe(3);

    expect(doc.story.title).toBe('My Story');
    expect(doc.components).toHaveLength(1);
    expect(doc.boards).toHaveLength(2);
    expect(doc.boards.map((b) => b.title)).toEqual(['Act One', 'Act Two']);
  });

  it('keeps each board with its own notes and connections', async () => {
    const archive = await buildIbsArchive(makeDoc());
    const { doc } = await readIbsArchive(await archive.arrayBuffer());

    expect(doc.boards[0].notes).toHaveLength(2);
    expect(doc.boards[0].connections).toHaveLength(1);
    expect(doc.boards[1].notes).toHaveLength(1);
    expect(doc.boards[1].connections).toHaveLength(0);
  });

  it('preserves note content verbatim', async () => {
    const archive = await buildIbsArchive(makeDoc());
    const { doc } = await readIbsArchive(await archive.arrayBuffer());
    const content = doc.boards[0].notes[0].content as { blocks: { content: string }[] };
    expect(content.blocks[0].content).toBe('hello {{gold}}');
  });

  it('detects a tampered payload via the checksum', async () => {
    const archive = await buildIbsArchive(makeDoc());
    const { doc } = await readIbsArchive(await archive.arrayBuffer());

    // Re-read with a mutated story title but the original manifest checksum.
    const tampered = { ...doc, story: { ...doc.story, title: 'Altered' } };
    const original = await readIbsArchive(await (await buildIbsArchive(makeDoc())).arrayBuffer());
    const recomputed = await sha256(checksumPayload(tampered));
    expect(recomputed).not.toBe(original.manifest.checksum);
  });

  it('rejects an archive with no manifest', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('story.json', '{}');
    const blob = await zip.generateAsync({ type: 'blob' });

    await expect(readIbsArchive(await blob.arrayBuffer())).rejects.toThrow(/manifest/i);
  });
});

describe('slugifyTitle', () => {
  it('slugifies and falls back sensibly', () => {
    expect(slugifyTitle('My Great Story!')).toBe('my-great-story');
    expect(slugifyTitle('***')).toBe('story');
  });
});
