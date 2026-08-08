-- ============================================================================
-- Migration 003 — Container integrity (v0.11.0)
-- ============================================================================
-- Apply in the Supabase dashboard: SQL Editor → New query → Run.
-- Safe to re-run.
--
-- WHAT THIS FIXES
--   Containers carry both `story_id` and `board_id`, but nothing enforced that
--   the board actually belongs to the story. RLS checks `user_owns_story
--   (story_id)`, so a crafted insert could pass authorization while pointing
--   `board_id` at a board in someone else's story.
--
--   Impact is limited — the row stays invisible to the other user, because
--   their SELECT is filtered by their own story ownership — so this is a data
--   integrity fix rather than a disclosure fix. (Finding IDB-008.)
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Enforce that a container's board belongs to its story
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION container_board_matches_story()
RETURNS TRIGGER AS $$
BEGIN
    -- Story-level containers (board_id IS NULL) are allowed by design.
    IF NEW.board_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM boards
        WHERE boards.id = NEW.board_id
          AND boards.story_id = NEW.story_id
    ) THEN
        RAISE EXCEPTION 'Container board_id % does not belong to story_id %',
            NEW.board_id, NEW.story_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS containers_board_story_match ON containers;
CREATE TRIGGER containers_board_story_match
    BEFORE INSERT OR UPDATE ON containers
    FOR EACH ROW EXECUTE FUNCTION container_board_matches_story();


-- ----------------------------------------------------------------------------
-- 2. Same guarantee for a note's container
-- ----------------------------------------------------------------------------
-- A note may only belong to a container on the same board.

CREATE OR REPLACE FUNCTION note_container_matches_board()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.container_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM containers
        WHERE containers.id = NEW.container_id
          AND (containers.board_id = NEW.board_id OR containers.board_id IS NULL)
    ) THEN
        RAISE EXCEPTION 'Note container_id % is not on board %',
            NEW.container_id, NEW.board_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_container_board_match ON notes;
CREATE TRIGGER notes_container_board_match
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION note_container_matches_board();


-- ----------------------------------------------------------------------------
-- 3. Verification
-- ----------------------------------------------------------------------------
--   SELECT tgname FROM pg_trigger
--   WHERE tgname IN ('containers_board_story_match', 'notes_container_board_match');
--
-- Expect both rows. Existing data is not rewritten; the triggers apply from
-- the next insert/update onward.
