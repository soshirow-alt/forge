-- =========================================================
-- STAGING ONLY — minimal service_role GRANTs for hero-carousel seed
-- Target ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT RUN ON PRODUCTION (bpnisgzxuwdxelhnduuf)
--
-- Scope:
-- - service_role only (no anon / authenticated)
-- - no auth schema GRANTs
-- - no ALL TABLES IN SCHEMA public
-- - hero-carousel seed/cleanup public tables only
--
-- Apply only after owner GO via Staging Dashboard SQL Editor.
-- Then: node scripts/staging-only/hero-carousel-seed.mjs --execute
-- =========================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
      AND owner_id = '4bdc4a2f-2a39-4599-a14c-91303310ef56'::uuid
      AND visibility = 'public'
  ) THEN
    RAISE EXCEPTION 'ABORT: expected Staging Smoke A project not found. Do not apply grants.';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_devlogs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_play_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_feedback TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_watches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_bookmarks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_follows TO service_role;

COMMIT;
