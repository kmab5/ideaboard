-- ============================================================================
-- Migration 004 — Database-level write rate limiting (v0.13.0)
-- ============================================================================
-- Apply in the Supabase dashboard: SQL Editor → New query → Run.
-- Safe to re-run.
--
-- WHY THIS EXISTS
--   The browser talks *directly* to Supabase for board writes (notes,
--   connections, containers, components), so those requests never pass through
--   the Next.js server and no middleware rate limiter can see them. This was
--   documented as an open gap in SECURITY.md.
--
--   Rather than proxying every mutation through an API route — which would add
--   latency to every keystroke-driven save and mean rewriting the optimistic
--   update path — the limit is enforced at the real boundary: Postgres itself.
--   This covers every client equally, including someone scripting the REST API
--   directly, which is exactly the case a server-side limiter would miss.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Counter table
-- ----------------------------------------------------------------------------
-- One row per (user, fixed one-minute window). Old rows are pruned
-- opportunistically so the table stays small without needing a cron job.

CREATE TABLE IF NOT EXISTS write_rate_limits (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    window_start TIMESTAMPTZ NOT NULL,
    write_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, window_start)
);

-- The table is maintained entirely by the SECURITY DEFINER trigger below, so
-- clients get no direct access. RLS with no policy denies everything.
ALTER TABLE write_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_write_rate_limits_window
    ON write_rate_limits(window_start);


-- ----------------------------------------------------------------------------
-- 2. Enforcement function
-- ----------------------------------------------------------------------------
-- Generous by design: a burst of edits, a large paste, or importing a story
-- should never trip it. It exists to stop scripted abuse, not normal authoring.

CREATE OR REPLACE FUNCTION enforce_write_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_window TIMESTAMPTZ;
    current_count INTEGER;
    max_writes_per_minute CONSTANT INTEGER := 600;
BEGIN
    -- Unauthenticated/service-role contexts (imports, admin tasks) are exempt.
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    current_window := date_trunc('minute', NOW());

    INSERT INTO write_rate_limits (user_id, window_start, write_count)
    VALUES (auth.uid(), current_window, 1)
    ON CONFLICT (user_id, window_start)
    DO UPDATE SET write_count = write_rate_limits.write_count + 1
    RETURNING write_count INTO current_count;

    IF current_count > max_writes_per_minute THEN
        RAISE EXCEPTION 'Rate limit exceeded: too many changes in a short time. Please slow down.'
            USING ERRCODE = '53400';
    END IF;

    -- Opportunistic cleanup: roughly 1 in 500 writes prunes old windows.
    IF random() < 0.002 THEN
        DELETE FROM write_rate_limits WHERE window_start < NOW() - INTERVAL '10 minutes';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ----------------------------------------------------------------------------
-- 3. Attach to the write-heavy tables
-- ----------------------------------------------------------------------------
-- INSERT and UPDATE only. DELETE is left unthrottled so a user can always
-- clean up their own data, even if they've hit the limit.

DROP TRIGGER IF EXISTS rate_limit_notes ON notes;
CREATE TRIGGER rate_limit_notes
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION enforce_write_rate_limit();

DROP TRIGGER IF EXISTS rate_limit_connections ON connections;
CREATE TRIGGER rate_limit_connections
    BEFORE INSERT OR UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION enforce_write_rate_limit();

DROP TRIGGER IF EXISTS rate_limit_containers ON containers;
CREATE TRIGGER rate_limit_containers
    BEFORE INSERT OR UPDATE ON containers
    FOR EACH ROW EXECUTE FUNCTION enforce_write_rate_limit();

DROP TRIGGER IF EXISTS rate_limit_components ON components;
CREATE TRIGGER rate_limit_components
    BEFORE INSERT OR UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION enforce_write_rate_limit();


-- ----------------------------------------------------------------------------
-- 4. Verification
-- ----------------------------------------------------------------------------
--   SELECT tgname FROM pg_trigger WHERE tgname LIKE 'rate_limit_%';
--   -- expect four rows
--
--   SELECT * FROM write_rate_limits ORDER BY window_start DESC LIMIT 5;
--   -- shows live counters once you start editing
--
-- To adjust the threshold, change `max_writes_per_minute` above and re-run.
-- To disable temporarily:
--   ALTER TABLE notes DISABLE TRIGGER rate_limit_notes;  -- etc.
