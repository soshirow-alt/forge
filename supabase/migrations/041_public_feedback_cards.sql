-- 041: Public feedback cards — optional_comment split, moderation, reports, public RPC
-- Prerequisite: 001–040 applied on shared Supabase project (bpnisgzxuwdxelhnduuf)
-- Purpose:
--   - optional_comment on voice response tables + backfill from answer_label "label — comment"
--   - moderation_status / hidden_* / report_count on all 4 feedback tables
--   - feedback_reports (4 target_source values; API service role only — no client INSERT)
--   - feedback_public_card_id() + resolve_feedback_card_id() + get_public_feedback_cards()
--   - get_public_voice_aggregates: merge buckets by answer_value; sum per-source counts (registered + guest)
-- Schema (001/002/006/040): projects.id uuid; FB tables project_id text; guest include_in_public_aggregate boolean (040)
-- Visibility: pr.id::text = p_project_id — same pattern as 006/040 RPCs
-- Apply: Supabase Dashboard SQL Editor when owner GO/RUN (shared prod DB — Preview uses same DB)
-- NOT applied automatically. Do NOT run until Phase 1 owner GO.

BEGIN;

-- ---------------------------------------------------------------------------
-- A. optional_comment on voice tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.project_voice_responses
  ADD COLUMN IF NOT EXISTS optional_comment text NULL;

ALTER TABLE public.project_voice_responses
  DROP CONSTRAINT IF EXISTS project_voice_responses_optional_comment_len;
ALTER TABLE public.project_voice_responses
  ADD CONSTRAINT project_voice_responses_optional_comment_len
  CHECK (optional_comment IS NULL OR char_length(optional_comment) <= 2000);

ALTER TABLE public.project_guest_voice_responses
  ADD COLUMN IF NOT EXISTS optional_comment text NULL;

ALTER TABLE public.project_guest_voice_responses
  DROP CONSTRAINT IF EXISTS project_guest_voice_responses_optional_comment_len;
ALTER TABLE public.project_guest_voice_responses
  ADD CONSTRAINT project_guest_voice_responses_optional_comment_len
  CHECK (optional_comment IS NULL OR char_length(optional_comment) <= 2000);

-- Backfill: buildVoiceAnswerLabel() uses "label — comment" (em dash surrounded by spaces)
UPDATE public.project_voice_responses
SET
  optional_comment = trim(substring(answer_label FROM position(' — ' IN answer_label) + 3)),
  answer_label = trim(substring(answer_label FROM 1 FOR position(' — ' IN answer_label) - 1))
WHERE answer_label IS NOT NULL
  AND position(' — ' IN answer_label) > 0
  AND optional_comment IS NULL;

UPDATE public.project_guest_voice_responses
SET
  optional_comment = trim(substring(answer_label FROM position(' — ' IN answer_label) + 3)),
  answer_label = trim(substring(answer_label FROM 1 FOR position(' — ' IN answer_label) - 1))
WHERE answer_label IS NOT NULL
  AND position(' — ' IN answer_label) > 0
  AND optional_comment IS NULL;

COMMENT ON COLUMN public.project_voice_responses.optional_comment IS
  'Optional free-text supplement. Public card shows this (not the choice label).';
COMMENT ON COLUMN public.project_guest_voice_responses.optional_comment IS
  'Optional free-text supplement. Public card shows this (not the choice label).';

-- ---------------------------------------------------------------------------
-- B. Moderation columns on all 4 feedback tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.project_voice_responses
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS hidden_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason text NULL,
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.project_guest_voice_responses
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS hidden_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason text NULL,
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.project_feedback
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS hidden_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason text NULL,
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.project_guest_feedback
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS hidden_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason text NULL,
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.project_voice_responses
  DROP CONSTRAINT IF EXISTS project_voice_responses_moderation_status_check;
ALTER TABLE public.project_voice_responses
  ADD CONSTRAINT project_voice_responses_moderation_status_check
  CHECK (moderation_status IN ('visible', 'hidden'));

ALTER TABLE public.project_guest_voice_responses
  DROP CONSTRAINT IF EXISTS project_guest_voice_responses_moderation_status_check;
ALTER TABLE public.project_guest_voice_responses
  ADD CONSTRAINT project_guest_voice_responses_moderation_status_check
  CHECK (moderation_status IN ('visible', 'hidden'));

ALTER TABLE public.project_feedback
  DROP CONSTRAINT IF EXISTS project_feedback_moderation_status_check;
