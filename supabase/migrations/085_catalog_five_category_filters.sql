-- 085: Five-category Search formal filters for get_public_projects_by_category
-- Schema / RPC only. STAGING FIRST via Owner Dashboard (vuqpwvjvgyxffmvpfrxo);
-- Production (bpnisgzxuwdxelhnduuf) later, also Owner-applied. Cursor/Codex do
-- NOT apply this file to any database.
--
-- No data backfill. No destructive drop of legacy category_attributes shapes
-- or legacy singular `kind` values — read-compat preserved in the new RPC.
-- Also preserves label-level legacy compat (no backfill): service-app
-- スマートフォンアプリ ↔ スマホアプリ (kinds axis), dev-tool
-- Visual Studio Code ↔ VS Code (environments axis) — canonical filter value
-- hits legacy-labeled rows. Mirrors lib/project-formal-filter-registry.ts
-- LEGACY_VALUE_ALIASES (Studio hydration applies the same aliases on read).
--
-- Prerequisite: 076_player_ia_categories_attributes.sql (category, category_attributes,
-- asset_kinds), 084_catalog_search_query_genres_tags.sql (p_query/p_genres/p_tags RPC).
--
-- Adds:
--   projects.player_counts text[] NOT NULL DEFAULT '{}' (game プレイ人数; dedicated
--     column — not reusing generic tags, matching player_count registry storageNotes)
--   GIN index projects_player_counts_gin_idx
--   GIN index projects_category_attributes_gin_idx (not present in 076/079 — added here)
--   Helper forge_parse_music_duration_seconds(text) — parses Studio `M:SS` / `H:MM:SS`
--     musicDuration into seconds for audio duration-bucket filtering.
--
-- New optional RPC args (all default NULL; appended AFTER 084's p_tags so the
-- 12-arg 084 signature is fully superseded — matches lib/supabase/public-catalog-db.ts
-- CATALOG_ATTR_PARAM_TO_RPC_ARG naming exactly):
--   p_play_times, p_play_envs, p_player_counts,
--   p_attr_kinds, p_attr_music_genres, p_attr_moods, p_attr_purposes,
--   p_duration_buckets, p_attr_formats, p_attr_tastes, p_attr_tools,
--   p_attr_environments, p_attr_features, p_asset_kinds
--
-- Filter semantics: same axis = OR (array overlap / ANY); different axes = AND.
-- All 084 filters (query/genres/tags/quick_try/feedback_wanted/usable_for_creation/
-- stream_policy/asset_kind) are preserved unchanged.
--
-- RETURNS TABLE is kept IDENTICAL to 084 for client compat — new args are
-- WHERE-only filters, not additional output columns.
--
-- 42P13 / signature: argument list changes → DROP exact prior (084) signature,
-- then CREATE. Grants restored for anon, authenticated, service_role.
--
-- D. Player Home category-scoped FB gathering / meaningful updates (added for
-- Codex round-2 finding 4 — /home/game must rank candidates within category=game
-- in the DB, not client-filter the whole-platform top-24 after the fact):
--   get_home_feedback_gathering_projects(p_limit integer DEFAULT 16, p_category
--     text DEFAULT NULL) — 083 signature was (integer) only; DROP exact prior
--     signature then CREATE with the new optional 2nd arg (matches
--     get_home_newest_projects style from 083).
--   get_home_meaningful_updates(p_limit integer DEFAULT 16, p_category text
--     DEFAULT NULL) — same treatment.
-- Category filter (coalesce(category,'game') = p_category, only when p_category
-- is set) is applied inside the ranking CTE, before ORDER BY / LIMIT, so a
-- category shelf ranks and limits within that category only instead of
-- filtering an already-limited whole-platform result. RETURNS TABLE unchanged
-- from 083 for both functions. Grants restored for anon, authenticated, service_role.

BEGIN;

