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
import type { Note, Connection, Board, Container } from '@/types/database';
import { NoteNode } from './note-node';
import { DrawingNode } from './drawing-node';
import { ConditionalNoteNode } from './conditional-note-node';
import { TechnicalNoteNode } from './technical-note-node';
import { ContainerNode } from './container-node';
import { ConnectionEdge } from './connection-edge';
import { Toolbar } from './toolbar';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useHistoryStore, useComponentStore } from '@/lib/store';
import { validateImageFile, safeExtensionForType, NOTE_IMAGE_MAX_BYTES } from '@/lib/upload';
import {
  NOTE_COLOR_VALUES,
  CONNECTION_COLORS,
  CONTAINER_COLORS,
  DEFAULT_NOTE_SIZE,
  DEFAULT_DRAWING_SIZE,
  DEFAULT_CONTAINER_SIZE,
  SNAP_GRID,
  randomFrom,
} from '@/lib/constants';
import {
  parseConditionData,
  makeComponentLookup,
  getActiveBranchId,
  type ConditionalBranch,
} from '@/lib/conditions';
import { parseTechnicalData, applyUpdate, type TechnicalUpdate } from '@/lib/technical';
import { notesInContainer, membershipChanges, boundsAroundNotes } from '@/lib/containers';
import type { LinkableBoard, LinkableContainer, ResolvedLink } from '@/lib/links';

// Custom node types - memoized to prevent recreation warnings
const defaultNodeTypes = {
  noteNode: NoteNode,
  drawingNode: DrawingNode,
  conditionalNode: ConditionalNoteNode,
  technicalNode: TechnicalNoteNode,
  containerNode: ContainerNode,
};

// Custom edge types - memoized to prevent recreation warnings
const defaultEdgeTypes = {
  connectionEdge: ConnectionEdge,
};

/** Map a note's data-model type to its React Flow node component. */
function nodeTypeForNote(type: Note['type']): keyof typeof defaultNodeTypes {
  if (type === 'drawing') return 'drawingNode';
  if (type === 'conditional') return 'conditionalNode';
  if (type === 'technical') return 'technicalNode';
  return 'noteNode';
}

interface CanvasProps {
  board: Board;
  notes: Note[];
  connections: Connection[];
  containers: Container[];
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: (note: Partial<Note>) => void;
  onUpdateConnection: (id: string, updates: Partial<Connection>) => void;
  onDeleteConnection: (id: string) => void;
  onCreateConnection: (connection: Partial<Connection>) => void;
  onUpdateContainer: (id: string, updates: Partial<Container>) => void;
  onCreateContainer: (container: Partial<Container>) => void;
  onDeleteContainer: (id: string, keepContents: boolean) => void;
  onUpdateViewport: (x: number, y: number, zoom: number) => void;
  /** When set, pan to and select this note (e.g. from the component panel). */
  focusNoteId?: string | null;
  /** Every board/container in the story, for resolving `#board/container` links. */
  linkBoards?: LinkableBoard[];
  linkContainers?: LinkableContainer[];
  onLinkClick?: (link: ResolvedLink) => void;
  /** When set, pan to and select this container (e.g. from a link). */
  focusContainerId?: string | null;
}

