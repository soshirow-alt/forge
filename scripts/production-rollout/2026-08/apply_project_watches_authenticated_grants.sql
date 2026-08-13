-- Production / Staging APPLY (Owner manual): project_watches authenticated grants
-- Same as supabase/migrations/102_project_watches_authenticated_grants.sql
-- App uses INSERT (not upsert) for watches — UPDATE grant not required.
-- Do NOT run from Cursor against Production.

BEGIN;

GRANT SELECT, INSERT, DELETE ON TABLE public.project_watches TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.project_watches FROM anon;

COMMIT;
