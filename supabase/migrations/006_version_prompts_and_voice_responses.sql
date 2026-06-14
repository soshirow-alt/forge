-- 006: version prompts, voice responses, public aggregates, feedback RLS tighten
-- Prerequisite: 001–005 applied

BEGIN;

-- A. Question master (per playable version)
CREATE TABLE IF NOT EXISTS public.project_version_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  version_key text NOT NULL,
  prompt_text text NOT NULL,
  response_kind text NOT NULL CHECK (
    response_kind IN ('yes_no', 'scale_3', 'choice', 'short_text', 'replay_intent')
  ),
  options jsonb NULL,
  sort_order smallint NOT NULL DEFAULT 0 CHECK (sort_order >= 0 AND sort_order <= 9),
  source text NOT NULL DEFAULT 'developer' CHECK (source IN ('developer', 'platform_default')),
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS project_version_prompts_project_version_idx
  ON public.project_version_prompts (project_id, version_key)
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS project_version_prompts_sort_idx
  ON public.project_version_prompts (project_id, version_key, sort_order)
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS project_version_prompts_default_idx
  ON public.project_version_prompts (project_id, version_key)
  WHERE source = 'platform_default' AND archived_at IS NULL;

-- B. Voice responses (initial voice / stage 1)
CREATE TABLE IF NOT EXISTS public.project_voice_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  project_id text NOT NULL,
  version_key text NOT NULL,
  prompt_id uuid NOT NULL REFERENCES public.project_version_prompts (id) ON DELETE CASCADE,
  answer_value text NOT NULL,
  answer_label text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS project_voice_responses_user_prompt_idx
  ON public.project_voice_responses (user_id, prompt_id);

CREATE INDEX IF NOT EXISTS project_voice_responses_project_version_idx
  ON public.project_voice_responses (project_id, version_key);

-- C. RLS
ALTER TABLE public.project_version_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_voice_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Version prompts readable for public projects"
  ON public.project_version_prompts FOR SELECT
  USING (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id
        AND (p.visibility = 'public' OR p.owner_id = auth.uid())
    )
  );

CREATE POLICY "Project owners manage version prompts"
  ON public.project_version_prompts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users read own voice responses"
  ON public.project_voice_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Project owners read voice responses"
  ON public.project_voice_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own voice responses"
  ON public.project_voice_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own voice responses"
  ON public.project_voice_responses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- D. Tighten project_feedback SELECT (individual deep feedback not public)
DROP POLICY IF EXISTS "Project feedback is publicly readable" ON public.project_feedback;

CREATE POLICY "Feedback readable by author or project owner"
  ON public.project_feedback FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = project_id AND p.owner_id = auth.uid()
    )
  );

-- E. Public aggregates RPC (no individual rows exposed)
CREATE OR REPLACE FUNCTION public.get_public_voice_aggregates(
  p_project_id text,
  p_version_key text
)
RETURNS TABLE (
  prompt_id uuid,
  prompt_text text,
  response_kind text,
  options jsonb,
  sort_order smallint,
  source text,
  answer_value text,
  answer_label text,
  response_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS prompt_id,
    p.prompt_text,
    p.response_kind,
    p.options,
    p.sort_order,
    p.source,
    r.answer_value,
    r.answer_label,
    COUNT(r.id)::bigint AS response_count
  FROM public.project_version_prompts p
  LEFT JOIN public.project_voice_responses r ON r.prompt_id = p.id
  WHERE p.project_id = p_project_id
    AND p.version_key = p_version_key
    AND p.archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects pr
      WHERE pr.id::text = p_project_id AND pr.visibility = 'public'
    )
  GROUP BY
    p.id,
    p.prompt_text,
    p.response_kind,
    p.options,
    p.sort_order,
    p.source,
    r.answer_value,
    r.answer_label
  ORDER BY p.sort_order ASC, response_count DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_voice_aggregates(text, text) TO anon, authenticated;

-- F. Ensure platform default prompt (players can trigger when dev set no questions)
CREATE OR REPLACE FUNCTION public.ensure_platform_default_prompt(
  p_project_id text,
  p_version_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.project_version_prompts
  WHERE project_id = p_project_id
    AND version_key = p_version_key
    AND source = 'platform_default'
    AND archived_at IS NULL
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.project_version_prompts (
    project_id,
    version_key,
    prompt_text,
    response_kind,
    options,
    sort_order,
    source
  ) VALUES (
    p_project_id,
    p_version_key,
    'もう一度遊びたい？',
    'replay_intent',
    '[{"id":"yes","label":"もう一度遊びたい"},{"id":"maybe","label":"更新次第また遊びたい"},{"id":"no","label":"今はもう遊ばない"}]'::jsonb,
    0,
    'platform_default'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_platform_default_prompt(text, text) TO authenticated;

COMMIT;
