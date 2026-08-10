-- =============================================================================
-- Production rollout APPLY 03 - reciprocity / email prefs / messaging (093-101)
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
-- Apply via: Supabase Dashboard -> SQL Editor (OWNER MANUAL ONLY)
-- Pure SQL (no \i / \set / psql meta). One transaction for this file.
-- Source: canonical supabase/migrations/ (concatenated; originals untouched).
-- DO NOT apply Staging seed / beautify / fixture SQL with this package.
-- Forward-only: do not edit applied migrations; fix with a later migration.
-- =============================================================================

BEGIN;


-- === 093_feedback_reciprocity_notifications.sql ===
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

-- === end 093_feedback_reciprocity_notifications.sql ===

-- === 094_platform_announcement_publish_window.sql ===
-- 094: platform announcement publish window + optional CTA fields.
-- Does not edit 078. Public RPCs filter by active window.

BEGIN;

ALTER TABLE public.platform_announcements
  ADD COLUMN IF NOT EXISTS starts_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS cta_label text NULL,
  ADD COLUMN IF NOT EXISTS cta_url text NULL;

ALTER TABLE public.platform_announcements
  DROP CONSTRAINT IF EXISTS platform_announcements_window_check;
ALTER TABLE public.platform_announcements
  ADD CONSTRAINT platform_announcements_window_check
  CHECK (
    ends_at IS NULL
    OR starts_at IS NULL
    OR ends_at >= starts_at
  );

COMMENT ON COLUMN public.platform_announcements.starts_at IS
  'Optional publish window start. NULL means immediately after published_at.';
COMMENT ON COLUMN public.platform_announcements.ends_at IS
  'Optional publish window end. NULL means no expiry.';
COMMENT ON COLUMN public.platform_announcements.cta_label IS
  'Optional public CTA label. Empty/null means no CTA chip.';
COMMENT ON COLUMN public.platform_announcements.cta_url IS
  'Optional public CTA URL (http/https or site-relative path).';

-- Backfill: published rows without starts_at use published_at as start.
UPDATE public.platform_announcements
SET starts_at = published_at
WHERE status = 'published'
  AND starts_at IS NULL
  AND published_at IS NOT NULL;

DROP FUNCTION IF EXISTS public.get_public_platform_announcements(integer, integer);
CREATE FUNCTION public.get_public_platform_announcements(
  p_limit integer DEFAULT 5,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  body text,
  importance text,
  published_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  cta_label text,
  cta_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.slug,
    a.title,
    a.body,
    a.importance,
    a.published_at,
    a.starts_at,
    a.ends_at,
    a.cta_label,
    a.cta_url
  FROM public.platform_announcements a
  WHERE a.status = 'published'
    AND coalesce(a.starts_at, a.published_at, '-infinity'::timestamptz) <= now()
    AND (a.ends_at IS NULL OR a.ends_at > now())
  ORDER BY a.published_at DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 5), 50))
  OFFSET greatest(0, coalesce(p_offset, 0));
$$;

