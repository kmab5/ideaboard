-- ============================================================================
-- Migration 001 — Security hardening (v0.6.0)
-- ============================================================================
-- Apply in the Supabase dashboard: SQL Editor → New query → Run.
-- Safe to re-run: every statement is idempotent.
--
-- WHAT THIS FIXES
--   1. note-attachments storage policies allowed ANY authenticated user to
--      upload to any path and to DELETE ANY other user's attachments.
--      (Findings IDB-001 / IDB-002 in SECURITY.md.)
--   2. Storage buckets had no server-side size or MIME limits, so the
--      client-side upload validation could be bypassed entirely. (IDB-003.)
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Owner-scoped policies for the note-attachments bucket
-- ----------------------------------------------------------------------------
-- Objects are stored as `<user_id>/<board_id>/<note_id>/<timestamp>.<ext>`,
-- so the first folder segment identifies the owner.

DROP POLICY IF EXISTS "Users can upload note attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own note attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own note attachments" ON storage.objects;
DROP POLICY IF EXISTS "Note attachments are publicly accessible" ON storage.objects;

CREATE POLICY "Users can upload note attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'note-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Note attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-attachments');

CREATE POLICY "Users can update their own note attachments"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'note-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own note attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'note-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
);


-- ----------------------------------------------------------------------------
-- 2. Server-side upload limits (mirror of the client-side validation)
-- ----------------------------------------------------------------------------
-- SVG is deliberately excluded: it can carry script and these buckets are
-- publicly readable.

UPDATE storage.buckets
SET file_size_limit = 5242880,  -- 5 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'note-attachments';

UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id IN ('thumbnails', 'attachments');


-- ----------------------------------------------------------------------------
-- 3. Verification
-- ----------------------------------------------------------------------------
-- Expect 4 note-attachments policies, three of which check foldername:
--   SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname = 'storage' AND policyname ILIKE '%note attachment%';
--
-- Expect non-null limits on every bucket:
--   SELECT id, file_size_limit, allowed_mime_types FROM storage.buckets;
