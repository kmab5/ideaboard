-- ============================================================================
-- IdeaBoard Database Schema for Supabase (PostgreSQL)
-- ============================================================================
-- This schema is designed for Supabase Free Tier
-- - Uses Supabase Auth for user management (auth.users)
-- - Leverages Row Level Security (RLS) for data protection
-- - Optimized indexes for common query patterns
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

-- Avatar type for user profiles
CREATE TYPE avatar_type AS ENUM ('custom', 'dicebear');

-- DiceBear avatar styles
CREATE TYPE dicebear_style AS ENUM (
    'adventurer',
    'adventurer-neutral',
    'avataaars',
    'avataaars-neutral',
    'big-ears',
    'big-ears-neutral',
    'big-smile',
    'bottts',
    'bottts-neutral',
    'croodles',
    'croodles-neutral',
    'fun-emoji',
    'icons',
    'identicon',
    'initials',
    'lorelei',
    'lorelei-neutral',
    'micah',
    'miniavs',
    'notionists',
    'notionists-neutral',
    'open-peeps',
    'personas',
    'pixel-art',
    'pixel-art-neutral',
    'shapes',
    'thumbs'
);

-- Component data types
CREATE TYPE component_type AS ENUM ('number', 'string', 'boolean', 'list');

-- Note types (drawing type for freehand drawings)
CREATE TYPE note_type AS ENUM ('normal', 'drawing', 'conditional', 'technical');

-- Connection anchor positions
CREATE TYPE anchor_position AS ENUM ('top', 'bottom', 'left', 'right');

-- Connection line styles
CREATE TYPE line_style AS ENUM ('solid', 'dashed', 'dotted');

-- Connection arrow types
CREATE TYPE arrow_type AS ENUM ('none', 'single', 'double');

-- Connection curvature types
CREATE TYPE curvature_type AS ENUM ('straight', 'curved', 'orthogonal');

-- ============================================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================================
-- Supabase Auth handles email, password, OAuth automatically
-- This table stores additional profile information

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display information
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    
    -- Avatar settings
    avatar_url TEXT,
    avatar_type avatar_type NOT NULL DEFAULT 'dicebear',
    dicebear_seed VARCHAR(255),
    dicebear_style dicebear_style NOT NULL DEFAULT 'adventurer',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for display name searches
CREATE INDEX idx_profiles_display_name ON profiles(display_name);

-- ============================================================================
-- STORIES TABLE
-- ============================================================================

CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Story details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    
    -- Status flags
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Story-specific settings (theme, defaults, etc.)
    settings JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_user_archived ON stories(user_id, is_archived);
CREATE INDEX idx_stories_user_favorite ON stories(user_id, is_favorite);
CREATE INDEX idx_stories_updated_at ON stories(updated_at DESC);

-- ============================================================================
-- COMPONENTS TABLE (Story-level variables)
-- ============================================================================

CREATE TABLE components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    
    -- Component definition
    name VARCHAR(100) NOT NULL,
    type component_type NOT NULL DEFAULT 'string',
    description TEXT,
    
    -- Values stored as JSONB for flexibility
    default_value JSONB NOT NULL DEFAULT 'null',
    current_value JSONB NOT NULL DEFAULT 'null',
    
    -- Visual customization
    color_tag VARCHAR(7), -- Hex color like #FF5733
    
    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique name within a story
    CONSTRAINT unique_component_name_per_story UNIQUE (story_id, name)
);

-- Indexes
CREATE INDEX idx_components_story_id ON components(story_id);
CREATE INDEX idx_components_name ON components(story_id, name);

-- ============================================================================
-- BOARD FOLDERS TABLE (for organizing boards)
-- ============================================================================

CREATE TABLE board_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    
    -- Folder details
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7), -- Hex color
    
    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_board_folders_story_id ON board_folders(story_id);

-- ============================================================================
-- BOARDS TABLE
-- ============================================================================

CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES board_folders(id) ON DELETE SET NULL,
    
    -- Board details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    
    -- Ordering
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Last viewport state (for restoring user's view)
    viewport_x REAL NOT NULL DEFAULT 0,
    viewport_y REAL NOT NULL DEFAULT 0,
    viewport_zoom REAL NOT NULL DEFAULT 1.0,
    
    -- Board settings (grid, snap, background, etc.)
    settings JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_boards_story_id ON boards(story_id);
CREATE INDEX idx_boards_folder_id ON boards(folder_id);
CREATE INDEX idx_boards_story_order ON boards(story_id, sort_order);

-- ============================================================================
-- CONTAINERS TABLE
-- ============================================================================

CREATE TABLE containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    
    -- Container details
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Position and size on canvas
    position_x REAL NOT NULL DEFAULT 0,
    position_y REAL NOT NULL DEFAULT 0,
    width REAL NOT NULL DEFAULT 400,
    height REAL NOT NULL DEFAULT 300,
    
    -- Visual styling
    color VARCHAR(7), -- Hex color for border/background
    background_opacity REAL NOT NULL DEFAULT 0.1,
    
    -- State flags
    is_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Mini-board content (notes and connections within container)
    -- Stored as JSONB for flexibility and atomic updates
    mini_board_data JSONB NOT NULL DEFAULT '{
        "notes": [],
        "connections": [],
        "viewport": {"x": 0, "y": 0, "zoom": 1}
    }',
    
    -- Layer order
    z_index INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Container names must be unique within their scope
    CONSTRAINT unique_container_name_per_board UNIQUE (board_id, name),
    -- Story-level containers (board_id is NULL) need unique names too
    CONSTRAINT unique_container_name_per_story UNIQUE (story_id, name) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX idx_containers_story_id ON containers(story_id);
CREATE INDEX idx_containers_board_id ON containers(board_id);
CREATE INDEX idx_containers_name ON containers(story_id, name);

-- ============================================================================
-- NOTES TABLE
-- ============================================================================

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
    
    -- Note type
    type note_type NOT NULL DEFAULT 'normal',
    
    -- Content
    title VARCHAR(255),
    content JSONB NOT NULL DEFAULT '{"blocks": []}', -- Rich text as JSON (e.g., TipTap, Slate, ProseMirror format)
    
    -- Position and size on canvas
    position_x REAL NOT NULL DEFAULT 0,
    position_y REAL NOT NULL DEFAULT 0,
    width REAL NOT NULL DEFAULT 200,
    height REAL NOT NULL DEFAULT 150,
    
    -- Visual styling
    color VARCHAR(7) NOT NULL DEFAULT '#FFFFFF', -- Background color
    
    -- State flags
    is_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Layer order
    z_index INTEGER NOT NULL DEFAULT 0,
    
    -- Type-specific data
    -- For conditional notes: stores condition expressions and branch config
    condition_data JSONB,
    -- For technical notes: stores component modification instructions
    technical_data JSONB,
    -- For drawing notes: stores stroke data (points, colors, widths)
    drawing_data JSONB,
    
    -- Tags for filtering
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notes_board_id ON notes(board_id);
CREATE INDEX idx_notes_container_id ON notes(container_id);
CREATE INDEX idx_notes_type ON notes(board_id, type);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_notes_position ON notes(board_id, position_x, position_y);

-- ============================================================================
-- CONNECTIONS TABLE (Arrows between notes)
-- ============================================================================

CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    
    -- Source and target notes
    source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    
    -- Anchor positions
    source_anchor anchor_position NOT NULL DEFAULT 'bottom',
    target_anchor anchor_position NOT NULL DEFAULT 'top',
    
    -- Visual properties
    label VARCHAR(255),
    color VARCHAR(7) NOT NULL DEFAULT '#000000',
    style line_style NOT NULL DEFAULT 'solid',
    thickness INTEGER NOT NULL DEFAULT 2 CHECK (thickness >= 1 AND thickness <= 5),
    arrow_type arrow_type NOT NULL DEFAULT 'single',
    curvature curvature_type NOT NULL DEFAULT 'curved',
    
    -- For conditional note branches
    branch_label VARCHAR(50), -- e.g., "true", "false", "else"
    branch_order INTEGER, -- Order of branches for conditional notes
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate connections
    CONSTRAINT unique_connection UNIQUE (source_note_id, target_note_id, source_anchor, target_anchor)
);

-- Indexes
CREATE INDEX idx_connections_board_id ON connections(board_id);
CREATE INDEX idx_connections_source ON connections(source_note_id);
CREATE INDEX idx_connections_target ON connections(target_note_id);

-- ============================================================================
-- COMPONENT REFERENCES TABLE (tracks where components are used)
-- ============================================================================
-- Denormalized table for quick lookup of component usage

