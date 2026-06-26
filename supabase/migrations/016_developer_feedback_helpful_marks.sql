-- 016: developer_feedback_helpful_marks — 開発者のみの「開発に役立った」評価
-- Prerequisite: 001 (projects), 002 (project_feedback), 006 (project_voice_responses)
-- Design: docs/forge-ui-product-decisions.md §8

BEGIN;

CREATE TABLE IF NOT EXISTS public.developer_feedback_helpful_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  developer_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('voice_response', 'project_feedback')),
  source_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (developer_id, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS developer_feedback_helpful_marks_project_idx
  ON public.developer_feedback_helpful_marks (project_id, created_at DESC);

ALTER TABLE public.developer_feedback_helpful_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers read own helpful marks"
  ON public.developer_feedback_helpful_marks FOR SELECT
  USING (developer_id = auth.uid());

CREATE POLICY "Project owners insert helpful marks"
  ON public.developer_feedback_helpful_marks FOR INSERT
  WITH CHECK (
    developer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners delete own helpful marks"
  ON public.developer_feedback_helpful_marks FOR DELETE
  USING (
    developer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

COMMIT;
