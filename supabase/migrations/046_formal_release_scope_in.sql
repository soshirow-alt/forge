-- 046: formal release scope-in — play_access_type + release event source + onboarding RPC
-- Prerequisite: 013, 014 applied
-- Design: docs/formal-release-scope-in-design.md

BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS play_access_type text NOT NULL DEFAULT 'unspecified'
  CHECK (play_access_type IN ('unspecified', 'free', 'demo_available', 'paid', 'other'));

COMMENT ON COLUMN public.projects.play_access_type IS
  'Player-facing play/pricing transparency. unspecified = no badge until author sets explicitly.';

CREATE INDEX IF NOT EXISTS projects_play_access_type_idx
  ON public.projects (play_access_type);

ALTER TABLE public.project_release_events
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'studio'
  CHECK (source IN ('studio', 'onboarding'));

COMMENT ON COLUMN public.project_release_events.source IS
  'studio = nurtured on Forge then declared; onboarding = already released at submit/edit.';

-- Atomic onboarding release — no follower notification (app layer); idempotent.
CREATE OR REPLACE FUNCTION public.declare_project_released_onboarding(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_status text;
  v_event_id uuid;
  v_has_released boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;

  SELECT p.owner_id, p.release_status
  INTO v_owner_id, v_status
  FROM public.projects p
  WHERE p.id = p_project_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Owner only';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.project_release_events e
    WHERE e.project_id = p_project_id
      AND e.event_type = 'released'
  )
  INTO v_has_released;

  IF v_has_released OR v_status = 'released' THEN
    UPDATE public.projects
    SET release_status = 'released'
    WHERE id = p_project_id
      AND release_status <> 'released';

    RETURN jsonb_build_object('already_released', true);
  END IF;

  INSERT INTO public.project_release_events (
    project_id,
    event_type,
    actor_user_id,
    source
  )
  VALUES (
    p_project_id,
    'released',
    auth.uid(),
    'onboarding'
  )
  RETURNING id INTO v_event_id;

  UPDATE public.projects
  SET release_status = 'released'
  WHERE id = p_project_id;

  RETURN jsonb_build_object(
    'already_released', false,
    'event_id', v_event_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.declare_project_released_onboarding(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.declare_project_released_onboarding(uuid) TO authenticated;

COMMIT;