-- ---------------------------------------------------------------------------
-- A. projects.player_counts + indexes
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS player_counts text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.projects.player_counts IS
  'Game プレイ人数 (multi-select: 1人 / 2人 / 3〜4人 / 5人以上). Dedicated column — not stored in projects.tags.';

CREATE INDEX IF NOT EXISTS projects_player_counts_gin_idx
  ON public.projects
  USING gin (player_counts);

CREATE INDEX IF NOT EXISTS projects_category_attributes_gin_idx
  ON public.projects
  USING gin (category_attributes);

-- ---------------------------------------------------------------------------
-- B. Helper: parse Studio musicDuration ("M:SS" / "H:MM:SS") into seconds
-- ---------------------------------------------------------------------------
-- Each part is validated as 1-15 digits BEFORE any numeric cast (no raw ::int
-- cast of an unbounded digit string — that throws "value out of range" and
-- fails the whole calling RPC instead of returning NULL). 15 digits safely
-- fits numeric with no precision loss; multiplication is done in numeric
-- (arbitrary precision, cannot overflow) and only cast to integer after an
-- explicit int4-range bounds check, so huge minutes/hours or an overflowing
-- product both resolve to NULL instead of raising.
CREATE OR REPLACE FUNCTION public.forge_parse_music_duration_seconds(p_value text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  WITH parts AS (
    SELECT regexp_split_to_array(btrim(p_value), ':') AS p
  ),
  safe_parts AS (
    SELECT p
    FROM parts
    WHERE array_length(p, 1) IN (2, 3)
      AND NOT EXISTS (SELECT 1 FROM unnest(p) x WHERE x !~ '^[0-9]{1,15}$')
  ),
  totals AS (
    SELECT
      p,
      CASE
        WHEN array_length(p, 1) = 2 THEN p[1]::numeric * 60 + p[2]::numeric
        ELSE p[1]::numeric * 3600 + p[2]::numeric * 60 + p[3]::numeric
      END AS total_seconds
    FROM safe_parts
  )
  SELECT
    CASE
      WHEN array_length(t.p, 1) = 2 AND t.p[2]::numeric > 59 THEN NULL
      WHEN array_length(t.p, 1) = 3 AND (t.p[2]::numeric > 59 OR t.p[3]::numeric > 59) THEN NULL
      WHEN t.total_seconds > 2147483647 THEN NULL
      ELSE t.total_seconds::integer
    END
  FROM totals t;
$$;

COMMENT ON FUNCTION public.forge_parse_music_duration_seconds(text) IS
  'Parses Studio category_attributes.musicDuration ("M:SS" or "H:MM:SS") into total seconds. NULL on empty/invalid input. Mirrors lib/studio-non-game-attributes.ts parseMusicDurationToSeconds.';

REVOKE ALL ON FUNCTION public.forge_parse_music_duration_seconds(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forge_parse_music_duration_seconds(text)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- C. get_public_projects_by_category — five-category formal filters
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_public_projects_by_category(
  text, text, boolean, boolean, boolean, text, text, integer, integer, text, text[], text[]
);

CREATE OR REPLACE FUNCTION public.get_public_projects_by_category(
  p_category text DEFAULT NULL,
  p_sort text DEFAULT 'newest',
  p_quick_try boolean DEFAULT NULL,
  p_feedback_wanted boolean DEFAULT NULL,
  p_usable_for_creation boolean DEFAULT NULL,
  p_stream_policy text DEFAULT NULL,
  p_asset_kind text DEFAULT NULL,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0,
  p_query text DEFAULT NULL,
  p_genres text[] DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_play_times text[] DEFAULT NULL,
  p_play_envs text[] DEFAULT NULL,
  p_player_counts text[] DEFAULT NULL,
  p_attr_kinds text[] DEFAULT NULL,
  p_attr_music_genres text[] DEFAULT NULL,
  p_attr_moods text[] DEFAULT NULL,
  p_attr_purposes text[] DEFAULT NULL,
  p_duration_buckets text[] DEFAULT NULL,
  p_attr_formats text[] DEFAULT NULL,
  p_attr_tastes text[] DEFAULT NULL,
  p_attr_tools text[] DEFAULT NULL,
  p_attr_environments text[] DEFAULT NULL,
  p_attr_features text[] DEFAULT NULL,
  p_asset_kinds text[] DEFAULT NULL
)
RETURNS TABLE (
  project_id uuid,
  title text,
  description text,
  category text,
  thumbnail_url text,
  creator text,
  genres text[],
  tags text[],
  purpose_tags text[],
  asset_kinds text[],
  stream_policy text,
  quick_try boolean,
  usable_for_creation boolean,
  looking_for_testers boolean,
  first_published_at timestamptz,
  meaningful_update_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH q AS (
    SELECT
      nullif(btrim(coalesce(p_query, '')), '') AS raw,
      CASE
        WHEN nullif(btrim(coalesce(p_query, '')), '') IS NULL THEN NULL
        ELSE
          '%' || replace(
            replace(
              replace(left(btrim(p_query), 80), '\', '\\'),
              '%',
              '\%'
            ),
            '_',
            '\_'
          ) || '%'
      END AS pattern
  )
  SELECT
    p.id AS project_id,
    p.title,
    p.description,
    coalesce(p.category, 'game') AS category,
    p.thumbnail_url,
    coalesce(nullif(btrim(p.creator), ''), p.owner_name) AS creator,
    coalesce(p.genres, ARRAY[p.genre]::text[]) AS genres,
    coalesce(p.tags, '{}') AS tags,
    coalesce(p.purpose_tags, '{}') AS purpose_tags,
    coalesce(p.asset_kinds, '{}') AS asset_kinds,
    coalesce(p.stream_policy, 'unset') AS stream_policy,
    coalesce(p.quick_try, false) AS quick_try,
    coalesce(p.usable_for_creation, false) AS usable_for_creation,
    coalesce(p.looking_for_testers, false) AS looking_for_testers,
    coalesce(p.first_published_at, p.created_at) AS first_published_at,
    (
      SELECT max(x.at)
      FROM (
        SELECT e.created_at AS at
        FROM public.project_release_events e
        WHERE e.project_id = p.id
          AND e.event_type = 'released'
          AND e.source IS DISTINCT FROM 'onboarding'
        UNION ALL
        SELECT coalesce(d.published_at, d.created_at)
        FROM public.project_devlogs d
        WHERE d.project_id = p.id::text
          AND coalesce(d.is_initial_publish, false) = false
      ) x
    ) AS meaningful_update_at
  FROM public.projects p
  CROSS JOIN q
  CROSS JOIN LATERAL (
    SELECT
      ARRAY(
        SELECT jsonb_array_elements_text(coalesce(p.category_attributes->'kinds', '[]'::jsonb))
      ) AS kinds_arr,
      p.category_attributes->>'kind' AS legacy_kind,
      ARRAY(
        SELECT jsonb_array_elements_text(coalesce(p.category_attributes->'musicGenres', '[]'::jsonb))
      ) AS music_genres_arr,
      ARRAY(
        SELECT jsonb_array_elements_text(coalesce(p.category_attributes->'moods', '[]'::jsonb))
      ) AS moods_arr,
      ARRAY(
        SELECT jsonb_array_elements_text(coalesce(p.category_attributes->'purposes', '[]'::jsonb))
      ) AS purposes_arr,
      ARRAY(
        SELECT jsonb_array_elements_text(coalesce(p.category_attributes->'formats', '[]'::jsonb))
      ) AS formats_arr,
      ARRAY(
        SELECT jsonb_array_elements_text(coalesce(p.category_attributes->'tastes', '[]'::jsonb))
      ) AS tastes_arr,
      ARRAY(
        SELECT jsonb_array_elements_text(coalesce(p.category_attributes->'tools', '[]'::jsonb))
      ) AS tools_arr,
      ARRAY(
        SELECT jsonb_array_elements_text(coalesce(p.category_attributes->'toolEnvironments', '[]'::jsonb))
      ) AS tool_environments_arr,
      ARRAY(
        SELECT jsonb_array_elements_text(coalesce(p.category_attributes->'serviceEnvironments', '[]'::jsonb))
      ) AS service_environments_arr,
      ARRAY(
        SELECT jsonb_array_elements_text(coalesce(p.category_attributes->'features', '[]'::jsonb))
      ) AS features_arr,
      public.forge_parse_music_duration_seconds(p.category_attributes->>'musicDuration') AS duration_seconds
  ) attrs
  WHERE p.visibility = 'public'
    AND (
      p_category IS NULL OR p_category = '' OR p_category = 'all'
      OR coalesce(p.category, 'game') = p_category
    )
    AND (p_quick_try IS NULL OR p.quick_try = p_quick_try)
    AND (p_feedback_wanted IS NULL OR p.looking_for_testers = p_feedback_wanted)
    AND (p_usable_for_creation IS NULL OR p.usable_for_creation = p_usable_for_creation)
    AND (
      p_stream_policy IS NULL OR p_stream_policy = ''
      OR p.stream_policy = p_stream_policy
    )
    -- asset kind axis: legacy singular p_asset_kind OR multi p_asset_kinds (same axis → OR)
    AND (
      (
        (p_asset_kind IS NULL OR p_asset_kind = '')
        AND (p_asset_kinds IS NULL OR cardinality(p_asset_kinds) = 0)
      )
      OR p_asset_kind = ANY (coalesce(p.asset_kinds, '{}'))
      OR p.asset_kinds && coalesce(p_asset_kinds, '{}')
    )
    AND (
      p_genres IS NULL
      OR cardinality(p_genres) = 0
      OR p.genres && p_genres
    )
    AND (
      p_tags IS NULL
      OR cardinality(p_tags) = 0
      OR p.tags && p_tags
    )
    -- game: 想定プレイ時間 (single-value column; multi-select filter = OR via ANY)
    AND (
      p_play_times IS NULL OR cardinality(p_play_times) = 0
      OR p.estimated_play_time = ANY (p_play_times)
    )
    -- game: 対応環境 — stored as projects.tags (PC対応 / スマホ対応 / ブラウザ対応)
    AND (
      p_play_envs IS NULL OR cardinality(p_play_envs) = 0
      OR p.tags && p_play_envs
    )
    -- game: プレイ人数 (dedicated column)
    AND (
      p_player_counts IS NULL OR cardinality(p_player_counts) = 0
      OR p.player_counts && p_player_counts
    )
    -- audio/dev-tool/service-app: 種類 (category_attributes.kinds[]; legacy singular kind fallback;
    -- legacy combined 効果音・ジングル also matches split filter values;
    -- legacy service-app label スマートフォンアプリ also matches canonical スマホアプリ filter)
    AND (
      p_attr_kinds IS NULL OR cardinality(p_attr_kinds) = 0
      OR attrs.kinds_arr && p_attr_kinds
      OR attrs.legacy_kind = ANY (p_attr_kinds)
      OR (
        attrs.legacy_kind = '効果音・ジングル'
        AND (
          '効果音・SE' = ANY (p_attr_kinds)
          OR 'ジングル' = ANY (p_attr_kinds)
          OR '効果音・ジングル' = ANY (p_attr_kinds)
        )
      )
      OR (
        (
          'スマートフォンアプリ' = ANY (attrs.kinds_arr)
          OR attrs.legacy_kind = 'スマートフォンアプリ'
        )
        AND 'スマホアプリ' = ANY (p_attr_kinds)
      )
    )
    -- audio: 音楽ジャンル
    AND (
      p_attr_music_genres IS NULL OR cardinality(p_attr_music_genres) = 0
      OR attrs.music_genres_arr && p_attr_music_genres
    )
    -- audio: 雰囲気
    AND (
      p_attr_moods IS NULL OR cardinality(p_attr_moods) = 0
      OR attrs.moods_arr && p_attr_moods
    )
    -- audio + service-app: 用途 (category_attributes.purposes[])
    AND (
      p_attr_purposes IS NULL OR cardinality(p_attr_purposes) = 0
      OR attrs.purposes_arr && p_attr_purposes
    )
    -- audio: 再生時間バケット (derived from musicDuration; missing/invalid never matches)
    AND (
      p_duration_buckets IS NULL OR cardinality(p_duration_buckets) = 0
      OR (
        attrs.duration_seconds IS NOT NULL
        AND (
          (attrs.duration_seconds < 10 AND '10秒未満' = ANY (p_duration_buckets))
          OR (attrs.duration_seconds >= 10 AND attrs.duration_seconds < 30 AND '10〜30秒' = ANY (p_duration_buckets))
          OR (attrs.duration_seconds >= 30 AND attrs.duration_seconds < 60 AND '30秒〜1分' = ANY (p_duration_buckets))
          OR (attrs.duration_seconds >= 60 AND attrs.duration_seconds < 180 AND '1〜3分' = ANY (p_duration_buckets))
          OR (attrs.duration_seconds >= 180 AND '3分以上' = ANY (p_duration_buckets))
        )
      )
    )
    -- asset: 表現形式
    AND (
      p_attr_formats IS NULL OR cardinality(p_attr_formats) = 0
      OR attrs.formats_arr && p_attr_formats
    )
    -- asset: テイスト
    AND (
      p_attr_tastes IS NULL OR cardinality(p_attr_tastes) = 0
      OR attrs.tastes_arr && p_attr_tastes
    )
    -- asset + dev-tool: 対応ツール
    AND (
      p_attr_tools IS NULL OR cardinality(p_attr_tools) = 0
      OR attrs.tools_arr && p_attr_tools
    )
    -- dev-tool: 対応環境・ツール (toolEnvironments) + service-app: 対応環境 (serviceEnvironments);
    -- legacy service-app Webブラウザ also matches canonical Web filter value;
    -- legacy dev-tool Visual Studio Code also matches canonical VS Code filter value
    AND (
      p_attr_environments IS NULL OR cardinality(p_attr_environments) = 0
      OR attrs.tool_environments_arr && p_attr_environments
      OR attrs.service_environments_arr && p_attr_environments
      OR (
        (
          'Webブラウザ' = ANY (attrs.tool_environments_arr)
          OR 'Webブラウザ' = ANY (attrs.service_environments_arr)
        )
        AND (
          'Web' = ANY (p_attr_environments)
          OR 'Webブラウザ' = ANY (p_attr_environments)
        )
      )
      OR (
        'Visual Studio Code' = ANY (attrs.tool_environments_arr)
        AND 'VS Code' = ANY (p_attr_environments)
      )
    )
    -- dev-tool + service-app: 特徴 (category_attributes.features[]; never in projects.tags)
    AND (
      p_attr_features IS NULL OR cardinality(p_attr_features) = 0
      OR attrs.features_arr && p_attr_features
    )
    AND (
      q.pattern IS NULL
      OR p.title ILIKE q.pattern ESCAPE '\'
      OR coalesce(p.description, '') ILIKE q.pattern ESCAPE '\'
      OR coalesce(nullif(btrim(p.creator), ''), p.owner_name, '') ILIKE q.pattern ESCAPE '\'
      OR EXISTS (
        SELECT 1
        FROM unnest(coalesce(p.genres, ARRAY[p.genre]::text[])) AS g(val)
        WHERE g.val ILIKE q.pattern ESCAPE '\'
      )
      OR EXISTS (
        SELECT 1
        FROM unnest(coalesce(p.tags, '{}')) AS t(val)
        WHERE t.val ILIKE q.pattern ESCAPE '\'
      )
    )
  ORDER BY
    CASE
      WHEN p_sort = 'updated' THEN (
        SELECT max(x.at)
        FROM (
          SELECT e.created_at AS at
          FROM public.project_release_events e
          WHERE e.project_id = p.id
            AND e.event_type = 'released'
            AND e.source IS DISTINCT FROM 'onboarding'
          UNION ALL
          SELECT coalesce(d.published_at, d.created_at)
          FROM public.project_devlogs d
          WHERE d.project_id = p.id::text
            AND coalesce(d.is_initial_publish, false) = false
        ) x
      )
      ELSE NULL
    END DESC NULLS LAST,
    coalesce(p.first_published_at, p.created_at) DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 24), 60))
  OFFSET greatest(0, coalesce(p_offset, 0));
$$;

-- Signature (26 args): matches CREATE FUNCTION parameter list above exactly —
-- p_category, p_sort, p_quick_try, p_feedback_wanted, p_usable_for_creation,
-- p_stream_policy, p_asset_kind, p_limit, p_offset, p_query, p_genres, p_tags,
-- p_play_times, p_play_envs, p_player_counts, p_attr_kinds, p_attr_music_genres,
-- p_attr_moods, p_attr_purposes, p_duration_buckets, p_attr_formats, p_attr_tastes,
-- p_attr_tools, p_attr_environments, p_attr_features, p_asset_kinds
REVOKE ALL ON FUNCTION public.get_public_projects_by_category(
  text, text, boolean, boolean, boolean, text, text, integer, integer, text, text[], text[],
  text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], text[]
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_projects_by_category(
  text, text, boolean, boolean, boolean, text, text, integer, integer, text, text[], text[],
  text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], text[]
) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- D. Home shelves — category-scoped FB gathering / meaningful updates
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_home_feedback_gathering_projects(integer);

