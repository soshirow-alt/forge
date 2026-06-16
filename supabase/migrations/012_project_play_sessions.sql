-- 012: project_play_sessions — 版ごとのプレイ履歴（追記のみ）
-- Prerequisite: 001–011 applied
-- Design: docs/player-play-history-design.md
-- Apply: Supabase Dashboard（staging-first 推奨）

BEGIN;

CREATE TABLE IF NOT EXISTS public.project_play_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  version_key text NOT NULL,
  played_at timestamptz NOT NULL DEFAULT now(),
  context text NOT NULL DEFAULT 'general' CHECK (
    context IN ('general', 'adoption_verify', 'new_version')
  ),
  adoption_id uuid NULL REFERENCES public.voice_adoptions (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_play_sessions_user_project_idx
  ON public.project_play_sessions (user_id, project_id, played_at DESC);

CREATE INDEX IF NOT EXISTS project_play_sessions_user_played_idx
  ON public.project_play_sessions (user_id, played_at DESC);

ALTER TABLE public.project_play_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own play sessions"
  ON public.project_play_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own play sessions"
  ON public.project_play_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMIT;
