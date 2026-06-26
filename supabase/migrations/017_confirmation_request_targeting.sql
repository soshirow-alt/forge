-- 017: confirmation request targeting — priorities, audience, notifications
-- Prerequisite: 015 (confirmation_requests), 009 (user_notifications types)
-- Design: docs/change-check-confirmation-loop.md § Step 5–6

BEGIN;

ALTER TABLE public.confirmation_requests
  ADD COLUMN IF NOT EXISTS notify_audience jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS linked_priorities jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS confirmation_request_id uuid NULL
    REFERENCES public.confirmation_requests (id) ON DELETE SET NULL;

ALTER TABLE public.user_notifications
  DROP CONSTRAINT IF EXISTS user_notifications_type_check;

ALTER TABLE public.user_notifications
  ADD CONSTRAINT user_notifications_type_check
  CHECK (type IN ('devlog', 'version_published', 'voice_received', 'confirmation_request'));

DROP POLICY IF EXISTS "Project owners insert notifications"
  ON public.user_notifications;

CREATE POLICY "Project owners insert notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (
    type IN ('devlog', 'version_published', 'confirmation_request')
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id::text = project_id
        AND p.owner_id = auth.uid()
    )
  );

-- Project owner only — resolve notify recipients (play/bookmark RLS bypass)
CREATE OR REPLACE FUNCTION public.get_confirmation_notify_recipients(
  p_project_id text,
  p_audience jsonb DEFAULT '[]'::jsonb,
  p_version_key text DEFAULT NULL,
  p_linked_priority_ids jsonb DEFAULT '[]'::jsonb
)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_audience text[];
  v_priority_ids text[];
  v_use_prior boolean;
  v_use_watchers boolean;
  v_use_bookmarks boolean;
  v_use_feedback boolean;
  v_use_all boolean;
BEGIN
  SELECT p.owner_id
  INTO v_owner_id
  FROM public.projects p
  WHERE p.id::text = p_project_id;

  IF v_owner_id IS NULL OR auth.uid() IS DISTINCT FROM v_owner_id THEN
    RETURN;
  END IF;

  SELECT coalesce(array_agg(elem::text), ARRAY[]::text[])
  INTO v_audience
  FROM jsonb_array_elements_text(coalesce(p_audience, '[]'::jsonb)) AS elem;

  IF coalesce(array_length(v_audience, 1), 0) = 0 THEN
    v_audience := ARRAY['prior_players', 'watchers'];
  END IF;

  SELECT coalesce(array_agg(elem::text), ARRAY[]::text[])
  INTO v_priority_ids
  FROM jsonb_array_elements_text(coalesce(p_linked_priority_ids, '[]'::jsonb)) AS elem;

  v_use_all := 'all' = ANY (v_audience);
  v_use_prior := v_use_all OR 'prior_players' = ANY (v_audience);
  v_use_watchers := v_use_all OR 'watchers' = ANY (v_audience);
  v_use_bookmarks := v_use_all OR 'bookmarks' = ANY (v_audience);
  v_use_feedback := v_use_all OR 'related_feedback' = ANY (v_audience);

  RETURN QUERY
  SELECT DISTINCT recipients.user_id
  FROM (
    SELECT pp.user_id
    FROM public.project_plays pp
    WHERE v_use_prior
      AND pp.project_id = p_project_id

    UNION

    SELECT ps.user_id
    FROM public.project_play_sessions ps
    WHERE v_use_prior
      AND ps.project_id = p_project_id

    UNION

    SELECT pw.user_id
    FROM public.project_watches pw
    WHERE v_use_watchers
      AND pw.project_id = p_project_id

    UNION

    SELECT pb.user_id
    FROM public.project_bookmarks pb
    WHERE v_use_bookmarks
      AND pb.project_id = p_project_id

    UNION

    SELECT pf.user_id
    FROM public.project_feedback pf
    WHERE v_use_feedback
      AND pf.project_id = p_project_id
      AND (
        coalesce(array_length(v_priority_ids, 1), 0) = 0
        OR (
          ('bug-summary' = ANY (v_priority_ids) AND nullif(trim(pf.bugs), '') IS NOT NULL)
          OR ('concern-summary' = ANY (v_priority_ids) AND nullif(trim(pf.concerns), '') IS NOT NULL)
        )
      )

    UNION

    SELECT vr.user_id
    FROM public.project_voice_responses vr
    WHERE v_use_feedback
      AND vr.project_id = p_project_id
      AND (
        coalesce(array_length(v_priority_ids, 1), 0) = 0
        OR EXISTS (
          SELECT 1
          FROM unnest(v_priority_ids) AS pid
          WHERE pid LIKE 'voice-%'
            AND vr.prompt_id::text = regexp_replace(pid, '^voice-(no|scale|split)-', '')
        )
      )
  ) AS recipients
  WHERE recipients.user_id <> v_owner_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_confirmation_notify_recipients(text, jsonb, text, jsonb)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_confirmation_notify_recipients(text, jsonb, text, jsonb)
  TO authenticated;

COMMIT;
