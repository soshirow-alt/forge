-- 051: project_devlogs.is_initial_publish + publish_project_version_with_devlog
-- Staging-first. Do NOT apply to production without owner GO.
--
-- Does NOT hardcode environment-specific devlog IDs.
-- Staging initial-devlog flag updates: scripts/staging-only/initial-devlog-flag.md
-- Production flag updates: owner GO + read-only candidate SELECT only (separate step).

BEGIN;

-- A) Column
ALTER TABLE public.project_devlogs
  ADD COLUMN IF NOT EXISTS is_initial_publish boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.project_devlogs.is_initial_publish IS
  'True only for bootstrap "initial publish" devlogs created at project submit. '
  'Excluded from home "recently updated" meaningful-update aggregation. '
  'Do not infer from title/version strings alone for new rows — set explicitly.';

CREATE INDEX IF NOT EXISTS project_devlogs_project_created_non_initial_idx
  ON public.project_devlogs (project_id, created_at DESC)
  WHERE is_initial_publish = false;

-- B) Canonical version publish + devlog (single transaction)
CREATE OR REPLACE FUNCTION public.publish_project_version_with_devlog(
  p_project_id uuid,
  p_version_key text,
  p_title text,
  p_content text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_current_version text;
  v_version text;
  v_title text;
  v_content text;
  v_devlog_id uuid;
  v_created_at timestamptz;
  v_published_version text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_version := NULLIF(btrim(COALESCE(p_version_key, '')), '');
  v_title := NULLIF(btrim(COALESCE(p_title, '')), '');
  v_content := NULLIF(btrim(COALESCE(p_content, '')), '');

  IF v_version IS NULL THEN
    RAISE EXCEPTION 'version_key is required';
  END IF;
  IF v_title IS NULL THEN
    RAISE EXCEPTION 'title is required';
  END IF;
  IF v_content IS NULL THEN
    RAISE EXCEPTION 'content is required';
  END IF;

  SELECT p.owner_id, COALESCE(p.playable_version, '0.1')
  INTO v_owner, v_current_version
  FROM public.projects p
  WHERE p.id = p_project_id
  FOR UPDATE;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_owner IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Only the project owner can publish a version';
  END IF;

  IF v_version = v_current_version THEN
    RAISE EXCEPTION 'version_key must differ from the current playable_version (%)',
      v_current_version;
  END IF;

  UPDATE public.projects
  SET playable_version = v_version
  WHERE id = p_project_id;

  INSERT INTO public.project_devlogs (
    project_id,
    author_id,
    title,
    content,
    published_version,
    is_initial_publish
  )
  VALUES (
    p_project_id::text,
    v_uid,
    v_title,
    v_content,
    v_version,
    false
  )
  RETURNING id, created_at, published_version
  INTO v_devlog_id, v_created_at, v_published_version;

  RETURN jsonb_build_object(
    'project_id', p_project_id,
    'playable_version', v_version,
    'devlog_id', v_devlog_id,
    'devlog_created_at', v_created_at,
    'published_version', v_published_version,
    'is_initial_publish', false,
    'author_id', v_uid
  );
END;
$$;

COMMENT ON FUNCTION public.publish_project_version_with_devlog(uuid, text, text, text) IS
  'Owner-only atomic playable_version bump + project_devlogs insert '
  '(published_version set, is_initial_publish=false). '
  'Notifications / confirmation_requests stay client-side after success. '
  'Same version_key as current playable_version raises an error.';

REVOKE ALL ON FUNCTION public.publish_project_version_with_devlog(uuid, text, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_project_version_with_devlog(uuid, text, text, text)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.publish_project_version_with_devlog(uuid, text, text, text)
  TO authenticated;
-- anon / service_role intentionally NOT granted

-- Verify grants (abort if anon can execute)
DO $$
DECLARE
  v_auth boolean;
  v_anon boolean;
BEGIN
  SELECT has_function_privilege(
    'authenticated',
    'public.publish_project_version_with_devlog(uuid, text, text, text)',
    'EXECUTE'
  ) INTO v_auth;
  SELECT has_function_privilege(
    'anon',
    'public.publish_project_version_with_devlog(uuid, text, text, text)',
    'EXECUTE'
  ) INTO v_anon;

  IF v_auth IS NOT TRUE THEN
    RAISE EXCEPTION
      '051 grant check failed: authenticated must EXECUTE publish_project_version_with_devlog';
  END IF;
  IF v_anon IS TRUE THEN
    RAISE EXCEPTION
      '051 grant check failed: anon must NOT EXECUTE publish_project_version_with_devlog';
  END IF;
END;
$$;

COMMIT;

-- Rollback (manual, staging):
-- DROP FUNCTION IF EXISTS public.publish_project_version_with_devlog(uuid, text, text, text);
-- DROP INDEX IF EXISTS public.project_devlogs_project_created_non_initial_idx;
-- ALTER TABLE public.project_devlogs DROP COLUMN IF EXISTS is_initial_publish;