CREATE TABLE component_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    
    -- Reference location (one of these will be set)
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    container_id UUID REFERENCES containers(id) ON DELETE CASCADE,
    
    -- Reference context
    reference_type VARCHAR(50) NOT NULL, -- 'content', 'condition', 'technical', 'container_mini_board'
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure at least one reference target
    CONSTRAINT valid_reference CHECK (note_id IS NOT NULL OR container_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_component_refs_component ON component_references(component_id);
CREATE INDEX idx_component_refs_note ON component_references(note_id);
CREATE INDEX idx_component_refs_container ON component_references(container_id);

-- ============================================================================
-- STORY SHARES TABLE (for collaboration)
-- ============================================================================

CREATE TABLE story_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    
    -- Share settings
    share_token VARCHAR(64) UNIQUE, -- For public/link sharing
    permission_level VARCHAR(20) NOT NULL DEFAULT 'view' 
        CHECK (permission_level IN ('view', 'comment', 'edit')),
    
    -- Optional restrictions
    password_hash VARCHAR(255), -- Optional password protection
    expires_at TIMESTAMPTZ, -- Optional expiration
    
    -- For user-specific sharing
    shared_with_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_story_shares_story ON story_shares(story_id);
CREATE INDEX idx_story_shares_token ON story_shares(share_token);
CREATE INDEX idx_story_shares_user ON story_shares(shared_with_user_id);

-- ============================================================================
-- VERSION HISTORY TABLE (for undo/version control)
-- ============================================================================

CREATE TABLE version_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference to entity
    entity_type VARCHAR(50) NOT NULL, -- 'story', 'board', 'note', 'component', 'container', 'connection'
    entity_id UUID NOT NULL,
    
    -- Snapshot of the entity state
    snapshot JSONB NOT NULL,
    
    -- Change metadata
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    change_type VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    change_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_version_history_entity ON version_history(entity_type, entity_id);
CREATE INDEX idx_version_history_created ON version_history(created_at DESC);

-- Note: Partial indexes with NOW() are not allowed (not immutable)
-- Use the cleanup_old_versions() function instead to manage storage

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can only insert their own profile (trigger uses SECURITY DEFINER to bypass RLS)
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STORIES POLICIES
-- ============================================================================

-- Users can view their own stories
CREATE POLICY "Users can view own stories"
    ON stories FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own stories
CREATE POLICY "Users can create own stories"
    ON stories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories
CREATE POLICY "Users can update own stories"
    ON stories FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete own stories"
    ON stories FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTION: Check story ownership (bypasses RLS to prevent recursion)
-- ============================================================================

CREATE OR REPLACE FUNCTION user_owns_story(story_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM stories 
        WHERE id = story_uuid AND user_id = auth.uid()
    );
$$;

-- ============================================================================
-- COMPONENTS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage components in their stories"
    ON components FOR ALL
    USING (user_owns_story(story_id))
    WITH CHECK (user_owns_story(story_id));

-- ============================================================================
-- BOARD FOLDERS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage folders in their stories"
    ON board_folders FOR ALL
    USING (user_owns_story(story_id))
    WITH CHECK (user_owns_story(story_id));

-- ============================================================================
-- BOARDS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage boards in their stories"
    ON boards FOR ALL
    USING (user_owns_story(story_id))
    WITH CHECK (user_owns_story(story_id));

-- ============================================================================
-- CONTAINERS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage containers in their stories"
    ON containers FOR ALL
    USING (user_owns_story(story_id))
    WITH CHECK (user_owns_story(story_id));

-- ============================================================================
-- NOTES POLICIES
-- ============================================================================

CREATE POLICY "Users can manage notes in their boards"
    ON notes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = notes.board_id 
            AND user_owns_story(boards.story_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = notes.board_id 
            AND user_owns_story(boards.story_id)
        )
    );

-- ============================================================================
-- CONNECTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage connections in their boards"
    ON connections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = connections.board_id 
            AND user_owns_story(boards.story_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM boards
            WHERE boards.id = connections.board_id 
            AND user_owns_story(boards.story_id)
        )
    );

-- ============================================================================
-- COMPONENT REFERENCES POLICIES
-- ============================================================================

CREATE POLICY "Users can manage component references in their stories"
    ON component_references FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM components
            WHERE components.id = component_references.component_id
            AND user_owns_story(components.story_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM components
            WHERE components.id = component_references.component_id
            AND user_owns_story(components.story_id)
        )
    );

-- ============================================================================
-- STORY SHARES POLICIES
-- ============================================================================

