-- 082: Staging seed for Player IA phase 1 (identifiable, non-destructive)
-- HARD: Staging only. Do NOT apply to Production.
-- Tag: forge-ia-seed-v1 — safe to delete by tag/title prefix "[IA Seed]"
-- Prerequisite: 076–081
-- Uses existing Staging owner dddddddd-dddd-4ddd-8ddd-000000000002 when present.

BEGIN;

-- Ensure seed developer profile activity tags (no-op if user missing)
UPDATE public.developer_profiles
SET
  activity_tags = ARRAY[
    'game_creator',
    'asset_creator',
    'streamer_creator'
  ]::text[],
  profile = coalesce(
    nullif(btrim(profile), ''),
    'Staging IA seed developer — Unity / ホラー好き / 配信者'
  ),
  updated_at = now()
WHERE user_id = 'dddddddd-dddd-4ddd-8ddd-000000000002';

-- Helper: upsert seed projects (keep existing 9 untouched)
INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, genre, genres, description,
  phase, status, looking_for_testers, tester_slots, section, tags,
  play_url, visibility, playable_version, release_status,
  category, quick_try, usable_for_creation, stream_policy, stream_policy_note,
  asset_kinds, purpose_tags, category_attributes, first_published_at
)
VALUES
(
  'eeeeeeee-eeee-4eee-8eee-000000000001',
  'dddddddd-dddd-4ddd-8ddd-000000000002',
  'IA Seed Dev',
  '[IA Seed] Forest Roguelike',
  'IA Seed Dev',
  'ローグライク',
  ARRAY['ローグライク','ホラー'],
  'すぐ試せるブラウザローグライク。配信OK。感想募集中。',
  'playable', 'open', true, 8, 'testers',
  ARRAY['forge-ia-seed-v1','ブラウザ','Unity'],
  'https://example.com/play/ia-seed-roguelike',
  'public', '0.3', 'in_development',
  'game', true, false, 'ok', NULL,
  '{}', ARRAY['テストプレイ','配信素材'],
  '{"quickTry":true,"streamPolicy":"ok"}'::jsonb,
  now() - interval '2 days'
),
(
  'eeeeeeee-eeee-4eee-8eee-000000000002',
  'dddddddd-dddd-4ddd-8ddd-000000000002',
  'IA Seed Dev',
  '[IA Seed] Night Ambient Pack',
  'IA Seed Dev',
  'BGM',
  ARRAY['BGM'],
  '制作に使えるアンビエントBGMパック。ホラー向け。',
  'playable', 'open', false, NULL, 'new',
  ARRAY['forge-ia-seed-v1','BGM','ホラー'],
  'https://example.com/listen/ia-seed-ambient',
  'public', '1.0', 'released',
  'audio', true, true, 'unset', NULL,
  '{}', ARRAY['ゲームBGM','配信BGM'],
  '{"quickTry":true,"usableForCreation":true}'::jsonb,
  now() - interval '5 days'
),
(
  'eeeeeeee-eeee-4eee-8eee-000000000003',
  'dddddddd-dddd-4ddd-8ddd-000000000002',
  'IA Seed Dev',
  '[IA Seed] Pixel UI Kit',
  'IA Seed Dev',
  'UI',
  ARRAY['UI'],
  '2DイラストとUI素材・アイコンを含むアセットキット。',
  'playable', 'open', true, 4, 'testers',
  ARRAY['forge-ia-seed-v1','ドット','UI'],
  'https://example.com/assets/ia-seed-ui',
  'public', '0.9', 'in_development',
  'asset', true, true, 'unset', NULL,
  ARRAY['2d_illustration','ui_element','icon','sprite'],
  ARRAY['UI制作','ゲーム素材'],
  '{"quickTry":true,"usableForCreation":true,"assetKinds":["2d_illustration","ui_element","icon","sprite"]}'::jsonb,
  now() - interval '1 day'
),
(
  'eeeeeeee-eeee-4eee-8eee-000000000004',
  'dddddddd-dddd-4ddd-8ddd-000000000002',
  'IA Seed Dev',
  '[IA Seed] Dialogue Builder',
  'IA Seed Dev',
  'ツール',
  ARRAY['ツール'],
  'ノベル制作用の開発ツール。すぐ試せて制作に使える。',
  'playable', 'open', true, 6, 'testers',
  ARRAY['forge-ia-seed-v1','ツール','ノベル'],
  'https://example.com/tools/ia-seed-dialogue',
  'public', '0.2', 'in_development',
  'dev-tool', true, true, 'unset', NULL,
  '{}', ARRAY['ノベル制作','シナリオ'],
  '{"quickTry":true,"usableForCreation":true}'::jsonb,
  now() - interval '3 days'
),
(
  'eeeeeeee-eeee-4eee-8eee-000000000005',
  'dddddddd-dddd-4ddd-8ddd-000000000002',
  'IA Seed Dev',
  '[IA Seed] Habit Board',
  'IA Seed Dev',
  'アプリ',
  ARRAY['アプリ'],
  '習慣トラッカーのWebサービス。感想募集中。',
  'playable', 'open', true, 10, 'testers',
  ARRAY['forge-ia-seed-v1','習慣','Web'],
  'https://example.com/apps/ia-seed-habit',
  'public', '0.1', 'in_development',
  'service-app', true, false, 'unset', NULL,
  '{}', ARRAY['自己管理'],
  '{"quickTry":true}'::jsonb,
  now() - interval '12 hours'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  genres = EXCLUDED.genres,
  tags = EXCLUDED.tags,
  quick_try = EXCLUDED.quick_try,
  usable_for_creation = EXCLUDED.usable_for_creation,
  stream_policy = EXCLUDED.stream_policy,
  asset_kinds = EXCLUDED.asset_kinds,
  purpose_tags = EXCLUDED.purpose_tags,
  category_attributes = EXCLUDED.category_attributes,
  looking_for_testers = EXCLUDED.looking_for_testers,
  visibility = 'public',
  updated_at = now();

-- Backfill existing public Staging projects to category=game (compat)
UPDATE public.projects
SET category = 'game'
WHERE visibility = 'public'
  AND (category IS NULL OR category = 'game')
  AND id NOT IN (
    'eeeeeeee-eeee-4eee-8eee-000000000001',
    'eeeeeeee-eeee-4eee-8eee-000000000002',
    'eeeeeeee-eeee-4eee-8eee-000000000003',
    'eeeeeeee-eeee-4eee-8eee-000000000004',
    'eeeeeeee-eeee-4eee-8eee-000000000005'
  );

-- Usage relations (使用した)
INSERT INTO public.project_usage_relations (
  id, source_project_id, target_project_id, relation_type, status, created_by
)
VALUES
(
  'ffffffff-ffff-4fff-8fff-000000000001',
  'eeeeeeee-eeee-4eee-8eee-000000000001',
  'eeeeeeee-eeee-4eee-8eee-000000000003',
  'used', 'published',
  'dddddddd-dddd-4ddd-8ddd-000000000002'
),
(
  'ffffffff-ffff-4fff-8fff-000000000002',
  'eeeeeeee-eeee-4eee-8eee-000000000001',
  'eeeeeeee-eeee-4eee-8eee-000000000002',
  'used', 'published',
  'dddddddd-dddd-4ddd-8ddd-000000000002'
)
ON CONFLICT (source_project_id, target_project_id, relation_type) DO UPDATE SET
  status = 'published',
  updated_at = now();

-- Announcements
INSERT INTO public.platform_announcements (
  id, slug, title, body, importance, status, published_at
)
VALUES
(
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
  'ia-seed-welcome',
  'Player IA シード: ホーム刷新プレビュー',
  'このお知らせは Staging 専用シードです。カテゴリ横断のホームと検索を確認できます。',
  'important',
  'published',
  now() - interval '1 day'
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000002',
  'ia-seed-draft-hidden',
  '下書きは公開されない',
  'この行は draft のままなので公開APIに出てはいけません。',
  'normal',
  'draft',
  NULL
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000003',
  'ia-seed-search-note',
  'グローバル検索の確認ポイント',
  '作品名・説明・タグ・活動タグ（配信者・Unity・ホラー好き）がヒットするか確認してください。',
  'normal',
  'published',
  now() - interval '6 hours'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  importance = EXCLUDED.importance,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  updated_at = now();

-- Guest FB sample (public aggregate) on game seed — only if guest tables exist
INSERT INTO public.project_guest_feedback (
  id, project_id, version_key, submitter_key,
  good_points, concerns, bugs, other_notes,
  include_in_public_aggregate, moderation_status
)
VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
  'eeeeeeee-eeee-4eee-8eee-000000000001',
  '0.3',
  'bbbbbbbb-bbbb-4bbb-8bbb-000000000099',
  '探索のテンポが良く、すぐ試せるのが嬉しいです。マップの霧演出も雰囲気があります。',
  '序盤のチュートリアルがもう少し短いと助かります。',
  NULL,
  'ホラー好きには刺さりそう。',
  true,
  'visible'
)
ON CONFLICT (id) DO UPDATE SET
  good_points = EXCLUDED.good_points,
  concerns = EXCLUDED.concerns,
  include_in_public_aggregate = true,
  moderation_status = 'visible';

COMMIT;
