-- 015: confirmation_requests — Devlog 公開時の任意「確認依頼」
-- Prerequisite: 003 (project_devlogs), 001 (projects)
-- Design: docs/change-check-confirmation-loop.md § Step 6
-- Apply: Supabase Dashboard（staging-first 推奨）

BEGIN;

CREATE TABLE IF NOT EXISTS public.confirmation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devlog_id uuid NOT NULL UNIQUE REFERENCES public.project_devlogs (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  published_version text NULL,
  changes_summary text NULL,
  ask_summary text NULL,
  estimated_duration text NULL,
  notify_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS confirmation_requests_project_id_idx
  ON public.confirmation_requests (project_id, created_at DESC);

ALTER TABLE public.confirmation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Confirmation requests are publicly readable"
  ON public.confirmation_requests FOR SELECT
  USING (true);

CREATE POLICY "Project owners insert confirmation requests"
  ON public.confirmation_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_devlogs d
      INNER JOIN public.projects p ON p.id::text = d.project_id
      WHERE d.id = devlog_id
        AND d.project_id = confirmation_requests.project_id
        AND d.author_id = auth.uid()
        AND p.owner_id = auth.uid()
    )
  );

COMMIT;
