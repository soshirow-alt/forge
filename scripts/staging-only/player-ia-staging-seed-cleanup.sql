-- STAGING ONLY cleanup — Player IA seed
-- Target ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT run on Production (bpnisgzxuwdxelhnduuf).
--
-- Deletes ONLY seed-owned rows (fixed UUID namespaces / markers).
-- Does NOT mutate existing developer_profiles or non-seed projects.
-- After success, seed-derived row counts must be 0 (see validate SQL).
-- Run THIS before player-ia-auth-seed-cleanup.ts (auth user delete CASCADE would wipe owned projects).

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.projects WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
  ) THEN
    RAISE EXCEPTION
      'ABORT player-ia-staging-seed-cleanup: Staging Smoke A missing — refuse';
  END IF;
END $$;

DELETE FROM public.feedback_card_replies
WHERE id::text LIKE '77777777-7777-4777-8777-%'
   OR target_id IN (
        SELECT id FROM public.project_feedback WHERE id::text LIKE '99999999-9999-4999-8999-%'
        UNION ALL
        SELECT id FROM public.project_guest_feedback WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%'
      )
   OR project_id LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.feedback_card_empathies
WHERE id::text LIKE '88888888-8888-4888-8888-%'
   OR target_id IN (
        SELECT id FROM public.project_feedback WHERE id::text LIKE '99999999-9999-4999-8999-%'
        UNION ALL
        SELECT id FROM public.project_guest_feedback WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%'
      )
   OR project_id LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.project_guest_feedback
WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%'
   OR project_id LIKE 'eeeeeeee-eeee-4eee-8eee-%'
   OR submitter_key::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%';

DELETE FROM public.project_feedback
WHERE id::text LIKE '99999999-9999-4999-8999-%'
   OR project_id LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.project_usage_relations
WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%'
   OR source_project_id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
   OR target_project_id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.project_devlogs
WHERE id::text LIKE '66666666-6666-4666-8666-%'
   OR project_id LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.project_release_events
WHERE id::text LIKE '55555555-5555-4555-8555-%'
   OR project_id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.platform_announcements
WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
   OR slug LIKE 'ia-seed-%'
   OR title LIKE '[IA Seed]%';

DELETE FROM public.projects
WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
   OR (
     title LIKE '[IA Seed]%'
     AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
   );

COMMIT;
