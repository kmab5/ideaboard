import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Node, Edge, Connection as FlowConnection, NodeChange, EdgeChange } from 'reactflow';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import type { Note, Connection, Board, NoteUpdate, ConnectionUpdate } from '@/types/database';

// Note node data
interface NoteNodeData {
  note: Note;
}

type NoteNode = Node<NoteNodeData>;
type ConnectionEdge = Edge<{ connection: Connection }>;

interface BoardState {
  // Current board data
  board: Board | null;
  nodes: NoteNode[];
  edges: ConnectionEdge[];

  // Selection state
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  // UI state
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;

  // Viewport
  viewport: { x: number; y: number; zoom: number };

  // Actions - Board
  setBoard: (board: Board | null) => void;
  clearBoard: () => void;

  // Actions - Nodes (Notes)
  setNodes: (nodes: NoteNode[]) => void;
  addNode: (note: Note) => void;
  updateNode: (id: string, updates: NoteUpdate) => void;
  removeNode: (id: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;

  // Actions - Edges (Connections)
  setEdges: (edges: ConnectionEdge[]) => void;
  addEdge: (connection: Connection) => void;
  updateEdge: (id: string, updates: ConnectionUpdate) => void;
  removeEdge: (id: string) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: FlowConnection) => void;

  // Actions - Selection
  setSelectedNodes: (ids: string[]) => void;
  setSelectedEdges: (ids: string[]) => void;
  clearSelection: () => void;

  // Actions - State
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // Actions - Bulk operations
  loadBoardData: (board: Board, notes: Note[], connections: Connection[]) => void;
}

// Convert Note to React Flow Node
const noteToNode = (note: Note): NoteNode => ({
  id: note.id,
  type: 'noteNode',
  position: { x: note.position_x, y: note.position_y },
  data: { note },
  style: {
    width: note.width,
    height: note.height,
  },
  draggable: !note.is_locked,
});

// Convert Connection to React Flow Edge
const connectionToEdge = (connection: Connection): ConnectionEdge => ({
  id: connection.id,
  source: connection.source_note_id,
  target: connection.target_note_id,
  sourceHandle: connection.source_anchor,
  targetHandle: connection.target_anchor,
  type: 'connectionEdge',
  data: { connection },
  style: {
    stroke: connection.color,
    strokeWidth: connection.thickness,
    strokeDasharray:
      connection.style === 'dashed' ? '5,5' : connection.style === 'dotted' ? '2,2' : undefined,
  },
  animated: false,
  label: connection.label || undefined,
});

export const useBoardStore = create<BoardState>()(
  devtools(
    (set) => ({
      // Initial state
      board: null,
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      isLoading: false,
      isSaving: false,
      hasUnsavedChanges: false,
      viewport: { x: 0, y: 0, zoom: 1 },

      // Board actions
      setBoard: (board) => set({ board }),

      clearBoard: () =>
        set({
          board: null,
          nodes: [],
          edges: [],
          selectedNodeIds: [],
          selectedEdgeIds: [],
          hasUnsavedChanges: false,
        }),

      // Node actions
      setNodes: (nodes) => set({ nodes }),

      addNode: (note) =>
        set((state) => ({
          nodes: [...state.nodes, noteToNode(note)],
          hasUnsavedChanges: true,
        })),

      updateNode: (id, updates) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  position: {
                    x: updates.position_x ?? node.position.x,
                    y: updates.position_y ?? node.position.y,
                  },
                  style: {
                    ...node.style,
                    width: updates.width ?? node.style?.width,
                    height: updates.height ?? node.style?.height,
                  },
                  draggable: updates.is_locked !== undefined ? !updates.is_locked : node.draggable,
                  data: {
                    ...node.data,
                    note: { ...node.data.note, ...updates },
                  },
                }
              : node
          ),
          hasUnsavedChanges: true,
        })),

      removeNode: (id) =>
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
          selectedNodeIds: state.selectedNodeIds.filter((nodeId) => nodeId !== id),
          hasUnsavedChanges: true,
        })),

      onNodesChange: (changes) =>
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes),
          hasUnsavedChanges: true,
        })),

      // Edge actions
      setEdges: (edges) => set({ edges }),

      addEdge: (connection) =>
        set((state) => ({
          edges: [...state.edges, connectionToEdge(connection)],
          hasUnsavedChanges: true,
        })),

      updateEdge: (id, updates) =>
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === id
              ? {
                  ...edge,
                  sourceHandle: updates.source_anchor ?? edge.sourceHandle,
                  targetHandle: updates.target_anchor ?? edge.targetHandle,
                  label: updates.label ?? edge.label,
                  style: {
                    ...edge.style,
                    stroke: updates.color ?? edge.style?.stroke,
                    strokeWidth: updates.thickness ?? edge.style?.strokeWidth,
                    strokeDasharray:
                      updates.style === 'dashed'
                        ? '5,5'
                        : updates.style === 'dotted'
                          ? '2,2'
                          : updates.style === 'solid'
                            ? undefined
                            : edge.style?.strokeDasharray,
                  },
                  data: {
                    ...edge.data,
                    connection: { ...edge.data!.connection, ...updates },
                  },
                }
              : edge
          ),
          hasUnsavedChanges: true,
        })),

      removeEdge: (id) =>
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== id),
          selectedEdgeIds: state.selectedEdgeIds.filter((edgeId) => edgeId !== id),
          hasUnsavedChanges: true,
        })),

      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
          hasUnsavedChanges: true,
        })),

      onConnect: (connection) =>
        set((state) => ({
          edges: addEdge(connection, state.edges),
          hasUnsavedChanges: true,
        })),

      // Selection actions
      setSelectedNodes: (ids) => set({ selectedNodeIds: ids }),
      setSelectedEdges: (ids) => set({ selectedEdgeIds: ids }),
      clearSelection: () => set({ selectedNodeIds: [], selectedEdgeIds: [] }),

      // State actions
      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),
      setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
      setViewport: (viewport) => set({ viewport }),

      // Bulk operations
      loadBoardData: (board, notes, connections) =>
        set({
          board,
          nodes: notes.map(noteToNode),
          edges: connections.map(connectionToEdge),
          viewport: {
            x: board.viewport_x,
            y: board.viewport_y,
            zoom: board.viewport_zoom,
          },
          isLoading: false,
          hasUnsavedChanges: false,
        }),
    }),
    { name: 'BoardStore' }
  )
);
