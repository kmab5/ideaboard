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

  // Handle node drag stop - save position when drag ends
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onUpdateNote(node.id, {
        position_x: node.position.x,
        position_y: node.position.y,
      });
    },
    [onUpdateNote]
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

      onCreateConnection(newConnection);
    },
    [board.id, onCreateConnection]
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

      onCreateNote(newNote);
    },
    [board.id, nodes.length, onCreateNote, getViewportCenter]
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

      onCreateNote(newDrawing);
    },
    [board.id, nodes.length, onCreateNote, getViewportCenter]
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.2, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.2, 0.1));
  }, []);

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
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
        panOnDrag={activeTool === 'pan'}
        selectionOnDrag={activeTool === 'select'}
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
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitView={handleFitView}
            onAddNote={() => handleAddNote()}
            onAddDrawing={() => handleAddDrawing()}
            onToolChange={setActiveTool}
            onToggleGrid={() => setShowGrid(!showGrid)}
            onManualSave={handleManualSave}
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
