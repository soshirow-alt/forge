-- 022: projects — 作品詳細用の紹介文・見どころカード（REL-2-02）
-- Prerequisite: 001 (projects)
--
-- STATUS: SQL draft — Dashboard 適用 GO 2026-06-27（オーナーが Dashboard で実行）
-- Design: docs/rel-2-02-project-overview-design.md
--
-- 役割分担:
--   description              — 一覧・検索・カード用の短い説明（既存・変更なし）
--   overview_introduction    — 作品詳細「作品紹介」用の長めテキスト（任意）
--   overview_features        — 見どころカード最大4件 [{ title, description }]（任意 jsonb 配列）

BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS overview_introduction text,
  ADD COLUMN IF NOT EXISTS overview_features jsonb;

COMMENT ON COLUMN public.projects.overview_introduction IS
  'Player-facing long introduction on game detail. NULL → app may fall back to description.';

COMMENT ON COLUMN public.projects.overview_features IS
  'Up to 4 feature cards: json array of { "title": string, "description": string }. NULL or [] → hide section.';

-- 軽量 CHECK: 配列型・最大4件のみ（要素の形はアプリ層で検証）
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_overview_features_shape;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_overview_features_shape CHECK (
    overview_features IS NULL
    OR (
      jsonb_typeof(overview_features) = 'array'
      AND jsonb_array_length(overview_features) <= 4
    )
  );

COMMIT;

-- Rollback（017+ 依存なし・022 単独可）:
-- BEGIN;
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_overview_features_shape;
-- ALTER TABLE public.projects
--   DROP COLUMN IF EXISTS overview_introduction,
--   DROP COLUMN IF EXISTS overview_features;
-- COMMIT;
