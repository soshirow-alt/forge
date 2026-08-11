-- =============================================================================
-- Production rollout APPLY — core schema + category / catalog / home (076-085)
-- File: 01_core_schema_and_category.sql
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
-- Apply via: Supabase Dashboard -> SQL Editor (OWNER MANUAL ONLY)
-- Pure SQL (no \i / \set / psql meta). One transaction for this file.
-- Source: canonical supabase/migrations/ (concatenated; originals untouched).
-- DO NOT apply Staging seed / beautify / fixture SQL with this package.
-- Forward-only: do not edit applied migrations; fix with a later migration.
-- =============================================================================

BEGIN;


-- === 076_player_ia_categories_attributes.sql ===
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

-- === end 076_player_ia_categories_attributes.sql ===

-- === 077_project_usage_relations.sql ===
-- 077: Public "使用した" relations between published projects
-- Schema migration (Staging first; Production later via owner Dashboard — not auto-seed).
-- Prerequisite: 076_player_ia_categories_attributes.sql
-- Public read: published rows only when both projects are visibility=public.
-- Client writes: revoked (registration UI is a later phase).

BEGIN;

CREATE TABLE IF NOT EXISTS public.project_usage_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  target_project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'used'
    CHECK (relation_type = 'used'),
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published')),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_usage_relations_distinct CHECK (source_project_id <> target_project_id),
  CONSTRAINT project_usage_relations_unique_pair UNIQUE (source_project_id, target_project_id, relation_type)
);

COMMENT ON TABLE public.project_usage_relations IS
  'Public catalog "使用した" links between Forge projects. Registration UI comes later; published rows are readable.';

CREATE INDEX IF NOT EXISTS project_usage_relations_source_idx
  ON public.project_usage_relations (source_project_id)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS project_usage_relations_target_idx
  ON public.project_usage_relations (target_project_id)
  WHERE status = 'published';

ALTER TABLE public.project_usage_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published usage relations on public projects"
  ON public.project_usage_relations;
CREATE POLICY "Anyone can read published usage relations on public projects"
  ON public.project_usage_relations
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.projects s
      WHERE s.id = source_project_id AND s.visibility = 'public'
    )
    AND EXISTS (
      SELECT 1 FROM public.projects t
      WHERE t.id = target_project_id AND t.visibility = 'public'
    )
  );

-- Table privileges: SELECT for RLS; no client writes in this phase.
GRANT SELECT ON TABLE public.project_usage_relations TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.project_usage_relations FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_project_usage_relations(
  p_project_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  source_project_id uuid,
  source_title text,
  source_category text,
  source_thumbnail_url text,
  target_project_id uuid,
  target_title text,
  target_category text,
  target_thumbnail_url text,
  relation_type text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.source_project_id,
    s.title AS source_title,
    coalesce(s.category, 'game') AS source_category,
    s.thumbnail_url AS source_thumbnail_url,
    r.target_project_id,
    t.title AS target_title,
    coalesce(t.category, 'game') AS target_category,
    t.thumbnail_url AS target_thumbnail_url,
    r.relation_type,
    r.created_at
  FROM public.project_usage_relations r
  INNER JOIN public.projects s ON s.id = r.source_project_id
  INNER JOIN public.projects t ON t.id = r.target_project_id
  WHERE r.status = 'published'
    AND r.relation_type = 'used'
    AND s.visibility = 'public'
    AND t.visibility = 'public'
    AND (
      p_project_id IS NULL
      OR r.source_project_id = p_project_id
      OR r.target_project_id = p_project_id
    )
  ORDER BY r.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 20), 50));
$$;

REVOKE ALL ON FUNCTION public.get_public_project_usage_relations(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_project_usage_relations(uuid, integer)
  TO anon, authenticated, service_role;

-- === end 077_project_usage_relations.sql ===

-- === 078_platform_announcements.sql ===
-- 078: Platform announcements (積み上げ型お知らせ)
-- Schema migration (Staging first; Production later via owner Dashboard).
-- Prerequisite: 001+
-- Public read: status=published only (RLS + SECURITY DEFINER RPCs).
-- Draft rows must never appear in get_public_platform_announcement*.

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  importance text NOT NULL DEFAULT 'normal'
    CHECK (importance IN ('normal', 'important')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_announcements_published_at_check
    CHECK (status = 'draft' OR published_at IS NOT NULL)
);

COMMENT ON TABLE public.platform_announcements IS
  'Forge platform announcements. Only status=published rows are public.';

CREATE INDEX IF NOT EXISTS platform_announcements_published_idx
  ON public.platform_announcements (published_at DESC)
  WHERE status = 'published';

ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published announcements"
  ON public.platform_announcements;
CREATE POLICY "Anyone can read published announcements"
  ON public.platform_announcements
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

GRANT SELECT ON TABLE public.platform_announcements TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.platform_announcements FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_platform_announcements(
  p_limit integer DEFAULT 5,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  body text,
  importance text,
  published_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.slug,
    a.title,
    a.body,
    a.importance,
    a.published_at
  FROM public.platform_announcements a
  WHERE a.status = 'published'
  ORDER BY a.published_at DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 5), 50))
  OFFSET greatest(0, coalesce(p_offset, 0));
