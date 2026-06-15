-- 010: nurture voice read state (studio owner read per playable version)
-- Prerequisite: 009 applied (optional ordering), 001 projects

BEGIN;

CREATE TABLE IF NOT EXISTS public.project_voice_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  version_key text NOT NULL,
  source_type text NOT NULL DEFAULT 'voice'
    CHECK (source_type IN ('voice')),
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id, version_key, source_type)
);

CREATE INDEX IF NOT EXISTS project_voice_reads_user_project_idx
  ON public.project_voice_reads (user_id, project_id);

ALTER TABLE public.project_voice_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own voice reads"
  ON public.project_voice_reads FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners insert own voice reads"
  ON public.project_voice_reads FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners update own voice reads"
  ON public.project_voice_reads FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

COMMIT;
