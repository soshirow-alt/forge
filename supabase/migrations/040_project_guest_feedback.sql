-- 040: Guest feedback tables (Phase 1) + public aggregate guest inclusion
-- Prerequisite: 001–039 applied
-- Purpose:
--   - project_guest_voice_responses / project_guest_feedback (no user_id)
--   - Client INSERT forbidden — API + service role only
--   - Extend get_public_voice_aggregates with p_include_guest
--   - short_text responses: public aggregate is count-only (no answer text)
-- Notes:
--   - Does NOT modify project_voice_responses / project_feedback / 038 / 039
--   - Does NOT touch project_plays / project_play_sessions / witness / notifications
-- Apply: Supabase Dashboard SQL Editor (Preview first). Not applied automatically.

BEGIN;

-- ---------------------------------------------------------------------------
-- A. project_guest_voice_responses (初声 / 問い回答)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_guest_voice_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  version_key text NOT NULL,
  prompt_id uuid NOT NULL REFERENCES public.project_version_prompts (id) ON DELETE CASCADE,
  answer_value text NOT NULL,
  answer_label text NULL,
  submitter_key uuid NOT NULL,
  include_in_public_aggregate boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_guest_voice_responses_answer_value_len
    CHECK (char_length(answer_value) BETWEEN 1 AND 500),
  CONSTRAINT project_guest_voice_responses_answer_label_len
    CHECK (answer_label IS NULL OR char_length(answer_label) <= 500)
);

CREATE UNIQUE INDEX IF NOT EXISTS project_guest_voice_responses_submitter_prompt_idx
  ON public.project_guest_voice_responses (submitter_key, prompt_id);

CREATE INDEX IF NOT EXISTS project_guest_voice_responses_project_version_idx
  ON public.project_guest_voice_responses (project_id, version_key, created_at DESC);

CREATE INDEX IF NOT EXISTS project_guest_voice_responses_prompt_idx
  ON public.project_guest_voice_responses (prompt_id);