ALTER TABLE public.project_feedback
  ADD CONSTRAINT project_feedback_moderation_status_check
  CHECK (moderation_status IN ('visible', 'hidden'));

ALTER TABLE public.project_guest_feedback
  DROP CONSTRAINT IF EXISTS project_guest_feedback_moderation_status_check;
ALTER TABLE public.project_guest_feedback
  ADD CONSTRAINT project_guest_feedback_moderation_status_check
  CHECK (moderation_status IN ('visible', 'hidden'));

ALTER TABLE public.project_voice_responses
  DROP CONSTRAINT IF EXISTS project_voice_responses_report_count_nonneg;
ALTER TABLE public.project_voice_responses
  ADD CONSTRAINT project_voice_responses_report_count_nonneg
  CHECK (report_count >= 0);

ALTER TABLE public.project_guest_voice_responses
  DROP CONSTRAINT IF EXISTS project_guest_voice_responses_report_count_nonneg;
ALTER TABLE public.project_guest_voice_responses
  ADD CONSTRAINT project_guest_voice_responses_report_count_nonneg
  CHECK (report_count >= 0);

ALTER TABLE public.project_feedback
  DROP CONSTRAINT IF EXISTS project_feedback_report_count_nonneg;
ALTER TABLE public.project_feedback
  ADD CONSTRAINT project_feedback_report_count_nonneg
  CHECK (report_count >= 0);

ALTER TABLE public.project_guest_feedback
  DROP CONSTRAINT IF EXISTS project_guest_feedback_report_count_nonneg;
ALTER TABLE public.project_guest_feedback
  ADD CONSTRAINT project_guest_feedback_report_count_nonneg
  CHECK (report_count >= 0);

-- ---------------------------------------------------------------------------
-- C. feedback_reports — API (service role) only; 4 target_source values
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  target_source text NOT NULL CHECK (
    target_source IN (
      'registered_voice',
      'guest_voice',
      'registered_detailed',
      'guest_detailed'
    )
  ),
  target_id uuid NOT NULL,
  card_id text NOT NULL,
  reason_code text NOT NULL CHECK (
    reason_code IN ('harassment', 'personal_info', 'spam', 'inappropriate', 'other')
  ),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 500),
  project_id text NOT NULL,
  version_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS feedback_reports_reporter_target_idx
  ON public.feedback_reports (reporter_id, target_source, target_id);

CREATE INDEX IF NOT EXISTS feedback_reports_target_idx
  ON public.feedback_reports (target_source, target_id);

CREATE INDEX IF NOT EXISTS feedback_reports_project_created_idx
  ON public.feedback_reports (project_id, created_at DESC);

COMMENT ON TABLE public.feedback_reports IS
  'Player reports on public feedback cards. Written via POST /api/feedback/report (service role). No client INSERT.';

ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;

-- No INSERT/SELECT policies for authenticated/anon — service role bypasses RLS.

-- ---------------------------------------------------------------------------
-- D. Opaque card_id helpers (md5 — no extension required)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.feedback_public_card_id(
  p_target_source text,
  p_target_id uuid
)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT 'fc1_' || substr(md5(p_target_source || ':' || p_target_id::text), 1, 32);
$$;

