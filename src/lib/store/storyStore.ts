import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Story, StoryUpdate } from '@/types/database';
import type { StoryFilter, StorySortBy, StorySortOrder } from '@/types';

interface StoryState {
  // State
  stories: Story[];
  currentStory: Story | null;
  isLoading: boolean;

  // Filters
  filter: StoryFilter;

  // Actions
  setStories: (stories: Story[]) => void;
  addStory: (story: Story) => void;
  updateStory: (id: string, updates: StoryUpdate) => void;
  removeStory: (id: string) => void;
  setCurrentStory: (story: Story | null) => void;
  setLoading: (loading: boolean) => void;

  // Filter Actions
  setSearch: (search: string) => void;
  setShowArchived: (show: boolean) => void;
  setShowFavorites: (show: boolean) => void;
  setSortBy: (sortBy: StorySortBy) => void;
  setSortOrder: (order: StorySortOrder) => void;
  resetFilters: () => void;

  // Selectors
  getFilteredStories: () => Story[];
  getStoryById: (id: string) => Story | undefined;
}

const defaultFilter: StoryFilter = {
  search: '',
  showArchived: false,
  showFavorites: false,
  sortBy: 'updated_at',
  sortOrder: 'desc',
};

export const useStoryStore = create<StoryState>()(
  devtools(
    (set, get) => ({
      // Initial state
      stories: [],
      currentStory: null,
      isLoading: false,
      filter: defaultFilter,

      // Actions
      setStories: (stories) => set({ stories }),

      addStory: (story) =>
        set((state) => ({
          stories: [story, ...state.stories],
        })),

      updateStory: (id, updates) =>
        set((state) => ({
          stories: state.stories.map((story) =>
            story.id === id ? { ...story, ...updates, updated_at: new Date().toISOString() } : story
          ),
          currentStory:
            state.currentStory?.id === id
              ? { ...state.currentStory, ...updates, updated_at: new Date().toISOString() }
              : state.currentStory,
        })),

      removeStory: (id) =>
        set((state) => ({
          stories: state.stories.filter((story) => story.id !== id),
          currentStory: state.currentStory?.id === id ? null : state.currentStory,
        })),

      setCurrentStory: (currentStory) => set({ currentStory }),

      setLoading: (isLoading) => set({ isLoading }),

      // Filter Actions
      setSearch: (search) =>
        set((state) => ({
          filter: { ...state.filter, search },
        })),

      setShowArchived: (showArchived) =>
        set((state) => ({
          filter: { ...state.filter, showArchived },
        })),

      setShowFavorites: (showFavorites) =>
        set((state) => ({
          filter: { ...state.filter, showFavorites },
        })),

      setSortBy: (sortBy) =>
        set((state) => ({
          filter: { ...state.filter, sortBy },
        })),

      setSortOrder: (sortOrder) =>
        set((state) => ({
          filter: { ...state.filter, sortOrder },
        })),

      resetFilters: () =>
        set({
          filter: defaultFilter,
        }),

      // Selectors
      getFilteredStories: () => {
        const state = get();
        let filtered = [...state.stories];

        // Filter by search
        if (state.filter.search) {
          const query = state.filter.search.toLowerCase();
          filtered = filtered.filter(
            (story) =>
              story.title.toLowerCase().includes(query) ||
              story.description?.toLowerCase().includes(query)
          );
        }

        // Filter archived
        if (!state.filter.showArchived) {
          filtered = filtered.filter((story) => !story.is_archived);
        }

        // Filter favorites only
        if (state.filter.showFavorites) {
          filtered = filtered.filter((story) => story.is_favorite);
        }

        // Sort
        filtered.sort((a, b) => {
          const aValue = a[state.filter.sortBy];
          const bValue = b[state.filter.sortBy];

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue);
            return state.filter.sortOrder === 'asc' ? comparison : -comparison;
          }

          return 0;
        });

        return filtered;
      },

      getStoryById: (id) => {
        const state = get();
        return state.stories.find((story) => story.id === id);
      },
    }),
    { name: 'StoryStore' }
  )
);