$$;

CREATE OR REPLACE FUNCTION public.get_public_platform_announcement_by_slug(
  p_slug text
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  body text,
  importance text,
  published_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.slug,
    a.title,
    a.body,
    a.importance,
    a.published_at
  FROM public.platform_announcements a
  WHERE a.status = 'published'
    AND a.slug = p_slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_platform_announcements(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_announcements(integer, integer)
  TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_platform_announcement_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_announcement_by_slug(text)
  TO anon, authenticated, service_role;

-- === end 078_platform_announcements.sql ===

-- === 079_global_public_search.sql ===
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

-- === end 079_global_public_search.sql ===

-- === 080_player_ia_home_feed.sql ===
-- 080: Player IA whole-home feed sections (A–G minus E when empty)
-- Schema / RPC migration (Staging first; Production later via owner Dashboard).
-- Prerequisite: 052+ home discovery, 070/071 feedback cards, 076–078
-- Author display uses auth.users metadata display fields only (never email).
--
-- Join typing (Staging / Production shared schema):
--   projects.id              uuid
--   project_release_events.project_id  uuid  → compare to p.id directly
--   project_devlogs.project_id         text  → compare via p.id::text (never text→uuid cast)
--   project_feedback / guest_* / voice *.project_id  text → p.id::text
-- Invalid avoids 42883 uuid=text and cast errors on non-UUID legacy text values.

BEGIN;

-- A. みんなのレビューから見つける — public FB cards with project, diversified
CREATE OR REPLACE FUNCTION public.get_home_review_highlights(
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  card_id text,
  project_id uuid,
  project_title text,
  project_category text,
  project_thumbnail_url text,
  author_kind text,
  author_display_name text,
  body_text text,
  empathy_count bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH registered_voice AS (
    SELECT
      public.feedback_public_card_id('registered_voice', r.id) AS card_id,
      p.id AS project_id,
      p.title AS project_title,
      coalesce(p.category, 'game') AS project_category,
      p.thumbnail_url AS project_thumbnail_url,
      'registered'::text AS author_kind,
      coalesce(
        nullif(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
        nullif(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(au.raw_user_meta_data ->> 'name'), ''),
        'プレイヤー'
      ) AS author_display_name,
      CASE
        WHEN vp.response_kind = 'short_text' THEN NULLIF(btrim(r.answer_value), '')
        ELSE NULLIF(btrim(coalesce(r.optional_comment, '')), '')
      END AS body_text,
      r.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'registered_voice' AND e.target_id = r.id
      ) AS empathy_count
    FROM public.project_voice_responses r
    INNER JOIN public.project_version_prompts vp ON vp.id = r.prompt_id
    INNER JOIN public.projects p ON p.id::text = r.project_id
    INNER JOIN auth.users au ON au.id = r.user_id
    WHERE p.visibility = 'public'
      AND r.moderation_status = 'visible'
      AND char_length(
        coalesce(
          CASE
            WHEN vp.response_kind = 'short_text' THEN NULLIF(btrim(r.answer_value), '')
            ELSE NULLIF(btrim(coalesce(r.optional_comment, '')), '')
          END,
          ''
        )
      ) >= 12
  ),
  guest_voice AS (
    SELECT
      public.feedback_public_card_id('guest_voice', g.id) AS card_id,
      p.id AS project_id,
      p.title AS project_title,
      coalesce(p.category, 'game') AS project_category,
      p.thumbnail_url AS project_thumbnail_url,
      'guest'::text AS author_kind,
      'ゲスト'::text AS author_display_name,
      CASE
        WHEN vp.response_kind = 'short_text' THEN NULLIF(btrim(g.answer_value), '')
        ELSE NULLIF(btrim(coalesce(g.optional_comment, '')), '')
      END AS body_text,
      g.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'guest_voice' AND e.target_id = g.id
      ) AS empathy_count
    FROM public.project_guest_voice_responses g
    INNER JOIN public.project_version_prompts vp ON vp.id = g.prompt_id
    INNER JOIN public.projects p ON p.id::text = g.project_id
    WHERE p.visibility = 'public'
      AND g.include_in_public_aggregate = true
      AND g.moderation_status = 'visible'
      AND char_length(
        coalesce(
          CASE
            WHEN vp.response_kind = 'short_text' THEN NULLIF(btrim(g.answer_value), '')
            ELSE NULLIF(btrim(coalesce(g.optional_comment, '')), '')
          END,
          ''
        )
      ) >= 12
  ),
  registered_detailed AS (
    SELECT
      public.feedback_public_card_id('registered_detailed', f.id) AS card_id,
      p.id AS project_id,
      p.title AS project_title,
      coalesce(p.category, 'game') AS project_category,
      p.thumbnail_url AS project_thumbnail_url,
      'registered'::text AS author_kind,
      coalesce(
        nullif(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
        nullif(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(au.raw_user_meta_data ->> 'name'), ''),
        'プレイヤー'
      ) AS author_display_name,
      NULLIF(
        btrim(
          concat_ws(
            ' ',
            NULLIF(btrim(coalesce(f.good_points, '')), ''),
            NULLIF(btrim(coalesce(f.concerns, '')), ''),
            NULLIF(btrim(coalesce(f.other_notes, '')), '')
          )
        ),
        ''
      ) AS body_text,
      f.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'registered_detailed' AND e.target_id = f.id
      ) AS empathy_count
    FROM public.project_feedback f
    INNER JOIN public.projects p ON p.id::text = f.project_id
    INNER JOIN auth.users au ON au.id = f.user_id
    WHERE p.visibility = 'public'
      AND f.moderation_status = 'visible'
      AND char_length(
        coalesce(
          NULLIF(
            btrim(
              concat_ws(
                ' ',
                NULLIF(btrim(coalesce(f.good_points, '')), ''),
                NULLIF(btrim(coalesce(f.concerns, '')), ''),
                NULLIF(btrim(coalesce(f.other_notes, '')), '')
              )
            ),
            ''
          ),
          ''
        )
      ) >= 12
  ),
  guest_detailed AS (
    SELECT
      public.feedback_public_card_id('guest_detailed', gf.id) AS card_id,
      p.id AS project_id,
      p.title AS project_title,
      coalesce(p.category, 'game') AS project_category,
      p.thumbnail_url AS project_thumbnail_url,
      'guest'::text AS author_kind,
      'ゲスト'::text AS author_display_name,
      NULLIF(
        btrim(
          concat_ws(
            ' ',
            NULLIF(btrim(coalesce(gf.good_points, '')), ''),
            NULLIF(btrim(coalesce(gf.concerns, '')), ''),
            NULLIF(btrim(coalesce(gf.other_notes, '')), '')
          )
        ),
        ''
      ) AS body_text,
      gf.created_at,
      (
        SELECT count(*)::bigint FROM public.feedback_card_empathies e
        WHERE e.target_source = 'guest_detailed' AND e.target_id = gf.id
      ) AS empathy_count
    FROM public.project_guest_feedback gf
    INNER JOIN public.projects p ON p.id::text = gf.project_id
    WHERE p.visibility = 'public'
      AND gf.include_in_public_aggregate = true
      AND gf.moderation_status = 'visible'
      AND char_length(
        coalesce(
          NULLIF(
            btrim(
              concat_ws(
                ' ',
                NULLIF(btrim(coalesce(gf.good_points, '')), ''),
                NULLIF(btrim(coalesce(gf.concerns, '')), ''),
                NULLIF(btrim(coalesce(gf.other_notes, '')), '')
              )
            ),
            ''
          ),
          ''
        )
      ) >= 12
  ),
  all_cards AS (
    SELECT * FROM registered_voice
    UNION ALL SELECT * FROM guest_voice
    UNION ALL SELECT * FROM registered_detailed
    UNION ALL SELECT * FROM guest_detailed
  ),
  ranked AS (
    SELECT
      c.*,
      row_number() OVER (
        PARTITION BY c.project_id
        ORDER BY c.empathy_count DESC, c.created_at DESC
      ) AS project_rank,
      (
        c.empathy_count * 3
        + EXTRACT(EPOCH FROM (now() - c.created_at)) / -86400.0
      ) AS score
    FROM all_cards c
    WHERE c.body_text IS NOT NULL
  )
  SELECT
    r.card_id,
    r.project_id,
    r.project_title,
    r.project_category,
    r.project_thumbnail_url,
    r.author_kind,
    r.author_display_name,
    r.body_text,
    r.empathy_count,
    r.created_at
  FROM ranked r
  WHERE r.project_rank = 1
  ORDER BY r.score DESC, r.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 8), 16));