COMMENT ON FUNCTION public.feedback_public_card_id(text, uuid) IS
  'Deterministic opaque card_id for public UI and report API. Does not expose row UUID.';

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
GRANT EXECUTE ON FUNCTION public.resolve_feedback_card_id(text, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- E. get_public_feedback_cards — public read via RPC only
-- ---------------------------------------------------------------------------
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
      0::bigint AS empathy_count
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
      0::bigint AS empathy_count
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

-- ---------------------------------------------------------------------------
-- F. Aggregates — GROUP BY answer_value only (optional_comment split)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_public_voice_aggregates(text, text, boolean);

CREATE OR REPLACE FUNCTION public.get_public_voice_aggregates(
  p_project_id text,
  p_version_key text,
  p_include_guest boolean DEFAULT true
)
RETURNS TABLE (
  prompt_id uuid,
  prompt_text text,
  response_kind text,
  options jsonb,
  sort_order smallint,
  source text,
  answer_value text,
  answer_label text,
  response_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bucketed_responses AS (
    SELECT
      r.prompt_id,
      r.answer_value,
      max(r.answer_label) AS answer_label,
      count(*)::bigint AS response_count
    FROM public.project_voice_responses r
    INNER JOIN public.project_version_prompts vp ON vp.id = r.prompt_id
    WHERE r.project_id = p_project_id
      AND r.version_key = p_version_key
      AND r.moderation_status = 'visible'
      AND vp.response_kind <> 'short_text'
    GROUP BY r.prompt_id, r.answer_value

    UNION ALL

    SELECT
      g.prompt_id,
      g.answer_value,
      max(g.answer_label) AS answer_label,
      count(*)::bigint AS response_count
    FROM public.project_guest_voice_responses g
    INNER JOIN public.project_version_prompts vp ON vp.id = g.prompt_id
    WHERE g.project_id = p_project_id
      AND g.version_key = p_version_key
      AND g.include_in_public_aggregate = true
      AND g.moderation_status = 'visible'
      AND p_include_guest = true
      AND vp.response_kind <> 'short_text'
    GROUP BY g.prompt_id, g.answer_value
  ),
  short_text_responses AS (
    SELECT r.prompt_id
    FROM public.project_voice_responses r
    INNER JOIN public.project_version_prompts vp ON vp.id = r.prompt_id
    WHERE r.project_id = p_project_id
      AND r.version_key = p_version_key
      AND r.moderation_status = 'visible'
      AND vp.response_kind = 'short_text'

    UNION ALL

    SELECT g.prompt_id
    FROM public.project_guest_voice_responses g
    INNER JOIN public.project_version_prompts vp ON vp.id = g.prompt_id
    WHERE g.project_id = p_project_id
      AND g.version_key = p_version_key
      AND g.include_in_public_aggregate = true
      AND g.moderation_status = 'visible'
      AND p_include_guest = true
      AND vp.response_kind = 'short_text'
  ),
  bucketed_rows AS (
    SELECT
      p.id AS prompt_id,
      p.prompt_text,
      p.response_kind,
      p.options,
      p.sort_order,
      p.source,
      br.answer_value,
      max(br.answer_label) AS answer_label,
      sum(br.response_count)::bigint AS response_count
    FROM public.project_version_prompts p
    INNER JOIN bucketed_responses br ON br.prompt_id = p.id
    WHERE p.project_id = p_project_id
      AND p.version_key = p_version_key
      AND p.response_kind <> 'short_text'
      AND (
        p.archived_at IS NULL
        OR EXISTS (
          SELECT 1 FROM public.project_voice_responses rv WHERE rv.prompt_id = p.id
        )
        OR EXISTS (
          SELECT 1 FROM public.project_guest_voice_responses gv WHERE gv.prompt_id = p.id
        )
      )
      AND EXISTS (
        SELECT 1 FROM public.projects pr
        WHERE pr.id::text = p_project_id AND pr.visibility = 'public'
      )
    GROUP BY
      p.id,
      p.prompt_text,
      p.response_kind,
      p.options,
      p.sort_order,
      p.source,
      br.answer_value
  ),
  short_text_rows AS (
    SELECT
      p.id AS prompt_id,
      p.prompt_text,
      p.response_kind,
      p.options,
      p.sort_order,
      p.source,
      NULL::text AS answer_value,
      NULL::text AS answer_label,
      COUNT(str.prompt_id)::bigint AS response_count
    FROM public.project_version_prompts p
    LEFT JOIN short_text_responses str ON str.prompt_id = p.id
    WHERE p.project_id = p_project_id
      AND p.version_key = p_version_key
      AND p.response_kind = 'short_text'
      AND (
        p.archived_at IS NULL
        OR EXISTS (
          SELECT 1 FROM public.project_voice_responses rv WHERE rv.prompt_id = p.id
        )
        OR EXISTS (
          SELECT 1 FROM public.project_guest_voice_responses gv WHERE gv.prompt_id = p.id
        )
      )
      AND EXISTS (
        SELECT 1 FROM public.projects pr
        WHERE pr.id::text = p_project_id AND pr.visibility = 'public'
      )
    GROUP BY
      p.id,
      p.prompt_text,
      p.response_kind,
      p.options,
      p.sort_order,
      p.source,
      p.archived_at,
      p.created_at
    HAVING COUNT(str.prompt_id) > 0
  )
  SELECT * FROM bucketed_rows
  UNION ALL
  SELECT * FROM short_text_rows
  ORDER BY sort_order ASC, response_count DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_voice_aggregates(text, text, boolean)
  TO anon, authenticated;

COMMIT;
