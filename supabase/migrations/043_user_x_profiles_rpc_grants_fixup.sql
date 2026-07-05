-- 043: Fix RPC grants — upsert_own_x_profile / anonymize_own_account_data leaked anon EXECUTE
-- Prerequisite: 042 applied (user_x_profiles, upsert_own_x_profile, anonymize_own_account_data)
-- Dashboard apply: owner GO only (042 post-check NG remediation)

BEGIN;

REVOKE ALL ON FUNCTION public.upsert_own_x_profile(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_own_x_profile(text, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.upsert_own_x_profile(text, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_own_x_profile(text, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.anonymize_own_account_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.anonymize_own_account_data() FROM anon;
REVOKE ALL ON FUNCTION public.anonymize_own_account_data() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.anonymize_own_account_data() TO authenticated;

REVOKE ALL ON FUNCTION public.get_public_feedback_cards(text, text, boolean, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_feedback_cards(text, text, boolean, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_feedback_cards(text, text, boolean, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_feedback_cards(text, text, boolean, integer, integer)
  TO anon, authenticated;

COMMIT;
