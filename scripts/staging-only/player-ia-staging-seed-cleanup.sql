-- STAGING ONLY cleanup — Player IA phase 1 seed
-- Target ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT run on Production (bpnisgzxuwdxelhnduuf).
--
-- Deletes only forge-ia-seed-v1 / fixed UUID rows created by
-- scripts/staging-only/player-ia-staging-seed.sql
-- Does NOT delete Smoke A/B, hero-carousel, or unrelated Staging projects.
--
-- Shared developer profile (dddddddd-…0002):
--   activity_tags / profile are NOT reverted (shared with hero-carousel seeds).

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
  ) THEN
    RAISE EXCEPTION
      'ABORT player-ia-staging-seed-cleanup: Staging Smoke A missing — refuse to run';
  END IF;
END $$;

-- Guest FB sample
DELETE FROM public.project_guest_feedback
WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001'
   OR (
     project_id = 'eeeeeeee-eeee-4eee-8eee-000000000001'
     AND submitter_key = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000099'
   );

-- Usage relations (also cascade if projects deleted first; explicit for clarity)
DELETE FROM public.project_usage_relations
WHERE id IN (
  'ffffffff-ffff-4fff-8fff-000000000001',
  'ffffffff-ffff-4fff-8fff-000000000002'
)
OR source_project_id IN (
  'eeeeeeee-eeee-4eee-8eee-000000000001',
  'eeeeeeee-eeee-4eee-8eee-000000000002',
  'eeeeeeee-eeee-4eee-8eee-000000000003',
  'eeeeeeee-eeee-4eee-8eee-000000000004',
  'eeeeeeee-eeee-4eee-8eee-000000000005'
)
OR target_project_id IN (
  'eeeeeeee-eeee-4eee-8eee-000000000001',
  'eeeeeeee-eeee-4eee-8eee-000000000002',
  'eeeeeeee-eeee-4eee-8eee-000000000003',
  'eeeeeeee-eeee-4eee-8eee-000000000004',
  'eeeeeeee-eeee-4eee-8eee-000000000005'
);

-- Announcements
DELETE FROM public.platform_announcements
WHERE id IN (
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000002',
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000003'
)
OR slug IN (
  'ia-seed-welcome',
  'ia-seed-draft-hidden',
  'ia-seed-search-note'
);

-- Seed projects (tag + fixed UUID + title prefix)
DELETE FROM public.projects
WHERE id IN (
  'eeeeeeee-eeee-4eee-8eee-000000000001',
  'eeeeeeee-eeee-4eee-8eee-000000000002',
  'eeeeeeee-eeee-4eee-8eee-000000000003',
  'eeeeeeee-eeee-4eee-8eee-000000000004',
  'eeeeeeee-eeee-4eee-8eee-000000000005'
)
OR (
  title LIKE '[IA Seed]%'
  AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'))
);

COMMIT;

-- Optional verify (run after COMMIT, outside transaction if desired):
-- SELECT count(*) FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags);
-- SELECT count(*) FROM public.platform_announcements WHERE slug LIKE 'ia-seed-%';
