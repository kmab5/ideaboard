'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, SortAsc, SortDesc, FolderOpen, Sparkles, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useStoryStore, useUserStore } from '@/lib/store';
import type { CreateStoryInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { StoryCard, CreateStoryDialog, PageLoader } from '@/components/common';
import { toast } from 'sonner';

export default function StoriesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, setUser, setProfile } = useUserStore();
  const {
    stories,
    setStories,
    addStory,
    updateStory,
    removeStory,
    isLoading,
    setLoading,
    filter,
    setSearch,
    setShowArchived,
    setShowFavorites,
    setSortBy,
    setSortOrder,
    getFilteredStories,
  } = useStoryStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user and profile on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          // Redirect to login if not authenticated
          router.push('/login');
          return;
        }

        setUser({ id: authUser.id, email: authUser.email! });

        // Fetch profile
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        // If no profile exists, create one
        if (!profile) {
          const displayName =
            authUser.user_metadata?.display_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split('@')[0] ||
            'User';

          const seed = authUser.id;
          const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              display_name: displayName,
              avatar_type: 'dicebear',
              dicebear_style: 'adventurer',
              dicebear_seed: seed,
              avatar_url: avatarUrl,
            })
            .select()
            .single();

          if (!createError && newProfile) {
            profile = newProfile;
          }
        }

        if (profile) {
          setProfile(profile);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, [supabase, setUser, setProfile, router]);

  // Fetch stories
  useEffect(() => {
    const fetchStories = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setStories(data || []);
      } catch (error) {
        console.error('Error fetching stories:', error);
        toast.error('Failed to load stories');
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    if (user) {
      fetchStories();
    }
  }, [user, supabase, setStories, setLoading]);

  const handleCreateStory = useCallback(
    async (data: CreateStoryInput) => {
      if (!user) return;

      try {
        // Create story
        const { data: newStory, error: storyError } = await supabase
          .from('stories')
          .insert({
            user_id: user.id,
            title: data.title,
            description: data.description || null,
          })
          .select()
          .single();

        if (storyError) throw storyError;

        // Create default board for the story
        const { error: boardError } = await supabase.from('boards').insert({
          story_id: newStory.id,
          title: 'Main Board',
          sort_order: 0,
        });

        if (boardError) throw boardError;

        addStory(newStory);
        toast.success('Story created!');
      } catch (error) {
        console.error('Error creating story:', error);
        toast.error('Failed to create story');
      }
    },
    [user, supabase, addStory]
  );

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      const story = stories.find((s) => s.id === id);
      if (!story) return;

      try {
        const { error } = await supabase
          .from('stories')
          .update({ is_favorite: !story.is_favorite })
          .eq('id', id);

        if (error) throw error;
        updateStory(id, { is_favorite: !story.is_favorite });
      } catch (error) {
        console.error('Error updating story:', error);
        toast.error('Failed to update story');
      }
    },
    [stories, supabase, updateStory]
  );

  const handleToggleArchive = useCallback(
    async (id: string) => {
      const story = stories.find((s) => s.id === id);
      if (!story) return;

      try {
        const { error } = await supabase
          .from('stories')
          .update({ is_archived: !story.is_archived })
          .eq('id', id);

        if (error) throw error;
        updateStory(id, { is_archived: !story.is_archived });
        toast.success(story.is_archived ? 'Story unarchived' : 'Story archived');
      } catch (error) {
        console.error('Error updating story:', error);
        toast.error('Failed to update story');
      }
    },
    [stories, supabase, updateStory]
  );

  const handleDeleteStory = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('stories').delete().eq('id', id);

        if (error) throw error;
        removeStory(id);
        toast.success('Story deleted');
      } catch (error) {
        console.error('Error deleting story:', error);
        toast.error('Failed to delete story');
      }
    },
    [supabase, removeStory]
  );

  const handleRenameStory = useCallback(
    async (id: string, title: string) => {
      try {
        const { error } = await supabase.from('stories').update({ title }).eq('id', id);

        if (error) throw error;
        updateStory(id, { title });
        toast.success('Story renamed');
      } catch (error) {
        console.error('Error renaming story:', error);
        toast.error('Failed to rename story');
      }
    },
    [supabase, updateStory]
  );

  if (!isInitialized || isLoading) {
    return <PageLoader />;
  }

  const filteredStories = getFilteredStories();

  return (
    <div className="w-full px-4 py-6 transition-all duration-300 ease-in-out sm:px-6 sm:py-8 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 transition-all duration-300 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold transition-all duration-300 sm:text-3xl">
            <BookOpen className="h-6 w-6 text-primary transition-all duration-300 sm:h-8 sm:w-8" />
            My Stories
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground transition-all duration-300 sm:mt-2 sm:text-base">
            Create and manage your interactive narratives
          </p>
        </div>
        <CreateStoryDialog onCreateStory={handleCreateStory} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-card p-3 transition-all duration-300 sm:mb-6 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            className="pl-10"
            value={filter.search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 transition-all duration-200">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={filter.showArchived}
                onCheckedChange={setShowArchived}
              >
                Show archived
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.showFavorites}
                onCheckedChange={setShowFavorites}
              >
                Favorites only
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {filter.sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('updated_at')}>
                Last updated
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('created_at')}>
                Date created
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title')}>Title</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSortOrder(filter.sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {filter.sortOrder === 'asc' ? 'Descending' : 'Ascending'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stories Count */}
      {filteredStories.length > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          Showing {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
          {filter.search && ` matching "${filter.search}"`}
        </p>
      )}

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
          {stories.length === 0 ? (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Welcome to IdeaBoard!</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Create your first story to start organizing your ideas visually with notes and
                connections.
              </p>
              <div className="mt-6">
                <CreateStoryDialog onCreateStory={handleCreateStory} />
              </div>
            </>
          ) : (
            <>
              <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No stories found</h3>
              <p className="mt-1 text-muted-foreground">
                Try adjusting your search or filter settings
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 transition-all duration-300 ease-in-out sm:grid-cols-2 sm:gap-5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onToggleFavorite={handleToggleFavorite}
              onToggleArchive={handleToggleArchive}
              onDelete={handleDeleteStory}
              onRename={handleRenameStory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
