import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Profile } from '@/types/database';

interface User {
  id: string;
  email: string;
}

interface UserState {
  // State
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        profile: null,
        isLoading: true,
        isAuthenticated: false,

        // Actions
        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          }),

        setProfile: (profile) =>
          set({
            profile,
          }),

        setLoading: (isLoading) =>
          set({
            isLoading,
          }),

        updateProfile: (updates) =>
          set((state) => ({
            profile: state.profile
              ? { ...state.profile, ...updates, updated_at: new Date().toISOString() }
              : null,
          })),

        logout: () =>
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
          }),
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({
          // Don't persist everything, just user identification
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'UserStore' }
  )
);
