-- =========================================================
-- STAGING ONLY — rollback Phase A (+ Phase B if applied)
-- DO NOT RUN ON PRODUCTION
-- =========================================================
begin;

alter table public.project_witness_grants
  disable trigger project_witness_grants_no_update;

delete from public.project_witness_grants
where project_id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'
  and user_id = '075348c9-6009-464c-920c-4fe6d63249c7';

alter table public.project_witness_grants
  enable trigger project_witness_grants_no_update;

update public.projects
set release_status = 'in_development',
    updated_at = now()
where id = '41ff5a96-105c-42a2-87b4-787bcfeacb45';

delete from public.voice_adoptions
where id = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000006';

delete from public.voice_adoption_matcher_runs
where id = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000005';

delete from public.project_devlogs
where id = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000004';

delete from public.project_voice_responses
where id = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000002';

delete from public.project_version_prompts
where id = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000001';

delete from public.project_watches
where project_id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'
  and user_id = '075348c9-6009-464c-920c-4fe6d63249c7';

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'display_name'
where id = '075348c9-6009-464c-920c-4fe6d63249c7';

commit;

-- select public.get_project_special_thanks('41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid);
