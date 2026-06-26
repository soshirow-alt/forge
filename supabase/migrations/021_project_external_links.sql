-- 021: projects — 作品単位の外部リンク（X / YouTube）（REL-2-01）
-- Prerequisite: 001 (projects)
--
-- STATUS: SQL draft — Dashboard 適用はオーナー別 GO 後のみ
-- Design: docs/rel-2-01-external-links-design.md
--
-- 既存列（変更なし）: steam_url, itch_url, discord_url, official_url, github_url
-- 追加列: x_url, youtube_url

BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS x_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text;

COMMENT ON COLUMN public.projects.x_url IS
  'Project-specific X (Twitter) profile or post URL. Distinct from developer_profiles.x_account.';

COMMENT ON COLUMN public.projects.youtube_url IS
  'Project trailer / channel / video URL (YouTube).';

COMMIT;

-- Rollback（021 単独可）:
-- BEGIN;
-- ALTER TABLE public.projects
--   DROP COLUMN IF EXISTS x_url,
--   DROP COLUMN IF EXISTS youtube_url;
-- COMMIT;
