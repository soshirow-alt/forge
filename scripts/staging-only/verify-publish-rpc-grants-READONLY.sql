-- READ-ONLY grant check for publish_project_version_with_devlog
-- Expect: authenticated_can_execute = true, anon_can_execute = false

SELECT
  has_function_privilege(
    'authenticated',
    'public.publish_project_version_with_devlog(uuid, text, text, text)',
    'EXECUTE'
  ) AS authenticated_can_execute,
  has_function_privilege(
    'anon',
    'public.publish_project_version_with_devlog(uuid, text, text, text)',
    'EXECUTE'
  ) AS anon_can_execute;
