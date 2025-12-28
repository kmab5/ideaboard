'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useStoryStore, useComponentStore } from '@/lib/store';
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

  // Debounce ref for auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

        // Fetch first board of story (MVP: one board per story)
        const { data: boards, error: boardError } = await supabase
          .from('boards')
          .select('*')
          .eq('story_id', storyId)
          .order('sort_order', { ascending: true })
          .limit(1);

        if (boardError) throw boardError;

        if (boards && boards.length > 0) {
          setBoard(boards[0]);

          // Fetch notes
          const { data: notesData, error: notesError } = await supabase
            .from('notes')
            .select('*')
            .eq('board_id', boards[0].id);

          if (notesError) throw notesError;
          setNotes(notesData || []);

          // Fetch connections
          const { data: connectionsData, error: connectionsError } = await supabase
            .from('connections')
            .select('*')
            .eq('board_id', boards[0].id);

          if (connectionsError) throw connectionsError;
          setConnections(connectionsData || []);
        }

        // Fetch components
        const { data: componentsData, error: componentsError } = await supabase
          .from('components')
          .select('*')
          .eq('story_id', storyId)
          .order('sort_order', { ascending: true });

        if (componentsError) throw componentsError;
        setComponents(componentsData || []);
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

  // Note handlers
  const handleUpdateNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, ...updates, updated_at: new Date().toISOString() } : note
        )
      );

      // Optimistic update - save in background
      try {
        await supabase
          .from('notes')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (error) {
        console.error('Error updating note:', error);
      }
    },
    [supabase]
  );

  const handleDeleteNote = useCallback(
    async (id: string) => {
      setNotes((prev) => prev.filter((note) => note.id !== id));
      setConnections((prev) =>
        prev.filter((conn) => conn.source_note_id !== id && conn.target_note_id !== id)
      );

      try {
        await supabase.from('notes').delete().eq('id', id);
      } catch (error) {
        console.error('Error deleting note:', error);
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
        await supabase.from('notes').insert(newNote);
      } catch (error) {
        console.error('Error creating note:', error);
        // Rollback
        setNotes((prev) => prev.filter((n) => n.id !== note.id));
      }
    },
    [supabase]
  );

  // Connection handlers
  const handleUpdateConnection = useCallback(
    async (id: string, updates: Partial<Connection>) => {
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === id ? { ...conn, ...updates, updated_at: new Date().toISOString() } : conn
        )
      );

      try {
        await supabase
          .from('connections')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (error) {
        console.error('Error updating connection:', error);
      }
    },
    [supabase]
  );

  const handleDeleteConnection = useCallback(
    async (id: string) => {
      setConnections((prev) => prev.filter((conn) => conn.id !== id));

      try {
        await supabase.from('connections').delete().eq('id', id);
      } catch (error) {
        console.error('Error deleting connection:', error);
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
        await supabase.from('connections').insert(newConnection);
      } catch (error) {
        console.error('Error creating connection:', error);
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
        />

        {/* Component Panel */}
        {isPanelOpen && (
          <ComponentPanel storyId={storyId} components={components} onClose={togglePanel} />
        )}
      </div>
    </div>
  );
}
