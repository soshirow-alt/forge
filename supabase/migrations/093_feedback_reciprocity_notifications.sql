-- 093: feedback reciprocity important notification + transactional email enqueue.
-- Fired only from INSERT triggers on registered feedback tables (not a free-form client RPC).
-- Does not edit 090–092. Email enqueue failure never rolls back feedback writes.

BEGIN;

ALTER TABLE public.user_notifications
  ADD COLUMN IF NOT EXISTS related_user_id uuid NULL
    REFERENCES auth.users (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.user_notifications.related_user_id IS
  'Other party for notifications that deep-link to a user profile (e.g. feedback reciprocity actor).';

ALTER TABLE public.user_notifications
  DROP CONSTRAINT IF EXISTS user_notifications_type_check;
ALTER TABLE public.user_notifications
  ADD CONSTRAINT user_notifications_type_check
  CHECK (
    type IN (
      'devlog',
      'version_published',
      'voice_received',
      'confirmation_request',
      'project_watched',
      'followed_developer_new_project',
      'followed_developer_released_project',
      'feedback_reply',
      'consultation_new',
      'consultation_message',
      'usage_relation_request',
      'usage_relation_accepted',
      'usage_relation_rejected',
      'feedback_reciprocity'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_reciprocity_open_uidx
  ON public.user_notifications (user_id, coalesce_key)
  WHERE type = 'feedback_reciprocity'
    AND requires_acknowledgement = true
    AND acknowledged_at IS NULL
    AND coalesce_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.actor_has_public_project(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.owner_id = p_user_id
      AND p.visibility = 'public'
  );
$$;

REVOKE ALL ON FUNCTION public.actor_has_public_project(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actor_has_public_project(uuid)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.dismiss_stale_feedback_reciprocity()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_count integer := 0;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  UPDATE public.user_notifications n
  SET
    acknowledged_at = coalesce(n.acknowledged_at, now()),
    seen_at = coalesce(n.seen_at, now()),
    read_at = coalesce(n.read_at, now())
  WHERE n.user_id = v_uid
    AND n.type = 'feedback_reciprocity'
    AND n.requires_acknowledgement = true
    AND n.acknowledged_at IS NULL
    AND (
      n.related_user_id IS NULL
      OR public.users_are_blocking(v_uid, n.related_user_id)
      OR NOT public.actor_has_public_project(n.related_user_id)
      OR NOT EXISTS (
        SELECT 1 FROM public.developer_profiles dp
        WHERE dp.user_id = n.related_user_id
      )
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.dismiss_stale_feedback_reciprocity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dismiss_stale_feedback_reciprocity()
  TO authenticated;

-- Internal helper: actor must be supplied by trigger from the inserted feedback row.
CREATE OR REPLACE FUNCTION public.consider_feedback_reciprocity(
  p_actor_id uuid,
  p_target_project_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_project_title text;
  v_project_visibility text;
  v_actor_name text;
  v_coalesce text;
  v_existing_id uuid;
  v_notification_id uuid;
  v_email text;
  v_message text;
BEGIN
  IF p_actor_id IS NULL OR p_target_project_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT p.owner_id, p.title, p.visibility
  INTO v_owner, v_project_title, v_project_visibility
  FROM public.projects p
  WHERE p.id = p_target_project_id;
  IF v_owner IS NULL THEN
    RETURN NULL;
  END IF;
  IF v_project_visibility IS DISTINCT FROM 'public' THEN
    RETURN NULL;
  END IF;
  IF v_owner = p_actor_id THEN
    RETURN NULL;
  END IF;
  IF public.users_are_blocking(p_actor_id, v_owner) THEN
    RETURN NULL;
  END IF;
  IF NOT public.actor_has_public_project(p_actor_id) THEN
    RETURN NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.developer_profiles dp WHERE dp.user_id = p_actor_id
  ) THEN
    RETURN NULL;
  END IF;

  SELECT coalesce(
    nullif(btrim(dp.public_name), ''),
    nullif(btrim(dp.creator_id), ''),
    'ユーザー'
  )
  INTO v_actor_name
  FROM public.developer_profiles dp
  WHERE dp.user_id = p_actor_id;

  v_coalesce := 'feedback-reciprocity:' || v_owner::text || ':' || p_actor_id::text;
  PERFORM pg_advisory_xact_lock(hashtext(v_coalesce));

  v_message :=
    'お返しに「' || v_actor_name || '」さんにフィードバックしませんか？'
    || E'\n'
    || '「' || coalesce(v_project_title, '作品') || '」にフィードバックが届きました。';

  SELECT n.id
  INTO v_existing_id
  FROM public.user_notifications n
  WHERE n.user_id = v_owner
    AND n.type = 'feedback_reciprocity'
    AND n.coalesce_key = v_coalesce
    AND n.requires_acknowledgement = true
    AND n.acknowledged_at IS NULL
  ORDER BY n.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.user_notifications
    SET
      message = v_message,
      project_id = p_target_project_id::text,
      related_user_id = p_actor_id,
      created_at = now()
    WHERE id = v_existing_id;
    RETURN v_existing_id;
  END IF;

  INSERT INTO public.user_notifications (
    user_id,
    type,
    project_id,
    message,
    requires_acknowledgement,
    coalesce_key,
    related_user_id
  )
  VALUES (
    v_owner,
    'feedback_reciprocity',
    p_target_project_id::text,
    v_message,
    true,
    v_coalesce,
    p_actor_id
  )
  RETURNING id INTO v_notification_id;

  BEGIN
    SELECT u.email INTO v_email
    FROM auth.users u
    WHERE u.id = v_owner;
    IF nullif(trim(v_email), '') IS NOT NULL THEN
      PERFORM public.enqueue_transactional_email(
        v_owner,
        v_email,
        'feedback_reciprocity',
        jsonb_build_object(
          'notification_id', v_notification_id,
          'actor_user_id', p_actor_id,
          'actor_display_name', v_actor_name,
          'receiving_project_id', p_target_project_id,
          'receiving_project_title', v_project_title
        ),
        now()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_notification_id;
EXCEPTION
  WHEN unique_violation THEN
    SELECT n.id INTO v_notification_id
    FROM public.user_notifications n
    WHERE n.user_id = v_owner
      AND n.type = 'feedback_reciprocity'
      AND n.coalesce_key = v_coalesce
      AND n.requires_acknowledgement = true
      AND n.acknowledged_at IS NULL
    ORDER BY n.created_at DESC
    LIMIT 1;
    RETURN v_notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.consider_feedback_reciprocity(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consider_feedback_reciprocity(uuid, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.trg_consider_feedback_reciprocity_from_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.consider_feedback_reciprocity(NEW.user_id, NEW.project_id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_consider_feedback_reciprocity_from_voice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.consider_feedback_reciprocity(NEW.user_id, NEW.project_id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_feedback_reciprocity_notify
  ON public.project_feedback;
CREATE TRIGGER project_feedback_reciprocity_notify
  AFTER INSERT ON public.project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_consider_feedback_reciprocity_from_feedback();

DROP TRIGGER IF EXISTS project_voice_responses_reciprocity_notify
  ON public.project_voice_responses;
CREATE TRIGGER project_voice_responses_reciprocity_notify
  AFTER INSERT ON public.project_voice_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_consider_feedback_reciprocity_from_voice();

REVOKE ALL ON FUNCTION public.trg_consider_feedback_reciprocity_from_feedback()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_consider_feedback_reciprocity_from_voice()
  FROM PUBLIC;

COMMIT;
