-- STAGING ONLY (vuqpwvjvgyxffmvpfrxo)
-- Read-only candidate SELECT for project_devlogs.is_initial_publish backfill.
-- DO NOT RUN ON PRODUCTION (bpnisgzxuwdxelhnduuf) as a write.
-- Production: run the SELECT only; UPDATE requires separate owner GO with explicit IDs.

-- Candidate heuristic (NOT unique-guaranteed):
--   title = '初回公開' AND published_version = '0.1'
-- Review each row before UPDATE. Do not hardcode IDs into shared migrations.

SELECT
  d.id AS devlog_id,
  d.project_id,
  d.title,
  d.published_version,
  d.created_at AS devlog_created_at,
  d.is_initial_publish AS current_flag,
  p.created_at AS project_created_at,
  p.visibility,
  p.title AS project_title
FROM public.project_devlogs d
LEFT JOIN public.projects p
  ON p.id::text = d.project_id
WHERE d.title = '初回公開'
  AND d.published_version = '0.1'
ORDER BY d.created_at ASC;

-- After manual review on STAGING, update only confirmed IDs:
-- UPDATE public.project_devlogs
-- SET is_initial_publish = true
-- WHERE id IN (
--   -- paste staging-confirmed uuids only
-- );
