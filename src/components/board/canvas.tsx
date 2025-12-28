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
import { ConnectionEdge } from './connection-edge';
import { Toolbar } from './toolbar';
import { toast } from 'sonner';

// Custom node types - memoized to prevent recreation warnings
const defaultNodeTypes = {
  noteNode: NoteNode,
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

  // Memoize node and edge types to prevent React Flow warnings
  const nodeTypes = useMemo(() => defaultNodeTypes, []);
  const edgeTypes = useMemo(() => defaultEdgeTypes, []);

  // Convert notes to React Flow nodes
  const notesToNodes = useCallback(
    (notesList: Note[]): Node[] =>
      notesList.map((note) => ({
        id: note.id,
        type: 'noteNode',
        position: { x: note.position_x, y: note.position_y },
        data: {
          note,
          onUpdate: onUpdateNote,
          onDelete: onDeleteNote,
        },
        style: { width: note.width, height: note.height },
        draggable: !note.is_locked,
      })),
    [onUpdateNote, onDeleteNote]
  );

  // Convert connections to React Flow edges
  const connectionsToEdges = useCallback(
    (connectionsList: Connection[]): Edge[] =>
      connectionsList.map((connection) => ({
        id: connection.id,
        source: connection.source_note_id,
        target: connection.target_note_id,
        sourceHandle: connection.source_anchor,
        targetHandle: connection.target_anchor,
        type: 'connectionEdge',
        data: {
          connection,
          onUpdate: onUpdateConnection,
          onDelete: onDeleteConnection,
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
    console.log('[DEBUG] Manual save triggered');
    // Save viewport
    onUpdateViewport(
      reactFlowInstance.getViewport().x,
      reactFlowInstance.getViewport().y,
      reactFlowInstance.getViewport().zoom
    );
    // Force save all note positions from current nodes
    nodes.forEach((node) => {
      console.log(
        `[DEBUG] Saving note ${node.id} at position x=${node.position.x}, y=${node.position.y}`
      );
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
      console.log('[DEBUG] Initializing notes on page load:');
      notes.forEach((note) => {
        console.log(
          `  Note "${note.title || note.id}": position_x=${note.position_x}, position_y=${note.position_y}`
        );
      });
      setNodes(notesToNodes(notes));
      setEdges(connectionsToEdges(connections));
      isInitializedRef.current = true;
    }
  }, [notes, connections, notesToNodes, connectionsToEdges, setNodes, setEdges]);

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
            data: {
              note: noteData,
              onUpdate: onUpdateNote,
              onDelete: onDeleteNote,
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
  }, [notes, notesToNodes, onUpdateNote, onDeleteNote, setNodes]);

  // Handle edge updates
  useEffect(() => {
    if (!isInitializedRef.current) return;

    setEdges((currentEdges) => {
      const currentIds = new Set(currentEdges.map((e) => e.id));
      const newConnections = connections.filter((conn) => !currentIds.has(conn.id));

      if (newConnections.length > 0) {
        return [...currentEdges, ...connectionsToEdges(newConnections)];
      }

      // Update data and source/target for existing edges
      return currentEdges.map((edge) => {
        const connectionData = connections.find((c) => c.id === edge.id);
        if (connectionData) {
          return {
            ...edge,
            source: connectionData.source_note_id,
            target: connectionData.target_note_id,
            sourceHandle: connectionData.source_anchor,
            targetHandle: connectionData.target_anchor,
            data: {
              connection: connectionData,
              onUpdate: onUpdateConnection,
              onDelete: onDeleteConnection,
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
  }, [connections, connectionsToEdges, setEdges, onUpdateConnection, onDeleteConnection]);

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
      console.log(
        `[DEBUG] Note position saved - id: ${node.id}, position: x=${node.position.x}, y=${node.position.y}`
      );
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

      const newConnection: Partial<Connection> = {
        id: uuidv4(),
        board_id: board.id,
        source_note_id: params.source,
        target_note_id: params.target,
        source_anchor: (params.sourceHandle as Connection['source_anchor']) || 'bottom',
        target_anchor: (params.targetHandle as Connection['target_anchor']) || 'top',
        color: '#6b7280', // Gray color that works in both light and dark mode
        style: 'solid',
        thickness: 2,
        arrow_type: 'single',
        curvature: 'curved',
      };

      onCreateConnection(newConnection);
    },
    [board.id, onCreateConnection]
  );

  // Add new note at position
  const handleAddNote = useCallback(
    (position?: { x: number; y: number }) => {
      const pos = position || { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 };
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
        color: '#FFFFFF',
        is_collapsed: false,
        is_locked: false,
        z_index: nodes.length,
      };

      onCreateNote(newNote);
    },
    [board.id, nodes.length, onCreateNote]
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
  }, [handleAddNote, handleZoomIn, handleZoomOut, handleFitView, handleManualSave]);

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
          className="rounded-lg !border !bg-background"
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
