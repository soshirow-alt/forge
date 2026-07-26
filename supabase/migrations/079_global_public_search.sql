-- 079: Server-side global public search (trigram + normalized substring)
-- Schema migration (Staging first; Production later via owner Dashboard).
-- Prerequisite: 076, 032 (developer discord/youtube), 033 (genres)
-- Scope: public projects + developers who own ≥1 public project + public tags only.
-- Must not search email, private projects, Studio drafts, notifications, or chats.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Normalize for case / punctuation / whitespace. Japanese partial match uses
-- substring + trigram; accent folding is not required for Forge catalog text.
CREATE OR REPLACE FUNCTION public.forge_search_normalize(p_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(
    regexp_replace(
      coalesce(p_input, ''),
      '[[:space:][:punct:]]+',
      ' ',
      'g'
    )
  );
$$;

-- Tokenize for short-ASCII exact matching: split ASCII alnum runs from
-- CJK/other runs so "SEキット" → {se, キット}, "2Dイラスト" → {2d, イラスト}.
CREATE OR REPLACE FUNCTION public.forge_search_tokens(p_input text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(array_agg(tok), '{}'::text[])
  FROM (
    SELECT lower(m[1]) AS tok
    FROM regexp_matches(
      coalesce(p_input, ''),
      '([a-zA-Z0-9]+|[^\s[:punct:]a-zA-Z0-9]+)',
      'g'
    ) AS m
  ) s
  WHERE length(tok) > 0;
$$;

-- True when the (already normalized) query is a single ASCII alnum term of length ≤ 2.
CREATE OR REPLACE FUNCTION public.forge_is_short_ascii_query(p_norm text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    coalesce(p_norm, '') ~ '^[a-z0-9]{1,2}$';
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
      -- Internal ops tags (forge-*) must not enter the public search document.
      array_to_string(
        ARRAY(
          SELECT t
          FROM unnest(coalesce(p.tags, '{}'::text[])) AS t
          WHERE t NOT LIKE 'forge-%'
        ),
        ' '
      ),
      array_to_string(
        ARRAY(
          SELECT t
          FROM unnest(coalesce(p.purpose_tags, '{}'::text[])) AS t
          WHERE t NOT LIKE 'forge-%'
        ),
        ' '
      ),
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
      -- creator_id is an internal handle; do not index it for public search.
      d.x_account,
      coalesce(d.website, ''),
      array_to_string(
        ARRAY(
          SELECT t
          FROM unnest(coalesce(d.activity_tags, '{}'::text[])) AS t
          WHERE t NOT LIKE 'forge-%'
        ),
        ' '
      )
    )
  );
$$;

-- Structured / independent-token match for short ASCII queries (SE, AI, 2D, …).
CREATE OR REPLACE FUNCTION public.forge_project_matches_short_ascii(
  p public.projects,
  p_term text
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    p_term = ANY (public.forge_search_tokens(p.title))
    OR public.forge_search_normalize(coalesce(p.category, '')) = p_term
    OR public.forge_search_normalize(coalesce(p.genre, '')) = p_term
    OR EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.genres, '{}'::text[])) AS g
      WHERE public.forge_search_normalize(g) = p_term
         OR p_term = ANY (public.forge_search_tokens(g))
    )
    OR EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.tags, '{}'::text[])) AS t
      WHERE t NOT LIKE 'forge-%'
        AND (
          public.forge_search_normalize(t) = p_term
          OR p_term = ANY (public.forge_search_tokens(t))
        )
    )
    OR EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.purpose_tags, '{}'::text[])) AS t
      WHERE t NOT LIKE 'forge-%'
        AND (
          public.forge_search_normalize(t) = p_term
          OR p_term = ANY (public.forge_search_tokens(t))
        )
    )
    OR EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.asset_kinds, '{}'::text[])) AS k
      WHERE public.forge_search_normalize(k) = p_term
         OR p_term = ANY (public.forge_search_tokens(k))
    )
    OR EXISTS (
      SELECT 1
      FROM jsonb_each_text(coalesce(p.category_attributes, '{}'::jsonb)) AS kv
      WHERE public.forge_search_normalize(kv.value) = p_term
         OR p_term = ANY (public.forge_search_tokens(kv.value))
    );
$$;

CREATE OR REPLACE FUNCTION public.forge_developer_matches_short_ascii(
  d public.developer_profiles,
  p_term text
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    p_term = ANY (public.forge_search_tokens(d.public_name))
    OR p_term = ANY (public.forge_search_tokens(coalesce(d.profile, '')))
    OR EXISTS (
      SELECT 1
      FROM unnest(coalesce(d.activity_tags, '{}'::text[])) AS t
      WHERE t NOT LIKE 'forge-%'
        AND (
          public.forge_search_normalize(t) = p_term
          OR p_term = ANY (public.forge_search_tokens(t))
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.forge_project_short_ascii_rank(
  p public.projects,
  p_term text
)
RETURNS real
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.tags, '{}'::text[])) AS t
      WHERE t NOT LIKE 'forge-%'
        AND public.forge_search_normalize(t) = p_term
    )
    OR EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.genres, '{}'::text[])) AS g
      WHERE public.forge_search_normalize(g) = p_term
    )
      THEN 1.0::real
    WHEN p_term = ANY (public.forge_search_tokens(p.title))
      THEN 0.9::real
    WHEN EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.purpose_tags, '{}'::text[])) AS t
      WHERE t NOT LIKE 'forge-%'
        AND (
          public.forge_search_normalize(t) = p_term
          OR p_term = ANY (public.forge_search_tokens(t))
        )
    )
    OR EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.asset_kinds, '{}'::text[])) AS k
      WHERE public.forge_search_normalize(k) = p_term
         OR p_term = ANY (public.forge_search_tokens(k))
    )
    OR EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.tags, '{}'::text[])) AS t
      WHERE t NOT LIKE 'forge-%'
        AND p_term = ANY (public.forge_search_tokens(t))
    )
    OR EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.genres, '{}'::text[])) AS g
      WHERE p_term = ANY (public.forge_search_tokens(g))
    )
      THEN 0.8::real
    ELSE 0.7::real
  END;
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
  v_short_ascii boolean;
