-- STAGING ONLY — raise search_public_catalog min rank (0.05 → 0.2)
-- Target: vuqpwvjvgyxffmvpfrxo only. Safe to re-run.
-- Preview also filters rank < 0.2 in app code until this is applied.
-- Confirm after: SELECT count(*) FROM public.search_public_catalog('zzz-ia-seed-nohit-999', 10);
-- Expect: 0

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
      WHERE EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.owner_id = d.user_id AND p.visibility = 'public'
      )
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
  WHERE hits.rank > 0.2
  ORDER BY hits.rank DESC, hits.title ASC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.search_public_catalog(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_catalog(text, integer)
  TO anon, authenticated, service_role;
