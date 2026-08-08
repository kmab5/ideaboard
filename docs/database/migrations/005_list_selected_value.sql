-- ============================================================================
-- Migration 005 — Selected value for list components (v0.15.0)
-- ============================================================================
-- Apply in the Supabase dashboard: SQL Editor → New query → Run.
-- Safe to re-run.
--
-- WHY
--   A `list` component's `current_value` holds its *choices* (e.g. sunny,
--   rainy, snowy). Until now there was no way to say which one is currently
--   active, so a list couldn't be branched on the way a real enum would be:
--   `weather == "rainy"` compared against the whole array and never matched.
--
--   `selected_value` records the active choice. Choices stay in
--   `current_value`, so existing data is untouched and `includes` keeps
--   working exactly as before.
-- ============================================================================

ALTER TABLE components ADD COLUMN IF NOT EXISTS selected_value JSONB;

COMMENT ON COLUMN components.selected_value IS
  'For list components: the currently active choice out of current_value. Null for other types, or for a list with nothing selected.';

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'components' AND column_name = 'selected_value';
