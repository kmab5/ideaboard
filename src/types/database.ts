// =============================================================================
// IdeaBoard Database Types
// Auto-generated from database schema - Do not edit directly
// =============================================================================

// =============================================================================
// ENUMS
// =============================================================================

export type AvatarType = 'custom' | 'dicebear';

export type DicebearStyle =
  | 'adventurer'
  | 'adventurer-neutral'
  | 'avataaars'
  | 'avataaars-neutral'
  | 'big-ears'
  | 'big-ears-neutral'
  | 'big-smile'
  | 'bottts'
  | 'bottts-neutral'
  | 'croodles'
  | 'croodles-neutral'
  | 'fun-emoji'
  | 'icons'
  | 'identicon'
  | 'initials'
  | 'lorelei'
  | 'lorelei-neutral'
  | 'micah'
  | 'miniavs'
  | 'notionists'
  | 'notionists-neutral'
  | 'open-peeps'
  | 'personas'
  | 'pixel-art'
  | 'pixel-art-neutral'
  | 'shapes'
  | 'thumbs';

export type ComponentType = 'number' | 'string' | 'boolean' | 'list';

export type NoteType = 'normal' | 'conditional' | 'technical';

export type AnchorPosition = 'top' | 'bottom' | 'left' | 'right';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export type ArrowType = 'none' | 'single' | 'double';

export type CurvatureType = 'straight' | 'curved' | 'orthogonal';

// =============================================================================
// TABLE TYPES
// =============================================================================

export interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  avatar_type: AvatarType;
  dicebear_seed: string | null;
  dicebear_style: DicebearStyle;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_archived: boolean;
  is_favorite: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Component {
  id: string;
  story_id: string;
  name: string;
  type: ComponentType;
  description: string | null;
  default_value: unknown;
  current_value: unknown;
  color_tag: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BoardFolder {
  id: string;
  story_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  story_id: string;
  folder_id: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  viewport_x: number;
  viewport_y: number;
  viewport_zoom: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Container {
  id: string;
  story_id: string;
  board_id: string | null;
  name: string;
  description: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color: string | null;
  background_opacity: number;
  is_collapsed: boolean;
  is_locked: boolean;
  mini_board_data: {
    notes: unknown[];
    connections: unknown[];
    viewport: { x: number; y: number; zoom: number };
  };
  z_index: number;
  created_at: string;
  updated_at: string;
}

export interface NoteContent {
  blocks: Array<{
    type: string;
    content: unknown;
  }>;
}

export interface Note {
  id: string;
  board_id: string;
  container_id: string | null;
  type: NoteType;
  title: string | null;
  content: NoteContent;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color: string;
  is_collapsed: boolean;
  is_locked: boolean;
  z_index: number;
  condition_data: Record<string, unknown> | null;
  technical_data: Record<string, unknown> | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  board_id: string;
  source_note_id: string;
  target_note_id: string;
  source_anchor: AnchorPosition;
  target_anchor: AnchorPosition;
  label: string | null;
  color: string;
  style: LineStyle;
  thickness: number;
  arrow_type: ArrowType;
  curvature: CurvatureType;
  branch_label: string | null;
  branch_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface ComponentReference {
  id: string;
  component_id: string;
  note_id: string | null;
  container_id: string | null;
  reference_type: string;
  created_at: string;
}

// =============================================================================
// INSERT/UPDATE TYPES
// =============================================================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type StoryInsert = Omit<Story, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type StoryUpdate = Partial<Omit<Story, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type ComponentInsert = Omit<Component, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type ComponentUpdate = Partial<
  Omit<Component, 'id' | 'story_id' | 'created_at' | 'updated_at'>
>;

export type BoardFolderInsert = Omit<BoardFolder, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
export type BoardFolderUpdate = Partial<
  Omit<BoardFolder, 'id' | 'story_id' | 'created_at' | 'updated_at'>
>;

export type BoardInsert = Omit<Board, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type BoardUpdate = Partial<Omit<Board, 'id' | 'story_id' | 'created_at' | 'updated_at'>>;

export type ContainerInsert = Omit<Container, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type ContainerUpdate = Partial<
  Omit<Container, 'id' | 'story_id' | 'created_at' | 'updated_at'>
>;

export type NoteInsert = Omit<Note, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type NoteUpdate = Partial<Omit<Note, 'id' | 'board_id' | 'created_at' | 'updated_at'>>;

export type ConnectionInsert = Omit<Connection, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
export type ConnectionUpdate = Partial<
  Omit<Connection, 'id' | 'board_id' | 'created_at' | 'updated_at'>
>;

// =============================================================================
// QUERY TYPES (with relations)
// =============================================================================

export interface StoryWithRelations extends Story {
  boards?: Board[];
  components?: Component[];
  board_folders?: BoardFolder[];
}

export interface BoardWithRelations extends Board {
  notes?: Note[];
  connections?: Connection[];
  containers?: Container[];
}

export interface NoteWithRelations extends Note {
  connections_from?: Connection[];
  connections_to?: Connection[];
}

// =============================================================================
// SUPABASE DATABASE TYPE
// =============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      stories: {
        Row: Story;
        Insert: StoryInsert;
        Update: StoryUpdate;
      };
      components: {
        Row: Component;
        Insert: ComponentInsert;
        Update: ComponentUpdate;
      };
      board_folders: {
        Row: BoardFolder;
        Insert: BoardFolderInsert;
        Update: BoardFolderUpdate;
      };
      boards: {
        Row: Board;
        Insert: BoardInsert;
        Update: BoardUpdate;
      };
      containers: {
        Row: Container;
        Insert: ContainerInsert;
        Update: ContainerUpdate;
      };
      notes: {
        Row: Note;
        Insert: NoteInsert;
        Update: NoteUpdate;
      };
      connections: {
        Row: Connection;
        Insert: ConnectionInsert;
        Update: ConnectionUpdate;
      };
      component_references: {
        Row: ComponentReference;
        Insert: Omit<ComponentReference, 'id' | 'created_at'>;
        Update: Partial<Omit<ComponentReference, 'id' | 'created_at'>>;
      };
    };
    Enums: {
      avatar_type: AvatarType;
      dicebear_style: DicebearStyle;
      component_type: ComponentType;
      note_type: NoteType;
      anchor_position: AnchorPosition;
      line_style: LineStyle;
      arrow_type: ArrowType;
      curvature_type: CurvatureType;
    };
  };
}
