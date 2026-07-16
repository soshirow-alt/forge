-- 071: feedback_card_empathies を RPC 専用 DML に固定
-- Staging only (vuqpwvjvgyxffmvpfrxo). Do not apply to Production from Cursor.
-- Prerequisite: 070_age_rating_feedback_engagement.sql
--
-- 方針:
--   - 共感の追加／解除は toggle_feedback_card_empathy (SECURITY DEFINER) のみ
--   - 公開件数／viewer 状態は get_public_feedback_cards 経由
--   - anon / authenticated からの直接 SELECT / INSERT / UPDATE / DELETE を不可にする
--   - 将来 GRANT が戻っても RLS policy が直接書き込みを許さない
--   - service_role は運用・verify 用に最小 DML を維持（UPDATE は不要）

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Align free-text DB caps with FEEDBACK_FREE_TEXT_MAX (1000)
--    (070 raised guest answer_value; optional_comment was still 2000)
-- ---------------------------------------------------------------------------
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
-- A. Drop all direct-access policies (SELECT / INSERT / DELETE)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Registered users read empathies on public projects"
  ON public.feedback_card_empathies;

DROP POLICY IF EXISTS "Registered users insert own empathies"
  ON public.feedback_card_empathies;

DROP POLICY IF EXISTS "Registered users delete own empathies"
  ON public.feedback_card_empathies;

-- ---------------------------------------------------------------------------
-- B. Revoke client table privileges (defense in depth vs future GRANT drift)
-- ---------------------------------------------------------------------------
REVOKE ALL ON TABLE public.feedback_card_empathies FROM PUBLIC;
REVOKE ALL ON TABLE public.feedback_card_empathies FROM anon;
REVOKE ALL ON TABLE public.feedback_card_empathies FROM authenticated;

-- ---------------------------------------------------------------------------
-- C. service_role: keep minimal ops privileges (no UPDATE)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, DELETE ON TABLE public.feedback_card_empathies TO service_role;

COMMENT ON TABLE public.feedback_card_empathies IS
  'Player empathy on public FB cards. Client writes only via toggle_feedback_card_empathy RPC; public counts/viewer state via get_public_feedback_cards. No direct anon/authenticated DML/SELECT.';

-- toggle RPC grants already set in 070; re-assert EXECUTE for authenticated only
REVOKE ALL ON FUNCTION public.toggle_feedback_card_empathy(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_feedback_card_empathy(text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.toggle_feedback_card_empathy(text, text, text)
  TO authenticated, service_role;

COMMIT;
