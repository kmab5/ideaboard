-- ============================================================================
-- Migration 002 — Conditional notes (v1.1)
-- ============================================================================
-- Apply in the Supabase dashboard: SQL Editor → New query → Run.
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS throughout.
--
-- WHAT THIS ADDS
--   A `branch_id` column on connections, correlating an outgoing connection
--   from a conditional note with a specific branch defined in that note's
--   `condition_data` (see src/lib/conditions.ts for the shape). This lets the
--   app know which physical connection represents which branch, independent
--   of the human-readable `branch_label` already on the table.
-- ============================================================================

ALTER TABLE connections ADD COLUMN IF NOT EXISTS branch_id UUID;

COMMENT ON COLUMN connections.branch_id IS
  'Correlates this connection with a branch id in the source note''s condition_data.branches (conditional notes only). Null for ordinary connections.';

-- Helpful for looking up "which connection currently represents branch X".
CREATE INDEX IF NOT EXISTS idx_connections_branch_id
  ON connections(branch_id) WHERE branch_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'connections' AND column_name = 'branch_id';
