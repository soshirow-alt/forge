-- 079: Server-side global public search (FTS + trigram)
-- Staging only from Cursor. Production: owner manual later.
-- Prerequisite: 076, 032 (developer discord/youtube), 033 (genres)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.forge_search_normalize(p_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(
    regexp_replace(
      coalesce(public.unaccent(coalesce(p_input, '')), ''),
      '[[:space:][:punct:]]+',
      ' ',
      'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.forge_project_search_document(p public.projects)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT public.forge_search_normalize(
    concat_ws(
      ' ',
      p.title,
      p.description,
      p.creator,
      p.owner_name,
      p.category,
      p.genre,
      array_to_string(coalesce(p.genres, '{}'), ' '),
      array_to_string(coalesce(p.tags, '{}'), ' '),
      array_to_string(coalesce(p.purpose_tags, '{}'), ' '),
      array_to_string(coalesce(p.asset_kinds, '{}'), ' '),
      p.stream_policy,
      coalesce(p.stream_policy_note, ''),
      coalesce(p.category_attributes::text, '')
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.forge_developer_search_document(d public.developer_profiles)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT public.forge_search_normalize(
    concat_ws(
      ' ',
      d.public_name,
      d.profile,
      d.creator_id,
      d.x_account,
      coalesce(d.website, ''),
      array_to_string(coalesce(d.activity_tags, '{}'), ' ')
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.search_public_catalog(
  p_query text,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  result_kind text,
  result_id text,
  title text,
  subtitle text,
  category text,
  thumbnail_url text,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q text := btrim(coalesce(p_query, ''));
  v_norm text;
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 40));
  v_terms text[];
BEGIN
  IF char_length(v_q) < 1 THEN
    RETURN;
  END IF;

  v_norm := public.forge_search_normalize(v_q);
  IF char_length(btrim(v_norm)) < 1 THEN
    RETURN;
  END IF;

  v_terms := array_remove(regexp_split_to_array(v_norm, '\s+'), '');

  RETURN QUERY
  WITH project_hits AS (
    SELECT
      'project'::text AS result_kind,
      p.id::text AS result_id,
      p.title AS title,
      coalesce(nullif(btrim(p.creator), ''), nullif(btrim(p.owner_name), ''), '') AS subtitle,
      coalesce(p.category, 'game') AS category,
      p.thumbnail_url AS thumbnail_url,
      (
        similarity(public.forge_project_search_document(p), v_norm)
        + CASE WHEN public.forge_project_search_document(p) LIKE '%' || v_norm || '%' THEN 0.5 ELSE 0 END
        + CASE
            WHEN v_terms <@ string_to_array(public.forge_project_search_document(p), ' ') THEN 0.35
            ELSE 0
          END
      )::real AS rank
    FROM public.projects p
    WHERE p.visibility = 'public'
      AND (
        public.forge_project_search_document(p) LIKE '%' || v_norm || '%'
        OR public.forge_project_search_document(p) % v_norm
        OR EXISTS (
          SELECT 1
          FROM unnest(v_terms) t(term)
          WHERE char_length(t.term) >= 2
            AND public.forge_project_search_document(p) LIKE '%' || t.term || '%'
        )
      )
  ),
  developer_hits AS (
    SELECT
      'developer'::text AS result_kind,
      d.user_id::text AS result_id,
      d.public_name AS title,
      coalesce(nullif(btrim(d.profile), ''), '') AS subtitle,
      NULL::text AS category,
      d.avatar_url AS thumbnail_url,
      (
        similarity(public.forge_developer_search_document(d), v_norm)
        + CASE WHEN public.forge_developer_search_document(d) LIKE '%' || v_norm || '%' THEN 0.5 ELSE 0 END
      )::real AS rank
    FROM public.developer_profiles d
    WHERE EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.owner_id = d.user_id AND p.visibility = 'public'
      )
      AND (
        public.forge_developer_search_document(d) LIKE '%' || v_norm || '%'
        OR public.forge_developer_search_document(d) % v_norm
        OR EXISTS (
          SELECT 1
          FROM unnest(v_terms) t(term)
          WHERE char_length(t.term) >= 2
            AND public.forge_developer_search_document(d) LIKE '%' || t.term || '%'
        )
      )
  ),
  tag_hits AS (
    SELECT DISTINCT ON (tag_value)
      'tag'::text AS result_kind,
      tag_value AS result_id,
      tag_value AS title,
      'タグ'::text AS subtitle,
      NULL::text AS category,
      NULL::text AS thumbnail_url,
      0.8::real AS rank
    FROM (
      SELECT unnest(coalesce(p.tags, '{}')) AS tag_value
      FROM public.projects p
      WHERE p.visibility = 'public'
      UNION ALL
      SELECT unnest(coalesce(p.purpose_tags, '{}'))
      FROM public.projects p
      WHERE p.visibility = 'public'
      UNION ALL
      SELECT unnest(coalesce(p.genres, '{}'))
      FROM public.projects p
      WHERE p.visibility = 'public'
      UNION ALL
      SELECT unnest(coalesce(d.activity_tags, '{}'))
      FROM public.developer_profiles d
    ) tags
    WHERE public.forge_search_normalize(tag_value) LIKE '%' || v_norm || '%'
       OR EXISTS (
         SELECT 1 FROM unnest(v_terms) t(term)
         WHERE char_length(t.term) >= 2
           AND public.forge_search_normalize(tag_value) LIKE '%' || t.term || '%'
       )
  )
  SELECT * FROM (
    SELECT * FROM project_hits
    UNION ALL
    SELECT * FROM developer_hits
    UNION ALL
    SELECT * FROM tag_hits
  ) hits
  WHERE hits.rank > 0.05
  ORDER BY hits.rank DESC, hits.title ASC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.search_public_catalog(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_catalog(text, integer)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_public_catalog_suggest(
  p_query text,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  result_kind text,
  result_id text,
  title text,
  subtitle text,
  category text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.result_kind, s.result_id, s.title, s.subtitle, s.category
  FROM public.search_public_catalog(p_query, least(coalesce(p_limit, 8), 12)) s;
$$;

REVOKE ALL ON FUNCTION public.search_public_catalog_suggest(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_catalog_suggest(text, integer)
  TO anon, authenticated, service_role;

COMMIT;
