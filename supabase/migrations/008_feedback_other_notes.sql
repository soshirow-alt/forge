-- 008: deep feedback free-text field (Phase1 UX)
-- Prerequisite: 001–007 applied

BEGIN;

ALTER TABLE public.project_feedback
  ADD COLUMN IF NOT EXISTS other_notes text;

COMMIT;
