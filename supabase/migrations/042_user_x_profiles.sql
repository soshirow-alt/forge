-- 042: X OAuth profile storage (login/link metadata only — no tokens)
-- Prerequisite: 039 (anonymize_own_account_data), 041 (get_public_feedback_cards)
-- Dashboard apply: owner GO only

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_x_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  x_user_id text NOT NULL,
  x_username text NOT NULL,
  x_display_name text,
  x_avatar_url text,
  x_connected_at timestamptz NOT NULL DEFAULT now(),
  x_last_synced_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_x_profiles_x_user_id_unique UNIQUE (x_user_id),
  CONSTRAINT user_x_profiles_x_username_not_empty CHECK (char_length(btrim(x_username)) > 0),
  CONSTRAINT user_x_profiles_x_username_len CHECK (char_length(x_username) <= 50)
);

COMMENT ON TABLE public.user_x_profiles IS
  'OAuth-linked X profile metadata for Forge display. Does not store OAuth tokens.';

ALTER TABLE public.user_x_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_x_profiles_select_own ON public.user_x_profiles;
CREATE POLICY user_x_profiles_select_own
  ON public.user_x_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.upsert_own_x_profile(
  p_x_user_id text,
  p_x_username text,
  p_x_display_name text,
  p_x_avatar_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing_user uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'anonymous_not_allowed';
  END IF;

  IF p_x_user_id IS NULL OR btrim(p_x_user_id) = '' THEN
    RAISE EXCEPTION 'invalid_x_user_id';
  END IF;

  IF p_x_username IS NULL OR btrim(p_x_username) = '' THEN
    RAISE EXCEPTION 'invalid_x_username';
  END IF;

  SELECT user_id
  INTO v_existing_user
  FROM public.user_x_profiles
  WHERE x_user_id = btrim(p_x_user_id);

  IF v_existing_user IS NOT NULL AND v_existing_user <> v_uid THEN
    RAISE EXCEPTION 'x_account_already_linked';
  END IF;

  INSERT INTO public.user_x_profiles (
    user_id,
    x_user_id,
    x_username,
    x_display_name,
    x_avatar_url,
    x_connected_at,
    x_last_synced_at
  )
  VALUES (
    v_uid,
    btrim(p_x_user_id),
    btrim(p_x_username),
    nullif(btrim(coalesce(p_x_display_name, '')), ''),
    nullif(btrim(coalesce(p_x_avatar_url, '')), ''),
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    x_user_id = EXCLUDED.x_user_id,
    x_username = EXCLUDED.x_username,
    x_display_name = EXCLUDED.x_display_name,
    x_avatar_url = EXCLUDED.x_avatar_url,
    x_last_synced_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_own_x_profile(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_own_x_profile(text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_x_profile(p_user_id uuid)
RETURNS TABLE (
  x_username text,
  x_display_name text,
  x_avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    x_username,
    x_display_name,
    x_avatar_url
  FROM public.user_x_profiles
  WHERE user_id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_public_x_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_x_profile(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_x_profiles(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  x_username text,
  x_display_name text,
  x_avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    uxp.user_id,
    uxp.x_username,
    uxp.x_display_name,
    uxp.x_avatar_url
  FROM public.user_x_profiles uxp
  WHERE uxp.user_id = ANY(p_user_ids);
$$;

REVOKE ALL ON FUNCTION public.get_public_x_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_x_profiles(uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.anonymize_own_account_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_label text := '退会済みユーザー';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'anonymous_not_allowed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.account_anonymizations WHERE user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'already_anonymized';
  END IF;

  UPDATE public.developer_profiles
  SET
    public_name = v_label,
    profile = '',
    x_account = NULL,
    website = NULL,
    updated_at = now()
  WHERE user_id = v_uid;

  UPDATE public.projects
  SET
    owner_name = v_label,
    creator = v_label,
    updated_at = now()
  WHERE owner_id = v_uid;

  DELETE FROM public.project_bookmarks WHERE user_id = v_uid;
  DELETE FROM public.project_watches WHERE user_id = v_uid;
  DELETE FROM public.project_supports WHERE user_id = v_uid;
  DELETE FROM public.project_plays WHERE user_id = v_uid;
  DELETE FROM public.project_play_sessions WHERE user_id = v_uid;
  DELETE FROM public.user_notifications WHERE user_id = v_uid;
  DELETE FROM public.developer_follows
  WHERE follower_id = v_uid OR developer_user_id = v_uid;
  DELETE FROM public.user_x_profiles WHERE user_id = v_uid;

  INSERT INTO public.account_anonymizations (user_id)
  VALUES (v_uid);
END;
$$;

REVOKE ALL ON FUNCTION public.anonymize_own_account_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.anonymize_own_account_data() TO authenticated;

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
  author_x_username text,
  prompt_text text,
  body_text text,
  good_points text,
  concerns text,
  bugs text,
  other_notes text,
  empathy_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH registered_voice_cards AS (
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
        nullif(btrim(uxp.x_display_name), ''),
        'プレイヤー'
      ) AS author_display_name,
      coalesce(
        nullif(
          btrim(
            coalesce(
              au.raw_user_meta_data ->> 'avatar_url',
              au.raw_user_meta_data ->> 'picture'
            )
          ),
          ''
        ),
        nullif(btrim(uxp.x_avatar_url), '')
      ) AS author_avatar_url,
      nullif(btrim(uxp.x_username), '') AS author_x_username,
      vp.prompt_text,
      CASE
        WHEN vp.response_kind = 'short_text' THEN NULLIF(btrim(r.answer_value), '')
        ELSE NULLIF(btrim(coalesce(r.optional_comment, '')), '')
      END AS body_text,
      NULL::text AS good_points,
      NULL::text AS concerns,
      NULL::text AS bugs,
      NULL::text AS other_notes,
      0::bigint AS empathy_count
    FROM public.project_voice_responses r
    INNER JOIN public.project_version_prompts vp ON vp.id = r.prompt_id
    INNER JOIN auth.users au ON au.id = r.user_id
    LEFT JOIN public.user_x_profiles uxp ON uxp.user_id = r.user_id
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
      NULL::text AS author_display_name,
      NULL::text AS author_avatar_url,
      NULL::text AS author_x_username,
      vp.prompt_text,
      CASE
        WHEN vp.response_kind = 'short_text' THEN NULLIF(btrim(g.answer_value), '')
        ELSE NULLIF(btrim(coalesce(g.optional_comment, '')), '')
      END AS body_text,
      NULL::text AS good_points,
      NULL::text AS concerns,
      NULL::text AS bugs,
      NULL::text AS other_notes,
      0::bigint AS empathy_count
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
        nullif(btrim(uxp.x_display_name), ''),
        'プレイヤー'
      ) AS author_display_name,
      coalesce(
        nullif(
          btrim(
            coalesce(
              au.raw_user_meta_data ->> 'avatar_url',
              au.raw_user_meta_data ->> 'picture'
            )
          ),
          ''
        ),
        nullif(btrim(uxp.x_avatar_url), '')
      ) AS author_avatar_url,
      nullif(btrim(uxp.x_username), '') AS author_x_username,
      NULL::text AS prompt_text,
      NULL::text AS body_text,
      NULLIF(btrim(coalesce(f.good_points, '')), '') AS good_points,
      NULLIF(btrim(coalesce(f.concerns, '')), '') AS concerns,
      NULLIF(btrim(coalesce(f.bugs, '')), '') AS bugs,
      NULLIF(btrim(coalesce(f.other_notes, '')), '') AS other_notes,
      0::bigint AS empathy_count
    FROM public.project_feedback f
    INNER JOIN auth.users au ON au.id = f.user_id
    LEFT JOIN public.user_x_profiles uxp ON uxp.user_id = f.user_id
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
      NULL::text AS author_display_name,
      NULL::text AS author_avatar_url,
      NULL::text AS author_x_username,
      NULL::text AS prompt_text,
      NULL::text AS body_text,
      NULLIF(btrim(coalesce(gf.good_points, '')), '') AS good_points,
      NULLIF(btrim(coalesce(gf.concerns, '')), '') AS concerns,
      NULLIF(btrim(coalesce(gf.bugs, '')), '') AS bugs,
      NULLIF(btrim(coalesce(gf.other_notes, '')), '') AS other_notes,
      0::bigint AS empathy_count
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
  )
  SELECT
    c.card_id,
    c.card_kind,
    c.created_at,
    c.author_kind,
    c.author_display_name,
    c.author_avatar_url,
    c.author_x_username,
    c.prompt_text,
    c.body_text,
    c.good_points,
    c.concerns,
    c.bugs,
    c.other_notes,
    c.empathy_count
  FROM all_cards c
  WHERE EXISTS (
    SELECT 1 FROM public.projects pr
    WHERE pr.id::text = p_project_id AND pr.visibility = 'public'
  )
  ORDER BY c.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 100))
  OFFSET greatest(coalesce(p_offset, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_feedback_cards(text, text, boolean, integer, integer)
  TO anon, authenticated;

COMMIT;

-- Rollback (manual): DROP TABLE user_x_profiles CASCADE; restore anonymize + get_public_feedback_cards from 041.
