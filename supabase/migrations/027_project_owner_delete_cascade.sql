-- 027: Project owner delete — witness grants / release events CASCADE
-- Problem: DELETE projects CASCADE into project_witness_grants hit append-only
-- BEFORE DELETE trigger; child tables with RLS had no DELETE policy for owners.
-- Prerequisite: 014, 013 applied

BEGIN;

-- Append-only: block UPDATE only (DELETE allowed via RLS when owner deletes project)
CREATE OR REPLACE FUNCTION public.prevent_witness_grant_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'project_witness_grants is append-only';
END;
$$;

DROP TRIGGER IF EXISTS project_witness_grants_no_update
  ON public.project_witness_grants;

CREATE TRIGGER project_witness_grants_no_update
  BEFORE UPDATE ON public.project_witness_grants
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_witness_grant_mutation();

DROP POLICY IF EXISTS "Project owners delete witness grants for own projects"
  ON public.project_witness_grants;

CREATE POLICY "Project owners delete witness grants for own projects"
  ON public.project_witness_grants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners delete release events for own projects"
  ON public.project_release_events;

CREATE POLICY "Project owners delete release events for own projects"
  ON public.project_release_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
  );

COMMIT;
