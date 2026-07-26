-- 082: Ensure service_role can write guest feedback tables (API path).
-- Preview/Staging guest FB POST failed with 42501 permission denied.
-- RLS remains enabled; service_role bypasses RLS but still needs table GRANTs.
-- Safe / idempotent.

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_guest_feedback
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_guest_voice_responses
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.guest_feedback_rate_events
  TO service_role;

COMMIT;
