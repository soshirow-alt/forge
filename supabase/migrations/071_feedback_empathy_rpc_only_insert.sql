-- 071: Close direct INSERT path on feedback_card_empathies (RPC-only writes)
-- Staging only. Prerequisite: 070
-- Client empathy create/remove must go through toggle_feedback_card_empathy (SECURITY DEFINER),
-- which resolves opaque card_id against visible public FB rows.

BEGIN;

DROP POLICY IF EXISTS "Registered users insert own empathies"
  ON public.feedback_card_empathies;

COMMENT ON TABLE public.feedback_card_empathies IS
  'Player empathy on public FB cards. Writes only via toggle_feedback_card_empathy RPC (no direct INSERT).';

COMMIT;
