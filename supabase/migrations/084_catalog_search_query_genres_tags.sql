-- 084: Extend get_public_projects_by_category with keyword / genres / tags filters
-- Schema / RPC only. Staging first via Owner Dashboard; Production later.
-- Prerequisite: 080_player_ia_home_feed.sql (base RPC), 033 genres GIN, 076 category attrs
--
-- Adds named args (defaults NULL):
--   p_query  text   — ILIKE on title/description/creator/genres/tags (escaped)
--   p_genres text[] — OR overlap with project genres (&&)
--   p_tags   text[] — OR overlap with project tags (&&) — UI passes feature tags only
--
-- Also: GIN index on projects.tags for public catalog tag filters.
--
-- 42P13 / signature: argument list changes → DROP exact prior signature, then CREATE.
-- Grants restored for anon, authenticated, service_role.

BEGIN;

CREATE INDEX IF NOT EXISTS projects_tags_gin_idx
  ON public.projects
  USING gin (tags);

DROP FUNCTION IF EXISTS public.get_public_projects_by_category(
  text, text, boolean, boolean, boolean, text, text, integer, integer
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
  p_tags text[] DEFAULT NULL
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
    AND (
      p_asset_kind IS NULL OR p_asset_kind = ''
      OR p_asset_kind = ANY (coalesce(p.asset_kinds, '{}'))
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

REVOKE ALL ON FUNCTION public.get_public_projects_by_category(
  text, text, boolean, boolean, boolean, text, text, integer, integer, text, text[], text[]
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_projects_by_category(
  text, text, boolean, boolean, boolean, text, text, integer, integer, text, text[], text[]
) TO anon, authenticated, service_role;

COMMIT;