CREATE OR REPLACE FUNCTION public.get_home_feedback_gathering_projects(
  p_limit integer DEFAULT 16,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  project_id uuid,
  title text,
  category text,
  description text,
  thumbnail_url text,
  window_days integer,
  distinct_author_count bigint,
  feedback_count bigint,
  has_creator_reply boolean,
  last_feedback_at timestamptz,
  empathy_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := greatest(1, least(coalesce(p_limit, 16), 40));
  v_category text := nullif(btrim(coalesce(p_category, '')), '');
  v_window_days integer := 30;
  v_qualifying integer := 0;
BEGIN
  -- Count qualifying projects in 30d (within category scope, if any);
  -- fall back to 90d when fewer than 4.
  WITH fb_events AS (
    SELECT
      p.id AS project_id,
      ('r:' || r.user_id::text) AS author_key,
      r.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'registered_voice' AND e.target_id = r.id
      ) AS empathy_count
    FROM public.project_voice_responses r
    INNER JOIN public.projects p ON p.id::text = r.project_id
    WHERE p.visibility = 'public'
      AND r.moderation_status = 'visible'
      AND r.created_at >= now() - interval '30 days'
      AND (v_category IS NULL OR coalesce(p.category, 'game') = v_category)
    UNION ALL
    SELECT
      p.id,
      ('g:' || g.submitter_key::text),
      g.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'guest_voice' AND e.target_id = g.id
      )
    FROM public.project_guest_voice_responses g
    INNER JOIN public.projects p ON p.id::text = g.project_id
    WHERE p.visibility = 'public'
      AND g.include_in_public_aggregate = true
      AND g.moderation_status = 'visible'
      AND g.created_at >= now() - interval '30 days'
      AND (v_category IS NULL OR coalesce(p.category, 'game') = v_category)
    UNION ALL
    SELECT
      p.id,
      ('r:' || f.user_id::text),
      f.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'registered_detailed' AND e.target_id = f.id
      )
    FROM public.project_feedback f
    INNER JOIN public.projects p ON p.id::text = f.project_id
    WHERE p.visibility = 'public'
      AND f.moderation_status = 'visible'
      AND f.created_at >= now() - interval '30 days'
      AND (v_category IS NULL OR coalesce(p.category, 'game') = v_category)
    UNION ALL
    SELECT
      p.id,
      ('g:' || gf.submitter_key::text),
      gf.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'guest_detailed' AND e.target_id = gf.id
      )
    FROM public.project_guest_feedback gf
    INNER JOIN public.projects p ON p.id::text = gf.project_id
    WHERE p.visibility = 'public'
      AND gf.include_in_public_aggregate = true
      AND gf.moderation_status = 'visible'
      AND gf.created_at >= now() - interval '30 days'
      AND (v_category IS NULL OR coalesce(p.category, 'game') = v_category)
  ),
  agg AS (
    SELECT
      e.project_id,
      count(DISTINCT e.author_key)::bigint AS distinct_author_count,
      count(*)::bigint AS feedback_count
    FROM fb_events e
    GROUP BY e.project_id
  )
  SELECT count(*)::integer INTO v_qualifying
  FROM agg a
  WHERE a.distinct_author_count >= 2 OR a.feedback_count >= 3;

  IF v_qualifying < 4 THEN
    v_window_days := 90;
  END IF;

  RETURN QUERY
  WITH fb_events AS (
    SELECT
      p.id AS project_id,
      ('r:' || r.user_id::text) AS author_key,
      r.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'registered_voice' AND e.target_id = r.id
      ) AS empathy_count
    FROM public.project_voice_responses r
    INNER JOIN public.projects p ON p.id::text = r.project_id
    WHERE p.visibility = 'public'
      AND r.moderation_status = 'visible'
      AND r.created_at >= now() - make_interval(days => v_window_days)
      AND (v_category IS NULL OR coalesce(p.category, 'game') = v_category)
    UNION ALL
    SELECT
      p.id,
      ('g:' || g.submitter_key::text),
      g.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'guest_voice' AND e.target_id = g.id
      )
    FROM public.project_guest_voice_responses g
    INNER JOIN public.projects p ON p.id::text = g.project_id
    WHERE p.visibility = 'public'
      AND g.include_in_public_aggregate = true
      AND g.moderation_status = 'visible'
      AND g.created_at >= now() - make_interval(days => v_window_days)
      AND (v_category IS NULL OR coalesce(p.category, 'game') = v_category)
    UNION ALL
    SELECT
      p.id,
      ('r:' || f.user_id::text),
      f.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'registered_detailed' AND e.target_id = f.id
      )
    FROM public.project_feedback f
    INNER JOIN public.projects p ON p.id::text = f.project_id
    WHERE p.visibility = 'public'
      AND f.moderation_status = 'visible'
      AND f.created_at >= now() - make_interval(days => v_window_days)
      AND (v_category IS NULL OR coalesce(p.category, 'game') = v_category)
    UNION ALL
    SELECT
      p.id,
      ('g:' || gf.submitter_key::text),
      gf.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'guest_detailed' AND e.target_id = gf.id
      )
    FROM public.project_guest_feedback gf
    INNER JOIN public.projects p ON p.id::text = gf.project_id
    WHERE p.visibility = 'public'
      AND gf.include_in_public_aggregate = true
      AND gf.moderation_status = 'visible'
      AND gf.created_at >= now() - make_interval(days => v_window_days)
      AND (v_category IS NULL OR coalesce(p.category, 'game') = v_category)
  ),
  agg AS (
    SELECT
      e.project_id,
      count(DISTINCT e.author_key)::bigint AS distinct_author_count,
      count(*)::bigint AS feedback_count,
      max(e.created_at) AS last_feedback_at,
      coalesce(sum(e.empathy_count), 0)::bigint AS empathy_count
    FROM fb_events e
    GROUP BY e.project_id
  ),
  ranked AS (
    SELECT
      p.id AS project_id,
      p.title,
      coalesce(p.category, 'game') AS category,
      coalesce(p.description, '') AS description,
      p.thumbnail_url,
      v_window_days AS window_days,
      a.distinct_author_count,
      a.feedback_count,
      EXISTS (
        SELECT 1
        FROM public.feedback_card_replies rep
        WHERE rep.project_id = p.id::text
          AND rep.author_id = p.owner_id
      ) AS has_creator_reply,
      a.last_feedback_at,
      a.empathy_count
    FROM agg a
    INNER JOIN public.projects p ON p.id = a.project_id
    WHERE p.visibility = 'public'
      AND (a.distinct_author_count >= 2 OR a.feedback_count >= 3)
      AND (v_category IS NULL OR coalesce(p.category, 'game') = v_category)
  )
  SELECT
    r.project_id,
    r.title,
    r.category,
    r.description,
    r.thumbnail_url,
    r.window_days,
    r.distinct_author_count,
    r.feedback_count,
    r.has_creator_reply,
    r.last_feedback_at,
    r.empathy_count
  FROM ranked r
  ORDER BY
    r.distinct_author_count DESC,
    r.feedback_count DESC,
    r.has_creator_reply DESC,
    r.last_feedback_at DESC,
    r.empathy_count DESC,
    r.project_id ASC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_home_feedback_gathering_projects(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_feedback_gathering_projects(integer, text)
  TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.get_home_meaningful_updates(integer);

CREATE OR REPLACE FUNCTION public.get_home_meaningful_updates(
  p_limit integer DEFAULT 16,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  project_id uuid,
  title text,
  category text,
  thumbnail_url text,
  update_kind text,
  update_label text,
  update_summary text,
  published_version text,
  meaningful_update_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH events AS (
    SELECT
      p.id AS project_id,
      p.title,
      coalesce(p.category, 'game') AS category,
      p.thumbnail_url,
      'release'::text AS update_kind,
      'リリース'::text AS update_label,
      coalesce(
        nullif(btrim(e.note), ''),
        '正式版を公開しました'
      ) AS update_summary,
      nullif(btrim(p.playable_version), '') AS published_version,
      e.created_at AS meaningful_update_at
    FROM public.project_release_events e
    INNER JOIN public.projects p ON p.id = e.project_id
    WHERE p.visibility = 'public'
      AND e.event_type = 'released'
      AND e.source IS DISTINCT FROM 'onboarding'
    UNION ALL
    SELECT
      p.id,
      p.title,
      coalesce(p.category, 'game'),
      p.thumbnail_url,
      'devlog'::text,
      '開発ログ'::text,
      coalesce(
        nullif(btrim(d.title), ''),
        left(nullif(btrim(d.content), ''), 120),
        '開発ログを更新しました'
      ),
      nullif(btrim(d.published_version), ''),
      coalesce(d.published_at, d.created_at)
    FROM public.project_devlogs d
    INNER JOIN public.projects p ON p.id::text = d.project_id
    WHERE p.visibility = 'public'
      AND coalesce(d.is_initial_publish, false) = false
      AND coalesce(d.published_at, d.created_at) IS NOT NULL
  ),
  best AS (
    SELECT DISTINCT ON (project_id)
      project_id,
      title,
      category,
      thumbnail_url,
      update_kind,
      update_label,
      update_summary,
      published_version,
      meaningful_update_at
    FROM events
    ORDER BY project_id, meaningful_update_at DESC
  )
  SELECT
    b.project_id,
    b.title,
    b.category,
    b.thumbnail_url,
    b.update_kind,
    b.update_label,
    b.update_summary,
    b.published_version,
    b.meaningful_update_at
  FROM best b
  WHERE (
    nullif(btrim(coalesce(p_category, '')), '') IS NULL
    OR b.category = nullif(btrim(coalesce(p_category, '')), '')
  )
  ORDER BY b.meaningful_update_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 16), 40));
$$;

REVOKE ALL ON FUNCTION public.get_home_meaningful_updates(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_meaningful_updates(integer, text)
  TO anon, authenticated, service_role;

COMMIT;
