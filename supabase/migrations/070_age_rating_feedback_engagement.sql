-- 070: age_rating + public FB empathy / helpful / replies + free-text length
-- Staging only (vuqpwvjvgyxffmvpfrxo). Do not apply to Production from Cursor.
-- Prerequisite: 041 (public feedback cards), 016 (helpful marks), 044 (notification types)

BEGIN;

-- ---------------------------------------------------------------------------
-- A. projects.age_rating (not a genre)
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS age_rating text NOT NULL DEFAULT 'general';

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_age_rating_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_age_rating_check
  CHECK (age_rating IN ('general', 'r18'));

UPDATE public.projects
SET age_rating = 'general'
WHERE age_rating IS NULL OR age_rating NOT IN ('general', 'r18');

COMMENT ON COLUMN public.projects.age_rating IS
  'Content age band (not genre). general | r18. Self-declared player gate for r18.';

-- ---------------------------------------------------------------------------
-- B. Free-text FB length: guest short_text answer_value 500 → 1000
-- ---------------------------------------------------------------------------
ALTER TABLE public.project_guest_voice_responses
  DROP CONSTRAINT IF EXISTS project_guest_voice_responses_answer_value_len;
ALTER TABLE public.project_guest_voice_responses
  ADD CONSTRAINT project_guest_voice_responses_answer_value_len
  CHECK (char_length(answer_value) BETWEEN 1 AND 1000);

-- ---------------------------------------------------------------------------
-- C. Extend helpful marks for guest public-card sources (reuse SoT)
-- ---------------------------------------------------------------------------
ALTER TABLE public.developer_feedback_helpful_marks
  DROP CONSTRAINT IF EXISTS developer_feedback_helpful_marks_source_type_check;

ALTER TABLE public.developer_feedback_helpful_marks
  ADD CONSTRAINT developer_feedback_helpful_marks_source_type_check
  CHECK (
    source_type IN (
      'voice_response',
      'project_feedback',
      'guest_voice_response',
      'guest_project_feedback'
    )
  );

-- Public read of mark presence is via SECURITY DEFINER RPC only.
-- Keep existing owner-only SELECT for Studio management.

-- ---------------------------------------------------------------------------
-- D. feedback_card_empathies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_card_empathies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  target_source text NOT NULL CHECK (
    target_source IN (
      'registered_voice',
      'guest_voice',
      'registered_detailed',
      'guest_detailed'
    )
  ),
  target_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_card_empathies_user_target_unique
    UNIQUE (user_id, target_source, target_id)
);

CREATE INDEX IF NOT EXISTS feedback_card_empathies_target_idx
  ON public.feedback_card_empathies (target_source, target_id);

CREATE INDEX IF NOT EXISTS feedback_card_empathies_project_idx
  ON public.feedback_card_empathies (project_id, created_at DESC);

COMMENT ON TABLE public.feedback_card_empathies IS
  'Player empathy on public FB cards. Keyed by same target_source/target_id as feedback_reports.';

ALTER TABLE public.feedback_card_empathies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Registered users read empathies on public projects"
  ON public.feedback_card_empathies;
