import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore, type HistoryAction } from './historyStore';

const reset = () => useHistoryStore.setState({ past: [], future: [], isUndoingOrRedoing: false });

const moveAction: Omit<HistoryAction, 'timestamp'> = {
  type: 'MOVE_NOTE',
  undo: { noteId: 'n1', previousState: { position_x: 0, position_y: 0 } },
  redo: { noteId: 'n1', newState: { position_x: 10, position_y: 10 } },
};

describe('historyStore', () => {
  beforeEach(reset);

  it('starts empty and cannot undo/redo', () => {
    const s = useHistoryStore.getState();
    expect(s.canUndo()).toBe(false);
    expect(s.canRedo()).toBe(false);
  });

  it('pushes actions and enables undo', () => {
    useHistoryStore.getState().pushAction(moveAction);
    expect(useHistoryStore.getState().canUndo()).toBe(true);
    expect(useHistoryStore.getState().past).toHaveLength(1);
  });

  it('undo moves an action to the future stack', () => {
    const s = useHistoryStore.getState();
    s.pushAction(moveAction);
    const undone = useHistoryStore.getState().undo();
    expect(undone?.type).toBe('MOVE_NOTE');
    expect(useHistoryStore.getState().canUndo()).toBe(false);
    expect(useHistoryStore.getState().canRedo()).toBe(true);
  });

  it('redo moves an action back to the past stack', () => {
    const s = useHistoryStore.getState();
    s.pushAction(moveAction);
    useHistoryStore.getState().undo();
    const redone = useHistoryStore.getState().redo();
    expect(redone?.type).toBe('MOVE_NOTE');
    expect(useHistoryStore.getState().canUndo()).toBe(true);
    expect(useHistoryStore.getState().canRedo()).toBe(false);
  });

  it('clears the future stack when a new action is pushed after undo', () => {
    const s = useHistoryStore.getState();
    s.pushAction(moveAction);
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().canRedo()).toBe(true);
    useHistoryStore.getState().pushAction(moveAction);
    expect(useHistoryStore.getState().canRedo()).toBe(false);
  });

  it('does not record while an undo/redo is in progress', () => {
    const s = useHistoryStore.getState();
    s.setIsUndoingOrRedoing(true);
    s.pushAction(moveAction);
    expect(useHistoryStore.getState().past).toHaveLength(0);
  });

  it('caps history at 30 entries', () => {
    const s = useHistoryStore.getState();
    for (let i = 0; i < 40; i++) s.pushAction(moveAction);
    expect(useHistoryStore.getState().past.length).toBeLessThanOrEqual(30);
  });

  it('returns null when undoing/redoing with empty stacks', () => {
    const s = useHistoryStore.getState();
    expect(s.undo()).toBeNull();
    expect(s.redo()).toBeNull();
  });
});