$$;

REVOKE ALL ON FUNCTION public.get_home_review_highlights(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_review_highlights(integer)
  TO anon, authenticated, service_role;

-- D. meaningful updates (reuse release events + non-initial devlogs)
CREATE OR REPLACE FUNCTION public.get_home_meaningful_updates(
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  project_id uuid,
  title text,
  category text,
  thumbnail_url text,
  update_kind text,
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
      coalesce(d.published_at, d.created_at)
    FROM public.project_devlogs d
    INNER JOIN public.projects p ON p.id::text = d.project_id
    WHERE p.visibility = 'public'
      AND coalesce(d.is_initial_publish, false) = false
      AND coalesce(d.published_at, d.created_at) IS NOT NULL
  ),
  best AS (
    SELECT DISTINCT ON (project_id)
      project_id, title, category, thumbnail_url, update_kind, meaningful_update_at
    FROM events
    ORDER BY project_id, meaningful_update_at DESC
  )
  SELECT *
  FROM best
  ORDER BY meaningful_update_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 8), 20));
$$;

REVOKE ALL ON FUNCTION public.get_home_meaningful_updates(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_meaningful_updates(integer)
  TO anon, authenticated, service_role;

-- G. newest across all categories
CREATE OR REPLACE FUNCTION public.get_home_newest_projects(
  p_limit integer DEFAULT 12,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  project_id uuid,
  title text,
  category text,
  thumbnail_url text,
  first_published_at timestamptz,
  creator text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS project_id,
    p.title,
    coalesce(p.category, 'game') AS category,
    p.thumbnail_url,
    coalesce(p.first_published_at, p.created_at) AS first_published_at,
    coalesce(nullif(btrim(p.creator), ''), p.owner_name) AS creator
  FROM public.projects p
  WHERE p.visibility = 'public'
    AND (
      p_category IS NULL
      OR p_category = ''
      OR p_category = 'all'
      OR coalesce(p.category, 'game') = p_category
    )
  ORDER BY coalesce(p.first_published_at, p.created_at) DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 12), 40));
