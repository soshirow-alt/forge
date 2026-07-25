-- 081: Re-enable public guest feedback listing + card resolution
-- Staging only from Cursor. Production: owner manual later.
-- Reverses the public-scope guest exclusion from 071 while keeping:
--   - empathy/reply mutations registered-user only (existing RPC auth checks)
--   - rate limits / moderation / include_in_public_aggregate
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

COMMIT;