// Inner component that uses the React Flow hooks
function CanvasInner({
  board,
  notes,
  connections,
  containers,
  onUpdateNote,
  onDeleteNote,
  onCreateNote,
  onUpdateConnection,
  onDeleteConnection,
  onCreateConnection,
  onUpdateContainer,
  onCreateContainer,
  onDeleteContainer,
  onUpdateViewport,
  focusNoteId,
  linkBoards,
  linkContainers,
  onLinkClick,
  focusContainerId,
}: CanvasProps) {
  // Preview mode: render {{component}} references as their current value.
  // Declared early because notesToNodes below injects it into node data.
  const [showValues, setShowValues] = useState(false);

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
      // Validate before touching the network. Bucket-level limits must mirror this.
      const validation = validateImageFile(file, NOTE_IMAGE_MAX_BYTES);
      if (!validation.valid) {
        toast.error(validation.error ?? 'Invalid image');
        return null;
      }

      try {
        const fileExt = safeExtensionForType(file.type);

        // The first path segment MUST be the owner's user id: storage RLS
        // enforces `auth.uid() = (storage.foldername(name))[1]` so that one
        // user cannot overwrite or delete another user's attachments.
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error('You must be signed in to upload images');
          return null;
        }

        const fileName = `${user.id}/${board.id}/${noteId}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('note-attachments')
          .upload(fileName, file, { contentType: file.type });

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
    [board.id, supabase.storage, supabase.auth]
  );

  // History store for undo/redo (moved up: handleSaveBranches below needs pushAction,
  // and notesToNodes needs handleSaveBranches).
  const {
    pushAction,
    undo: undoAction,
    redo: redoAction,
    canUndo,
    canRedo,
    setIsUndoingOrRedoing,
  } = useHistoryStore();

  // Persist a conditional note's branches, and reconcile the actual outgoing
  // connections so each branch's `target` matches what the editor shows.
  // Connections are correlated to branches via `branch_id` (see conditions.ts
  // and migration 002); a branch with no chosen target simply has no connection.
  const handleSaveBranches = useCallback(
    (noteId: string, branches: ConditionalBranch[], targets: Record<string, string | null>) => {
      const previousConditionData = notes.find((n) => n.id === noteId)?.condition_data ?? null;

      pushAction({
        type: 'UPDATE_NOTE',
        undo: { noteId, previousState: { condition_data: previousConditionData } },
        redo: { noteId, newState: { condition_data: { branches } } },
      });
      onUpdateNote(noteId, { condition_data: { branches } });

      const existingBranchConnections = connections.filter(
        (c) => c.source_note_id === noteId && c.branch_id
      );

      branches.forEach((branch, index) => {
        const desiredTarget = targets[branch.id] ?? null;
        const existing = existingBranchConnections.find((c) => c.branch_id === branch.id);

        if (!desiredTarget) {
          if (existing) onDeleteConnection(existing.id);
          return;
        }

        if (!existing) {
          onCreateConnection({
            id: uuidv4(),
            board_id: board.id,
            source_note_id: noteId,
            target_note_id: desiredTarget,
            source_anchor: 'bottom',
            target_anchor: 'top',
            color: '#7c3aed',
            style: 'solid',
            thickness: 2,
            arrow_type: 'single',
            curvature: 'curved',
            branch_label: branch.label,
            branch_order: index,
            branch_id: branch.id,
          });
        } else if (
          existing.target_note_id !== desiredTarget ||
          existing.branch_label !== branch.label ||
          existing.branch_order !== index
        ) {
          onUpdateConnection(existing.id, {
            target_note_id: desiredTarget,
            branch_label: branch.label,
            branch_order: index,
          });
        }
      });

      // Remove connections for branches that no longer exist.
      const currentBranchIds = new Set(branches.map((b) => b.id));
      existingBranchConnections
        .filter((c) => c.branch_id && !currentBranchIds.has(c.branch_id))
        .forEach((c) => onDeleteConnection(c.id));
    },
    [board.id, notes, connections, onUpdateNote, onCreateConnection, onUpdateConnection, onDeleteConnection, pushAction]
  );

  // Persist a technical note's update list.
  const handleSaveTechnicalUpdates = useCallback(
    (noteId: string, updates: TechnicalUpdate[]) => {
      const previousTechnicalData = notes.find((n) => n.id === noteId)?.technical_data ?? null;

      pushAction({
        type: 'UPDATE_NOTE',
        undo: { noteId, previousState: { technical_data: previousTechnicalData } },
        redo: { noteId, newState: { technical_data: { updates } } },
      });
      onUpdateNote(noteId, { technical_data: { updates } });
    },
    [notes, onUpdateNote, pushAction]
  );

  // Apply a technical note's updates to the actual components now — a
  // testing aid for walking a path (PRD 4.2.1.4), not a runtime engine.
  // Reads/writes components directly since this is an imperative action, not
  // something that needs to re-render canvas.tsx on every store change.
  const handleApplyTechnicalUpdates = useCallback(
    async (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;
      const { updates } = parseTechnicalData(note.technical_data);
      if (updates.length === 0) return;

      const { components: currentComponents, updateComponent } = useComponentStore.getState();
      const componentByName = new Map(currentComponents.map((c) => [c.name.toLowerCase(), c]));

      let applied = 0;
      const skipped: string[] = [];
      const before: { componentId: string; value: unknown }[] = [];
      const after: { componentId: string; value: unknown }[] = [];

      for (const update of updates) {
        const component = componentByName.get(update.component.toLowerCase());
        if (!component) {
          skipped.push(update.component);
          continue;
        }
        const newValue = applyUpdate(component.current_value, update);
        if (newValue === undefined) {
          skipped.push(update.component);
          continue;
        }
        try {
          const { error } = await supabase
            .from('components')
            .update({ current_value: newValue })
            .eq('id', component.id);
          if (error) throw error;
          updateComponent(component.id, { current_value: newValue });
          // Capture the pre-apply value once per component, so undoing a
          // sequence of updates to the same component restores the original.
          if (!before.some((b) => b.componentId === component.id)) {
            before.push({ componentId: component.id, value: component.current_value });
          }
          const existingAfter = after.find((a) => a.componentId === component.id);
          if (existingAfter) existingAfter.value = newValue;
          else after.push({ componentId: component.id, value: newValue });
          applied++;
        } catch (error) {
          console.error('Failed to apply technical update:', error);
          skipped.push(update.component);
        }
      }

      if (applied > 0) {
        pushAction({
          type: 'APPLY_TECHNICAL',
          undo: { componentValues: before },
          redo: { componentValues: after },
        });
        toast.success(`Applied ${applied} update${applied === 1 ? '' : 's'}`, {
          description: 'Ctrl+Z to undo',
        });
      }
      if (skipped.length > 0) {
        toast.error(`Couldn't apply: ${skipped.join(', ')}`);
      }
    },
    [notes, supabase, pushAction]
  );

  // Convert notes to React Flow nodes
  const notesToNodes = useCallback(
    (notesList: Note[]): Node[] =>
      notesList.map((note) => {
        const isConditional = note.type === 'conditional';
        const isTechnical = note.type === 'technical';
        const branchTargets: Record<string, string | null> = {};
        if (isConditional) {
          connections
            .filter((c) => c.source_note_id === note.id && c.branch_id)
            .forEach((c) => {
              branchTargets[c.branch_id as string] = c.target_note_id;
            });
        }

        return {
          id: note.id,
          type: nodeTypeForNote(note.type),
          position: { x: note.position_x, y: note.position_y },
          data: {
            note,
            onUpdate: onUpdateNote,
            onDelete: onDeleteNote,
            onImageUpload: note.type === 'drawing' ? undefined : handleImageUpload,
            linkBoards,
            linkContainers,
            onLinkClick,
            showValues,
            ...(isConditional
              ? {
                  onSaveBranches: handleSaveBranches,
                  branchTargets,
                  availableNotes: notes
                    .filter((n) => n.id !== note.id)
                    .map((n) => ({ id: n.id, title: n.title })),
                }
              : {}),
            ...(isTechnical
              ? {
                  onSaveUpdates: handleSaveTechnicalUpdates,
                  onApplyUpdates: handleApplyTechnicalUpdates,
                }
              : {}),
          },
          style: { width: note.width, height: note.height },
          draggable: !note.is_locked,
        };
      }),
    [
      onUpdateNote,
      onDeleteNote,
      handleImageUpload,
      connections,
      notes,
      handleSaveBranches,
      handleSaveTechnicalUpdates,
      handleApplyTechnicalUpdates,
      linkBoards,
      linkContainers,
      onLinkClick,
      showValues,
    ]
  );

  // Convert containers to React Flow nodes. These are rendered *behind* notes
  // (React Flow paints in array order) and are only draggable by their header
  // strip, so notes sitting on top stay directly interactive.
  const containersToNodes = useCallback(
    (containerList: Container[]): Node[] =>
      containerList.map((container) => ({
        id: container.id,
        type: 'containerNode',
        position: { x: container.position_x, y: container.position_y },
        data: {
          container,
          noteCount: notesInContainer(
            {
              id: container.id,
              x: container.position_x,
              y: container.position_y,
              width: container.width,
              height: container.height,
              z_index: container.z_index,
            },
            notes.map((n) => ({
              id: n.id,
              position_x: n.position_x,
              position_y: n.position_y,
              width: n.width,
              height: n.height,
            })),
            containerList.map((c) => ({
              id: c.id,
              x: c.position_x,
              y: c.position_y,
              width: c.width,
              height: c.height,
              z_index: c.z_index,
            }))
          ).length,
          onUpdate: onUpdateContainer,
          onDelete: onDeleteContainer,
        },
        // A collapsed container shrinks to just its header strip; the stored
        // height is untouched so expanding restores the original size.
        style: {
          width: container.width,
          height: container.is_collapsed ? 32 : container.height,
        },
        draggable: !container.is_locked,
        dragHandle: '.drag-handle__container',
        selectable: true,
        // Keep containers underneath notes regardless of insertion order.
        zIndex: 0,
      })),
    [notes, onUpdateContainer, onDeleteContainer]
  );

  // Live branch evaluation for conditional notes, used to highlight the
  // currently "active" outgoing connection as component values change.
  const allComponents = useComponentStore((s) => s.components);
  const componentLookup = useMemo(() => makeComponentLookup(allComponents), [allComponents]);
  const activeBranchByNoteId = useMemo(() => {
    const map: Record<string, string | null> = {};
    notes
      .filter((n) => n.type === 'conditional')
      .forEach((n) => {
        const data = parseConditionData(n.condition_data);
        map[n.id] = getActiveBranchId(data.branches, componentLookup);
      });
    return map;
  }, [notes, componentLookup]);

  // A connection is only ever "active"/"inactive" if it's a branch of a
  // conditional note (branch_id set); ordinary connections are unaffected.
  const isBranchActive = useCallback(
    (connection: Connection): boolean | undefined => {
      if (!connection.branch_id) return undefined;
      return activeBranchByNoteId[connection.source_note_id] === connection.branch_id;
    },
    [activeBranchByNoteId]
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
          isActiveBranch: isBranchActive(connection),
        },
      })),
    [onUpdateConnection, onDeleteConnection, isBranchActive]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeTool, setActiveTool] = useState<'select' | 'pan'>('select');
  const [showGrid, setShowGrid] = useState(true);
  // Snap-to-grid is separate from grid *visibility*: you can align to an
  // invisible grid, or see dots without snapping.
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [zoom, setZoom] = useState(board.viewport_zoom);

  // Handle undo
  // Restore a set of component values (used by APPLY_TECHNICAL undo/redo).
  // Writes go through the same path as editing a value in the Components panel.
  const restoreComponentValues = useCallback(
    async (values: { componentId: string; value: unknown }[]) => {
      const { updateComponent } = useComponentStore.getState();
      for (const { componentId, value } of values) {
        try {
          const { error } = await supabase
            .from('components')
            .update({ current_value: value })
            .eq('id', componentId);
          if (error) throw error;
          updateComponent(componentId, { current_value: value });
        } catch (error) {
          console.error('Failed to restore component value:', error);
          toast.error('Could not fully undo the component change');
        }
      }
    },
    [supabase]
  );

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
      case 'APPLY_TECHNICAL':
        // Undo apply = put every component back to its pre-apply value.
        if (action.undo.componentValues) {
          void restoreComponentValues(action.undo.componentValues);
        }
        break;
    }

    setIsUndoingOrRedoing(false);
    toast.success('Undone');
  }, [
    restoreComponentValues,
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
      case 'APPLY_TECHNICAL':
        // Redo apply = re-write the post-apply component values.
        if (action.redo.componentValues) {
          void restoreComponentValues(action.redo.componentValues);
        }
        break;
    }

    setIsUndoingOrRedoing(false);
    toast.success('Redone');
  }, [
    restoreComponentValues,
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
      // Containers first so they paint behind notes.
      setNodes([...containersToNodes(containers), ...notesToNodes(notes)]);
      setEdges(connectionsToEdges(connections, showGrid));
      isInitializedRef.current = true;
    }
  }, [
    notes,
    connections,
    containers,
    notesToNodes,
    containersToNodes,
    connectionsToEdges,
    setNodes,
    setEdges,
    showGrid,
  ]);

  // Keep container nodes in sync (added, removed, moved, resized, renamed).
  useEffect(() => {
    if (!isInitializedRef.current) return;

    setNodes((currentNodes) => {
      const containerIds = new Set(containers.map((c) => c.id));
      // Drop containers that were deleted.
      const kept = currentNodes.filter(
        (node) => node.type !== 'containerNode' || containerIds.has(node.id)
      );

      const existingIds = new Set(
        kept.filter((n) => n.type === 'containerNode').map((n) => n.id)
      );
      const added = containers.filter((c) => !existingIds.has(c.id));

      const updated = kept.map((node) => {
        if (node.type !== 'containerNode') return node;
        const containerData = containers.find((c) => c.id === node.id);
        if (!containerData) return node;

        const isInteracting =
          node.dragging === true || (node as { resizing?: boolean }).resizing === true;
        const rebuilt = containersToNodes([containerData])[0];

        return {
          ...node,
          data: rebuilt.data,
          position: isInteracting ? node.position : rebuilt.position,
          style: isInteracting ? node.style : rebuilt.style,
          draggable: rebuilt.draggable,
        };
      });

      // New containers go at the front so they stay behind the notes.
      return added.length > 0 ? [...containersToNodes(added), ...updated] : updated;
    });
  }, [containers, containersToNodes, setNodes]);

  // Handle note additions only (not updates to existing notes)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    setNodes((currentNodes) => {
      const currentIds = new Set(currentNodes.map((n) => n.id));
      const newNotes = notes.filter((note) => !currentIds.has(note.id));

      if (newNotes.length > 0) {
        return [...currentNodes, ...notesToNodes(newNotes)];
      }

      // Update existing nodes from persisted state.
      return currentNodes.map((node) => {
        const noteData = notes.find((n) => n.id === node.id);
        if (!noteData) return node;

        // Sync position/size back from state (e.g. after undo/redo) unless the
        // node is being actively manipulated, so we never fight a live drag.
        const isInteracting =
          node.dragging === true || (node as { resizing?: boolean }).resizing === true;

        const positionChanged =
          node.position.x !== noteData.position_x || node.position.y !== noteData.position_y;
        const sizeChanged =
          node.style?.width !== noteData.width || node.style?.height !== noteData.height;

        const isConditional = noteData.type === 'conditional';
        const isTechnical = noteData.type === 'technical';
        const branchTargets: Record<string, string | null> = {};
        if (isConditional) {
          connections
            .filter((c) => c.source_note_id === noteData.id && c.branch_id)
            .forEach((c) => {
              branchTargets[c.branch_id as string] = c.target_note_id;
            });
        }

        return {
          ...node,
          type: nodeTypeForNote(noteData.type),
          position:
            !isInteracting && positionChanged
              ? { x: noteData.position_x, y: noteData.position_y }
              : node.position,
          style:
            !isInteracting && sizeChanged
              ? { ...node.style, width: noteData.width, height: noteData.height }
              : node.style,
          data: {
            note: noteData,
            onUpdate: onUpdateNote,
            onDelete: onDeleteNote,
            onImageUpload: noteData.type === 'drawing' ? undefined : handleImageUpload,
            linkBoards,
            linkContainers,
            onLinkClick,
            showValues,
            ...(isConditional
              ? {
                  onSaveBranches: handleSaveBranches,
                  branchTargets,
                  availableNotes: notes
                    .filter((n) => n.id !== noteData.id)
                    .map((n) => ({ id: n.id, title: n.title })),
                }
              : {}),
            ...(isTechnical
              ? {
                  onSaveUpdates: handleSaveTechnicalUpdates,
                  onApplyUpdates: handleApplyTechnicalUpdates,
                }
              : {}),
          },
          draggable: !noteData.is_locked,
        };
      });
    });

    // Remove deleted notes
    setNodes((currentNodes) => {
      const noteIds = new Set(notes.map((n) => n.id));
      // Container nodes aren't in `notes`; keep them (their own effect syncs them).
      return currentNodes.filter(
        (node) => node.type === 'containerNode' || noteIds.has(node.id)
      );
    });
  }, [
    notes,
    connections,
    notesToNodes,
    onUpdateNote,
    onDeleteNote,
    handleImageUpload,
    handleSaveBranches,
    handleSaveTechnicalUpdates,
    handleApplyTechnicalUpdates,
    linkBoards,
    linkContainers,
    onLinkClick,
    showValues,
    setNodes,
  ]);

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
              isActiveBranch: isBranchActive(connectionData),
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
  }, [
    connections,
    connectionsToEdges,
    setEdges,
    onUpdateConnection,
    onDeleteConnection,
    showGrid,
    isBranchActive,
  ]);

  // Keep `notes.container_id` in step with the geometric truth. Membership is
  // computed from positions (lib/containers.ts), but we persist it so it can be
  // queried; without this, notes enclosed by creating/moving/resizing a
  // container — rather than by being dragged into one — would keep a stale id.
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const changes = membershipChanges(
      notes.map((n) => ({
        id: n.id,
        position_x: n.position_x,
        position_y: n.position_y,
        width: n.width,
        height: n.height,
        container_id: n.container_id,
      })),
      containers.map((c) => ({
        id: c.id,
        x: c.position_x,
        y: c.position_y,
        width: c.width,
        height: c.height,
        z_index: c.z_index,
      }))
    );

    changes.forEach(({ noteId, containerId }) => {
      onUpdateNote(noteId, { container_id: containerId });
    });
  }, [containers, notes, onUpdateNote]);

  // Pan to a container when a link targets one.
  useEffect(() => {
    if (!focusContainerId) return;
    const container = containers.find((c) => c.id === focusContainerId);
    if (!container) return;

    reactFlowInstance.setCenter(
      container.position_x + container.width / 2,
      container.position_y + container.height / 2,
      { zoom: 0.8, duration: 400 }
    );
    setNodes((current) =>
      current.map((node) => ({ ...node, selected: node.id === focusContainerId }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusContainerId]);

  // Pan to and select a note when asked (e.g. from the component panel's
  // "used in" list). focusNoteId is cleared by the parent after each request.
  useEffect(() => {
    if (!focusNoteId) return;
    const note = notes.find((n) => n.id === focusNoteId);
    if (!note) return;

    const centerX = note.position_x + (note.width ?? DEFAULT_NOTE_SIZE.width) / 2;
    const centerY = note.position_y + (note.height ?? DEFAULT_NOTE_SIZE.height) / 2;
    reactFlowInstance.setCenter(centerX, centerY, { zoom: 1, duration: 400 });
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({ ...node, selected: node.id === focusNoteId }))
    );
    // Only react to focus requests, not every notes change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNoteId]);

  // Handle node changes (position updates during drag)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // NOTE: container sizes are deliberately NOT persisted from here.
      // React Flow emits `dimensions` changes on measurement (not just user
      // resizes), and measured values are rounded by the zoom factor — writing
      // those back caused containers to shrink a little on every render.
      // NodeResizer's onResizeEnd is the authoritative source instead.
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
      const moved = startPos && (startPos.x !== node.position.x || startPos.y !== node.position.y);

      // Containers carry their contents: apply the same delta to every note
      // inside, then persist the container's own position.
      if (node.type === 'containerNode') {
        const container = containers.find((c) => c.id === node.id);
        dragStartPositions.current.delete(node.id);
        if (!container) return;

        if (moved && startPos) {
          const dx = node.position.x - startPos.x;
          const dy = node.position.y - startPos.y;

          // Membership is computed from the container's ORIGINAL bounds, so we
          // move exactly the notes that were inside when the drag began.
          const containedNotes = notesInContainer(
            {
              id: container.id,
              x: startPos.x,
              y: startPos.y,
              width: container.width,
              height: container.height,
              z_index: container.z_index,
            },
            notes.map((n) => ({
              id: n.id,
              position_x: n.position_x,
              position_y: n.position_y,
              width: n.width,
              height: n.height,
            })),
            containers.map((c) => ({
              id: c.id,
              x: c.id === container.id ? startPos.x : c.position_x,
              y: c.id === container.id ? startPos.y : c.position_y,
              width: c.width,
              height: c.height,
              z_index: c.z_index,
            }))
          );

          containedNotes.forEach((contained) => {
            onUpdateNote(contained.id, {
              position_x: contained.position_x + dx,
              position_y: contained.position_y + dy,
            });
          });
        }

        onUpdateContainer(node.id, {
          position_x: node.position.x,
          position_y: node.position.y,
        });
        return;
      }

      // Only track if position actually changed
      if (moved && startPos) {
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

      // Dropping a note into or out of a container updates its membership.
      const droppedNote = notes.find((n) => n.id === node.id);
      if (droppedNote) {
        const [change] = membershipChanges(
          [
            {
              id: droppedNote.id,
              position_x: node.position.x,
              position_y: node.position.y,
              width: droppedNote.width,
              height: droppedNote.height,
              container_id: droppedNote.container_id,
            },
          ],
          containers.map((c) => ({
            id: c.id,
            x: c.position_x,
            y: c.position_y,
            width: c.width,
            height: c.height,
            z_index: c.z_index,
          }))
        );

        onUpdateNote(node.id, {
          position_x: node.position.x,
          position_y: node.position.y,
          ...(change ? { container_id: change.containerId } : {}),
        });
        return;
      }

      onUpdateNote(node.id, {
        position_x: node.position.x,
        position_y: node.position.y,
      });
    },
    [onUpdateNote, onUpdateContainer, pushAction, containers, notes]
  );

  // Handle new connections
  const handleConnect = useCallback(
    (params: FlowConnection) => {
      if (!params.source || !params.target) return;

      // Strip the -source suffix from sourceHandle for database storage
      const sourceAnchor = params.sourceHandle?.replace('-source', '') || 'bottom';

      // Random color for new connections
      const randomConnectionColor = randomFrom(CONNECTION_COLORS);

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
    const container = document.querySelector('.react-flow');
    const rect = container?.getBoundingClientRect();
    const screenX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const screenY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    // Convert screen center to flow coordinates via React Flow's own transform.
    const center = reactFlowInstance.screenToFlowPosition({ x: screenX, y: screenY });

    // Add small random offset to prevent stacking
    return {
      x: center.x + (Math.random() - 0.5) * 50,
      y: center.y + (Math.random() - 0.5) * 50,
    };
  }, [reactFlowInstance]);

  // Add new note at position
  const handleAddNote = useCallback(
    (position?: { x: number; y: number }) => {
      const pos = position || getViewportCenter();

      // Random color for new notes
      const randomNoteColor = randomFrom(NOTE_COLOR_VALUES);

      const newNote: Partial<Note> = {
        id: uuidv4(),
        board_id: board.id,
        type: 'normal',
        title: '',
        content: { blocks: [] },
        position_x: pos.x,
        position_y: pos.y,
        width: DEFAULT_NOTE_SIZE.width,
        height: DEFAULT_NOTE_SIZE.height,
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
        width: DEFAULT_DRAWING_SIZE.width,
        height: DEFAULT_DRAWING_SIZE.height,
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

  // Add new conditional note at position (starts with no branches; the author
  // fills those in via "Manage branches" on the node itself).
  const handleAddConditionalNote = useCallback(
    (position?: { x: number; y: number }) => {
      const pos = position || getViewportCenter();

      const newNote: Partial<Note> = {
        id: uuidv4(),
        board_id: board.id,
        type: 'conditional',
        title: 'Condition',
        content: { blocks: [] },
        position_x: pos.x,
        position_y: pos.y,
        width: 220,
        height: 180,
        color: '#FFFFFF',
        is_collapsed: false,
        is_locked: false,
        z_index: nodes.length,
        condition_data: { branches: [] },
      };

      pushAction({
        type: 'CREATE_NOTE',
        undo: { noteId: newNote.id },
        redo: { noteId: newNote.id, fullState: newNote as Note },
      });

      onCreateNote(newNote);
    },
    [board.id, nodes.length, onCreateNote, getViewportCenter, pushAction]
  );

  // Add new technical note at position (starts with no updates; the author
  // fills those in via "Manage updates" on the node itself).
  const handleAddTechnicalNote = useCallback(
    (position?: { x: number; y: number }) => {
      const pos = position || getViewportCenter();

      const newNote: Partial<Note> = {
        id: uuidv4(),
        board_id: board.id,
        type: 'technical',
        title: 'Update',
        content: { blocks: [] },
        position_x: pos.x,
        position_y: pos.y,
        width: 220,
        height: 180,
        color: '#FFFFFF',
        is_collapsed: false,
        is_locked: false,
        z_index: nodes.length,
        technical_data: { updates: [] },
      };

      pushAction({
        type: 'CREATE_NOTE',
        undo: { noteId: newNote.id },
        redo: { noteId: newNote.id, fullState: newNote as Note },
      });

      onCreateNote(newNote);
    },
    [board.id, nodes.length, onCreateNote, getViewportCenter, pushAction]
  );

  // Add a container. If notes are selected, the container is drawn around them
  // (and they become its contents); otherwise it's placed at the viewport
  // centre at a default size.
  const handleAddContainer = useCallback(() => {
    const selectedNotes = nodes
      .filter((n) => n.selected && n.type !== 'containerNode')
      .map((n) => notes.find((note) => note.id === n.id))
      .filter((n): n is Note => Boolean(n));

    const fitted = boundsAroundNotes(
      selectedNotes.map((n) => ({
        id: n.id,
        position_x: n.position_x,
        position_y: n.position_y,
        width: n.width,
        height: n.height,
      }))
    );

    const center = getViewportCenter();
    const bounds = fitted ?? {
      x: center.x,
      y: center.y,
      width: DEFAULT_CONTAINER_SIZE.width,
      height: DEFAULT_CONTAINER_SIZE.height,
    };

    // Names are unique per board at the database level, so avoid a collision.
    const existingNames = new Set(containers.map((c) => c.name));
    let suffix = containers.length + 1;
    let name = `Container ${suffix}`;
    while (existingNames.has(name)) {
      suffix += 1;
      name = `Container ${suffix}`;
    }

    onCreateContainer({
      id: uuidv4(),
      story_id: board.story_id,
      board_id: board.id,
      name,
      position_x: bounds.x,
      position_y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      color: randomFrom(CONTAINER_COLORS),
      background_opacity: 0.1,
      is_collapsed: false,
      is_locked: false,
      z_index: 0,
    });
  }, [nodes, notes, containers, board.id, board.story_id, getViewportCenter, onCreateContainer]);

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

      // Alt/Option+N: check e.code rather than e.key, since Option+N produces
      // a special character (e.g. 'ñ') on macOS rather than a plain 'n'.
      if (e.altKey && e.code === 'KeyN') {
        e.preventDefault();
        handleAddTechnicalNote();
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
          if (e.shiftKey) {
            handleAddConditionalNote();
          } else {
            handleAddNote();
          }
          break;
        case 'd':
          handleAddDrawing();
          break;
        case 'c':
          handleAddContainer();
          break;
        case 'p':
          setShowValues((v) => !v);
          break;
        case 'g':
          if (e.shiftKey) {
            setSnapToGrid((v) => !v);
            break;
          }
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
    handleAddConditionalNote,
    handleAddTechnicalNote,
    handleAddContainer,
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
        snapToGrid={snapToGrid}
        snapGrid={SNAP_GRID}
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
            onAddConditional={() => handleAddConditionalNote()}
            onAddTechnical={() => handleAddTechnicalNote()}
            onAddContainer={handleAddContainer}
            snapToGrid={snapToGrid}
            onToggleSnapToGrid={() => setSnapToGrid((v) => !v)}
            showValues={showValues}
            onToggleShowValues={() => setShowValues((v) => !v)}
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
