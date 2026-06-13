-- 004: playable_version, feedback version_key, devlog published_version, phase cleanup
-- Prerequisite: 001, 002, 003 applied
-- Pre-check (run separately before this migration):
--   SELECT user_id, project_id, COUNT(*) FROM public.project_feedback
--   GROUP BY 1, 2 HAVING COUNT(*) > 1;

BEGIN;

-- A. phase cleanup (本番: プロトタイプ → 試作版)
UPDATE public.projects
SET phase = '試作版'
WHERE phase = 'プロトタイプ';

-- B. projects.playable_version
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS playable_version text NOT NULL DEFAULT '0.1';

UPDATE public.projects
SET playable_version = '0.1'
WHERE playable_version IS NULL OR playable_version = '';

-- C. project_feedback version columns
ALTER TABLE public.project_feedback
  ADD COLUMN IF NOT EXISTS version_key text NOT NULL DEFAULT '0.1';

ALTER TABLE public.project_feedback
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NULL;

UPDATE public.project_feedback
SET version_key = '0.1'
WHERE version_key IS NULL OR version_key = '';

-- D. dedupe (user_id, project_id) before UNIQUE — keeps newest row
DELETE FROM public.project_feedback AS older
USING public.project_feedback AS newer
WHERE older.user_id = newer.user_id
  AND older.project_id = newer.project_id
  AND older.created_at < newer.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS project_feedback_user_project_version_idx
  ON public.project_feedback (user_id, project_id, version_key);

-- E. devlog published_version
ALTER TABLE public.project_devlogs
  ADD COLUMN IF NOT EXISTS published_version text NULL;

-- F. RLS: allow users to update own feedback
CREATE POLICY "Users update own feedback"
  ON public.project_feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
