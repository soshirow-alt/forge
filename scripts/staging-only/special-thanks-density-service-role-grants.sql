-- =========================================================
-- STAGING ONLY — minimal service_role GRANTs for density seed
-- Target ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT RUN ON PRODUCTION (bpnisgzxuwdxelhnduuf)
--
-- Scope:
-- - service_role only (no anon / authenticated)
-- - no auth schema GRANTs
-- - no ALL TABLES IN SCHEMA public
-- - density-required public tables only
-- - projects: SELECT only (Smoke A existence check + seed guard)
--
-- Apply only after owner GO. Do not paste to Dashboard before review.
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

GRANT SELECT ON public.projects TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_x_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_watches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_voice_responses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_adoptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_devlogs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_adoption_matcher_runs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_version_prompts TO service_role;

COMMIT;
