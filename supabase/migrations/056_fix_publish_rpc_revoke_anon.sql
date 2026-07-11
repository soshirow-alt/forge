-- 056: publish_project_version_with_devlog — revoke anon EXECUTE
-- For environments that already applied 051 before explicit REVOKE FROM anon.
-- Does not change function body. No GRANT to anon or service_role.

BEGIN;

REVOKE ALL ON FUNCTION public.publish_project_version_with_devlog(uuid, text, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_project_version_with_devlog(uuid, text, text, text)
  FROM anon;
GRANT EXECUTE ON FUNCTION public.publish_project_version_with_devlog(uuid, text, text, text)
  TO authenticated;

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
      '056 grant check failed: authenticated must EXECUTE publish_project_version_with_devlog';
  END IF;
  IF v_anon IS TRUE THEN
    RAISE EXCEPTION
      '056 grant check failed: anon must NOT EXECUTE publish_project_version_with_devlog';
  END IF;
END;
$$;

COMMIT;

-- Manual verify (Dashboard, read-only):
-- SELECT
--   has_function_privilege(
--     'authenticated',
--     'public.publish_project_version_with_devlog(uuid, text, text, text)',
--     'EXECUTE'
--   ) AS authenticated_can_execute,
--   has_function_privilege(
--     'anon',
--     'public.publish_project_version_with_devlog(uuid, text, text, text)',
--     'EXECUTE'
--   ) AS anon_can_execute;
-- Expect: authenticated_can_execute = true, anon_can_execute = false
