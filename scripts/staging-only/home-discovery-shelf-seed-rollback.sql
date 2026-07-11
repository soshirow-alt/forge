-- STAGING ONLY rollback for home-discovery-shelf-seed.sql
-- Target: vuqpwvjvgyxffmvpfrxo
-- Does NOT delete Smoke A / B.
-- DO NOT run on Production.

BEGIN;

DELETE FROM public.project_feedback
WHERE id IN (
  'cccccccc-cccc-4ccc-8ddd-200000000003',
  'cccccccc-cccc-4ccc-8ddd-200000000004'
)
OR project_id IN (
  'cccccccc-cccc-4ccc-8ddd-000000000001',
  'cccccccc-cccc-4ccc-8ddd-000000000002',
  'cccccccc-cccc-4ccc-8ddd-000000000003',
  'cccccccc-cccc-4ccc-8ddd-000000000004'
);

DELETE FROM public.project_watches
WHERE project_id IN (
  'cccccccc-cccc-4ccc-8ddd-000000000001',
  'cccccccc-cccc-4ccc-8ddd-000000000002',
  'cccccccc-cccc-4ccc-8ddd-000000000003',
  'cccccccc-cccc-4ccc-8ddd-000000000004'
);

DELETE FROM public.project_voice_responses
WHERE project_id IN (
  'cccccccc-cccc-4ccc-8ddd-000000000001',
  'cccccccc-cccc-4ccc-8ddd-000000000002',
  'cccccccc-cccc-4ccc-8ddd-000000000003',
  'cccccccc-cccc-4ccc-8ddd-000000000004'
);

DELETE FROM public.project_devlogs
WHERE id IN (
  'cccccccc-cccc-4ccc-8ddd-100000000002',
  'cccccccc-cccc-4ccc-8ddd-100000000004'
)
OR project_id IN (
  'cccccccc-cccc-4ccc-8ddd-000000000001',
  'cccccccc-cccc-4ccc-8ddd-000000000002',
  'cccccccc-cccc-4ccc-8ddd-000000000003',
  'cccccccc-cccc-4ccc-8ddd-000000000004'
);

DELETE FROM public.project_play_sessions
WHERE project_id IN (
  'cccccccc-cccc-4ccc-8ddd-000000000001',
  'cccccccc-cccc-4ccc-8ddd-000000000002',
  'cccccccc-cccc-4ccc-8ddd-000000000003',
  'cccccccc-cccc-4ccc-8ddd-000000000004'
);

DELETE FROM public.projects
WHERE id IN (
  'cccccccc-cccc-4ccc-8ddd-000000000001',
  'cccccccc-cccc-4ccc-8ddd-000000000002',
  'cccccccc-cccc-4ccc-8ddd-000000000003',
  'cccccccc-cccc-4ccc-8ddd-000000000004'
);

COMMIT;

-- Verify leftover seed titles should be 0:
-- SELECT id, title FROM public.projects WHERE title LIKE 'Home Seed %';
