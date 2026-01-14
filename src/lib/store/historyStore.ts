import { create } from 'zustand';
import type { Note, Connection } from '@/types/database';

// Maximum number of history entries to keep (session only)
const MAX_HISTORY_SIZE = 30;

// Action types that can be undone/redone
export type HistoryActionType =
  | 'CREATE_NOTE'
  | 'UPDATE_NOTE'
  | 'DELETE_NOTE'
  | 'CREATE_CONNECTION'
  | 'UPDATE_CONNECTION'
  | 'DELETE_CONNECTION'
  | 'MOVE_NOTE'
  | 'RESIZE_NOTE';

// Represents a single undoable action
export interface HistoryAction {
  type: HistoryActionType;
  timestamp: number;
  // Data needed to undo the action
  undo: {
    noteId?: string;
    connectionId?: string;
    previousState?: Partial<Note> | Partial<Connection>;
    fullState?: Note | Connection;
  };
  // Data needed to redo the action
  redo: {
    noteId?: string;
    connectionId?: string;
    newState?: Partial<Note> | Partial<Connection>;
    fullState?: Note | Connection;
  };
}

interface HistoryState {
  // Past actions (can be undone)
  past: HistoryAction[];
  // Future actions (can be redone after undo)
  future: HistoryAction[];
  // Whether we're currently performing an undo/redo (to prevent recording)
  isUndoingOrRedoing: boolean;

  // Actions
  pushAction: (action: Omit<HistoryAction, 'timestamp'>) => void;
  undo: () => HistoryAction | null;
  redo: () => HistoryAction | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
  setIsUndoingOrRedoing: (value: boolean) => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  isUndoingOrRedoing: false,

  pushAction: (action) => {
    const state = get();

    // Don't record actions while undoing/redoing
    if (state.isUndoingOrRedoing) return;

    const newAction: HistoryAction = {
      ...action,
      timestamp: Date.now(),
    };

    set((state) => ({
      past: [...state.past.slice(-MAX_HISTORY_SIZE + 1), newAction],
      // Clear future when a new action is performed
      future: [],
    }));
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return null;

    const actionToUndo = state.past[state.past.length - 1];

    set((state) => ({
      past: state.past.slice(0, -1),
      future: [actionToUndo, ...state.future].slice(0, MAX_HISTORY_SIZE),
    }));

    return actionToUndo;
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return null;

    const actionToRedo = state.future[0];

    set((state) => ({
      past: [...state.past, actionToRedo].slice(-MAX_HISTORY_SIZE),
      future: state.future.slice(1),
    }));

    return actionToRedo;
  },

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),

  setIsUndoingOrRedoing: (value) => set({ isUndoingOrRedoing: value }),
}));
