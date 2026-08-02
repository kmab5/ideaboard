'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useStoryStore, useComponentStore } from '@/lib/store';
import { extractReferenceNames } from '@/lib/references';
import type { Board, Note, Connection } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Canvas } from '@/components/board';
import { ComponentPanel } from '@/components/panels';
import { ThemeToggle } from '@/components/common';
import { toast } from 'sonner';

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const supabase = createClient();

  const { currentStory, setCurrentStory } = useStoryStore();
  const { components, setComponents, isPanelOpen, togglePanel } = useComponentStore();

  const [board, setBoard] = useState<Board | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

        // Board and components both derive from the story id, so fetch together.
        const [boardsResult, componentsResult] = await Promise.all([
          supabase
            .from('boards')
            .select('*')
            .eq('story_id', storyId)
            .order('sort_order', { ascending: true })
            .limit(1),
          supabase
            .from('components')
            .select('*')
            .eq('story_id', storyId)
            .order('sort_order', { ascending: true }),
        ]);

        if (boardsResult.error) throw boardsResult.error;
        if (componentsResult.error) throw componentsResult.error;

        setComponents(componentsResult.data || []);

        const boards = boardsResult.data;
        if (boards && boards.length > 0) {
          const currentBoard = boards[0];
          setBoard(currentBoard);

          // Notes and connections both derive from the board id — fetch together.
          const [notesResult, connectionsResult] = await Promise.all([
            supabase.from('notes').select('*').eq('board_id', currentBoard.id),
            supabase.from('connections').select('*').eq('board_id', currentBoard.id),
          ]);

          if (notesResult.error) throw notesResult.error;
          if (connectionsResult.error) throw connectionsResult.error;

          setNotes(notesResult.data || []);
          setConnections(connectionsResult.data || []);
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
  }, [storyId, supabase, router, setCurrentStory, setComponents]);

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
            <p className="text-xs text-muted-foreground">{board.title}</p>
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

      {/* Canvas */}
      <div className="relative flex-1">
        <Canvas
          board={board}
          notes={notes}
          connections={connections}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onCreateNote={handleCreateNote}
          onUpdateConnection={handleUpdateConnection}
          onDeleteConnection={handleDeleteConnection}
          onCreateConnection={handleCreateConnection}
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
