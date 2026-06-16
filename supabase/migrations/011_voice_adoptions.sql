-- 011: voice_adoptions canonical data + matcher runs + disputes
-- Prerequisite: 001–010 applied
-- Staging-first: apply on Dashboard before production

BEGIN;

-- A. devlog publish metadata (immutable support)
ALTER TABLE public.project_devlogs
  ADD COLUMN IF NOT EXISTS published_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS content_hash text NULL;

-- B. matcher runs (job audit)
CREATE TABLE IF NOT EXISTS public.voice_adoption_matcher_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devlog_id uuid NOT NULL REFERENCES public.project_devlogs (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  trigger_type text NOT NULL CHECK (
    trigger_type IN ('devlog_published', 'backfill', 'model_upgrade')
  ),
  trigger_version text NOT NULL DEFAULT 'matcher-v1',
  status text NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'running', 'completed', 'failed', 'skipped')
  ),
  candidate_count int NOT NULL DEFAULT 0,
  evaluated_count int NOT NULL DEFAULT 0,
  adopted_count int NOT NULL DEFAULT 0,
  skipped_below_threshold int NOT NULL DEFAULT 0,
  devlog_content_hash text NULL,
  model text NOT NULL DEFAULT 'fixture',
  prompt_version text NOT NULL DEFAULT 'adoption-prompt-v1',
  error_message text NULL,
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_adoption_matcher_runs_devlog_trigger_unique
    UNIQUE (devlog_id, trigger_type, trigger_version)
);

CREATE INDEX IF NOT EXISTS voice_adoption_matcher_runs_devlog_idx
  ON public.voice_adoption_matcher_runs (devlog_id);

CREATE INDEX IF NOT EXISTS voice_adoption_matcher_runs_project_idx
  ON public.voice_adoption_matcher_runs (project_id, created_at DESC);

-- C. voice adoptions (canonical facts)
CREATE TABLE IF NOT EXISTS public.voice_adoptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  voice_response_id uuid NOT NULL
    REFERENCES public.project_voice_responses (id) ON DELETE CASCADE,
  devlog_id uuid NOT NULL
    REFERENCES public.project_devlogs (id) ON DELETE CASCADE,
  voice_version_key text NOT NULL,
  published_version text NOT NULL,
  player_quote text NOT NULL CHECK (char_length(player_quote) BETWEEN 1 AND 120),
  update_summary text NOT NULL CHECK (char_length(update_summary) BETWEEN 1 AND 120),
  prompt_text text NULL,
  confidence numeric(4,3) NOT NULL
    CHECK (confidence >= 0.82 AND confidence <= 1),
  model text NOT NULL,
  model_version text NULL,
  matcher_run_id uuid NOT NULL
    REFERENCES public.voice_adoption_matcher_runs (id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suppressed')),
  suppression_reason text NULL CHECK (
    suppression_reason IS NULL OR suppression_reason IN (
      'player_dispute', 'devlog_retracted', 'admin'
    )
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_adoptions_response_devlog_unique
    UNIQUE (voice_response_id, devlog_id)
);

CREATE INDEX IF NOT EXISTS voice_adoptions_user_created_idx
  ON public.voice_adoptions (user_id, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS voice_adoptions_user_project_created_idx
  ON public.voice_adoptions (user_id, project_id, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS voice_adoptions_devlog_active_idx
  ON public.voice_adoptions (devlog_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS voice_adoptions_voice_response_idx
  ON public.voice_adoptions (voice_response_id, created_at DESC);

CREATE INDEX IF NOT EXISTS voice_adoptions_project_published_idx
  ON public.voice_adoptions (project_id, published_version, created_at DESC)
  WHERE status = 'active';

-- D. disputes
CREATE TABLE IF NOT EXISTS public.voice_adoption_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_id uuid NOT NULL
    REFERENCES public.voice_adoptions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  note text NULL CHECK (note IS NULL OR char_length(note) <= 280),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (adoption_id, user_id)
);

-- E. RLS
ALTER TABLE public.voice_adoption_matcher_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_adoptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_adoption_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own active adoptions"
  ON public.voice_adoptions FOR SELECT
  USING (auth.uid() = user_id AND status = 'active');

CREATE POLICY "Project owners read adoptions on owned projects"
  ON public.voice_adoptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners read matcher runs"
  ON public.voice_adoption_matcher_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Players insert own disputes"
  ON public.voice_adoption_disputes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.voice_adoptions a
      WHERE a.id = adoption_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Players read own disputes"
  ON public.voice_adoption_disputes FOR SELECT
  USING (auth.uid() = user_id);

-- F. dispute → suppress adoption
CREATE OR REPLACE FUNCTION public.suppress_voice_adoption_on_dispute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.voice_adoptions
  SET
    status = 'suppressed',
    suppression_reason = 'player_dispute',
    updated_at = now()
  WHERE id = NEW.adoption_id
    AND user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS voice_adoption_disputes_suppress ON public.voice_adoption_disputes;

CREATE TRIGGER voice_adoption_disputes_suppress
  AFTER INSERT ON public.voice_adoption_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.suppress_voice_adoption_on_dispute();

-- G. published devlog: block body edits (title still editable via app)
CREATE OR REPLACE FUNCTION public.enforce_devlog_immutable_body()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.published_version IS NOT NULL AND NEW.content IS DISTINCT FROM OLD.content THEN
    RAISE EXCEPTION 'Published devlog body is immutable. Create a new devlog instead.';
  END IF;

  IF NEW.published_version IS NOT NULL AND OLD.published_version IS NULL THEN
    NEW.published_at := COALESCE(NEW.published_at, now());
    NEW.content_hash := encode(
      sha256(convert_to(COALESCE(NEW.title, '') || E'\n' || COALESCE(NEW.content, ''), 'UTF8')),
      'hex'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_devlogs_immutable_body ON public.project_devlogs;

CREATE TRIGGER project_devlogs_immutable_body
  BEFORE UPDATE ON public.project_devlogs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_devlog_immutable_body();

COMMIT;
