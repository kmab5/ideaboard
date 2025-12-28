import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Component, ComponentUpdate } from '@/types/database';

interface ComponentState {
  // State
  components: Component[];
  isLoading: boolean;
  isPanelOpen: boolean;
  searchQuery: string;
  filterType: string | null;

  // Actions
  setComponents: (components: Component[]) => void;
  addComponent: (component: Component) => void;
  updateComponent: (id: string, updates: ComponentUpdate) => void;
  removeComponent: (id: string) => void;
  resetComponent: (id: string) => void;
  resetAllComponents: () => void;

  // UI Actions
  setLoading: (loading: boolean) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string | null) => void;

  // Selectors
  getComponentByName: (name: string) => Component | undefined;
  getComponentById: (id: string) => Component | undefined;
  getFilteredComponents: () => Component[];
}

export const useComponentStore = create<ComponentState>()(
  devtools(
    (set, get) => ({
      // Initial state
      components: [],
      isLoading: false,
      isPanelOpen: false,
      searchQuery: '',
      filterType: null,

      // Actions
      setComponents: (components) =>
        set({
          components: components.sort((a, b) => a.sort_order - b.sort_order),
        }),

      addComponent: (component) =>
        set((state) => ({
          components: [...state.components, component].sort((a, b) => a.sort_order - b.sort_order),
        })),

      updateComponent: (id, updates) =>
        set((state) => ({
          components: state.components
            .map((comp) =>
              comp.id === id ? { ...comp, ...updates, updated_at: new Date().toISOString() } : comp
            )
            .sort((a, b) => a.sort_order - b.sort_order),
        })),

      removeComponent: (id) =>
        set((state) => ({
          components: state.components.filter((comp) => comp.id !== id),
        })),

      resetComponent: (id) =>
        set((state) => ({
          components: state.components.map((comp) =>
            comp.id === id
              ? {
                  ...comp,
                  current_value: comp.default_value,
                  updated_at: new Date().toISOString(),
                }
              : comp
          ),
        })),

      resetAllComponents: () =>
        set((state) => ({
          components: state.components.map((comp) => ({
            ...comp,
            current_value: comp.default_value,
            updated_at: new Date().toISOString(),
          })),
        })),

      // UI Actions
      setLoading: (isLoading) => set({ isLoading }),

      togglePanel: () =>
        set((state) => ({
          isPanelOpen: !state.isPanelOpen,
        })),

      setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setFilterType: (filterType) => set({ filterType }),

      // Selectors
      getComponentByName: (name) => {
        const state = get();
        return state.components.find((comp) => comp.name.toLowerCase() === name.toLowerCase());
      },

      getComponentById: (id) => {
        const state = get();
        return state.components.find((comp) => comp.id === id);
      },

      getFilteredComponents: () => {
        const state = get();
        let filtered = state.components;

        // Filter by search query
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (comp) =>
              comp.name.toLowerCase().includes(query) ||
              comp.description?.toLowerCase().includes(query)
          );
        }

        // Filter by type
        if (state.filterType) {
          filtered = filtered.filter((comp) => comp.type === state.filterType);
        }

        return filtered;
      },
    }),
    { name: 'ComponentStore' }
  )
);
