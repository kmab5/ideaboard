'use client';

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection as FlowConnection,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import type { Note, Connection, Board } from '@/types/database';
import { NoteNode } from './note-node';
import { DrawingNode } from './drawing-node';
import { ConnectionEdge } from './connection-edge';
import { Toolbar } from './toolbar';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useHistoryStore } from '@/lib/store';

// Custom node types - memoized to prevent recreation warnings
const defaultNodeTypes = {
  noteNode: NoteNode,
  drawingNode: DrawingNode,
};

// Custom edge types - memoized to prevent recreation warnings
const defaultEdgeTypes = {
  connectionEdge: ConnectionEdge,
};

interface CanvasProps {
  board: Board;
  notes: Note[];
  connections: Connection[];
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: (note: Partial<Note>) => void;
  onUpdateConnection: (id: string, updates: Partial<Connection>) => void;
  onDeleteConnection: (id: string) => void;
  onCreateConnection: (connection: Partial<Connection>) => void;
  onUpdateViewport: (x: number, y: number, zoom: number) => void;
}

// Inner component that uses the React Flow hooks
function CanvasInner({
  board,
  notes,
  connections,
  onUpdateNote,
  onDeleteNote,
  onCreateNote,
  onUpdateConnection,
  onDeleteConnection,
  onCreateConnection,
  onUpdateViewport,
}: CanvasProps) {
  // Track if initial load is complete
  const isInitializedRef = useRef(false);
  const reactFlowInstance = useReactFlow();
  const supabase = createClient();

  // Memoize node and edge types to prevent React Flow warnings
  const nodeTypes = useMemo(() => defaultNodeTypes, []);
  const edgeTypes = useMemo(() => defaultEdgeTypes, []);

  // Handle image upload to Supabase Storage
  const handleImageUpload = useCallback(
    async (noteId: string, file: File): Promise<string | null> => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${board.id}/${noteId}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('note-attachments')
          .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('note-attachments').getPublicUrl(data.path);

        return publicUrl;
      } catch (error) {
        console.error('Failed to upload image:', error);
        toast.error('Failed to upload image');
        return null;
      }
    },
    [board.id, supabase.storage]
  );

  // Convert notes to React Flow nodes
  const notesToNodes = useCallback(
    (notesList: Note[]): Node[] =>
      notesList.map((note) => ({
        id: note.id,
        type: note.type === 'drawing' ? 'drawingNode' : 'noteNode',
        position: { x: note.position_x, y: note.position_y },
        data: {
          note,
          onUpdate: onUpdateNote,
          onDelete: onDeleteNote,
          onImageUpload: note.type === 'drawing' ? undefined : handleImageUpload,
        },
        style: { width: note.width, height: note.height },
        draggable: !note.is_locked,
      })),
    [onUpdateNote, onDeleteNote, handleImageUpload]
  );

  // Convert connections to React Flow edges
  const connectionsToEdges = useCallback(
    (connectionsList: Connection[], gridVisible: boolean): Edge[] =>
      connectionsList.map((connection) => ({
        id: connection.id,
        source: connection.source_note_id,
        target: connection.target_note_id,
        // Add -source suffix since source handles are named "top-source", "bottom-source", etc.
        sourceHandle: `${connection.source_anchor}-source`,
        targetHandle: connection.target_anchor,
        type: 'connectionEdge',
        data: {
          connection,
          onUpdate: onUpdateConnection,
          onDelete: onDeleteConnection,
          showGrid: gridVisible,
        },
      })),
    [onUpdateConnection, onDeleteConnection]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeTool, setActiveTool] = useState<'select' | 'pan'>('select');
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(board.viewport_zoom);

  // History store for undo/redo
  const {
    pushAction,
    undo: undoAction,
    redo: redoAction,
    canUndo,
    canRedo,
    setIsUndoingOrRedoing,
  } = useHistoryStore();

  // Handle undo
  const handleUndo = useCallback(() => {
    const action = undoAction();
    if (!action) return;

    setIsUndoingOrRedoing(true);

    switch (action.type) {
      case 'CREATE_NOTE':
        // Undo create = delete the note
        if (action.redo.noteId) {
          onDeleteNote(action.redo.noteId);
        }
        break;
      case 'DELETE_NOTE':
        // Undo delete = recreate the note
        if (action.undo.fullState) {
          onCreateNote(action.undo.fullState as Note);
        }
        break;
      case 'UPDATE_NOTE':
      case 'MOVE_NOTE':
      case 'RESIZE_NOTE':
        // Undo update = restore previous state
        if (action.undo.noteId && action.undo.previousState) {
          onUpdateNote(action.undo.noteId, action.undo.previousState as Partial<Note>);
        }
        break;
      case 'CREATE_CONNECTION':
        // Undo create = delete the connection
        if (action.redo.connectionId) {
          onDeleteConnection(action.redo.connectionId);
        }
        break;
      case 'DELETE_CONNECTION':
        // Undo delete = recreate the connection
        if (action.undo.fullState) {
          onCreateConnection(action.undo.fullState as Connection);
        }
        break;
      case 'UPDATE_CONNECTION':
        // Undo update = restore previous state
        if (action.undo.connectionId && action.undo.previousState) {
          onUpdateConnection(
            action.undo.connectionId,
            action.undo.previousState as Partial<Connection>
          );
        }
        break;
    }

    setIsUndoingOrRedoing(false);
    toast.success('Undone');
  }, [
    undoAction,
    setIsUndoingOrRedoing,
    onDeleteNote,
    onCreateNote,
    onUpdateNote,
    onDeleteConnection,
    onCreateConnection,
    onUpdateConnection,
  ]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const action = redoAction();
    if (!action) return;

    setIsUndoingOrRedoing(true);

    switch (action.type) {
      case 'CREATE_NOTE':
        // Redo create = recreate the note
        if (action.redo.fullState) {
          onCreateNote(action.redo.fullState as Note);
        }
        break;
      case 'DELETE_NOTE':
        // Redo delete = delete the note again
        if (action.undo.noteId) {
          onDeleteNote(action.undo.noteId);
        }
        break;
      case 'UPDATE_NOTE':
      case 'MOVE_NOTE':
      case 'RESIZE_NOTE':
        // Redo update = apply new state
        if (action.redo.noteId && action.redo.newState) {
          onUpdateNote(action.redo.noteId, action.redo.newState as Partial<Note>);
        }
        break;
      case 'CREATE_CONNECTION':
        // Redo create = recreate the connection
        if (action.redo.fullState) {
          onCreateConnection(action.redo.fullState as Connection);
        }
        break;
      case 'DELETE_CONNECTION':
        // Redo delete = delete the connection again
        if (action.undo.connectionId) {
          onDeleteConnection(action.undo.connectionId);
        }
        break;
      case 'UPDATE_CONNECTION':
        // Redo update = apply new state
        if (action.redo.connectionId && action.redo.newState) {
          onUpdateConnection(action.redo.connectionId, action.redo.newState as Partial<Connection>);
        }
        break;
    }

    setIsUndoingOrRedoing(false);
    toast.success('Redone');
  }, [
    redoAction,
    setIsUndoingOrRedoing,
    onDeleteNote,
    onCreateNote,
    onUpdateNote,
    onDeleteConnection,
    onCreateConnection,
    onUpdateConnection,
  ]);

  // Manual save handler - saves all current state
  const handleManualSave = useCallback(() => {
    // Save viewport
    onUpdateViewport(
      reactFlowInstance.getViewport().x,
      reactFlowInstance.getViewport().y,
      reactFlowInstance.getViewport().zoom
    );
    // Force save all note positions from current nodes
    nodes.forEach((node) => {
      onUpdateNote(node.id, {
        position_x: node.position.x,
        position_y: node.position.y,
      });
    });
    toast.success('Saved!');
  }, [nodes, reactFlowInstance, onUpdateNote, onUpdateViewport]);

  // Custom edge change handler that deletes connections when edges are removed
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Handle edge removals by deleting the connection from database
      changes.forEach((change) => {
        if (change.type === 'remove') {
          onDeleteConnection(change.id);
        }
      });
      // Apply the changes to local state
      onEdgesChange(changes);
    },
    [onEdgesChange, onDeleteConnection]
  );

  // Initialize nodes and edges when notes/connections change
  useEffect(() => {
    // Only initialize once we have data (notes array exists, even if empty)
    if (!isInitializedRef.current) {
      setNodes(notesToNodes(notes));
      setEdges(connectionsToEdges(connections, showGrid));
      isInitializedRef.current = true;
    }
  }, [notes, connections, notesToNodes, connectionsToEdges, setNodes, setEdges, showGrid]);

  // Handle note additions only (not updates to existing notes)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    setNodes((currentNodes) => {
      const currentIds = new Set(currentNodes.map((n) => n.id));
      const newNotes = notes.filter((note) => !currentIds.has(note.id));

      if (newNotes.length > 0) {
        return [...currentNodes, ...notesToNodes(newNotes)];
      }

      // Update data prop for existing nodes (but not position - position flows from UI to DB)
      return currentNodes.map((node) => {
        const noteData = notes.find((n) => n.id === node.id);
        if (noteData) {
          return {
            ...node,
            type: noteData.type === 'drawing' ? 'drawingNode' : 'noteNode',
            data: {
              note: noteData,
              onUpdate: onUpdateNote,
              onDelete: onDeleteNote,
              onImageUpload: noteData.type === 'drawing' ? undefined : handleImageUpload,
            },
            draggable: !noteData.is_locked,
          };
        }
        return node;
      });
    });

    // Remove deleted notes
    setNodes((currentNodes) => {
      const noteIds = new Set(notes.map((n) => n.id));
      return currentNodes.filter((node) => noteIds.has(node.id));
    });
  }, [notes, notesToNodes, onUpdateNote, onDeleteNote, handleImageUpload, setNodes]);

  // Handle edge updates
  useEffect(() => {
    if (!isInitializedRef.current) return;

    setEdges((currentEdges) => {
      const currentIds = new Set(currentEdges.map((e) => e.id));
      const newConnections = connections.filter((conn) => !currentIds.has(conn.id));

      if (newConnections.length > 0) {
        return [...currentEdges, ...connectionsToEdges(newConnections, showGrid)];
      }

      // Update data and source/target for existing edges
      return currentEdges.map((edge) => {
        const connectionData = connections.find((c) => c.id === edge.id);
        if (connectionData) {
          return {
            ...edge,
            source: connectionData.source_note_id,
            target: connectionData.target_note_id,
            sourceHandle: `${connectionData.source_anchor}-source`,
            targetHandle: connectionData.target_anchor,
            data: {
              connection: connectionData,
              onUpdate: onUpdateConnection,
              onDelete: onDeleteConnection,
              showGrid,
            },
          };
        }
        return edge;
      });
    });

    // Remove deleted connections
    setEdges((currentEdges) => {
      const connIds = new Set(connections.map((c) => c.id));
      return currentEdges.filter((edge) => connIds.has(edge.id));
    });
  }, [connections, connectionsToEdges, setEdges, onUpdateConnection, onDeleteConnection, showGrid]);

  // Handle node changes (position updates during drag)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  // Track drag start positions for undo
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Handle node drag start - save initial position for undo
  const handleNodeDragStart = useCallback((_event: React.MouseEvent, node: Node) => {
    dragStartPositions.current.set(node.id, { ...node.position });
  }, []);

  // Handle node drag stop - save position when drag ends
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const startPos = dragStartPositions.current.get(node.id);

      // Only track if position actually changed
      if (startPos && (startPos.x !== node.position.x || startPos.y !== node.position.y)) {
        pushAction({
          type: 'MOVE_NOTE',
          undo: {
            noteId: node.id,
            previousState: { position_x: startPos.x, position_y: startPos.y },
          },
          redo: {
            noteId: node.id,
            newState: { position_x: node.position.x, position_y: node.position.y },
          },
        });
      }

      dragStartPositions.current.delete(node.id);

      onUpdateNote(node.id, {
        position_x: node.position.x,
        position_y: node.position.y,
      });
    },
    [onUpdateNote, pushAction]
  );

  // Handle new connections
  const handleConnect = useCallback(
    (params: FlowConnection) => {
      if (!params.source || !params.target) return;

      // Strip the -source suffix from sourceHandle for database storage
      const sourceAnchor = params.sourceHandle?.replace('-source', '') || 'bottom';

      // Random color for new connections
      const connectionColors = [
        '#6b7280',
        '#ef4444',
        '#f97316',
        '#eab308',
        '#22c55e',
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
      ];
      const randomConnectionColor =
        connectionColors[Math.floor(Math.random() * connectionColors.length)];

      const newConnection: Partial<Connection> = {
        id: uuidv4(),
        board_id: board.id,
        source_note_id: params.source,
        target_note_id: params.target,
        source_anchor: sourceAnchor as Connection['source_anchor'],
        target_anchor: (params.targetHandle as Connection['target_anchor']) || 'top',
        color: randomConnectionColor,
        style: 'solid',
        thickness: 2,
        arrow_type: 'single',
        curvature: 'curved',
      };

      // Track history for undo
      pushAction({
        type: 'CREATE_CONNECTION',
        undo: { connectionId: newConnection.id },
        redo: { connectionId: newConnection.id, fullState: newConnection as Connection },
      });

      onCreateConnection(newConnection);
    },
    [board.id, onCreateConnection, pushAction]
  );

  // Get the center of the current viewport in flow coordinates
  const getViewportCenter = useCallback(() => {
    const viewport = reactFlowInstance.getViewport();

    // Get the container dimensions from the React Flow wrapper
    const flowContainer = document.querySelector('.react-flow');
    const width = flowContainer?.clientWidth || window.innerWidth;
    const height = flowContainer?.clientHeight || window.innerHeight;

    // Convert screen center to flow coordinates
    const centerX = (-viewport.x + width / 2) / viewport.zoom;
    const centerY = (-viewport.y + height / 2) / viewport.zoom;

    // Add small random offset to prevent stacking
    return {
      x: centerX + (Math.random() - 0.5) * 50,
      y: centerY + (Math.random() - 0.5) * 50,
    };
  }, [reactFlowInstance]);

  // Add new note at position
  const handleAddNote = useCallback(
    (position?: { x: number; y: number }) => {
      const pos = position || getViewportCenter();

      // Random color for new notes
      const noteColors = [
        '#FFFFFF',
        '#FFF9C4',
        '#FFCCBC',
        '#F8BBD9',
        '#E1BEE7',
        '#C5CAE9',
        '#BBDEFB',
        '#B2DFDB',
        '#C8E6C9',
      ];
      const randomNoteColor = noteColors[Math.floor(Math.random() * noteColors.length)];

      const newNote: Partial<Note> = {
        id: uuidv4(),
        board_id: board.id,
        type: 'normal',
        title: '',
        content: { blocks: [] },
        position_x: pos.x,
        position_y: pos.y,
        width: 200,
        height: 150,
        color: randomNoteColor,
        is_collapsed: false,
        is_locked: false,
        z_index: nodes.length,
      };

      // Track history for undo
      pushAction({
        type: 'CREATE_NOTE',
        undo: { noteId: newNote.id },
        redo: { noteId: newNote.id, fullState: newNote as Note },
      });

      onCreateNote(newNote);
    },
    [board.id, nodes.length, onCreateNote, getViewportCenter, pushAction]
  );

  // Add new drawing at position
  const handleAddDrawing = useCallback(
    (position?: { x: number; y: number }) => {
      const pos = position || getViewportCenter();

      const newDrawing: Partial<Note> = {
        id: uuidv4(),
        board_id: board.id,
        type: 'drawing',
        title: 'Drawing',
        content: { blocks: [] },
        position_x: pos.x,
        position_y: pos.y,
        width: 300,
        height: 200,
        color: '#FFFFFF',
        is_collapsed: false,
        is_locked: false,
        z_index: nodes.length,
        drawing_data: { strokes: [] },
      };

      // Track history for undo
      pushAction({
        type: 'CREATE_NOTE',
        undo: { noteId: newDrawing.id },
        redo: { noteId: newDrawing.id, fullState: newDrawing as Note },
      });

      onCreateNote(newDrawing);
    },
    [board.id, nodes.length, onCreateNote, getViewportCenter, pushAction]
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn({ duration: 200 });
    // Update zoom state after animation
    setTimeout(() => {
      setZoom(reactFlowInstance.getZoom());
    }, 210);
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut({ duration: 200 });
    // Update zoom state after animation
    setTimeout(() => {
      setZoom(reactFlowInstance.getZoom());
    }, 210);
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
    // Update zoom state after animation
    setTimeout(() => {
      setZoom(reactFlowInstance.getZoom());
    }, 310);
  }, [reactFlowInstance]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Ctrl+S / Cmd+S for manual save (allow even in inputs)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
        return;
      }

      // Handle Ctrl+Z / Cmd+Z for undo (allow even in inputs for consistency)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Handle Ctrl+Shift+Z / Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Handle Ctrl+Y / Cmd+Y for redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Ignore other shortcuts if typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'h':
          setActiveTool('pan');
          break;
        case 'n':
          handleAddNote();
          break;
        case 'd':
          handleAddDrawing();
          break;
        case 'g':
          setShowGrid((g) => !g);
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleFitView();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleAddNote,
    handleAddDrawing,
    handleUndo,
    handleRedo,
    handleZoomIn,
    handleZoomOut,
    handleFitView,
    handleManualSave,
  ]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={undefined}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectOnClick={true}
        defaultViewport={{
          x: board.viewport_x,
          y: board.viewport_y,
          zoom: board.viewport_zoom,
        }}
        minZoom={0.1}
        maxZoom={4}
        // TODO: Touch panning not working correctly in Chrome DevTools touch simulation
        // Need to investigate React Flow touch event handling for mobile devices
        // Pan mode: allow all inputs including touch (button 0)
        // Select mode: middle mouse (1) and right mouse (2) for panning
        panOnDrag={activeTool === 'pan'}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        // In select mode, dragging on empty canvas creates selection box
        selectionOnDrag={activeTool === 'select'}
        selectNodesOnDrag={activeTool === 'select'}
        // Enable node dragging in both modes
        nodesDraggable={true}
        // Prevent browser scroll/zoom interference
        preventScrolling={true}
        fitView={nodes.length === 0}
        onMoveEnd={(_, viewport) => {
          setZoom(viewport.zoom);
          onUpdateViewport(viewport.x, viewport.y, viewport.zoom);
        }}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Shift', 'Meta']}
        className="bg-muted/20"
        proOptions={{ hideAttribution: true }}
      >
        {showGrid && <Background variant={BackgroundVariant.Dots} gap={20} size={1} />}
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="hidden rounded-lg !border !bg-background sm:block"
        />
        <Controls className="rounded-lg !border !bg-background" showInteractive={false} />

        <Panel position="top-left">
          <Toolbar
            zoom={zoom}
            showGrid={showGrid}
            activeTool={activeTool}
            canUndo={canUndo()}
            canRedo={canRedo()}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitView={handleFitView}
            onAddNote={() => handleAddNote()}
            onAddDrawing={() => handleAddDrawing()}
            onToolChange={setActiveTool}
            onToggleGrid={() => setShowGrid(!showGrid)}
            onManualSave={handleManualSave}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </Panel>
      </ReactFlow>
    </div>
  );
}

// Wrapper component that provides the ReactFlowProvider
export function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
