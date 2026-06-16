-- 013: project_release_events — 正式版宣言の immutable 履歴
-- Prerequisite: 001–012 applied
-- Design: docs/official-release-design.md

BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS release_status text NOT NULL DEFAULT 'in_development'
  CHECK (release_status IN ('in_development', 'released', 'release_reopened'));

CREATE TABLE IF NOT EXISTS public.project_release_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('released', 'release_reopened')),
  actor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_release_events_project_created_idx
  ON public.project_release_events (project_id, created_at ASC);

CREATE INDEX IF NOT EXISTS projects_release_status_idx
  ON public.projects (release_status);

ALTER TABLE public.project_release_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Release events readable for public or owner projects"
  ON public.project_release_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (p.visibility = 'public' OR p.owner_id = auth.uid())
    )
  );

CREATE POLICY "Project owners insert release events"
  ON public.project_release_events FOR INSERT
  WITH CHECK (
    actor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

COMMIT;
