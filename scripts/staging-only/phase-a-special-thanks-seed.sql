-- =========================================================
-- STAGING ONLY — Special Thanks Phase A seed (named watchers)
-- Project: Smoke A 41ff5a96-105c-42a2-87b4-787bcfeacb45
-- Ref must be: vuqpwvjvgyxffmvpfrxo
-- DO NOT RUN ON PRODUCTION
-- Prerequisite: updated 049 applied (watchers + update_contributors + avatar_url)
-- =========================================================
begin;

do $$
declare
  v_vis text;
  v_rel text;
begin
  select visibility, release_status into v_vis, v_rel
  from public.projects
  where id = '41ff5a96-105c-42a2-87b4-787bcfeacb45';

  if v_vis is distinct from 'public' then
    raise exception 'abort: Smoke A not public (got %)', v_vis;
  end if;
  if v_rel is distinct from 'in_development' then
    raise exception 'abort: expected in_development before Phase A (got %)', v_rel;
  end if;
end $$;

update auth.users
set raw_user_meta_data =
  coalesce(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('display_name', 'ST Smoke Player A')
where id = '075348c9-6009-464c-920c-4fe6d63249c7';

insert into public.project_watches (user_id, project_id, created_at)
values (
  '075348c9-6009-464c-920c-4fe6d63249c7',
  '41ff5a96-105c-42a2-87b4-787bcfeacb45',
  now()
)
on conflict (user_id, project_id) do nothing;

insert into public.project_version_prompts (
  id, project_id, version_key, prompt_text, response_kind, options, sort_order, source
) values (
  'aaaaaaaa-bbbb-4ccc-8ddd-000000000001',
  '41ff5a96-105c-42a2-87b4-787bcfeacb45',
  '0.1',
  'ST smoke: もう一度遊びたい？',
  'short_text',
  null,
  0,
  'developer'
)
on conflict (id) do nothing;

insert into public.project_voice_responses (
  id, user_id, project_id, version_key, prompt_id,
  answer_value, answer_label, moderation_status, created_at, updated_at
) values (
  'aaaaaaaa-bbbb-4ccc-8ddd-000000000002',
  '075348c9-6009-464c-920c-4fe6d63249c7',
  '41ff5a96-105c-42a2-87b4-787bcfeacb45',
  '0.1',
  'aaaaaaaa-bbbb-4ccc-8ddd-000000000001',
  'ジャンプの着地が重い',
  null,
  'visible',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.project_devlogs (
  id, project_id, author_id, title, content,
  published_version, published_at, created_at
) values (
  'aaaaaaaa-bbbb-4ccc-8ddd-000000000004',
  '41ff5a96-105c-42a2-87b4-787bcfeacb45',
  '4bdc4a2f-2a39-4599-a14c-91303310ef56',
  'ST smoke: 着地調整',
  'Special Thanks smoke用の一時開発ログ。本番反映しない。',
  '0.1.1',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.voice_adoption_matcher_runs (
  id, devlog_id, project_id, trigger_type, trigger_version,
  status, candidate_count, evaluated_count, adopted_count,
  model, prompt_version, started_at, completed_at
) values (
  'aaaaaaaa-bbbb-4ccc-8ddd-000000000005',
  'aaaaaaaa-bbbb-4ccc-8ddd-000000000004',
  '41ff5a96-105c-42a2-87b4-787bcfeacb45',
  'backfill',
  'st-special-thanks-smoke-v1',
  'completed',
  1, 1, 1,
  'fixture',
  'st-smoke-v1',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.voice_adoptions (
  id, project_id, user_id, voice_response_id, devlog_id,
  voice_version_key, published_version,
  player_quote, update_summary, prompt_text,
  confidence, model, matcher_run_id, status, created_at, updated_at
) values (
  'aaaaaaaa-bbbb-4ccc-8ddd-000000000006',
  '41ff5a96-105c-42a2-87b4-787bcfeacb45',
  '075348c9-6009-464c-920c-4fe6d63249c7',
  'aaaaaaaa-bbbb-4ccc-8ddd-000000000002',
  'aaaaaaaa-bbbb-4ccc-8ddd-000000000004',
  '0.1',
  '0.1.1',
  'ジャンプの着地が重い',
  '着地硬直を短縮した',
  'ST smoke: もう一度遊びたい？',
  0.900,
  'fixture',
  'aaaaaaaa-bbbb-4ccc-8ddd-000000000005',
  'active',
  now(),
  now()
)
on conflict (id) do nothing;

commit;

-- Verify:
-- select public.get_project_special_thanks('41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid);