CREATE POLICY "Registered users read empathies on public projects"
  ON public.feedback_card_empathies FOR SELECT
  USING (
    public.auth_is_registered_user()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id
        AND (p.visibility = 'public' OR p.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Registered users insert own empathies"
  ON public.feedback_card_empathies;
CREATE POLICY "Registered users insert own empathies"
  ON public.feedback_card_empathies FOR INSERT
  WITH CHECK (
    public.auth_is_registered_user()
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS "Registered users delete own empathies"
  ON public.feedback_card_empathies;
CREATE POLICY "Registered users delete own empathies"
  ON public.feedback_card_empathies FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- E. feedback_card_replies (1-hop only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_card_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  target_source text NOT NULL CHECK (
    target_source IN (
      'registered_voice',
      'guest_voice',
      'registered_detailed',
      'guest_detailed'
    )
  ),
  target_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_card_replies_body_len
    CHECK (char_length(body) BETWEEN 1 AND 200)
);

CREATE INDEX IF NOT EXISTS feedback_card_replies_target_created_idx
  ON public.feedback_card_replies (target_source, target_id, created_at ASC);

CREATE INDEX IF NOT EXISTS feedback_card_replies_project_idx
  ON public.feedback_card_replies (project_id, created_at DESC);

COMMENT ON TABLE public.feedback_card_replies IS
  'One-hop replies under a public FB card. Authors: card author (registered) or project owner.';

ALTER TABLE public.feedback_card_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read replies on public or owned projects"
  ON public.feedback_card_replies;
CREATE POLICY "Read replies on public or owned projects"
  ON public.feedback_card_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id
        AND (p.visibility = 'public' OR p.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authors delete own replies"
  ON public.feedback_card_replies;
CREATE POLICY "Authors delete own replies"
  ON public.feedback_card_replies FOR DELETE
  USING (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
  );

-- INSERT is via SECURITY DEFINER RPC only (author/owner checks).
-- No direct INSERT policy for clients.

-- ---------------------------------------------------------------------------
-- F. Cleanup orphans when parent FB rows are deleted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_feedback_card_side_tables()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source text;
BEGIN
  v_source := TG_ARGV[0];
  DELETE FROM public.feedback_card_empathies
  WHERE target_source = v_source AND target_id = OLD.id;
  DELETE FROM public.feedback_card_replies
  WHERE target_source = v_source AND target_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS project_voice_responses_cleanup_card_side
  ON public.project_voice_responses;
CREATE TRIGGER project_voice_responses_cleanup_card_side
  AFTER DELETE ON public.project_voice_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_feedback_card_side_tables('registered_voice');

DROP TRIGGER IF EXISTS project_guest_voice_responses_cleanup_card_side
  ON public.project_guest_voice_responses;
CREATE TRIGGER project_guest_voice_responses_cleanup_card_side
  AFTER DELETE ON public.project_guest_voice_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_feedback_card_side_tables('guest_voice');

DROP TRIGGER IF EXISTS project_feedback_cleanup_card_side
  ON public.project_feedback;
CREATE TRIGGER project_feedback_cleanup_card_side
  AFTER DELETE ON public.project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_feedback_card_side_tables('registered_detailed');

DROP TRIGGER IF EXISTS project_guest_feedback_cleanup_card_side
  ON public.project_guest_feedback;
CREATE TRIGGER project_guest_feedback_cleanup_card_side
  AFTER DELETE ON public.project_guest_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_feedback_card_side_tables('guest_detailed');

-- ---------------------------------------------------------------------------
-- G. Notification type: feedback_reply
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_notifications
  DROP CONSTRAINT IF EXISTS user_notifications_type_check;

ALTER TABLE public.user_notifications
  ADD CONSTRAINT user_notifications_type_check
  CHECK (
    type IN (
      'devlog',
      'version_published',
      'voice_received',
      'confirmation_request',
      'project_watched',
      'followed_developer_new_project',
      'followed_developer_released_project',
      'feedback_reply'
    )
  );

-- Allow SECURITY DEFINER trigger / RPC to insert feedback_reply (bypass via owner of function).
-- Existing insert policies unchanged; RPC uses SECURITY DEFINER.

-- ---------------------------------------------------------------------------
-- H. Helpers: resolve card + author/owner
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.feedback_card_author_user_id(
  p_target_source text,
  p_target_id uuid
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE p_target_source
    WHEN 'registered_voice' THEN (
      SELECT r.user_id FROM public.project_voice_responses r WHERE r.id = p_target_id
    )
    WHEN 'registered_detailed' THEN (
      SELECT f.user_id FROM public.project_feedback f WHERE f.id = p_target_id
    )
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.feedback_card_is_visible_public(
  p_project_id text,
  p_version_key text,
  p_target_source text,
  p_target_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.projects pr
    WHERE pr.id::text = p_project_id AND pr.visibility = 'public'
  ) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.resolve_feedback_card_id(
      public.feedback_public_card_id(p_target_source, p_target_id),
      p_project_id,
      p_version_key
    ) r
    WHERE r.target_source = p_target_source AND r.target_id = p_target_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.helpful_source_type_from_card_source(p_source text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_source
    WHEN 'registered_voice' THEN 'voice_response'
    WHEN 'registered_detailed' THEN 'project_feedback'
    WHEN 'guest_voice' THEN 'guest_voice_response'
    WHEN 'guest_detailed' THEN 'guest_project_feedback'
    ELSE NULL
  END;
$$;

-- ---------------------------------------------------------------------------
-- I. Replace get_public_feedback_cards with empathy/reply/helpful enrichment
-- ---------------------------------------------------------------------------
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
      NULL::text AS author_display_name,
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
      NULL::text AS author_display_name,
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
  TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- J. toggle empathy
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
GRANT EXECUTE ON FUNCTION public.toggle_feedback_card_empathy(text, text, text)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- K. toggle helpful (owner only) — reuses developer_feedback_helpful_marks
-- ---------------------------------------------------------------------------
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
GRANT EXECUTE ON FUNCTION public.toggle_feedback_card_helpful(text, text, text)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- L. Replies list / create / delete
-- ---------------------------------------------------------------------------
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

  -- Also allow owner to list on non-public? resolve requires public. OK for public tab.
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

  -- Notify the other party (never self)
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
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  DELETE FROM public.feedback_card_replies r
  WHERE r.id = p_reply_id AND r.author_id = v_uid;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_feedback_card_reply(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_feedback_card_reply(uuid)
  TO authenticated;

COMMIT;
