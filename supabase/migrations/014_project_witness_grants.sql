-- 014: project_witness_grants — 見届け人付与記録（append-only）
-- Prerequisite: 001–013 applied
-- Design: docs/witness-phase-design-review.md, docs/witness-phase-w2-migration.md
-- W1 lib: lib/witness-eligibility.ts（判定ロジックは SQL と同期）

BEGIN;

CREATE TABLE IF NOT EXISTS public.project_witness_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  first_released_at timestamptz NOT NULL,
  grant_path text NOT NULL CHECK (
    grant_path IN ('multi_version', 'voice', 'watch')
  ),
  granted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS project_witness_grants_user_granted_idx
  ON public.project_witness_grants (user_id, granted_at DESC);

CREATE INDEX IF NOT EXISTS project_witness_grants_project_idx
  ON public.project_witness_grants (project_id, granted_at DESC);

COMMENT ON TABLE public.project_witness_grants IS
  '見届け人付与記録。初回 Released のみ付与。append-only（剥奪なし）。';

ALTER TABLE public.project_witness_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own witness grants"
  ON public.project_witness_grants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Witness grants readable for public or owner projects"
  ON public.project_witness_grants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (p.visibility = 'public' OR p.owner_id = auth.uid())
    )
  );

-- 付与は trigger + SECURITY DEFINER のみ。クライアント直接 INSERT 不可。

CREATE OR REPLACE FUNCTION public.prevent_witness_grant_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'project_witness_grants is append-only';
END;
$$;

DROP TRIGGER IF EXISTS project_witness_grants_no_update
  ON public.project_witness_grants;

CREATE TRIGGER project_witness_grants_no_update
  BEFORE UPDATE OR DELETE ON public.project_witness_grants
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_witness_grant_mutation();

CREATE OR REPLACE FUNCTION public.grant_witnesses_on_first_released()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_project_id_text text;
  v_candidate record;
  v_first_played_at timestamptz;
  v_session_count integer;
  v_version_count integer;
  v_voice_count integer;
  v_has_watch boolean;
  v_grant_path text;
BEGIN
  IF NEW.event_type <> 'released' THEN
    RETURN NEW;
  END IF;

  -- 初回 Released のみ（再 Released / 過去 released ありはスキップ）
  IF EXISTS (
    SELECT 1
    FROM public.project_release_events e
    WHERE e.project_id = NEW.project_id
      AND e.event_type = 'released'
      AND e.id <> NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT p.owner_id
  INTO v_owner_id
  FROM public.projects p
  WHERE p.id = NEW.project_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_project_id_text := NEW.project_id::text;

  FOR v_candidate IN
    SELECT DISTINCT engagement.user_id
    FROM (
      SELECT pp.user_id
      FROM public.project_plays pp
      WHERE pp.project_id = v_project_id_text
      UNION
      SELECT ps.user_id
      FROM public.project_play_sessions ps
      WHERE ps.project_id = v_project_id_text
      UNION
      SELECT vr.user_id
      FROM public.project_voice_responses vr
      WHERE vr.project_id = v_project_id_text
      UNION
      SELECT pw.user_id
      FROM public.project_watches pw
      WHERE pw.project_id = v_project_id_text
    ) engagement
    WHERE engagement.user_id <> v_owner_id
  LOOP
    SELECT MIN(played.ts)
    INTO v_first_played_at
    FROM (
      SELECT pp.created_at AS ts
      FROM public.project_plays pp
      WHERE pp.project_id = v_project_id_text
        AND pp.user_id = v_candidate.user_id
        AND pp.created_at <= NEW.created_at
      UNION ALL
      SELECT ps.played_at AS ts
      FROM public.project_play_sessions ps
      WHERE ps.project_id = v_project_id_text
        AND ps.user_id = v_candidate.user_id
        AND ps.played_at <= NEW.created_at
    ) played;

    IF v_first_played_at IS NULL THEN
      CONTINUE;
    END IF;

    SELECT
      COUNT(*)::integer,
      COUNT(DISTINCT ps.version_key)::integer
    INTO v_session_count, v_version_count
    FROM public.project_play_sessions ps
    WHERE ps.project_id = v_project_id_text
      AND ps.user_id = v_candidate.user_id
      AND ps.played_at <= NEW.created_at;

    SELECT COUNT(*)::integer
    INTO v_voice_count
    FROM public.project_voice_responses vr
    WHERE vr.project_id = v_project_id_text
      AND vr.user_id = v_candidate.user_id
      AND vr.created_at <= NEW.created_at;

    SELECT EXISTS (
      SELECT 1
      FROM public.project_watches w
      WHERE w.project_id = v_project_id_text
        AND w.user_id = v_candidate.user_id
        AND w.created_at <= NEW.created_at
    )
    INTO v_has_watch;

    v_grant_path := NULL;

    IF v_version_count >= 2 THEN
      v_grant_path := 'multi_version';
    ELSIF v_voice_count >= 1 THEN
      v_grant_path := 'voice';
    ELSIF v_has_watch AND v_session_count >= 2 THEN
      v_grant_path := 'watch';
    END IF;

    IF v_grant_path IS NOT NULL THEN
      INSERT INTO public.project_witness_grants (
        project_id,
        user_id,
        first_released_at,
        grant_path,
        granted_at
      )
      VALUES (
        NEW.project_id,
        v_candidate.user_id,
        NEW.created_at,
        v_grant_path,
        now()
      )
      ON CONFLICT (project_id, user_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_release_events_grant_witnesses
  ON public.project_release_events;

CREATE TRIGGER project_release_events_grant_witnesses
  AFTER INSERT ON public.project_release_events
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_witnesses_on_first_released();

COMMIT;
