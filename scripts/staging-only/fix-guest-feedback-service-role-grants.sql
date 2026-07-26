-- STAGING ONLY — restore service_role GRANTs for guest feedback writes
-- Target: vuqpwvjvgyxffmvpfrxo
-- Symptom: Preview POST /api/projects/.../guest-feedback → 42501
--   permission denied for table project_guest_feedback
-- Safe to re-run.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_guest_feedback
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_guest_voice_responses
  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.guest_feedback_rate_events
  TO service_role;

-- Confirm (Dashboard SQL, as postgres/service):
-- SELECT has_table_privilege('service_role', 'public.project_guest_feedback', 'INSERT');
-- Expect: true