BEGIN
  IF char_length(v_q) < 1 THEN
    RETURN;
  END IF;

  v_norm := public.forge_search_normalize(v_q);
  IF char_length(btrim(v_norm)) < 1 THEN
    RETURN;
  END IF;

  v_terms := array_remove(regexp_split_to_array(v_norm, '\s+'), '');
  -- Single ASCII alnum term of length ≤ 2 (SE/AI/UI/2D/3D…): no full-document
  -- substring/trigram. Longer ASCII and all Japanese keep normal search.
  v_short_ascii := (
    coalesce(array_length(v_terms, 1), 0) = 1
    AND public.forge_is_short_ascii_query(v_terms[1])
  );
  IF v_short_ascii THEN
    v_norm := v_terms[1];
  END IF;

  RETURN QUERY
  WITH project_hits AS (
    SELECT
      'project'::text AS result_kind,
      p.id::text AS result_id,
      p.title AS title,
      coalesce(nullif(btrim(p.creator), ''), nullif(btrim(p.owner_name), ''), '') AS subtitle,
      coalesce(p.category, 'game') AS category,
      p.thumbnail_url AS thumbnail_url,
      CASE
        WHEN v_short_ascii THEN public.forge_project_short_ascii_rank(p, v_norm)
        ELSE (
          similarity(public.forge_project_search_document(p), v_norm)
          + CASE WHEN public.forge_project_search_document(p) LIKE '%' || v_norm || '%' THEN 0.5 ELSE 0 END
          + CASE
              WHEN v_terms <@ string_to_array(public.forge_project_search_document(p), ' ') THEN 0.35
              ELSE 0
            END
        )::real
      END AS rank
    FROM public.projects p
    WHERE p.visibility = 'public'
      AND (
        CASE
          WHEN v_short_ascii THEN public.forge_project_matches_short_ascii(p, v_norm)
          ELSE (
            public.forge_project_search_document(p) LIKE '%' || v_norm || '%'
            OR public.forge_project_search_document(p) % v_norm
            OR EXISTS (
              SELECT 1
              FROM unnest(v_terms) t(term)
              WHERE char_length(t.term) >= 2
                AND public.forge_project_search_document(p) LIKE '%' || t.term || '%'
            )
          )
        END
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
      CASE
        WHEN v_short_ascii THEN
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM unnest(coalesce(d.activity_tags, '{}'::text[])) AS t
              WHERE t NOT LIKE 'forge-%'
                AND public.forge_search_normalize(t) = v_norm
            ) THEN 1.0::real
            WHEN v_norm = ANY (public.forge_search_tokens(d.public_name)) THEN 0.9::real
            ELSE 0.7::real
          END
        ELSE (
          similarity(public.forge_developer_search_document(d), v_norm)
          + CASE WHEN public.forge_developer_search_document(d) LIKE '%' || v_norm || '%' THEN 0.5 ELSE 0 END
        )::real
      END AS rank
    FROM public.developer_profiles d
    WHERE EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.owner_id = d.user_id AND p.visibility = 'public'
      )
      AND (
        CASE
          WHEN v_short_ascii THEN public.forge_developer_matches_short_ascii(d, v_norm)
          ELSE (
            public.forge_developer_search_document(d) LIKE '%' || v_norm || '%'
            OR public.forge_developer_search_document(d) % v_norm
            OR EXISTS (
              SELECT 1
              FROM unnest(v_terms) t(term)
              WHERE char_length(t.term) >= 2
                AND public.forge_developer_search_document(d) LIKE '%' || t.term || '%'
            )
          )
        END
      )
  ),
  tag_hits AS (
    -- Normal: tag contains query (ドット→ドット絵). Short ASCII: exact only (SE→SE).
    -- Never reverse-contain (v_norm LIKE '%'||tag||'%').
    SELECT
      scored.result_kind,
      scored.result_id,
      scored.title,
      scored.subtitle,
      scored.category,
      scored.thumbnail_url,
      scored.rank
    FROM (
      SELECT DISTINCT ON (tags.tag_value)
        'tag'::text AS result_kind,
        tags.tag_value AS result_id,
        tags.tag_value AS title,
        'タグ'::text AS subtitle,
        NULL::text AS category,
        NULL::text AS thumbnail_url,
        (
          CASE
            WHEN norm.tag_norm = v_norm THEN 0.9
            ELSE 0.55
          END
          + least(similarity(norm.tag_norm, v_norm), 0.2)
        )::real AS rank
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
      CROSS JOIN LATERAL (
        SELECT public.forge_search_normalize(tags.tag_value) AS tag_norm
      ) norm
      WHERE
        tags.tag_value NOT LIKE 'forge-%'
        AND (
          CASE
            WHEN v_short_ascii THEN norm.tag_norm = v_norm
            ELSE norm.tag_norm LIKE '%' || v_norm || '%'
          END
        )
      ORDER BY tags.tag_value, rank DESC
    ) scored
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
