-- 076: Player IA — formal project categories, structured attributes, activity tags
-- Schema migration (Staging first; Production later via owner Dashboard).
-- Prerequisite: 075_project_feedback_owner_reads.sql
--
-- Back-compat: existing projects default/backfill to category = 'game'.
-- No seed data in this file. Staging demo rows live under scripts/staging-only/.

BEGIN;

-- ---------------------------------------------------------------------------
-- A. projects.category + structured attributes
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS category text;

UPDATE public.projects
SET category = 'game'
WHERE category IS NULL OR btrim(category) = '';

ALTER TABLE public.projects
  ALTER COLUMN category SET DEFAULT 'game';

ALTER TABLE public.projects
  ALTER COLUMN category SET NOT NULL;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_category_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_category_check
  CHECK (category IN ('game', 'audio', 'asset', 'dev-tool', 'service-app'));

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS category_attributes jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS quick_try boolean NOT NULL DEFAULT false;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS usable_for_creation boolean NOT NULL DEFAULT false;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS stream_policy text NOT NULL DEFAULT 'unset';

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_stream_policy_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_stream_policy_check
  CHECK (stream_policy IN ('ok', 'conditional', 'no', 'unset'));

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS stream_policy_note text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS asset_kinds text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS purpose_tags text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.projects.category IS
  'Formal top-level catalog category: game | audio | asset | dev-tool | service-app.';
COMMENT ON COLUMN public.projects.quick_try IS
  '試し方: すぐ試せる (structured; not free-text inference).';
COMMENT ON COLUMN public.projects.usable_for_creation IS
  '試し方: 制作に使える (structured).';
COMMENT ON COLUMN public.projects.stream_policy IS
  'Game streaming policy: ok | conditional | no | unset.';
COMMENT ON COLUMN public.projects.asset_kinds IS
  'Asset category structured kinds (2d_illustration, model_3d, …).';
COMMENT ON COLUMN public.projects.purpose_tags IS
  'Public purpose tags for discovery/search.';

CREATE INDEX IF NOT EXISTS projects_category_public_idx
  ON public.projects (category)
  WHERE visibility = 'public';

CREATE INDEX IF NOT EXISTS projects_quick_try_public_idx
  ON public.projects (quick_try)
  WHERE visibility = 'public' AND quick_try = true;

CREATE INDEX IF NOT EXISTS projects_usable_for_creation_public_idx
  ON public.projects (usable_for_creation)
  WHERE visibility = 'public' AND usable_for_creation = true;

CREATE INDEX IF NOT EXISTS projects_stream_policy_public_idx
  ON public.projects (stream_policy)
  WHERE visibility = 'public' AND category = 'game';

CREATE INDEX IF NOT EXISTS projects_asset_kinds_gin_idx
  ON public.projects USING gin (asset_kinds);

CREATE INDEX IF NOT EXISTS projects_purpose_tags_gin_idx
  ON public.projects USING gin (purpose_tags);

-- ---------------------------------------------------------------------------
-- B. developer_profiles.activity_tags
-- ---------------------------------------------------------------------------
ALTER TABLE public.developer_profiles
  ADD COLUMN IF NOT EXISTS activity_tags text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.developer_profiles.activity_tags IS
  'Multi-select public activity tags: player, streamer_creator, game_creator, …';

CREATE INDEX IF NOT EXISTS developer_profiles_activity_tags_gin_idx
  ON public.developer_profiles USING gin (activity_tags);

COMMIT;
