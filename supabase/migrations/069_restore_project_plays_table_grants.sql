-- 069: Restore table privileges on project_plays / project_supports
-- Staging discovery: service_role and authenticated get
--   "permission denied for table project_plays" (and supports)
-- while project_watches / project_play_sessions still work.
-- SECURITY DEFINER RPCs (e.g. get_public_project_stats) still read plays,
-- but client upsert via recordProjectPlay cannot write → play_player_count stays 0.
-- Idempotent GRANTs. No RLS policy changes. Staging first; Production owner-manual.

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_plays TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_plays TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_supports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_supports TO service_role;

-- Match sibling engagement tables: PostgREST may expose anon with RLS still enforced.
GRANT SELECT ON TABLE public.project_plays TO anon;
GRANT SELECT ON TABLE public.project_supports TO anon;

COMMIT;