DROP FUNCTION IF EXISTS public.get_public_platform_announcement_by_slug(text);
CREATE FUNCTION public.get_public_platform_announcement_by_slug(
  p_slug text
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  body text,
  importance text,
  published_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  cta_label text,
  cta_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Published history detail (including expired). Drafts never returned.
  SELECT
    a.id,
    a.slug,
    a.title,
    a.body,
    a.importance,
    a.published_at,
    a.starts_at,
    a.ends_at,
    a.cta_label,
    a.cta_url
  FROM public.platform_announcements a
  WHERE a.status = 'published'
    AND a.slug = p_slug
    -- Detail may include expired, but never scheduled-future rows.
    AND coalesce(a.starts_at, a.published_at, '-infinity'::timestamptz) <= now()
  LIMIT 1;
$$;

-- Archive: published history including expired (still not drafts).
DROP FUNCTION IF EXISTS public.get_public_platform_announcement_archive(integer, integer);
CREATE FUNCTION public.get_public_platform_announcement_archive(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  body text,
  importance text,
  published_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  cta_label text,
  cta_url text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.slug,
    a.title,
    a.body,
    a.importance,
    a.published_at,
    a.starts_at,
    a.ends_at,
    a.cta_label,
    a.cta_url,
    (
      coalesce(a.starts_at, a.published_at, '-infinity'::timestamptz) <= now()
      AND (a.ends_at IS NULL OR a.ends_at > now())
    ) AS is_active
  FROM public.platform_announcements a
  WHERE a.status = 'published'
    -- Archive includes expired, excludes drafts and not-yet-started schedules.
    AND coalesce(a.starts_at, a.published_at, '-infinity'::timestamptz) <= now()
  ORDER BY a.published_at DESC NULLS LAST
  LIMIT greatest(1, least(coalesce(p_limit, 50), 100))
  OFFSET greatest(0, coalesce(p_offset, 0));
$$;

REVOKE ALL ON FUNCTION public.get_public_platform_announcements(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_announcements(integer, integer)
  TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_platform_announcement_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_announcement_by_slug(text)
  TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_platform_announcement_archive(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_announcement_archive(integer, integer)
  TO anon, authenticated, service_role;

-- === end 094_platform_announcement_publish_window.sql ===

-- === 095_feedback_reciprocity_project_id_text_cast.sql ===
-- 095: fix reciprocity triggers for real project_id text columns.
-- 093 defined consider_feedback_reciprocity(uuid, uuid) and trigger helpers that
-- passed NEW.project_id directly. On Staging/Production, project_feedback and
-- project_voice_responses store project_id as text, so the call resolves to
-- (uuid, text) and fails with 42883. The trigger EXCEPTION handlers swallowed
-- that error, so reciprocity never fired on real INSERT paths.
-- Do not edit 093. Cast via text→uuid so both text and uuid column shapes work.

BEGIN;

CREATE OR REPLACE FUNCTION public.trg_consider_feedback_reciprocity_from_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
BEGIN
  BEGIN
    v_project_id := nullif(btrim(NEW.project_id::text), '')::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NEW;
  END;
  IF NEW.user_id IS NULL OR v_project_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.consider_feedback_reciprocity(NEW.user_id, v_project_id);
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
DECLARE
  v_project_id uuid;
BEGIN
  BEGIN
    v_project_id := nullif(btrim(NEW.project_id::text), '')::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NEW;
  END;
  IF NEW.user_id IS NULL OR v_project_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.consider_feedback_reciprocity(NEW.user_id, v_project_id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_consider_feedback_reciprocity_from_feedback()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_consider_feedback_reciprocity_from_voice()
  FROM PUBLIC;

-- === end 095_feedback_reciprocity_project_id_text_cast.sql ===

-- === 096_transactional_email_preferences.sql ===
-- 096: transactional email preference (notify_email) + enqueue/send-time gates
-- Staging apply OK. Production apply is owner-manual later (not this task).

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) user_settings.notify_email
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS notify_email jsonb NOT NULL DEFAULT '{
    "master": true,
    "messages_collab": true,
    "usage_relation": true,
    "feedback_reciprocity": true
  }'::jsonb;

COMMENT ON COLUMN public.user_settings.notify_email IS
  'Optional transactional email prefs. Missing row/keys default ON for important templates only.';

-- ---------------------------------------------------------------------------
-- 2) outbox: suppressed status (preference OFF at send-time; not "sent")
-- ---------------------------------------------------------------------------
ALTER TABLE public.transactional_email_outbox
  DROP CONSTRAINT IF EXISTS transactional_email_outbox_status_check;

ALTER TABLE public.transactional_email_outbox
  ADD CONSTRAINT transactional_email_outbox_status_check
  CHECK (status = ANY (ARRAY[
    'pending'::text,
    'sent'::text,
    'failed'::text,
    'dead'::text,
    'suppressed'::text
  ]));

-- ---------------------------------------------------------------------------
-- 3) category mapping + allow helper (missing prefs = ON)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transactional_email_category_for_template(
  p_template_key text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE trim(p_template_key)
    WHEN 'collab_consultation_new' THEN 'messages_collab'
    WHEN 'collab_consultation_message' THEN 'messages_collab'
    WHEN 'usage_relation_request' THEN 'usage_relation'
    WHEN 'usage_relation_accepted' THEN 'usage_relation'
    WHEN 'usage_relation_rejected' THEN 'usage_relation'
    WHEN 'feedback_reciprocity' THEN 'feedback_reciprocity'
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.transactional_email_category_for_template(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transactional_email_category_for_template(text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.transactional_email_pref_allows(
  p_user_id uuid,
  p_template_key text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category text;
  v_prefs jsonb;
  v_master boolean;
  v_category_on boolean;
BEGIN
  v_category := public.transactional_email_category_for_template(p_template_key);
  IF v_category IS NULL THEN
    -- Unknown template: do not send via this preference path.
    RETURN false;
  END IF;

  SELECT us.notify_email
    INTO v_prefs
  FROM public.user_settings us
  WHERE us.user_id = p_user_id;

  -- No row ⇒ defaults ON for important transactional templates.
  IF v_prefs IS NULL THEN
    RETURN true;
  END IF;

  v_master := coalesce((v_prefs ->> 'master')::boolean, true);
  IF NOT v_master THEN
    RETURN false;
  END IF;

  v_category_on := coalesce((v_prefs ->> v_category)::boolean, true);
  RETURN v_category_on;
END;
$$;

REVOKE ALL ON FUNCTION public.transactional_email_pref_allows(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transactional_email_pref_allows(uuid, text)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 4) enqueue: resolve current Auth email + preference gate (NULL = skipped)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_transactional_email(
  p_user_id uuid,
  p_to_email text,
  p_template_key text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_available_at timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text;
BEGIN
  IF p_user_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'Valid recipient user is required';
  END IF;
  IF nullif(trim(p_template_key), '') IS NULL THEN
    RAISE EXCEPTION 'Template key is required';
  END IF;

  -- Current registered Auth email is canonical (ignore stale p_to_email).
  SELECT nullif(trim(u.email), '')
    INTO v_email
  FROM auth.users u
  WHERE u.id = p_user_id;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Caller may pass a hint; still require Auth email match for safety.
  IF nullif(trim(p_to_email), '') IS NOT NULL
     AND lower(trim(p_to_email)) <> lower(v_email) THEN
    -- Prefer Auth email; do not enqueue to a different address.
    NULL;
  END IF;

  IF NOT public.transactional_email_pref_allows(p_user_id, trim(p_template_key)) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.transactional_email_outbox (
    user_id, to_email, template_key, payload, available_at
  )
  VALUES (
    p_user_id,
    v_email,
    trim(p_template_key),
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_available_at, now())
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_transactional_email(
  uuid, text, text, jsonb, timestamptz
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_transactional_email(
  uuid, text, text, jsonb, timestamptz
) TO service_role;

-- ---------------------------------------------------------------------------
-- 5) send-time evaluate: refresh email + prefer suppress over send
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.evaluate_transactional_email_outbox_row(
  p_outbox_id uuid
)
RETURNS TABLE (
  allowed boolean,
  to_email text,
  suppress_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.transactional_email_outbox%ROWTYPE;
  v_auth_email text;
BEGIN
  SELECT *
    INTO v_row
  FROM public.transactional_email_outbox
  WHERE id = p_outbox_id
  FOR UPDATE;

  IF NOT FOUND THEN
    allowed := false;
    to_email := NULL;
    suppress_reason := 'missing_row';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_row.status = 'sent' OR v_row.status = 'suppressed' OR v_row.status = 'dead' THEN
    allowed := false;
    to_email := v_row.to_email;
    suppress_reason := 'already_final:' || v_row.status;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT nullif(trim(u.email), '')
    INTO v_auth_email
  FROM auth.users u
  WHERE u.id = v_row.user_id;

  IF v_auth_email IS NULL THEN
    UPDATE public.transactional_email_outbox
    SET status = 'suppressed',
        last_error = 'suppressed:missing_auth_email',
        available_at = now()
    WHERE id = p_outbox_id;

    allowed := false;
    to_email := NULL;
    suppress_reason := 'missing_auth_email';
    RETURN NEXT;
    RETURN;
  END IF;

  IF NOT public.transactional_email_pref_allows(v_row.user_id, v_row.template_key) THEN
    UPDATE public.transactional_email_outbox
    SET status = 'suppressed',
        last_error = 'suppressed:preference_off',
        to_email = v_auth_email,
        available_at = now()
    WHERE id = p_outbox_id;

    allowed := false;
    to_email := v_auth_email;
    suppress_reason := 'preference_off';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Keep to_email aligned with current Auth email.
  IF v_row.to_email IS DISTINCT FROM v_auth_email THEN
    UPDATE public.transactional_email_outbox
    SET to_email = v_auth_email
    WHERE id = p_outbox_id;
  END IF;

  allowed := true;
  to_email := v_auth_email;
  suppress_reason := NULL;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.evaluate_transactional_email_outbox_row(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_transactional_email_outbox_row(uuid)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 6) In-app notification copy: 相談 → メッセージ (existing + future inserts)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_user_notification_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN ('consultation_new', 'consultation_message')
     AND NEW.message IS NOT NULL
     AND position('コラボ相談' in NEW.message) > 0 THEN
    NEW.message := replace(NEW.message, 'コラボ相談', 'メッセージ');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_user_notification_message() FROM PUBLIC;

DROP TRIGGER IF EXISTS user_notifications_normalize_message
  ON public.user_notifications;
CREATE TRIGGER user_notifications_normalize_message
  BEFORE INSERT OR UPDATE OF message, type
  ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_user_notification_message();

UPDATE public.user_notifications
SET message = replace(message, 'コラボ相談', 'メッセージ')
WHERE type IN ('consultation_new', 'consultation_message')
  AND message LIKE '%コラボ相談%';

-- Table grants (policies alone are insufficient after PUBLIC revoke patterns)
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_settings TO authenticated;
GRANT SELECT ON TABLE public.user_settings TO service_role;

-- === end 096_transactional_email_preferences.sql ===

-- === 097_transactional_email_pref_allows_harden.sql ===
-- 097: harden transactional_email_pref_allows against malformed notify_email JSON

BEGIN;

CREATE OR REPLACE FUNCTION public.transactional_email_pref_allows(
  p_user_id uuid,
  p_template_key text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category text;
  v_prefs jsonb;
  v_master boolean;
  v_category_on boolean;
  v_raw text;
BEGIN
  v_category := public.transactional_email_category_for_template(p_template_key);
  IF v_category IS NULL THEN
    RETURN false;
  END IF;

  SELECT us.notify_email
    INTO v_prefs
  FROM public.user_settings us
  WHERE us.user_id = p_user_id;

  IF v_prefs IS NULL THEN
    RETURN true;
  END IF;

  BEGIN
    v_raw := v_prefs ->> 'master';
    IF v_raw IS NULL THEN
      v_master := true;
    ELSIF lower(v_raw) IN ('true', 't', '1') THEN
      v_master := true;
    ELSIF lower(v_raw) IN ('false', 'f', '0') THEN
      v_master := false;
    ELSE
      -- Malformed → fail closed for this recipient only.
      RETURN false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  IF NOT v_master THEN
    RETURN false;
  END IF;

  BEGIN
    v_raw := v_prefs ->> v_category;
    IF v_raw IS NULL THEN
      v_category_on := true;
    ELSIF lower(v_raw) IN ('true', 't', '1') THEN
      v_category_on := true;
    ELSIF lower(v_raw) IN ('false', 'f', '0') THEN
      v_category_on := false;
    ELSE
      RETURN false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  RETURN v_category_on;
END;
$$;

REVOKE ALL ON FUNCTION public.transactional_email_pref_allows(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transactional_email_pref_allows(uuid, text)
  TO service_role;

-- === end 097_transactional_email_pref_allows_harden.sql ===

-- === 098_remove_dead_notify_studio_voice.sql ===
-- 098: remove dead notify_studio.voice preference key
-- Product: voice_received notifications remain always-on (031).
-- The "voice" key in notify_studio default/JSON was a remnant after 031
-- removed the preference gate from notify_owner_on_voice_response().
-- Do not reintroduce a Settings toggle; do not disable voice_received inserts.

BEGIN;

ALTER TABLE public.user_settings
  ALTER COLUMN notify_studio SET DEFAULT '{
    "witness": true,
    "version-play": true,
    "community": true
  }'::jsonb;

-- Strip remnant key from existing rows (idempotent).
UPDATE public.user_settings
SET notify_studio = coalesce(notify_studio, '{}'::jsonb) - 'voice'
WHERE notify_studio ? 'voice';

COMMENT ON COLUMN public.user_settings.notify_studio IS
  'Studio in-app notification prefs (witness, version-play, community). voice key removed; voice_received is always-on (031).';

-- === end 098_remove_dead_notify_studio_voice.sql ===

-- === 099_messaging_pair_identity.sql ===
-- 099: messaging pair identity — 1 unordered participant pair = 1 open thread
-- - Soft-close duplicate open consultations (keep latest by last_message_at)
-- - Partial UNIQUE on open unordered pairs
-- - create_collab_consultation finds-or-reuses open (or reopens latest) pair thread
-- - list_my_collab_consultations aggregates 1 row per counterpart
-- - mark_collab_consultation_read marks all consultations in the pair
-- Non-destructive: historical consultation/message rows are kept.

BEGIN;

-- 1) Soft-close duplicate open pairs (keep one canonical open row per unordered pair)
WITH ranked AS (
  SELECT
    c.id,
    row_number() OVER (
      PARTITION BY LEAST(c.initiator_id, c.counterpart_id),
                   GREATEST(c.initiator_id, c.counterpart_id)
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC, c.id DESC
    ) AS rn
  FROM public.collab_consultations c
  WHERE c.status = 'open'
)
UPDATE public.collab_consultations c
SET status = 'closed',
    updated_at = now()
FROM ranked r
WHERE c.id = r.id
  AND r.rn > 1
  AND c.status = 'open';

-- 2) Enforce at most one open thread per unordered pair
CREATE UNIQUE INDEX IF NOT EXISTS collab_consultations_one_open_pair_uidx
  ON public.collab_consultations (
    LEAST(initiator_id, counterpart_id),
    GREATEST(initiator_id, counterpart_id)
  )
  WHERE status = 'open';

-- 3) create: find-or-reuse pair thread (purpose/project = context only)
CREATE OR REPLACE FUNCTION public.create_collab_consultation(
  p_counterpart_id uuid,
  p_purpose text,
  p_first_message text,
  p_initiator_project_id uuid DEFAULT NULL,
  p_counterpart_project_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_consultation_id uuid;
  v_message_id uuid;
  v_project_id text;
  v_email text;
  v_reused boolean := false;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF p_counterpart_id IS NULL OR p_counterpart_id = v_uid
     OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_counterpart_id) THEN
    RAISE EXCEPTION 'Valid distinct counterpart required';
  END IF;
  IF public.users_are_blocking(v_uid, p_counterpart_id) THEN
    RAISE EXCEPTION 'Consultation unavailable because a participant has blocked the other';
  END IF;
  IF p_purpose NOT IN (
    'use_their_work', 'offer_my_work', 'commission', 'collaborate', 'other'
  ) THEN
    RAISE EXCEPTION 'Invalid consultation purpose';
  END IF;
  IF char_length(trim(coalesce(p_first_message, ''))) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'First message must contain 1 to 4000 characters';
  END IF;
  IF p_initiator_project_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_initiator_project_id AND p.owner_id = v_uid
  ) THEN
    RAISE EXCEPTION 'Initiator project must belong to the initiator';
  END IF;
  IF p_counterpart_project_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_counterpart_project_id
      AND p.owner_id = p_counterpart_id
      AND p.visibility = 'public'
  ) THEN
    RAISE EXCEPTION 'Counterpart project must be public and belong to the counterpart';
  END IF;

  -- Prefer existing open thread for this unordered pair.
  SELECT c.id INTO v_consultation_id
  FROM public.collab_consultations c
  WHERE c.status = 'open'
    AND (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    )
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
  LIMIT 1;

  IF v_consultation_id IS NULL THEN
    -- Else reuse latest historical thread (reopen) rather than spawn a second identity.
    SELECT c.id INTO v_consultation_id
    FROM public.collab_consultations c
    WHERE (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    )
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    LIMIT 1;
  END IF;

  IF v_consultation_id IS NOT NULL THEN
    v_reused := true;
    UPDATE public.collab_consultations
    SET purpose = p_purpose,
        initiator_project_id = coalesce(p_initiator_project_id, initiator_project_id),
        counterpart_project_id = coalesce(p_counterpart_project_id, counterpart_project_id),
        status = 'open',
        updated_at = now()
    WHERE id = v_consultation_id;

    INSERT INTO public.collab_consultation_messages (
      consultation_id, sender_id, body
    )
    VALUES (v_consultation_id, v_uid, trim(p_first_message))
    RETURNING id INTO v_message_id;

    INSERT INTO public.collab_consultation_reads (
      consultation_id, user_id, last_read_at, last_read_message_id
    )
    VALUES (v_consultation_id, v_uid, now(), v_message_id)
    ON CONFLICT (consultation_id, user_id) DO UPDATE
    SET last_read_at = EXCLUDED.last_read_at,
        last_read_message_id = EXCLUDED.last_read_message_id;

    v_project_id := coalesce(
      p_counterpart_project_id::text,
      p_initiator_project_id::text
    );

    INSERT INTO public.user_notifications (
      user_id, type, project_id, message,
      requires_acknowledgement, coalesce_key, consultation_id
    )
    VALUES (
      p_counterpart_id,
      'consultation_message',
      v_project_id,
      '新しいメッセージが届きました',
      true,
      'consultation:' || v_consultation_id::text,
      v_consultation_id
    );

    BEGIN
      SELECT u.email INTO v_email
      FROM auth.users u
      WHERE u.id = p_counterpart_id;
      IF nullif(trim(v_email), '') IS NOT NULL THEN
        PERFORM public.enqueue_transactional_email(
          p_counterpart_id,
          v_email,
          'collab_consultation_message',
          jsonb_build_object(
            'consultation_id', v_consultation_id,
            'initiator_id', v_uid,
            'purpose', p_purpose
          ),
          now()
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    RETURN v_consultation_id;
  END IF;

  -- Brand-new pair: create once.
  INSERT INTO public.collab_consultations (
    initiator_id, counterpart_id, purpose,
    initiator_project_id, counterpart_project_id
  )
  VALUES (
    v_uid, p_counterpart_id, p_purpose,
    p_initiator_project_id, p_counterpart_project_id
  )
  RETURNING id INTO v_consultation_id;

  INSERT INTO public.collab_consultation_messages (
    consultation_id, sender_id, body
  )
  VALUES (v_consultation_id, v_uid, trim(p_first_message))
  RETURNING id INTO v_message_id;

  INSERT INTO public.collab_consultation_reads (
    consultation_id, user_id, last_read_at, last_read_message_id
  )
  VALUES (v_consultation_id, v_uid, now(), v_message_id);

  v_project_id := coalesce(
    p_counterpart_project_id::text,
    p_initiator_project_id::text
  );

  INSERT INTO public.user_notifications (
    user_id, type, project_id, message,
    requires_acknowledgement, coalesce_key, consultation_id
  )
  VALUES (
    p_counterpart_id,
    'consultation_new',
    v_project_id,
    '新しいメッセージが届きました',
    true,
    'consultation:' || v_consultation_id::text,
    v_consultation_id
  );

  BEGIN
    SELECT u.email INTO v_email
    FROM auth.users u
    WHERE u.id = p_counterpart_id;
    IF nullif(trim(v_email), '') IS NOT NULL THEN
      PERFORM public.enqueue_transactional_email(
        p_counterpart_id,
        v_email,
        'collab_consultation_new',
        jsonb_build_object(
          'consultation_id', v_consultation_id,
          'initiator_id', v_uid,
          'purpose', p_purpose
        ),
        now()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_consultation_id;
END;
$$;

-- 4) list: one row per counterpart (canonical = latest activity consultation)
CREATE OR REPLACE FUNCTION public.list_my_collab_consultations()
RETURNS TABLE (
  consultation_id uuid,
  counterpart_id uuid,
  purpose text,
  initiator_project_id uuid,
  counterpart_project_id uuid,
  status text,
  last_message_body text,
  last_message_sender_id uuid,
  last_message_at timestamptz,
  unread_count bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH mine AS (
    SELECT
      c.*,
      CASE
        WHEN c.initiator_id = auth.uid() THEN c.counterpart_id
        ELSE c.initiator_id
      END AS peer_id,
      LEAST(c.initiator_id, c.counterpart_id) AS pair_a,
      GREATEST(c.initiator_id, c.counterpart_id) AS pair_b
    FROM public.collab_consultations c
    WHERE public.auth_is_registered_user()
      AND auth.uid() IN (c.initiator_id, c.counterpart_id)
  ),
  canonical AS (
    SELECT DISTINCT ON (m.pair_a, m.pair_b)
      m.*
    FROM mine m
    ORDER BY
      m.pair_a,
      m.pair_b,
      m.last_message_at DESC NULLS LAST,
      m.created_at DESC,
      m.id DESC
  )
  SELECT
    c.id,
    c.peer_id,
    c.purpose,
    c.initiator_project_id,
    c.counterpart_project_id,
    c.status,
    lm.body,
    lm.sender_id,
    lm.created_at,
    (
      SELECT count(*)::bigint
      FROM public.collab_consultation_messages um
      JOIN public.collab_consultations uc ON uc.id = um.consultation_id
      LEFT JOIN public.collab_consultation_reads ur
        ON ur.consultation_id = uc.id AND ur.user_id = auth.uid()
      WHERE LEAST(uc.initiator_id, uc.counterpart_id) = c.pair_a
        AND GREATEST(uc.initiator_id, uc.counterpart_id) = c.pair_b
        AND um.sender_id <> auth.uid()
        AND um.created_at > coalesce(ur.last_read_at, '-infinity'::timestamptz)
    ),
    c.created_at
  FROM canonical c
  LEFT JOIN LATERAL (
    SELECT m.body, m.sender_id, m.created_at
    FROM public.collab_consultation_messages m
    JOIN public.collab_consultations xc ON xc.id = m.consultation_id
    WHERE LEAST(xc.initiator_id, xc.counterpart_id) = c.pair_a
      AND GREATEST(xc.initiator_id, xc.counterpart_id) = c.pair_b
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1
  ) lm ON true
  ORDER BY lm.created_at DESC NULLS LAST, c.created_at DESC;
$$;

-- 5) mark read across the whole pair (so aggregated unread clears)
CREATE OR REPLACE FUNCTION public.mark_collab_consultation_read(
  p_consultation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pair_a uuid;
  v_pair_b uuid;
  r record;
  v_message_id uuid;
  v_message_at timestamptz;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  SELECT
    LEAST(c.initiator_id, c.counterpart_id),
    GREATEST(c.initiator_id, c.counterpart_id)
  INTO v_pair_a, v_pair_b
  FROM public.collab_consultations c
  WHERE c.id = p_consultation_id
    AND v_uid IN (c.initiator_id, c.counterpart_id);
  IF v_pair_a IS NULL THEN
    RAISE EXCEPTION 'Participant consultation not found';
  END IF;

  FOR r IN
    SELECT c.id
    FROM public.collab_consultations c
    WHERE LEAST(c.initiator_id, c.counterpart_id) = v_pair_a
      AND GREATEST(c.initiator_id, c.counterpart_id) = v_pair_b
  LOOP
    SELECT m.id, m.created_at
    INTO v_message_id, v_message_at
    FROM public.collab_consultation_messages m
    WHERE m.consultation_id = r.id
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1;

    INSERT INTO public.collab_consultation_reads (
      consultation_id, user_id, last_read_at, last_read_message_id
    )
    VALUES (
      r.id, v_uid, coalesce(v_message_at, now()), v_message_id
    )
    ON CONFLICT (consultation_id, user_id) DO UPDATE
    SET last_read_at = EXCLUDED.last_read_at,
        last_read_message_id = EXCLUDED.last_read_message_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_my_collab_consultations() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_collab_consultation_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_collab_consultations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_collab_consultation_read(uuid) TO authenticated;

-- === end 099_messaging_pair_identity.sql ===

-- === 100_messaging_context_segments.sql ===
-- 100: consultation context segments within pair identity
-- Same unordered participant pair stays one conversation (list/unread).
-- New create_collab_consultation appends a new open consultation row
-- (soft-closing prior open) so purpose/project history can render as
-- timeline context cards without overwriting prior segments.
-- Does not insert system messages into collab_consultation_messages.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_collab_consultation(
  p_counterpart_id uuid,
  p_purpose text,
  p_first_message text,
  p_initiator_project_id uuid DEFAULT NULL,
  p_counterpart_project_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_consultation_id uuid;
  v_message_id uuid;
  v_project_id text;
  v_email text;
  v_pair_existed boolean := false;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF p_counterpart_id IS NULL OR p_counterpart_id = v_uid
     OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_counterpart_id) THEN
    RAISE EXCEPTION 'Valid distinct counterpart required';
  END IF;
  IF public.users_are_blocking(v_uid, p_counterpart_id) THEN
    RAISE EXCEPTION 'Consultation unavailable because a participant has blocked the other';
  END IF;
  IF p_purpose NOT IN (
    'use_their_work', 'offer_my_work', 'commission', 'collaborate', 'other'
  ) THEN
    RAISE EXCEPTION 'Invalid consultation purpose';
  END IF;
  IF char_length(trim(coalesce(p_first_message, ''))) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'First message must contain 1 to 4000 characters';
  END IF;
  IF p_initiator_project_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_initiator_project_id AND p.owner_id = v_uid
  ) THEN
    RAISE EXCEPTION 'Initiator project must belong to the initiator';
  END IF;
  IF p_counterpart_project_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_counterpart_project_id
      AND p.owner_id = p_counterpart_id
      AND p.visibility = 'public'
  ) THEN
    RAISE EXCEPTION 'Counterpart project must be public and belong to the counterpart';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.collab_consultations c
    WHERE (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    )
  ) INTO v_pair_existed;

  -- Keep at most one open row per pair: close prior open before inserting segment.
  UPDATE public.collab_consultations c
  SET status = 'closed',
      updated_at = now()
  WHERE c.status = 'open'
    AND (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    );

  INSERT INTO public.collab_consultations (
    initiator_id, counterpart_id, purpose,
    initiator_project_id, counterpart_project_id
  )
  VALUES (
    v_uid, p_counterpart_id, p_purpose,
    p_initiator_project_id, p_counterpart_project_id
  )
  RETURNING id INTO v_consultation_id;

  INSERT INTO public.collab_consultation_messages (
    consultation_id, sender_id, body
  )
  VALUES (v_consultation_id, v_uid, trim(p_first_message))
  RETURNING id INTO v_message_id;

  INSERT INTO public.collab_consultation_reads (
    consultation_id, user_id, last_read_at, last_read_message_id
  )
  VALUES (v_consultation_id, v_uid, now(), v_message_id);

  v_project_id := coalesce(
    p_counterpart_project_id::text,
    p_initiator_project_id::text
  );

  INSERT INTO public.user_notifications (
    user_id, type, project_id, message,
    requires_acknowledgement, coalesce_key, consultation_id
  )
  VALUES (
    p_counterpart_id,
    CASE WHEN v_pair_existed THEN 'consultation_message' ELSE 'consultation_new' END,
    v_project_id,
    '新しいメッセージが届きました',
    true,
    'consultation:' || v_consultation_id::text,
    v_consultation_id
  );

  BEGIN
    SELECT u.email INTO v_email
    FROM auth.users u
    WHERE u.id = p_counterpart_id;
    IF nullif(trim(v_email), '') IS NOT NULL THEN
      PERFORM public.enqueue_transactional_email(
        p_counterpart_id,
        v_email,
        CASE
          WHEN v_pair_existed THEN 'collab_consultation_message'
          ELSE 'collab_consultation_new'
        END,
        jsonb_build_object(
          'consultation_id', v_consultation_id,
          'initiator_id', v_uid,
          'purpose', p_purpose
        ),
        now()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_consultation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_collab_consultation(
  uuid, text, text, uuid, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_collab_consultation(
  uuid, text, text, uuid, uuid
) TO authenticated;

-- === end 100_messaging_context_segments.sql ===

-- === 101_messaging_pair_email_read_harden.sql ===
-- 101: pair-aware messaging email/read hardening
-- - mark_collab_consultation_read locks all pair consultations FOR UPDATE
-- - create_collab_consultation emails only when recipient has no pair-level unread
-- - send_collab_consultation_message unread check is pair-scoped (not segment-only)
-- Keeps 099/100 pair identity + context segments.

BEGIN;

CREATE OR REPLACE FUNCTION public.mark_collab_consultation_read(
  p_consultation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pair_a uuid;
  v_pair_b uuid;
  r record;
  v_message_id uuid;
  v_message_at timestamptz;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;

  SELECT
    LEAST(c.initiator_id, c.counterpart_id),
    GREATEST(c.initiator_id, c.counterpart_id)
  INTO v_pair_a, v_pair_b
  FROM public.collab_consultations c
  WHERE c.id = p_consultation_id
    AND v_uid IN (c.initiator_id, c.counterpart_id);
  IF v_pair_a IS NULL THEN
    RAISE EXCEPTION 'Participant consultation not found';
  END IF;

  -- Serialize with send/create on every consultation in the pair.
  PERFORM 1
  FROM public.collab_consultations c
  WHERE LEAST(c.initiator_id, c.counterpart_id) = v_pair_a
    AND GREATEST(c.initiator_id, c.counterpart_id) = v_pair_b
  FOR UPDATE;

  FOR r IN
    SELECT c.id
    FROM public.collab_consultations c
    WHERE LEAST(c.initiator_id, c.counterpart_id) = v_pair_a
      AND GREATEST(c.initiator_id, c.counterpart_id) = v_pair_b
  LOOP
    SELECT m.id, m.created_at
    INTO v_message_id, v_message_at
    FROM public.collab_consultation_messages m
    WHERE m.consultation_id = r.id
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1;

    INSERT INTO public.collab_consultation_reads (
      consultation_id, user_id, last_read_at, last_read_message_id
    )
    VALUES (
      r.id, v_uid, coalesce(v_message_at, now()), v_message_id
    )
    ON CONFLICT (consultation_id, user_id) DO UPDATE
    SET last_read_at = EXCLUDED.last_read_at,
        last_read_message_id = EXCLUDED.last_read_message_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_collab_consultation(
  p_counterpart_id uuid,
  p_purpose text,
  p_first_message text,
  p_initiator_project_id uuid DEFAULT NULL,
  p_counterpart_project_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_consultation_id uuid;
  v_message_id uuid;
  v_project_id text;
  v_email text;
  v_pair_existed boolean := false;
  v_recipient_already_unread boolean := false;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF p_counterpart_id IS NULL OR p_counterpart_id = v_uid
     OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_counterpart_id) THEN
    RAISE EXCEPTION 'Valid distinct counterpart required';
  END IF;
  IF public.users_are_blocking(v_uid, p_counterpart_id) THEN
    RAISE EXCEPTION 'Consultation unavailable because a participant has blocked the other';
  END IF;
  IF p_purpose NOT IN (
    'use_their_work', 'offer_my_work', 'commission', 'collaborate', 'other'
  ) THEN
    RAISE EXCEPTION 'Invalid consultation purpose';
  END IF;
  IF char_length(trim(coalesce(p_first_message, ''))) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'First message must contain 1 to 4000 characters';
  END IF;
  IF p_initiator_project_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_initiator_project_id AND p.owner_id = v_uid
  ) THEN
    RAISE EXCEPTION 'Initiator project must belong to the initiator';
  END IF;
  IF p_counterpart_project_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_counterpart_project_id
      AND p.owner_id = p_counterpart_id
      AND p.visibility = 'public'
  ) THEN
    RAISE EXCEPTION 'Counterpart project must be public and belong to the counterpart';
  END IF;

  -- Lock existing pair rows before soft-close + insert (double-click / concurrent create).
  PERFORM 1
  FROM public.collab_consultations c
  WHERE (
    (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
    OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
  )
  FOR UPDATE;

  SELECT EXISTS (
    SELECT 1
    FROM public.collab_consultations c
    WHERE (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    )
  ) INTO v_pair_existed;

  SELECT EXISTS (
    SELECT 1
    FROM public.collab_consultation_messages m
    JOIN public.collab_consultations c ON c.id = m.consultation_id
    WHERE (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    )
      AND m.sender_id IS DISTINCT FROM p_counterpart_id
      AND (
        NOT EXISTS (
          SELECT 1
          FROM public.collab_consultation_reads r
          WHERE r.consultation_id = c.id
            AND r.user_id = p_counterpart_id
        )
        OR m.created_at > (
          SELECT r.last_read_at
          FROM public.collab_consultation_reads r
          WHERE r.consultation_id = c.id
            AND r.user_id = p_counterpart_id
        )
      )
  ) INTO v_recipient_already_unread;

  UPDATE public.collab_consultations c
  SET status = 'closed',
      updated_at = now()
  WHERE c.status = 'open'
    AND (
      (c.initiator_id = v_uid AND c.counterpart_id = p_counterpart_id)
      OR (c.initiator_id = p_counterpart_id AND c.counterpart_id = v_uid)
    );

  INSERT INTO public.collab_consultations (
    initiator_id, counterpart_id, purpose,
    initiator_project_id, counterpart_project_id
  )
  VALUES (
    v_uid, p_counterpart_id, p_purpose,
    p_initiator_project_id, p_counterpart_project_id
  )
  RETURNING id INTO v_consultation_id;

  INSERT INTO public.collab_consultation_messages (
    consultation_id, sender_id, body
  )
  VALUES (v_consultation_id, v_uid, trim(p_first_message))
  RETURNING id INTO v_message_id;

  INSERT INTO public.collab_consultation_reads (
    consultation_id, user_id, last_read_at, last_read_message_id
  )
  VALUES (v_consultation_id, v_uid, now(), v_message_id);

  v_project_id := coalesce(
    p_counterpart_project_id::text,
    p_initiator_project_id::text
  );

  INSERT INTO public.user_notifications (
    user_id, type, project_id, message,
    requires_acknowledgement, coalesce_key, consultation_id
  )
  VALUES (
    p_counterpart_id,
    CASE WHEN v_pair_existed THEN 'consultation_message' ELSE 'consultation_new' END,
    v_project_id,
    '新しいメッセージが届きました',
    true,
    'consultation:' || v_consultation_id::text,
    v_consultation_id
  );

  IF NOT coalesce(v_recipient_already_unread, false) THEN
    BEGIN
      SELECT u.email INTO v_email
      FROM auth.users u
      WHERE u.id = p_counterpart_id;
      IF nullif(trim(v_email), '') IS NOT NULL THEN
        PERFORM public.enqueue_transactional_email(
          p_counterpart_id,
          v_email,
          CASE
            WHEN v_pair_existed THEN 'collab_consultation_message'
            ELSE 'collab_consultation_new'
          END,
          jsonb_build_object(
            'consultation_id', v_consultation_id,
            'initiator_id', v_uid,
            'purpose', p_purpose
          ),
          now()
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN v_consultation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_collab_consultation_message(
  p_consultation_id uuid,
  p_body text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_message_id uuid;
  v_consultation public.collab_consultations%ROWTYPE;
  v_recipient_id uuid;
  v_project_id text;
  v_email text;
  v_recipient_already_unread boolean;
  v_pair_a uuid;
  v_pair_b uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.auth_is_registered_user() THEN
    RAISE EXCEPTION 'Registered authentication required';
  END IF;
  IF char_length(trim(coalesce(p_body, ''))) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'Message must contain 1 to 4000 characters';
  END IF;

  SELECT * INTO v_consultation
  FROM public.collab_consultations c
  WHERE c.id = p_consultation_id
    AND c.status = 'open'
    AND v_uid IN (c.initiator_id, c.counterpart_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Open participant consultation not found';
  END IF;

  v_pair_a := LEAST(v_consultation.initiator_id, v_consultation.counterpart_id);
  v_pair_b := GREATEST(v_consultation.initiator_id, v_consultation.counterpart_id);

  -- Also lock sibling segments so mark_read/create cannot race the unread gate.
  PERFORM 1
  FROM public.collab_consultations c
  WHERE LEAST(c.initiator_id, c.counterpart_id) = v_pair_a
    AND GREATEST(c.initiator_id, c.counterpart_id) = v_pair_b
    AND c.id <> p_consultation_id
  FOR UPDATE;

  v_recipient_id := CASE
    WHEN v_consultation.initiator_id = v_uid
      THEN v_consultation.counterpart_id
    ELSE v_consultation.initiator_id
  END;
  IF public.users_are_blocking(v_uid, v_recipient_id) THEN
    RAISE EXCEPTION 'Message unavailable because a participant has blocked the other';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.collab_consultation_messages m
    JOIN public.collab_consultations c ON c.id = m.consultation_id
    WHERE LEAST(c.initiator_id, c.counterpart_id) = v_pair_a
      AND GREATEST(c.initiator_id, c.counterpart_id) = v_pair_b
      AND m.sender_id IS DISTINCT FROM v_recipient_id
      AND (
        NOT EXISTS (
          SELECT 1
          FROM public.collab_consultation_reads r
          WHERE r.consultation_id = c.id
            AND r.user_id = v_recipient_id
        )
        OR m.created_at > (
          SELECT r.last_read_at
          FROM public.collab_consultation_reads r
          WHERE r.consultation_id = c.id
            AND r.user_id = v_recipient_id
        )
      )
  ) INTO v_recipient_already_unread;

  INSERT INTO public.collab_consultation_messages (
    consultation_id, sender_id, body
  )
  VALUES (p_consultation_id, v_uid, trim(p_body))
  RETURNING id INTO v_message_id;

  INSERT INTO public.collab_consultation_reads (
    consultation_id, user_id, last_read_at, last_read_message_id
  )
  VALUES (p_consultation_id, v_uid, now(), v_message_id)
  ON CONFLICT (consultation_id, user_id) DO UPDATE
  SET last_read_at = EXCLUDED.last_read_at,
      last_read_message_id = EXCLUDED.last_read_message_id;

  v_project_id := coalesce(
    v_consultation.counterpart_project_id::text,
    v_consultation.initiator_project_id::text
  );

  INSERT INTO public.user_notifications (
    user_id, type, project_id, message,
    requires_acknowledgement, coalesce_key, consultation_id
  )
  VALUES (
    v_recipient_id,
    'consultation_message',
    v_project_id,
    '新しいメッセージが届きました',
    true,
    'consultation:' || p_consultation_id::text,
    p_consultation_id
  );

  IF NOT coalesce(v_recipient_already_unread, false) THEN
    BEGIN
      SELECT u.email INTO v_email
      FROM auth.users u
      WHERE u.id = v_recipient_id;
      IF nullif(trim(v_email), '') IS NOT NULL THEN
        PERFORM public.enqueue_transactional_email(
          v_recipient_id,
          v_email,
          'collab_consultation_message',
          jsonb_build_object(
            'consultation_id', p_consultation_id,
            'message_id', v_message_id,
            'sender_id', v_uid
          ),
          now()
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN v_message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_collab_consultation_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_collab_consultation_message(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_collab_consultation_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_collab_consultation(uuid, text, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_collab_consultation_message(uuid, text) TO authenticated;

-- === end 101_messaging_pair_email_read_harden.sql ===

COMMIT;
