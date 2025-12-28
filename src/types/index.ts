// Re-export all database types
export * from './database';

// =============================================================================
// APP-SPECIFIC TYPES
// =============================================================================

import type { Node, Edge } from 'reactflow';
import type { Note, Connection } from './database';

// User state
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
}

// React Flow node data
export interface NoteNodeData {
  note: Note;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export type NoteNode = Node<NoteNodeData>;

// React Flow edge data
export interface ConnectionEdgeData {
  connection: Connection;
  onUpdate: (id: string, updates: Partial<Connection>) => void;
  onDelete: (id: string) => void;
}

export type ConnectionEdge = Edge<ConnectionEdgeData>;

// Canvas viewport
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// Auth state
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Form states
export interface FormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
}

// Toast/notification
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

// Component panel filter
export interface ComponentFilter {
  search: string;
  type: string | null;
}

// Story filter/sort
export type StorySortBy = 'updated_at' | 'created_at' | 'title';
export type StorySortOrder = 'asc' | 'desc';

export interface StoryFilter {
  search: string;
  showArchived: boolean;
  showFavorites: boolean;
  sortBy: StorySortBy;
  sortOrder: StorySortOrder;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
