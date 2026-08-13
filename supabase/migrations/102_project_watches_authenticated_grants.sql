-- 102: Restore authenticated DML grants on project_watches
-- Staging (2026-08 audit): authenticated had SELECT but lacked INSERT/DELETE,
-- so watch toggle failed while owner fanout SELECT still partially worked.
-- RLS policies already restrict rows to auth.uid() / owned projects (002/039).
-- Owner applies to Staging + Production manually. Cursor does not apply Production.

BEGIN;

GRANT SELECT, INSERT, DELETE ON TABLE public.project_watches TO authenticated;

-- Keep anon without DML (guest cannot watch).
REVOKE INSERT, UPDATE, DELETE ON TABLE public.project_watches FROM anon;

COMMIT;
