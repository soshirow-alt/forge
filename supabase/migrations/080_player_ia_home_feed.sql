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

COMMIT;
