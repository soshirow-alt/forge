-- 026: platform_feedback — 運営へのご意見（サイドバー導線）
-- Prerequisite: 001
-- Operator review via Supabase Dashboard (no in-app admin UI).

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category text NOT NULL CHECK (
    category IN ('bug', 'idea', 'service', 'other')
  ),
  message text NOT NULL CHECK (
    char_length(message) >= 10 AND char_length(message) <= 2000
  ),
  page_path text NOT NULL DEFAULT '',
  viewer_mode text NOT NULL DEFAULT 'player' CHECK (
    viewer_mode IN ('player', 'studio')
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_feedback_created_idx
  ON public.platform_feedback (created_at DESC);

CREATE INDEX IF NOT EXISTS platform_feedback_user_idx
  ON public.platform_feedback (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS platform_feedback_category_idx
  ON public.platform_feedback (category, created_at DESC);

COMMENT ON TABLE public.platform_feedback IS
  'User feedback to Forge operators (bugs, ideas, service opinions). Review via Supabase Dashboard.';

ALTER TABLE public.platform_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own platform feedback"
  ON public.platform_feedback;
CREATE POLICY "Users insert own platform feedback"
  ON public.platform_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own platform feedback"
  ON public.platform_feedback;
CREATE POLICY "Users read own platform feedback"
  ON public.platform_feedback FOR SELECT
  USING (user_id = auth.uid());

COMMIT;
