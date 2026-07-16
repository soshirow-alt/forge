-- 071: public FB engagement harden — empathy RPC-only + guest out of public scope + optional_comment 1000
-- Staging only (vuqpwvjvgyxffmvpfrxo). Do not apply to Production from Cursor.
-- Prerequisite: 070_age_rating_feedback_engagement.sql
--
-- Scope (2026-07-16 owner):
--   Public Player 「みんなのFB」 = registered_voice / registered_detailed only.
--   guest_voice / guest_detailed stay in DB for compatibility but are NOT publicly
--   listable or actionable via public card RPCs (matches app p_include_guest:false
--   and guest_feedback_disabled APIs since 2026-07-13).
--   Studio internal 「開発に役立った」 via developer_feedback_helpful_marks table
--   path is unchanged (not these public card RPCs).
--
-- Before apply (Staging AND future Production):
--   Read-only check — do NOT truncate or UPDATE existing rows:
--     SELECT count(*), coalesce(max(char_length(optional_comment)),0)
--     FROM public.project_voice_responses
--     WHERE optional_comment IS NOT NULL AND char_length(optional_comment) > 1000;
--     SELECT count(*), coalesce(max(char_length(optional_comment)),0)
--     FROM public.project_guest_voice_responses
--     WHERE optional_comment IS NOT NULL AND char_length(optional_comment) > 1000;
--   If either count > 0, do not apply until rows are resolved manually.
--   This migration also aborts (EXCEPTION) if such rows exist — no silent rewrite.

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Abort if optional_comment already exceeds 1000 (no data rewrite)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_reg_count integer;
  v_reg_max integer;
  v_guest_count integer;
  v_guest_max integer;
BEGIN
  SELECT count(*)::integer,
         coalesce(max(char_length(optional_comment)), 0)::integer
  INTO v_reg_count, v_reg_max
  FROM public.project_voice_responses
  WHERE optional_comment IS NOT NULL
    AND char_length(optional_comment) > 1000;

  SELECT count(*)::integer,
         coalesce(max(char_length(optional_comment)), 0)::integer
  INTO v_guest_count, v_guest_max
  FROM public.project_guest_voice_responses
  WHERE optional_comment IS NOT NULL
    AND char_length(optional_comment) > 1000;

  IF v_reg_count > 0 OR v_guest_count > 0 THEN
    RAISE EXCEPTION
      '071 blocked: optional_comment > 1000 exists (registered count=% max=%; guest count=% max=%). Resolve manually; migration does not truncate.',
      v_reg_count, v_reg_max, v_guest_count, v_guest_max;
  END IF;
END $$;

ALTER TABLE public.project_guest_voice_responses
  DROP CONSTRAINT IF EXISTS project_guest_voice_responses_optional_comment_len;
ALTER TABLE public.project_guest_voice_responses
  ADD CONSTRAINT project_guest_voice_responses_optional_comment_len
  CHECK (optional_comment IS NULL OR char_length(optional_comment) <= 1000);

ALTER TABLE public.project_voice_responses
  DROP CONSTRAINT IF EXISTS project_voice_responses_optional_comment_len;
ALTER TABLE public.project_voice_responses
  ADD CONSTRAINT project_voice_responses_optional_comment_len
  CHECK (optional_comment IS NULL OR char_length(optional_comment) <= 1000);

-- ---------------------------------------------------------------------------
-- 1. feedback_card_empathies — client DML/SELECT denied; writes via RPC only
-- ---------------------------------------------------------------------------
-- service_role: no table DML GRANT. Empathy mutations run only inside
-- toggle_feedback_card_empathy (SECURITY DEFINER, owner privileges). Staging
-- verify scripts assert direct PostgREST INSERT/DELETE fail for clients.
DROP POLICY IF EXISTS "Registered users read empathies on public projects"
  ON public.feedback_card_empathies;
DROP POLICY IF EXISTS "Registered users insert own empathies"
  ON public.feedback_card_empathies;
DROP POLICY IF EXISTS "Registered users delete own empathies"
  ON public.feedback_card_empathies;

REVOKE ALL ON TABLE public.feedback_card_empathies FROM PUBLIC;
REVOKE ALL ON TABLE public.feedback_card_empathies FROM anon;
REVOKE ALL ON TABLE public.feedback_card_empathies FROM authenticated;
REVOKE ALL ON TABLE public.feedback_card_empathies FROM service_role;

COMMENT ON TABLE public.feedback_card_empathies IS
  'Player empathy on public FB cards. Client access only via toggle_feedback_card_empathy + get_public_feedback_cards. No direct table DML/SELECT for anon/authenticated/service_role.';

