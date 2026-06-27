-- 024: content_reports — 最低限の通報導線（REL-2-07）
-- Prerequisite: 001
-- Design: docs/rel-2-07-content-reports-design.md

BEGIN;

CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (
    target_type IN ('project', 'community_post', 'community_reply', 'developer')
  ),
  target_id text NOT NULL,
  reason_code text NOT NULL CHECK (
    reason_code IN ('spam', 'harassment', 'rights', 'unsafe_link', 'other')
  ),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 500),
  context_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_reports_target_idx
  ON public.content_reports (target_type, target_id);

CREATE INDEX IF NOT EXISTS content_reports_created_idx
  ON public.content_reports (created_at DESC);

CREATE INDEX IF NOT EXISTS content_reports_reporter_idx
  ON public.content_reports (reporter_id, created_at DESC);

COMMENT ON TABLE public.content_reports IS
  'User-submitted content reports. Operator review via Supabase Dashboard (no in-app admin UI).';

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own content reports"
  ON public.content_reports;
CREATE POLICY "Users insert own content reports"
  ON public.content_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users read own content reports"
  ON public.content_reports;
CREATE POLICY "Users read own content reports"
  ON public.content_reports FOR SELECT
  USING (reporter_id = auth.uid());

COMMIT;