-- ---------------------------------------------------------------------------
-- B. project_guest_feedback (詳しい感想)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_guest_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  version_key text NOT NULL,
  good_points text NULL,
  concerns text NULL,
  bugs text NULL,
  other_notes text NULL,
  focus_response text NULL,
  would_replay text NULL CHECK (would_replay IN ('yes', 'maybe', 'no')),
  submitter_key uuid NOT NULL,
  include_in_public_aggregate boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_guest_feedback_good_points_len
    CHECK (good_points IS NULL OR char_length(good_points) <= 2000),
  CONSTRAINT project_guest_feedback_concerns_len
    CHECK (concerns IS NULL OR char_length(concerns) <= 2000),
  CONSTRAINT project_guest_feedback_bugs_len
    CHECK (bugs IS NULL OR char_length(bugs) <= 2000),
  CONSTRAINT project_guest_feedback_other_notes_len
    CHECK (other_notes IS NULL OR char_length(other_notes) <= 2000),
  CONSTRAINT project_guest_feedback_focus_response_len
    CHECK (focus_response IS NULL OR char_length(focus_response) <= 2000),
  CONSTRAINT project_guest_feedback_has_content CHECK (
    NULLIF(btrim(coalesce(good_points, '')), '') IS NOT NULL
    OR NULLIF(btrim(coalesce(concerns, '')), '') IS NOT NULL
    OR NULLIF(btrim(coalesce(bugs, '')), '') IS NOT NULL
    OR NULLIF(btrim(coalesce(other_notes, '')), '') IS NOT NULL
    OR NULLIF(btrim(coalesce(focus_response, '')), '') IS NOT NULL
    OR would_replay IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS project_guest_feedback_submitter_project_version_idx
  ON public.project_guest_feedback (submitter_key, project_id, version_key);

CREATE INDEX IF NOT EXISTS project_guest_feedback_project_version_idx
  ON public.project_guest_feedback (project_id, version_key, created_at DESC);

-- ---------------------------------------------------------------------------
-- C. API rate-limit audit (hashed IP; no raw IP stored)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guest_feedback_rate_events (
  id bigserial PRIMARY KEY,
  ip_hash text NOT NULL,
  project_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('voice', 'detailed', 'submitter_bootstrap')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guest_feedback_rate_events_ip_created_idx
  ON public.guest_feedback_rate_events (ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS guest_feedback_rate_events_project_created_idx
  ON public.guest_feedback_rate_events (project_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- D. updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_guest_feedback_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_guest_voice_responses_set_updated_at
  ON public.project_guest_voice_responses;
CREATE TRIGGER project_guest_voice_responses_set_updated_at
  BEFORE UPDATE ON public.project_guest_voice_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_guest_feedback_updated_at();

DROP TRIGGER IF EXISTS project_guest_feedback_set_updated_at
  ON public.project_guest_feedback;
CREATE TRIGGER project_guest_feedback_set_updated_at
  BEFORE UPDATE ON public.project_guest_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.set_guest_feedback_updated_at();

-- ---------------------------------------------------------------------------
-- E. RLS — owner read only; no client write
-- ---------------------------------------------------------------------------
ALTER TABLE public.project_guest_voice_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_guest_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_feedback_rate_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owners read guest voice responses"
  ON public.project_guest_voice_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners read guest feedback"
  ON public.project_guest_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = project_id
        AND p.owner_id = auth.uid()
    )
  );

COMMENT ON TABLE public.project_guest_voice_responses IS
  'Guest first-voice answers. No user_id. Written via API service role only.';
COMMENT ON TABLE public.project_guest_feedback IS
  'Guest detailed feedback. No user_id. Written via API service role only.';
COMMENT ON COLUMN public.project_guest_voice_responses.submitter_key IS
  'Abuse-prevention opaque key (cookie). Not linked to accounts on login.';
COMMENT ON COLUMN public.project_guest_voice_responses.include_in_public_aggregate IS
  'When false, excluded from public aggregate RPC even if p_include_guest=true.';

-- ---------------------------------------------------------------------------
-- F. Public aggregates — p_include_guest + short_text count-only
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_public_voice_aggregates(text, text);

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
      r.answer_label
    FROM public.project_voice_responses r
    INNER JOIN public.project_version_prompts vp ON vp.id = r.prompt_id
    WHERE r.project_id = p_project_id
      AND r.version_key = p_version_key
      AND vp.response_kind <> 'short_text'

    UNION ALL

    SELECT
      g.prompt_id,
      g.answer_value,
      g.answer_label
    FROM public.project_guest_voice_responses g
    INNER JOIN public.project_version_prompts vp ON vp.id = g.prompt_id
    WHERE g.project_id = p_project_id
      AND g.version_key = p_version_key
      AND g.include_in_public_aggregate = true
      AND p_include_guest = true
      AND vp.response_kind <> 'short_text'
  ),
  short_text_responses AS (
    SELECT r.prompt_id
    FROM public.project_voice_responses r
    INNER JOIN public.project_version_prompts vp ON vp.id = r.prompt_id
    WHERE r.project_id = p_project_id
      AND r.version_key = p_version_key
      AND vp.response_kind = 'short_text'

    UNION ALL

    SELECT g.prompt_id
    FROM public.project_guest_voice_responses g
    INNER JOIN public.project_version_prompts vp ON vp.id = g.prompt_id
    WHERE g.project_id = p_project_id
      AND g.version_key = p_version_key
      AND g.include_in_public_aggregate = true
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
      br.answer_label,
      COUNT(br.answer_value)::bigint AS response_count
    FROM public.project_version_prompts p
    LEFT JOIN bucketed_responses br ON br.prompt_id = p.id
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
      p.archived_at,
      p.created_at,
      br.answer_value,
      br.answer_label
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