-- ---------------------------------------------------------------------------
-- 2. resolve_feedback_card_id — registered sources only (public card scope)
-- ---------------------------------------------------------------------------
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

  -- Public card scope: registered only. guest_* intentionally omitted.
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
    );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_feedback_card_id(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_feedback_card_id(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.resolve_feedback_card_id(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_feedback_card_id(text, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Helper — reject guest sources if ever resolved
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assert_public_feedback_card_source(p_source text)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_source IS NULL OR p_source NOT IN ('registered_voice', 'registered_detailed') THEN
    RAISE EXCEPTION 'guest feedback is not publicly actionable';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_public_feedback_card_source(text) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 4. get_public_feedback_cards — force exclude guest (ignore p_include_guest)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_feedback_cards(
  p_project_id text,
  p_version_key text,
  p_include_guest boolean DEFAULT false,
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
  -- p_include_guest is retained for signature compatibility but ignored.
  -- Public surface always excludes guest_* (app also passes false).
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
  all_cards AS (
    SELECT * FROM registered_voice_cards
    UNION ALL
    SELECT * FROM registered_detailed_cards
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
        ELSE NULL
      END AS target_source,
      m.source_id AS target_id
    FROM public.developer_feedback_helpful_marks m
    WHERE m.project_id = p_project_id
      AND m.source_type IN ('voice_response', 'project_feedback')
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

REVOKE ALL ON FUNCTION public.get_public_feedback_cards(text, text, boolean, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_feedback_cards(text, text, boolean, integer, integer)
  TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Engagement RPCs — assert registered-only after resolve
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_feedback_card_empathy(
  p_project_id text,
  p_version_key text,
  p_card_id text
)
RETURNS TABLE (
  empathy_count bigint,
  viewer_has_empathy boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_source text;
  v_target uuid;
  v_author uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT r.target_source, r.target_id
  INTO v_source, v_target
  FROM public.resolve_feedback_card_id(p_card_id, p_project_id, p_version_key) r
  LIMIT 1;

  IF v_source IS NULL OR v_target IS NULL THEN
    RAISE EXCEPTION 'feedback card not found';
  END IF;

  PERFORM public.assert_public_feedback_card_source(v_source);

  v_author := public.feedback_card_author_user_id(v_source, v_target);
  IF v_author IS NOT NULL AND v_author = v_uid THEN
    RAISE EXCEPTION 'cannot empathize own feedback';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.feedback_card_empathies e
    WHERE e.user_id = v_uid
      AND e.target_source = v_source
      AND e.target_id = v_target
  ) THEN
    DELETE FROM public.feedback_card_empathies e
    WHERE e.user_id = v_uid
      AND e.target_source = v_source
      AND e.target_id = v_target;
  ELSE
    INSERT INTO public.feedback_card_empathies (project_id, target_source, target_id, user_id)
    VALUES (p_project_id, v_source, v_target, v_uid);
  END IF;

  RETURN QUERY
  SELECT
    (
      SELECT count(*)::bigint
      FROM public.feedback_card_empathies e
      WHERE e.target_source = v_source AND e.target_id = v_target
    ),
    EXISTS (
      SELECT 1 FROM public.feedback_card_empathies e
      WHERE e.user_id = v_uid
        AND e.target_source = v_source
        AND e.target_id = v_target
    );
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_feedback_card_empathy(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_feedback_card_empathy(text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.toggle_feedback_card_empathy(text, text, text)
  TO authenticated;

-- Public-card helpful toggle: registered only.
-- Studio guest 「開発に役立った」 continues via developer_feedback_helpful_marks table APIs.
CREATE OR REPLACE FUNCTION public.toggle_feedback_card_helpful(
  p_project_id text,
  p_version_key text,
  p_card_id text
)
RETURNS TABLE (
  developer_marked_helpful boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_source text;
  v_target uuid;
  v_helpful_type text;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id::text = p_project_id AND p.owner_id = v_uid
  ) THEN
    RAISE EXCEPTION 'owner only';
  END IF;

  SELECT r.target_source, r.target_id
  INTO v_source, v_target
  FROM public.resolve_feedback_card_id(p_card_id, p_project_id, p_version_key) r
  LIMIT 1;

  IF v_source IS NULL OR v_target IS NULL THEN
    RAISE EXCEPTION 'feedback card not found';
  END IF;

  PERFORM public.assert_public_feedback_card_source(v_source);

  v_helpful_type := public.helpful_source_type_from_card_source(v_source);
  IF v_helpful_type IS NULL THEN
    RAISE EXCEPTION 'invalid source';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.developer_feedback_helpful_marks m
    WHERE m.developer_id = v_uid
      AND m.source_type = v_helpful_type
      AND m.source_id = v_target
  ) THEN
    DELETE FROM public.developer_feedback_helpful_marks m
    WHERE m.developer_id = v_uid
      AND m.source_type = v_helpful_type
      AND m.source_id = v_target;
  ELSE
    INSERT INTO public.developer_feedback_helpful_marks (
      project_id, developer_id, source_type, source_id
    ) VALUES (p_project_id, v_uid, v_helpful_type, v_target);
  END IF;

  RETURN QUERY
  SELECT EXISTS (
    SELECT 1 FROM public.developer_feedback_helpful_marks m
    WHERE m.developer_id = v_uid
      AND m.source_type = v_helpful_type
      AND m.source_id = v_target
  );
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_feedback_card_helpful(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_feedback_card_helpful(text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.toggle_feedback_card_helpful(text, text, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.list_feedback_card_replies(
  p_project_id text,
  p_version_key text,
  p_card_id text
)
RETURNS TABLE (
  id uuid,
  body text,
  created_at timestamptz,
  author_display_name text,
  author_avatar_url text,
  is_developer boolean,
  is_own boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source text;
  v_target uuid;
  v_owner uuid;
  v_uid uuid := auth.uid();
BEGIN
  SELECT r.target_source, r.target_id
  INTO v_source, v_target
  FROM public.resolve_feedback_card_id(p_card_id, p_project_id, p_version_key) r
  LIMIT 1;

  IF v_source IS NULL THEN
    RETURN;
  END IF;

  PERFORM public.assert_public_feedback_card_source(v_source);

  SELECT p.owner_id INTO v_owner
  FROM public.projects p
  WHERE p.id::text = p_project_id;

  RETURN QUERY
  SELECT
    rep.id,
    rep.body,
    rep.created_at,
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
    (v_owner IS NOT NULL AND rep.author_id = v_owner) AS is_developer,
    (v_uid IS NOT NULL AND rep.author_id = v_uid) AS is_own
  FROM public.feedback_card_replies rep
  INNER JOIN auth.users au ON au.id = rep.author_id
  WHERE rep.target_source = v_source
    AND rep.target_id = v_target
  ORDER BY rep.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_feedback_card_replies(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_feedback_card_replies(text, text, text)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_feedback_card_reply(
  p_project_id text,
  p_version_key text,
  p_card_id text,
  p_body text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_source text;
  v_target uuid;
  v_author uuid;
  v_owner uuid;
  v_title text;
  v_body text := btrim(coalesce(p_body, ''));
  v_reply_id uuid;
  v_notify_user uuid;
  v_message text;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF char_length(v_body) < 1 OR char_length(v_body) > 200 THEN
    RAISE EXCEPTION 'invalid reply body';
  END IF;

  SELECT r.target_source, r.target_id
  INTO v_source, v_target
  FROM public.resolve_feedback_card_id(p_card_id, p_project_id, p_version_key) r
  LIMIT 1;

  IF v_source IS NULL THEN
    RAISE EXCEPTION 'feedback card not found';
  END IF;

  PERFORM public.assert_public_feedback_card_source(v_source);

  SELECT p.owner_id, p.title INTO v_owner, v_title
  FROM public.projects p
  WHERE p.id::text = p_project_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'project not found';
  END IF;

  v_author := public.feedback_card_author_user_id(v_source, v_target);

  IF v_uid IS DISTINCT FROM v_owner AND (v_author IS NULL OR v_uid IS DISTINCT FROM v_author) THEN
    RAISE EXCEPTION 'not allowed to reply';
  END IF;

  INSERT INTO public.feedback_card_replies (
    project_id, target_source, target_id, author_id, body
  ) VALUES (p_project_id, v_source, v_target, v_uid, v_body)
  RETURNING id INTO v_reply_id;

  IF v_uid = v_owner THEN
    v_notify_user := v_author;
    v_message := 'あなたのフィードバックに開発者から返信がありました';
  ELSE
    v_notify_user := v_owner;
    v_message := '作品のフィードバックに返信がありました';
  END IF;

  IF v_notify_user IS NOT NULL AND v_notify_user IS DISTINCT FROM v_uid THEN
    INSERT INTO public.user_notifications (
      user_id, type, message, project_id, version_key
    ) VALUES (
      v_notify_user,
      'feedback_reply',
      CASE
        WHEN v_title IS NULL OR btrim(v_title) = '' THEN v_message
        ELSE format('「%s」— %s', v_title, v_message)
      END,
      p_project_id,
      p_version_key
    );
  END IF;

  RETURN v_reply_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_feedback_card_reply(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_feedback_card_reply(text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_feedback_card_reply(text, text, text, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_feedback_card_reply(
  p_reply_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_source text;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT r.target_source INTO v_source
  FROM public.feedback_card_replies r
  WHERE r.id = p_reply_id AND r.author_id = v_uid;

  IF v_source IS NULL THEN
    RETURN false;
  END IF;

  PERFORM public.assert_public_feedback_card_source(v_source);

  DELETE FROM public.feedback_card_replies r
  WHERE r.id = p_reply_id AND r.author_id = v_uid;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_feedback_card_reply(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_feedback_card_reply(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_feedback_card_reply(uuid)
  TO authenticated;

COMMIT;
