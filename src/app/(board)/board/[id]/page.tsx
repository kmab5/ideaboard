'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import { useStoryStore, useComponentStore } from '@/lib/store';
import { extractReferenceNames } from '@/lib/references';
import { cloneBoardContents, resolveActiveBoard } from '@/lib/boards';
import { uniqueContainerName, notesInContainer } from '@/lib/containers';
import type { Board, Note, Connection, Container } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Canvas, BoardTabs } from '@/components/board';
import { ComponentPanel } from '@/components/panels';
import { ThemeToggle } from '@/components/common';
import { toast } from 'sonner';

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = params.id as string;
  // Which board of the story is open. Kept in the URL (?b=) so a board is
  // linkable and survives refresh; falls back to the story's first board.
  const boardIdParam = searchParams.get('b');
  const supabase = createClient();

  const { currentStory, setCurrentStory } = useStoryStore();
  const { components, setComponents, isPanelOpen, togglePanel } = useComponentStore();

  // Boards state is held here rather than in a store: only this page and the
  // tab bar need it, unlike components which are read by deeply nested nodes.
  const [boards, setBoards] = useState<Board[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitchingBoard, setIsSwitchingBoard] = useState(false);
  // Note the panel asks the canvas to focus (pan/select). Null clears it.
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);

  // Debounce ref for auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mirror latest notes/connections into refs so callbacks can read current
  // state synchronously (for optimistic rollback) without being re-created.
  const notesRef = useRef<Note[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  // Update document title when story loads
  useEffect(() => {
    if (currentStory?.title) {
      document.title = `${currentStory.title} | IdeaBoard`;
    }
    return () => {
      document.title = 'IdeaBoard - Visual Whiteboard for Ideas';
    };
  }, [currentStory?.title]);

  // Fetch story and board data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Fetch story
        const { data: story, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single();

        if (storyError) {
          // Story not found or not accessible
          if (user) {
            toast.error("Board not found or you don't have access");
            router.push('/stories');
          } else {
            router.push('/login');
          }
          return;
        }

        // Check if story belongs to current user
        if (!user || story.user_id !== user.id) {
          if (user) {
            toast.error("You don't have access to this board");
            router.push('/stories');
          } else {
            router.push('/login');
          }
          return;
        }

        setCurrentStory(story);

        // Boards and components both derive from the story id, so fetch together.
        const [boardsResult, componentsResult] = await Promise.all([
          supabase
            .from('boards')
            .select('*')
            .eq('story_id', storyId)
            .order('sort_order', { ascending: true }),
          supabase
            .from('components')
            .select('*')
            .eq('story_id', storyId)
            .order('sort_order', { ascending: true }),
        ]);

        if (boardsResult.error) throw boardsResult.error;
        if (componentsResult.error) throw componentsResult.error;

        setComponents(componentsResult.data || []);

        const allBoards = boardsResult.data || [];
        setBoards(allBoards);

        if (allBoards.length > 0) {
          // Honour ?b= when it names a board in this story; otherwise fall back
          // to the first board (also covers a stale/other-story board id).
          const currentBoard = resolveActiveBoard(allBoards, boardIdParam)!;
          setBoard(currentBoard);

          // Notes and connections both derive from the board id — fetch together.
          const [notesResult, connectionsResult, containersResult] = await Promise.all([
            supabase.from('notes').select('*').eq('board_id', currentBoard.id),
            supabase.from('connections').select('*').eq('board_id', currentBoard.id),
            supabase.from('containers').select('*').eq('board_id', currentBoard.id),
          ]);

          if (notesResult.error) throw notesResult.error;
          if (connectionsResult.error) throw connectionsResult.error;
          if (containersResult.error) throw containersResult.error;

          setNotes(notesResult.data || []);
          setConnections(connectionsResult.data || []);
          setContainers(containersResult.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load board');
        router.push('/stories');
      } finally {
        setIsLoading(false);
      }
    };

    if (storyId) {
      fetchData();
    }
    // boardIdParam is deliberately excluded: switching boards is handled by
    // handleSelectBoard (which swaps data in place), not by refetching
    // everything from scratch on every URL change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, supabase, router, setCurrentStory, setComponents]);

  // ---------------------------------------------------------------------
  // Board management (multi-board per story)
  // ---------------------------------------------------------------------

  // Switch boards by swapping the canvas data in place rather than reloading
  // the page, so the story/components already in memory are reused.
  const handleSelectBoard = useCallback(
    async (boardId: string) => {
      if (boardId === board?.id) return;
      const target = boards.find((b) => b.id === boardId);
      if (!target) return;

      setIsSwitchingBoard(true);
      try {
        const [notesResult, connectionsResult, containersResult] = await Promise.all([
          supabase.from('notes').select('*').eq('board_id', boardId),
          supabase.from('connections').select('*').eq('board_id', boardId),
          supabase.from('containers').select('*').eq('board_id', boardId),
        ]);
        if (notesResult.error) throw notesResult.error;
        if (connectionsResult.error) throw connectionsResult.error;
        if (containersResult.error) throw containersResult.error;

        setBoard(target);
        setNotes(notesResult.data || []);
        setConnections(connectionsResult.data || []);
        setContainers(containersResult.data || []);
        // Keep the URL in sync so the open board is linkable and survives reload.
        router.replace(`/board/${storyId}?b=${boardId}`, { scroll: false });
      } catch (error) {
        console.error('Error switching board:', error);
        toast.error('Failed to open board');
      } finally {
        setIsSwitchingBoard(false);
      }
    },
    [board?.id, boards, supabase, router, storyId]
  );

  const handleCreateBoard = useCallback(
    async (title: string) => {
      const newBoard = {
        id: uuidv4(),
        story_id: storyId,
        title,
        sort_order: boards.length,
      };

      try {
        const { data, error } = await supabase.from('boards').insert(newBoard).select().single();
        if (error) throw error;

        setBoards((prev) => [...prev, data]);
        // A new board starts empty, so swap directly without another fetch.
        setBoard(data);
        setNotes([]);
        setConnections([]);
        setContainers([]);
        router.replace(`/board/${storyId}?b=${data.id}`, { scroll: false });
        toast.success(`Created "${title}"`);
      } catch (error) {
        console.error('Error creating board:', error);
        toast.error('Failed to create board');
      }
    },
    [storyId, boards.length, supabase, router]
  );

  const handleRenameBoard = useCallback(
    async (boardId: string, title: string) => {
      const previous = boards.find((b) => b.id === boardId);
      setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, title } : b)));
      setBoard((prev) => (prev?.id === boardId ? { ...prev, title } : prev));

      try {
        const { error } = await supabase.from('boards').update({ title }).eq('id', boardId);
        if (error) throw error;
      } catch (error) {
        console.error('Error renaming board:', error);
        toast.error('Failed to rename board');
        if (previous) {
          setBoards((prev) => prev.map((b) => (b.id === boardId ? previous : b)));
          setBoard((prev) => (prev?.id === boardId ? previous : prev));
        }
      }
    },
    [boards, supabase]
  );

  const handleDeleteBoard = useCallback(
    async (boardId: string) => {
      // Guarded in the UI too, but never let a story end up with zero boards.
      if (boards.length <= 1) return;

      const remaining = boards.filter((b) => b.id !== boardId);
      const previousBoards = boards;
      setBoards(remaining);

      try {
        // Notes and connections cascade from the board row.
        const { error } = await supabase.from('boards').delete().eq('id', boardId);
        if (error) throw error;

        toast.success('Board deleted');
        if (board?.id === boardId) {
          await handleSelectBoard(remaining[0].id);
        }
      } catch (error) {
        console.error('Error deleting board:', error);
        toast.error('Failed to delete board');
        setBoards(previousBoards);
      }
    },
    [boards, board?.id, supabase, handleSelectBoard]
  );

  // Copy a board along with its notes and connections. Ids are remapped so the
  // copies are independent, and connections are rewired to the new note ids.
  const handleDuplicateBoard = useCallback(
    async (boardId: string) => {
      const source = boards.find((b) => b.id === boardId);
      if (!source) return;

      try {
        const { data: newBoard, error: boardError } = await supabase
          .from('boards')
          .insert({
            id: uuidv4(),
            story_id: storyId,
            title: `${source.title} (copy)`,
            sort_order: boards.length,
          })
          .select()
          .single();
        if (boardError) throw boardError;

        const [sourceNotes, sourceConnections, sourceContainers] = await Promise.all([
          supabase.from('notes').select('*').eq('board_id', boardId),
          supabase.from('connections').select('*').eq('board_id', boardId),
          supabase.from('containers').select('*').eq('board_id', boardId),
        ]);
        if (sourceNotes.error) throw sourceNotes.error;
        if (sourceConnections.error) throw sourceConnections.error;
        if (sourceContainers.error) throw sourceContainers.error;

        const {
          notes: clonedNotes,
          connections: clonedConnections,
          containers: clonedContainers,
        } = cloneBoardContents(
          sourceNotes.data || [],
          sourceConnections.data || [],
          newBoard.id,
          uuidv4,
          sourceContainers.data || []
        );

        // Container names are UNIQUE per story, so cloned containers need
        // fresh names — fetch every name in the story, not just this board's.
        if (clonedContainers.length > 0) {
          const { data: storyContainers } = await supabase
            .from('containers')
            .select('name')
            .eq('story_id', storyId);

          const takenNames = new Set<string>((storyContainers || []).map((c) => c.name));
          const renamed = clonedContainers.map((container) => {
            const name = uniqueContainerName(container.name, takenNames);
            takenNames.add(name);
            return { ...container, name };
          });

          // Containers must exist before notes, since notes.container_id
          // references them.
          const { error } = await supabase.from('containers').insert(renamed);
          if (error) throw error;
        }

        if (clonedNotes.length > 0) {
          const { error } = await supabase.from('notes').insert(clonedNotes);
          if (error) throw error;
        }

        if (clonedConnections.length > 0) {
          const { error } = await supabase.from('connections').insert(clonedConnections);
          if (error) throw error;
        }

        setBoards((prev) => [...prev, newBoard]);
        toast.success(`Duplicated "${source.title}"`);
      } catch (error) {
        console.error('Error duplicating board:', error);
        toast.error('Failed to duplicate board');
      }
    },
    [boards, storyId, supabase]
  );

  // ---------------------------------------------------------------------
  // Containers
  // ---------------------------------------------------------------------

  const handleCreateContainer = useCallback(
    async (container: Partial<Container>) => {
      // Container names are UNIQUE per story at the database level, so a name
      // that's free on this board may still collide with one on another board.
      let name = container.name ?? 'Container';
      try {
        const { data: storyContainers } = await supabase
          .from('containers')
          .select('name')
          .eq('story_id', storyId);
        name = uniqueContainerName(name, (storyContainers || []).map((c) => c.name));
      } catch (error) {
        // Non-fatal: fall back to the proposed name and let the insert decide.
        console.error('Could not check container names:', error);
      }

      const newContainer = {
        ...container,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Container;

      setContainers((prev) => [...prev, newContainer]);

      try {
        const { error } = await supabase.from('containers').insert(newContainer);
        if (error) throw error;
      } catch (error) {
        console.error('Error creating container:', error);
        toast.error('Failed to create container');
        setContainers((prev) => prev.filter((c) => c.id !== container.id));
      }
    },
    [supabase, storyId]
  );

  const handleUpdateContainer = useCallback(
    async (id: string, updates: Partial<Container>) => {
      const previous = containers.find((c) => c.id === id);

      setContainers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
      );

      try {
        const { error } = await supabase
          .from('containers')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating container:', error);
        toast.error('Failed to save container');
        if (previous) {
          setContainers((prev) => prev.map((c) => (c.id === id ? previous : c)));
        }
      }
    },
    [containers, supabase]
  );

  const handleDeleteContainer = useCallback(
    async (id: string, keepContents: boolean) => {
      const previousContainers = containers;
      const target = containers.find((c) => c.id === id);
      if (!target) return;

      // Membership is geometric (see lib/containers.ts). `container_id` is only
      // persisted when a note is dragged, so a note created inside a container
      // — or enclosed when the container was drawn around it — can still have a
      // null container_id. Deleting by container_id would silently miss those,
      // so resolve contents from geometry instead.
      const contained = notesInContainer(
        {
          id: target.id,
          x: target.position_x,
          y: target.position_y,
          width: target.width,
          height: target.height,
          z_index: target.z_index,
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
          x: c.position_x,
          y: c.position_y,
          width: c.width,
          height: c.height,
          z_index: c.z_index,
        }))
      );
      const containedIds = new Set(contained.map((n) => n.id));
      const containedNotes = notes.filter((n) => containedIds.has(n.id));

      setContainers((prev) => prev.filter((c) => c.id !== id));
      if (!keepContents) {
        setNotes((prev) => prev.filter((n) => !containedIds.has(n.id)));
      }

      try {
        if (!keepContents && containedNotes.length > 0) {
          const { error: notesError } = await supabase
            .from('notes')
            .delete()
            .in(
              'id',
              containedNotes.map((n) => n.id)
            );
          if (notesError) throw notesError;
        }

        // notes.container_id is ON DELETE SET NULL, so surviving notes are
        // detached automatically when the container row goes away.
        const { error } = await supabase.from('containers').delete().eq('id', id);
        if (error) throw error;

        if (keepContents) {
          setNotes((prev) =>
            prev.map((n) => (n.container_id === id ? { ...n, container_id: null } : n))
          );
        }
        toast.success(
          keepContents
            ? 'Container removed'
            : `Container and ${containedNotes.length} note${containedNotes.length === 1 ? '' : 's'} deleted`
        );
      } catch (error) {
        console.error('Error deleting container:', error);
        toast.error('Failed to delete container');
        setContainers(previousContainers);
        if (!keepContents) setNotes((prev) => [...prev, ...containedNotes]);
      }
    },
    [containers, notes, supabase]
  );

  // Best-effort sync of the component_references table when a note's content
  // changes. Non-blocking: failures are logged but never surfaced or rolled back.
  const syncNoteReferences = useCallback(
    async (noteId: string, content: Note['content']) => {
      try {
        const names = extractReferenceNames(content);
        const comps = useComponentStore.getState().components;
        const componentIds = names
          .map((name) => comps.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id)
          .filter((id): id is string => Boolean(id));

        await supabase.from('component_references').delete().eq('note_id', noteId);
        if (componentIds.length > 0) {
          await supabase.from('component_references').insert(
            componentIds.map((component_id) => ({
              component_id,
              note_id: noteId,
              reference_type: 'content',
            }))
          );
        }
      } catch (error) {
        console.error('Failed to sync component references:', error);
      }
    },
    [supabase]
  );

  // Note handlers
  const handleUpdateNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      const previous = notesRef.current.find((note) => note.id === id);

      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, ...updates, updated_at: new Date().toISOString() } : note
        )
      );

      // Optimistic update - persist in the background, roll back on failure.
      try {
        const { error } = await supabase
          .from('notes')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;

        // Keep the component_references table in sync when content changes.
        if (updates.content !== undefined) {
          void syncNoteReferences(id, updates.content);
        }
      } catch (error) {
        console.error('Error updating note:', error);
        toast.error('Failed to save changes');
        if (previous) {
          setNotes((prev) => prev.map((note) => (note.id === id ? previous : note)));
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase]
  );

  const handleDeleteNote = useCallback(
    async (id: string) => {
      const previousNote = notesRef.current.find((note) => note.id === id);
      const removedConnections = connectionsRef.current.filter(
        (conn) => conn.source_note_id === id || conn.target_note_id === id
      );

      setNotes((prev) => prev.filter((note) => note.id !== id));
      setConnections((prev) =>
        prev.filter((conn) => conn.source_note_id !== id && conn.target_note_id !== id)
      );

      try {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
        // Restore the note and any connections that were removed with it.
        if (previousNote) {
          setNotes((prev) => [...prev, previousNote]);
        }
        if (removedConnections.length > 0) {
          setConnections((prev) => [...prev, ...removedConnections]);
        }
      }
    },
    [supabase]
  );

  const handleCreateNote = useCallback(
    async (note: Partial<Note>) => {
      const newNote = {
        ...note,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Note;

      setNotes((prev) => [...prev, newNote]);

      try {
        const { error } = await supabase.from('notes').insert(newNote);
        if (error) throw error;
      } catch (error) {
        console.error('Error creating note:', error);
        toast.error('Failed to create note');
        setNotes((prev) => prev.filter((n) => n.id !== note.id));
      }
    },
    [supabase]
  );

  // Connection handlers
  const handleUpdateConnection = useCallback(
    async (id: string, updates: Partial<Connection>) => {
      const previous = connectionsRef.current.find((conn) => conn.id === id);

      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === id ? { ...conn, ...updates, updated_at: new Date().toISOString() } : conn
        )
      );

      try {
        const { error } = await supabase
          .from('connections')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating connection:', error);
        toast.error('Failed to save connection');
        if (previous) {
          setConnections((prev) => prev.map((conn) => (conn.id === id ? previous : conn)));
        }
      }
    },
    [supabase]
  );

  const handleDeleteConnection = useCallback(
    async (id: string) => {
      const previous = connectionsRef.current.find((conn) => conn.id === id);

      setConnections((prev) => prev.filter((conn) => conn.id !== id));

      try {
        const { error } = await supabase.from('connections').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting connection:', error);
        toast.error('Failed to delete connection');
        if (previous) {
          setConnections((prev) => [...prev, previous]);
        }
      }
    },
    [supabase]
  );

  const handleCreateConnection = useCallback(
    async (connection: Partial<Connection>) => {
      const newConnection = {
        ...connection,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Connection;

      setConnections((prev) => [...prev, newConnection]);

      try {
        const { error } = await supabase.from('connections').insert(newConnection);
        if (error) throw error;
      } catch (error) {
        console.error('Error creating connection:', error);
        toast.error('Failed to create connection');
        setConnections((prev) => prev.filter((c) => c.id !== connection.id));
      }
    },
    [supabase]
  );

  // Viewport handler with autosave
  const handleUpdateViewport = useCallback(
    (x: number, y: number, zoom: number) => {
      if (board) {
        setBoard((prev) =>
          prev
            ? {
                ...prev,
                viewport_x: x,
                viewport_y: y,
                viewport_zoom: zoom,
              }
            : null
        );

        // Debounced autosave viewport
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await supabase
              .from('boards')
              .update({
                viewport_x: x,
                viewport_y: y,
                viewport_zoom: zoom,
              })
              .eq('id', board.id);
          } catch (error) {
            console.error('Error saving viewport:', error);
          }
        }, 1000); // Save after 1 second of no changes
      }
    },
    [board, supabase]
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Board not found</p>
        <Button asChild>
          <Link href="/stories">Back to Stories</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-12 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/stories">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">{currentStory?.title || 'Untitled'}</h1>
            <p className="text-xs text-muted-foreground">
              {boards.length > 1 ? `${boards.length} boards` : board.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={togglePanel}>
            <Settings className="mr-2 h-4 w-4" />
            Components
          </Button>
        </div>
      </header>

      {/* Board tabs */}
      <BoardTabs
        boards={boards}
        activeBoardId={board.id}
        onSelect={handleSelectBoard}
        onCreate={handleCreateBoard}
        onRename={handleRenameBoard}
        onDelete={handleDeleteBoard}
        onDuplicate={handleDuplicateBoard}
      />

      {/* Canvas */}
      <div className="relative flex-1">
        {isSwitchingBoard && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <Canvas
          // Remount on board change so React Flow rebuilds its internal state
          // rather than trying to reconcile two unrelated node sets.
          key={board.id}
          board={board}
          notes={notes}
          connections={connections}
          containers={containers}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onCreateNote={handleCreateNote}
          onUpdateConnection={handleUpdateConnection}
          onDeleteConnection={handleDeleteConnection}
          onCreateConnection={handleCreateConnection}
          onUpdateContainer={handleUpdateContainer}
          onCreateContainer={handleCreateContainer}
          onDeleteContainer={handleDeleteContainer}
          onUpdateViewport={handleUpdateViewport}
          focusNoteId={focusNoteId}
        />

        {/* Component Panel */}
        {isPanelOpen && (
          <ComponentPanel
            storyId={storyId}
            components={components}
            notes={notes}
            onClose={togglePanel}
            onFocusNote={(noteId) => {
              setFocusNoteId(noteId);
              // Reset so re-selecting the same note re-triggers focus.
              window.setTimeout(() => setFocusNoteId(null), 100);
            }}
            onUpdateNote={handleUpdateNote}
          />
        )}
      </div>
    </div>
  );
}