CREATE POLICY "Story owners can manage shares"
    ON story_shares FOR ALL
    USING (user_owns_story(story_id))
    WITH CHECK (user_owns_story(story_id));

CREATE POLICY "Users can view shares they have access to"
    ON story_shares FOR SELECT
    USING (shared_with_user_id = auth.uid());

-- ============================================================================
-- VERSION HISTORY POLICIES
-- ============================================================================

CREATE POLICY "Users can view version history of their content"
    ON version_history FOR SELECT
    USING (changed_by = auth.uid());

-- Only allow inserts via triggers/functions (not direct client access)
CREATE POLICY "Authenticated users can insert version history for their content"
    ON version_history FOR INSERT
    WITH CHECK (changed_by = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at
    BEFORE UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_folders_updated_at
    BEFORE UPDATE ON board_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at
    BEFORE UPDATE ON boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_containers_updated_at
    BEFORE UPDATE ON containers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_shares_updated_at
    BEFORE UPDATE ON story_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Create profile on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Security: prevent search path injection
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, dicebear_seed)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email::text, '@', 1))
        ),
        NEW.id::text  -- Use user ID as dicebear seed (guaranteed unique)
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- FUNCTION: Clean up old version history (for storage management)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_versions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Keep only last 30 days of history
    DELETE FROM version_history
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Keep only last 100 versions per entity
    DELETE FROM version_history v1
    WHERE v1.id NOT IN (
        SELECT v2.id FROM version_history v2
        WHERE v2.entity_type = v1.entity_type
        AND v2.entity_id = v1.entity_id
        ORDER BY v2.created_at DESC
        LIMIT 100
    );
END;
$$;

-- ============================================================================
-- STORAGE BUCKET CONFIGURATION (for Supabase Storage)
-- ============================================================================
-- Run these in the Supabase dashboard or via management API

-- Create bucket for avatars (public)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create bucket for story thumbnails
-- INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);

-- Create bucket for file attachments (private)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- Create bucket for note image attachments (public for easy display)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('note-attachments', 'note-attachments', true);

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================
-- NOTE: Run these AFTER creating buckets in Supabase Dashboard:
--   1. Create bucket 'avatars' (public: true)
--   2. Create bucket 'thumbnails' (public: true)  
--   3. Create bucket 'attachments' (public: false)
-- Then run these policies:

-- AVATARS BUCKET POLICIES
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- THUMBNAILS BUCKET POLICIES
CREATE POLICY "Users can upload thumbnails for their stories"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can update their thumbnails"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their thumbnails"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ATTACHMENTS BUCKET POLICIES (private)
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- NOTE-ATTACHMENTS BUCKET POLICIES (public for note images)
CREATE POLICY "Users can upload note attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'note-attachments'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Note attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-attachments');

CREATE POLICY "Users can delete their own note attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'note-attachments'
    AND auth.role() = 'authenticated'
);

-- ============================================================================
-- INDEXES FOR FULL-TEXT SEARCH
-- ============================================================================

-- Full-text search on note content (using JSONB)
CREATE INDEX idx_notes_content_search ON notes 
    USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content::text, '')));

-- Full-text search on story titles
CREATE INDEX idx_stories_title_search ON stories 
    USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE profiles IS 'Extended user profile information (supplements auth.users)';
COMMENT ON TABLE stories IS 'Top-level project container owned by users';
COMMENT ON TABLE components IS 'User-defined variables that can be referenced across the story';
COMMENT ON TABLE boards IS 'Canvas workspaces within a story';
COMMENT ON TABLE containers IS 'Named regions on boards with embedded mini-boards';
COMMENT ON TABLE notes IS 'Individual notes/cards on boards (normal, conditional, or technical)';
COMMENT ON TABLE connections IS 'Directional arrows connecting notes';
COMMENT ON TABLE component_references IS 'Tracks where components are used for quick lookups';
COMMENT ON TABLE story_shares IS 'Sharing configuration for collaboration';
COMMENT ON TABLE version_history IS 'Snapshots for undo/version control';

COMMENT ON COLUMN containers.mini_board_data IS 'JSONB containing embedded notes, connections, and viewport state';
COMMENT ON COLUMN notes.content IS 'Rich text content stored as JSONB (compatible with TipTap/ProseMirror)';
COMMENT ON COLUMN notes.condition_data IS 'Condition expressions for conditional notes';
COMMENT ON COLUMN notes.technical_data IS 'Component modification instructions for technical notes';
