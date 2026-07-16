-- 072: registered voice answer_value max length 1000
-- Staging only until owner applies (vuqpwvjvgyxffmvpfrxo). Do not apply to Production from Cursor.
-- Prerequisite: 070, 071
--
-- Aligns DB with FEEDBACK_FREE_TEXT_MAX / app upsertVoiceResponses checks.
-- Guest answer_value already capped in 070 (project_guest_voice_responses_answer_value_len).
-- optional_comment already capped in 071. project_feedback detailed fields unchanged (2000).
--
-- Before apply (Staging AND future Production) — read-only, do NOT truncate/UPDATE:
--   SELECT count(*) AS over_1000,
--          coalesce(max(char_length(answer_value)), 0) AS max_len
--   FROM public.project_voice_responses
--   WHERE char_length(answer_value) > 1000;
-- If over_1000 > 0, do not apply until rows are resolved manually.
-- This migration also aborts (EXCEPTION) if such rows exist — no silent rewrite.
--
-- Choice / yes_no / scale_3 answer_value values are short option ids (≪1000);
-- uniform CHECK does not change their semantics.

BEGIN;

DO $$
DECLARE
  v_count integer;
  v_max integer;
BEGIN
  SELECT count(*)::integer,
         coalesce(max(char_length(answer_value)), 0)::integer
  INTO v_count, v_max
  FROM public.project_voice_responses
  WHERE char_length(answer_value) > 1000;

  IF v_count > 0 THEN
    RAISE EXCEPTION
      '072 blocked: project_voice_responses.answer_value > 1000 exists (count=% max=%). Resolve manually; migration does not truncate.',
      v_count, v_max;
  END IF;
END $$;

ALTER TABLE public.project_voice_responses
  DROP CONSTRAINT IF EXISTS project_voice_responses_answer_value_len;

ALTER TABLE public.project_voice_responses
  ADD CONSTRAINT project_voice_responses_answer_value_len
  CHECK (char_length(answer_value) <= 1000);

COMMENT ON CONSTRAINT project_voice_responses_answer_value_len
  ON public.project_voice_responses IS
  'Free-text short_text and option ids share answer_value; max 1000 matches FEEDBACK_FREE_TEXT_MAX. Enforced in app + DB.';

COMMIT;