$$;

REVOKE ALL ON FUNCTION public.get_home_newest_projects(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_newest_projects(integer, text)
  TO anon, authenticated, service_role;

-- Category search shelves helper
CREATE OR REPLACE FUNCTION public.get_public_projects_by_category(
  p_category text DEFAULT NULL,
  p_sort text DEFAULT 'newest',
  p_quick_try boolean DEFAULT NULL,
  p_feedback_wanted boolean DEFAULT NULL,
  p_usable_for_creation boolean DEFAULT NULL,
  p_stream_policy text DEFAULT NULL,
  p_asset_kind text DEFAULT NULL,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0
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
  text, text, boolean, boolean, boolean, text, text, integer, integer
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_projects_by_category(
  text, text, boolean, boolean, boolean, text, text, integer, integer
) TO anon, authenticated, service_role;

-- === end 080_player_ia_home_feed.sql ===

-- === 081_guest_feedback_public_reenable.sql ===
-- 081: Re-enable public guest feedback listing + card resolution
-- Schema / RPC migration (Staging first; Production later via owner Dashboard).
-- Reverses the public-scope guest exclusion from 071 while keeping:
--   - empathy/reply mutations registered-user only (existing RPC auth checks)
--   - moderation_status / include_in_public_aggregate filters
-- Rate limits remain in app layer (hashed IP in guest_feedback_rate_events; no raw IP).
-- App hard-stop: guest write APIs still return guest_feedback_disabled when
-- VERCEL_ENV=production until a future Production code release.
-- Prerequisite: 071

BEGIN;

-- Allow guest card sources for engagement RPCs (auth still required in toggles).
CREATE OR REPLACE FUNCTION public.assert_public_feedback_card_source(p_source text)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_source IS NULL OR p_source NOT IN (
    'registered_voice',
    'registered_detailed',
    'guest_voice',
    'guest_detailed'
  ) THEN
    RAISE EXCEPTION 'unsupported feedback card source';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_public_feedback_card_source(text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.resolve_feedback_card_id(
  p_card_id text,
  p_project_id text,
  p_version_key text
)
RETURNS TABLE (
  target_source text,
  target_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_card_id IS NULL OR char_length(p_card_id) < 5 THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.projects pr
    WHERE pr.id::text = p_project_id AND pr.visibility = 'public'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 'registered_voice'::text, r.id
  FROM public.project_voice_responses r
  INNER JOIN public.project_version_prompts vp ON vp.id = r.prompt_id
  WHERE r.project_id = p_project_id
    AND r.version_key = p_version_key
    AND r.moderation_status = 'visible'
    AND public.feedback_public_card_id('registered_voice', r.id) = p_card_id
    AND (
      (vp.response_kind = 'short_text' AND NULLIF(btrim(r.answer_value), '') IS NOT NULL)
      OR NULLIF(btrim(coalesce(r.optional_comment, '')), '') IS NOT NULL
    )

  UNION ALL

  SELECT 'guest_voice'::text, g.id
  FROM public.project_guest_voice_responses g
  INNER JOIN public.project_version_prompts vp ON vp.id = g.prompt_id
  WHERE g.project_id = p_project_id
    AND g.version_key = p_version_key
    AND g.include_in_public_aggregate = true
    AND g.moderation_status = 'visible'
    AND public.feedback_public_card_id('guest_voice', g.id) = p_card_id
    AND (
      (vp.response_kind = 'short_text' AND NULLIF(btrim(g.answer_value), '') IS NOT NULL)
      OR NULLIF(btrim(coalesce(g.optional_comment, '')), '') IS NOT NULL
    )

  UNION ALL

  SELECT 'registered_detailed'::text, f.id
  FROM public.project_feedback f
  WHERE f.project_id = p_project_id
    AND f.version_key = p_version_key
    AND f.moderation_status = 'visible'
    AND public.feedback_public_card_id('registered_detailed', f.id) = p_card_id
    AND (
      NULLIF(btrim(coalesce(f.good_points, '')), '') IS NOT NULL
      OR NULLIF(btrim(coalesce(f.concerns, '')), '') IS NOT NULL
      OR NULLIF(btrim(coalesce(f.bugs, '')), '') IS NOT NULL
      OR NULLIF(btrim(coalesce(f.other_notes, '')), '') IS NOT NULL
    )

  UNION ALL

  SELECT 'guest_detailed'::text, gf.id
  FROM public.project_guest_feedback gf
  WHERE gf.project_id = p_project_id
    AND gf.version_key = p_version_key
    AND gf.include_in_public_aggregate = true
    AND gf.moderation_status = 'visible'
    AND public.feedback_public_card_id('guest_detailed', gf.id) = p_card_id
    AND (
      NULLIF(btrim(coalesce(gf.good_points, '')), '') IS NOT NULL
      OR NULLIF(btrim(coalesce(gf.concerns, '')), '') IS NOT NULL
      OR NULLIF(btrim(coalesce(gf.bugs, '')), '') IS NOT NULL
      OR NULLIF(btrim(coalesce(gf.other_notes, '')), '') IS NOT NULL
    );
END;
$$;


REVOKE ALL ON FUNCTION public.resolve_feedback_card_id(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_feedback_card_id(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.resolve_feedback_card_id(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_feedback_card_id(text, text, text) TO service_role;

DROP FUNCTION IF EXISTS public.get_public_feedback_cards(text, text, boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.get_public_feedback_cards(
  p_project_id text,
  p_version_key text,
  p_include_guest boolean DEFAULT true,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  card_id text,
  card_kind text,
  created_at timestamptz,
  author_kind text,
  author_display_name text,
  author_avatar_url text,
  prompt_text text,
  body_text text,
  good_points text,
  concerns text,
  bugs text,
  other_notes text,
  empathy_count bigint,
  reply_count bigint,
  viewer_has_empathy boolean,
  viewer_can_empathy boolean,
  developer_marked_helpful boolean,
  viewer_is_project_owner boolean,
  viewer_can_reply boolean,
  target_source text,
  target_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH viewer AS (
    SELECT
      auth.uid() AS uid,
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id::text = p_project_id AND p.owner_id = auth.uid()
      ) AS is_owner
  ),
  registered_voice_cards AS (
    SELECT
      public.feedback_public_card_id('registered_voice', r.id) AS card_id,
      CASE
        WHEN vp.response_kind = 'short_text' THEN 'short_text'
        ELSE 'voice_supplement'
      END AS card_kind,
      r.created_at,
      'registered'::text AS author_kind,
      coalesce(
        nullif(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
        nullif(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(au.raw_user_meta_data ->> 'name'), ''),
        'プレイヤー'
      ) AS author_display_name,
      nullif(
        btrim(
          coalesce(
            au.raw_user_meta_data ->> 'avatar_url',
            au.raw_user_meta_data ->> 'picture'
          )
        ),
        ''
      ) AS author_avatar_url,
      vp.prompt_text,
      CASE
        WHEN vp.response_kind = 'short_text' THEN NULLIF(btrim(r.answer_value), '')
        ELSE NULLIF(btrim(coalesce(r.optional_comment, '')), '')
      END AS body_text,
      NULL::text AS good_points,
      NULL::text AS concerns,
      NULL::text AS bugs,
      NULL::text AS other_notes,
      'registered_voice'::text AS target_source,
      r.id AS target_id,
      r.user_id AS author_user_id
    FROM public.project_voice_responses r
    INNER JOIN public.project_version_prompts vp ON vp.id = r.prompt_id
    INNER JOIN auth.users au ON au.id = r.user_id
    WHERE r.project_id = p_project_id
      AND r.version_key = p_version_key
      AND r.moderation_status = 'visible'
      AND (
        (vp.response_kind = 'short_text' AND NULLIF(btrim(r.answer_value), '') IS NOT NULL)
        OR NULLIF(btrim(coalesce(r.optional_comment, '')), '') IS NOT NULL
      )
  ),
  guest_voice_cards AS (
    SELECT
      public.feedback_public_card_id('guest_voice', g.id) AS card_id,
      CASE
        WHEN vp.response_kind = 'short_text' THEN 'short_text'
        ELSE 'voice_supplement'
      END AS card_kind,
      g.created_at,
      'guest'::text AS author_kind,
      'ゲスト'::text AS author_display_name,
      NULL::text AS author_avatar_url,
      vp.prompt_text,
      CASE
        WHEN vp.response_kind = 'short_text' THEN NULLIF(btrim(g.answer_value), '')
        ELSE NULLIF(btrim(coalesce(g.optional_comment, '')), '')
      END AS body_text,
      NULL::text AS good_points,
      NULL::text AS concerns,
      NULL::text AS bugs,
      NULL::text AS other_notes,
      'guest_voice'::text AS target_source,
      g.id AS target_id,
      NULL::uuid AS author_user_id
    FROM public.project_guest_voice_responses g
    INNER JOIN public.project_version_prompts vp ON vp.id = g.prompt_id
    WHERE g.project_id = p_project_id
      AND g.version_key = p_version_key
      AND g.include_in_public_aggregate = true
      AND g.moderation_status = 'visible'
      AND p_include_guest = true
      AND (
        (vp.response_kind = 'short_text' AND NULLIF(btrim(g.answer_value), '') IS NOT NULL)
        OR NULLIF(btrim(coalesce(g.optional_comment, '')), '') IS NOT NULL
      )
  ),
  registered_detailed_cards AS (
    SELECT
      public.feedback_public_card_id('registered_detailed', f.id) AS card_id,
      'detailed'::text AS card_kind,
      f.created_at,
      'registered'::text AS author_kind,
      coalesce(
        nullif(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
        nullif(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(au.raw_user_meta_data ->> 'name'), ''),
        'プレイヤー'
      ) AS author_display_name,
      nullif(
        btrim(
          coalesce(
            au.raw_user_meta_data ->> 'avatar_url',
            au.raw_user_meta_data ->> 'picture'
          )
        ),
        ''
      ) AS author_avatar_url,
      NULL::text AS prompt_text,
      NULL::text AS body_text,
      NULLIF(btrim(coalesce(f.good_points, '')), '') AS good_points,
      NULLIF(btrim(coalesce(f.concerns, '')), '') AS concerns,
      NULLIF(btrim(coalesce(f.bugs, '')), '') AS bugs,
      NULLIF(btrim(coalesce(f.other_notes, '')), '') AS other_notes,
      'registered_detailed'::text AS target_source,
      f.id AS target_id,
      f.user_id AS author_user_id
    FROM public.project_feedback f
    INNER JOIN auth.users au ON au.id = f.user_id
    WHERE f.project_id = p_project_id
      AND f.version_key = p_version_key
      AND f.moderation_status = 'visible'
      AND (
        NULLIF(btrim(coalesce(f.good_points, '')), '') IS NOT NULL
        OR NULLIF(btrim(coalesce(f.concerns, '')), '') IS NOT NULL
        OR NULLIF(btrim(coalesce(f.bugs, '')), '') IS NOT NULL
        OR NULLIF(btrim(coalesce(f.other_notes, '')), '') IS NOT NULL
      )
  ),
  guest_detailed_cards AS (
    SELECT
      public.feedback_public_card_id('guest_detailed', gf.id) AS card_id,
      'detailed'::text AS card_kind,
      gf.created_at,
      'guest'::text AS author_kind,
      'ゲスト'::text AS author_display_name,
      NULL::text AS author_avatar_url,
      NULL::text AS prompt_text,
      NULL::text AS body_text,
      NULLIF(btrim(coalesce(gf.good_points, '')), '') AS good_points,
      NULLIF(btrim(coalesce(gf.concerns, '')), '') AS concerns,
      NULLIF(btrim(coalesce(gf.bugs, '')), '') AS bugs,
      NULLIF(btrim(coalesce(gf.other_notes, '')), '') AS other_notes,
      'guest_detailed'::text AS target_source,
      gf.id AS target_id,
      NULL::uuid AS author_user_id
    FROM public.project_guest_feedback gf
    WHERE gf.project_id = p_project_id
      AND gf.version_key = p_version_key
      AND gf.include_in_public_aggregate = true
      AND gf.moderation_status = 'visible'
      AND p_include_guest = true
      AND (
        NULLIF(btrim(coalesce(gf.good_points, '')), '') IS NOT NULL
        OR NULLIF(btrim(coalesce(gf.concerns, '')), '') IS NOT NULL
        OR NULLIF(btrim(coalesce(gf.bugs, '')), '') IS NOT NULL
        OR NULLIF(btrim(coalesce(gf.other_notes, '')), '') IS NOT NULL
      )
  ),
  all_cards AS (
    SELECT * FROM registered_voice_cards
    UNION ALL
    SELECT * FROM guest_voice_cards
    UNION ALL
    SELECT * FROM registered_detailed_cards
    UNION ALL
    SELECT * FROM guest_detailed_cards
  ),
  empathy_agg AS (
    SELECT e.target_source, e.target_id, count(*)::bigint AS empathy_count
    FROM public.feedback_card_empathies e
    WHERE e.project_id = p_project_id
    GROUP BY e.target_source, e.target_id
  ),
  reply_agg AS (
    SELECT r.target_source, r.target_id, count(*)::bigint AS reply_count
    FROM public.feedback_card_replies r
    WHERE r.project_id = p_project_id
    GROUP BY r.target_source, r.target_id
  ),
  viewer_empathy AS (
    SELECT e.target_source, e.target_id
    FROM public.feedback_card_empathies e
    CROSS JOIN viewer v
    WHERE e.project_id = p_project_id
      AND v.uid IS NOT NULL
      AND e.user_id = v.uid
  ),
  helpful_marks AS (
    SELECT
      CASE m.source_type
        WHEN 'voice_response' THEN 'registered_voice'
        WHEN 'project_feedback' THEN 'registered_detailed'
        WHEN 'guest_voice_response' THEN 'guest_voice'
        WHEN 'guest_project_feedback' THEN 'guest_detailed'
      END AS target_source,
      m.source_id AS target_id
    FROM public.developer_feedback_helpful_marks m
    WHERE m.project_id = p_project_id
  )
  SELECT
    c.card_id,
    c.card_kind,
    c.created_at,
    c.author_kind,
    c.author_display_name,
    c.author_avatar_url,
    c.prompt_text,
    c.body_text,
    c.good_points,
    c.concerns,
    c.bugs,
    c.other_notes,
    coalesce(ea.empathy_count, 0) AS empathy_count,
    coalesce(ra.reply_count, 0) AS reply_count,
    EXISTS (
      SELECT 1 FROM viewer_empathy ve
      WHERE ve.target_source = c.target_source AND ve.target_id = c.target_id
    ) AS viewer_has_empathy,
    (
      (SELECT v.uid FROM viewer v) IS NOT NULL
      AND (
        c.author_user_id IS NULL
        OR c.author_user_id IS DISTINCT FROM (SELECT v.uid FROM viewer v)
      )
    ) AS viewer_can_empathy,
    EXISTS (
      SELECT 1 FROM helpful_marks hm
      WHERE hm.target_source = c.target_source AND hm.target_id = c.target_id
    ) AS developer_marked_helpful,
    coalesce((SELECT v.is_owner FROM viewer v), false) AS viewer_is_project_owner,
    (
      (SELECT v.uid FROM viewer v) IS NOT NULL
      AND (
        coalesce((SELECT v.is_owner FROM viewer v), false)
        OR (
          c.author_user_id IS NOT NULL
          AND c.author_user_id = (SELECT v.uid FROM viewer v)
        )
      )
    ) AS viewer_can_reply,
    c.target_source,
    c.target_id
  FROM all_cards c
  LEFT JOIN empathy_agg ea
    ON ea.target_source = c.target_source AND ea.target_id = c.target_id
  LEFT JOIN reply_agg ra
    ON ra.target_source = c.target_source AND ra.target_id = c.target_id
  WHERE EXISTS (
    SELECT 1 FROM public.projects pr
    WHERE pr.id::text = p_project_id AND pr.visibility = 'public'
  )
  ORDER BY c.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 100))
  OFFSET greatest(coalesce(p_offset, 0), 0);
$$;


GRANT EXECUTE ON FUNCTION public.get_public_feedback_cards(text, text, boolean, integer, integer)
  TO anon, authenticated, service_role;

-- === end 081_guest_feedback_public_reenable.sql ===

-- === 082_guest_feedback_service_role_grants.sql ===
-- 082: Ensure service_role can write guest feedback tables (API path).
-- Preview/Staging guest FB POST failed with 42501 permission denied.
-- RLS remains enabled; service_role bypasses RLS but still needs table GRANTs.
-- Safe / idempotent.

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_guest_feedback
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_guest_voice_responses
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.guest_feedback_rate_events
  TO service_role;

-- === end 082_guest_feedback_service_role_grants.sql ===

-- === 083_player_ia_home_v0_shelves.sql ===
-- 083: Player IA home v0 shelves — FB gathering projects + meaningful update summary
-- Schema / RPC only (no column adds). Staging first; Production later via owner Dashboard.
-- Prerequisite: 080_player_ia_home_feed.sql, 070/071 feedback replies, 076–078
--
-- Adds:
--   get_home_feedback_gathering_projects — project-level FB aggregation (30d → 90d fallback)
--   get_home_meaningful_updates — DROP+CREATE to include summary / version / label
--   get_home_newest_projects — DROP+CREATE to include description
-- Keeps get_home_review_highlights (legacy) untouched.
--
-- 42P13 note: Postgres cannot CREATE OR REPLACE a function when OUT / RETURNS TABLE
-- columns change. Existing 080 signatures must be DROPped first (exact arg types only).

BEGIN;

-- ---------------------------------------------------------------------------
-- A. Feedback-gathering projects (works with activity, not review body quotes)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_home_feedback_gathering_projects(
  p_limit integer DEFAULT 16
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
  v_window_days integer := 30;
  v_qualifying integer := 0;
BEGIN
  -- Count qualifying projects in 30d; fall back to 90d when fewer than 4.
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

REVOKE ALL ON FUNCTION public.get_home_feedback_gathering_projects(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_feedback_gathering_projects(integer)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- B. Meaningful updates — add summary / version / label (same event rules)
-- 080 OUT columns differ (no update_label / update_summary / published_version).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_home_meaningful_updates(integer);

CREATE OR REPLACE FUNCTION public.get_home_meaningful_updates(
  p_limit integer DEFAULT 16
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
  SELECT *
  FROM best
  ORDER BY meaningful_update_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 16), 40));
$$;

REVOKE ALL ON FUNCTION public.get_home_meaningful_updates(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_meaningful_updates(integer)
  TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- C. Newest — include description for short overview cards
-- 080 OUT columns differ (no description).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_home_newest_projects(integer, text);

CREATE OR REPLACE FUNCTION public.get_home_newest_projects(
  p_limit integer DEFAULT 16,
  p_category text DEFAULT NULL
)
RETURNS TABLE (
  project_id uuid,
  title text,
  category text,
  description text,
  thumbnail_url text,
  first_published_at timestamptz,
  creator text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS project_id,
    p.title,
    coalesce(p.category, 'game') AS category,
    coalesce(p.description, '') AS description,
    p.thumbnail_url,
    coalesce(p.first_published_at, p.created_at) AS first_published_at,
    coalesce(nullif(btrim(p.creator), ''), p.owner_name) AS creator
  FROM public.projects p
  WHERE p.visibility = 'public'
    AND (
      p_category IS NULL
      OR p_category = ''
      OR p_category = 'all'
      OR coalesce(p.category, 'game') = p_category
    )
  ORDER BY coalesce(p.first_published_at, p.created_at) DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 16), 40));
$$;

REVOKE ALL ON FUNCTION public.get_home_newest_projects(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_newest_projects(integer, text)
  TO anon, authenticated, service_role;

-- === end 083_player_ia_home_v0_shelves.sql ===

-- === 084_catalog_search_query_genres_tags.sql ===
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

-- === end 084_catalog_search_query_genres_tags.sql ===

-- === 085_catalog_five_category_filters.sql ===
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

-- === end 085_catalog_five_category_filters.sql ===

COMMIT;
