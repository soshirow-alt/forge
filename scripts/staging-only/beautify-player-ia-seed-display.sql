-- STAGING ONLY — beautify Player IA seed public display (titles / announcements / thumbnails)
-- Target ref: vuqpwvjvgyxffmvpfrxo
-- DO NOT run on Production (bpnisgzxuwdxelhnduuf).
--
-- UPDATE allowlist (only):
--   public.projects (seed UUID + forge-ia-seed-v1 only)
--   public.platform_announcements (seed UUID only)
--   public.developer_profiles (exact ia-seed-dev-NN + a1a1… user_id pairs only)
--
-- Explicitly NOT updated (immutable / append-only / out of scope):
--   public.project_devlogs  — published body immutable (011 enforce_devlog_immutable_body)
--   public.project_release_events
--   auth.users / hero developer_profiles / usage / feedback tables
--   non-seed projects
--
-- Markers:
--   project UUIDs: eeeeeeee-eeee-4eee-8eee-*
--   tag: forge-ia-seed-v1 (preserved)
--   announcements: aaaaaaaa-aaaa-4aaa-8aaa-*
--
-- Idempotent. All-or-nothing transaction. Unexpected counts → RAISE → full rollback.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $$
DECLARE
  v_smoke_ok boolean;
  v_hero_ok boolean;
  v_seed_n integer;
  v_cat_bad integer;
  v_prefix_projects integer;
  v_prefix_announcements integer;
  v_thumb_need integer;
  v_no_image_null integer;
  v_ann_n integer;
  v_ann_pub integer;
  v_ann_draft integer;
BEGIN
  -- Staging hard-stop: Smoke A is Staging fixture; Production must not match this path.
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid
      AND visibility = 'public'
  ) INTO v_smoke_ok;

  IF NOT v_smoke_ok THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: Staging Smoke A missing — refuse (wrong project / Production?)';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = 'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid
  ) INTO v_hero_ok;

  IF NOT v_hero_ok THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: Staging hero-carousel project missing — refuse';
  END IF;

  SELECT count(*)::integer INTO v_seed_n
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]));

  IF v_seed_n <> 40 THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: expected 40 forge-ia-seed-v1 UUID projects, got %',
      v_seed_n;
  END IF;

  SELECT count(*)::integer INTO v_cat_bad
  FROM (
    SELECT coalesce(category, 'game') AS category, count(*) AS n
    FROM public.projects
    WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    GROUP BY coalesce(category, 'game')
  ) c
  WHERE c.n <> 8;

  IF v_cat_bad <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: category counts must be 8 each before update';
  END IF;

  -- Pre-assert: noImage edge cases are exactly the two fixed IDs (may already be NULL).
  SELECT count(*)::integer INTO v_no_image_null
  FROM public.projects
  WHERE id IN (
    'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
  );

  IF v_no_image_null <> 2 THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: noImage edge UUIDs missing';
  END IF;

  SELECT count(*)::integer INTO v_prefix_projects
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    AND (
      title LIKE '[IA Seed]%'
      OR coalesce(description, '') LIKE '[IA Seed]%'
      OR coalesce(overview_introduction, '') LIKE '[IA Seed]%'
    );

  SELECT count(*)::integer INTO v_prefix_announcements
  FROM public.platform_announcements
  WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
    AND (
      title LIKE '[IA Seed]%'
      OR body LIKE '[IA Seed]%'
    );

  SELECT count(*)::integer INTO v_thumb_need
  FROM public.projects
  WHERE id IN (
    'eeeeeeee-eeee-4eee-8eee-000000000001'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000002'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000003'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000005'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000006'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000007'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000008'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000009'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000010'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000011'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000012'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000013'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000014'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000015'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000016'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000017'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000018'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000019'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000020'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000022'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000023'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000024'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000025'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000026'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000027'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000028'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000029'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000030'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000031'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000032'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000033'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000034'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000035'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000036'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000037'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000038'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000039'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000040'::uuid
  );

  IF v_thumb_need <> 38 THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: expected 38 thumbnail assignment targets, got %',
      v_thumb_need;
  END IF;

  SELECT count(*)::integer INTO v_ann_n
  FROM public.platform_announcements
  WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%';

  IF v_ann_n <> 8 THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: expected 8 seed announcements, got %',
      v_ann_n;
  END IF;

  SELECT
    count(*) FILTER (WHERE status = 'published')::integer,
    count(*) FILTER (WHERE status = 'draft')::integer
  INTO v_ann_pub, v_ann_draft
  FROM public.platform_announcements
  WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%';

  IF v_ann_pub <> 6 OR v_ann_draft <> 2 THEN
    RAISE EXCEPTION
      'ABORT beautify-player-ia-seed-display: announcements must be published=6 draft=2 (got %/%)',
      v_ann_pub, v_ann_draft;
  END IF;

  RAISE NOTICE
    'beautify preflight OK: seed=% prefix_projects=% prefix_announcements=% ann=%/%',
    v_seed_n, v_prefix_projects, v_prefix_announcements, v_ann_pub, v_ann_draft;
END $$;

-- ---------------------------------------------------------------------------
-- A. Seed project display: titles, natural descriptions, creator/owner_name
--    Does NOT update project_devlogs / project_release_events (immutable).
--    Does NOT update hero owner profiles (dddd…0001 / 0002).
--    Long edge fixtures (…0008 / …0039 description; …0008 creator) keep body
--    after marker strip only.
-- ---------------------------------------------------------------------------
UPDATE public.projects p
SET
  title = regexp_replace(p.title, '^\[IA Seed\]\s*', ''),
  description = CASE
    WHEN p.id IN (
      'eeeeeeee-eeee-4eee-8eee-000000000008'::uuid,
      'eeeeeeee-eeee-4eee-8eee-000000000039'::uuid
    ) THEN regexp_replace(
      regexp_replace(coalesce(p.description, ''), '^\[IA Seed\]\s*', ''),
      '\s*[—\-–]\s*Staging専用架空作品。?\s*',
      '',
      'g'
    )
    WHEN coalesce(p.category, 'game') = 'audio'
      THEN 'ゲームや映像制作に利用できる音楽・音声素材です。'
    WHEN coalesce(p.category, 'game') = 'asset'
      THEN 'ゲームやアプリ制作に利用できる素材セットです。'
    WHEN coalesce(p.category, 'game') = 'dev-tool'
      THEN '制作や開発作業を支援する開発ツールです。'
    WHEN coalesce(p.category, 'game') = 'service-app'
      THEN 'ブラウザから実際に試せるサービス・アプリです。'
    ELSE '探索や戦略を実際に遊んで試せる開発中のゲームです。'
  END,
  overview_introduction = CASE
    WHEN p.overview_introduction IS NULL THEN NULL
    ELSE regexp_replace(
      regexp_replace(p.overview_introduction, '^\[IA Seed\]\s*', ''),
      '\s*[—\-–]\s*Staging専用架空作品。?\s*$',
      ''
    )
  END,
  creator = CASE
    WHEN p.id = 'eeeeeeee-eeee-4eee-8eee-000000000008'::uuid
      THEN regexp_replace(coalesce(p.creator, ''), '^IA Seed\s+', '')
    WHEN coalesce(p.creator, '') IN ('IA Seed Owner A')
      THEN 'Lumen Works'
    WHEN coalesce(p.creator, '') IN ('IA Seed Owner B')
      THEN 'Northlight Studio'
    WHEN coalesce(p.creator, '') ~ '^IA Seed\s+'
      THEN regexp_replace(p.creator, '^IA Seed\s+', '')
    WHEN p.owner_id = 'dddddddd-dddd-4ddd-8ddd-000000000001'::uuid
     AND coalesce(p.creator, '') ~* 'IA Seed'
      THEN 'Lumen Works'
    WHEN p.owner_id = 'dddddddd-dddd-4ddd-8ddd-000000000002'::uuid
     AND coalesce(p.creator, '') ~* 'IA Seed'
      THEN 'Northlight Studio'
    ELSE p.creator
  END,
  owner_name = CASE
    WHEN p.id = 'eeeeeeee-eeee-4eee-8eee-000000000008'::uuid
      THEN regexp_replace(coalesce(p.owner_name, ''), '^IA Seed\s+', '')
    WHEN coalesce(p.owner_name, '') IN ('IA Seed Owner A')
      THEN 'Lumen Works'
    WHEN coalesce(p.owner_name, '') IN ('IA Seed Owner B')
      THEN 'Northlight Studio'
    WHEN coalesce(p.owner_name, '') ~ '^IA Seed\s+'
      THEN regexp_replace(p.owner_name, '^IA Seed\s+', '')
    WHEN p.owner_id = 'dddddddd-dddd-4ddd-8ddd-000000000001'::uuid
     AND coalesce(p.owner_name, '') ~* 'IA Seed'
      THEN 'Lumen Works'
    WHEN p.owner_id = 'dddddddd-dddd-4ddd-8ddd-000000000002'::uuid
     AND coalesce(p.owner_name, '') ~* 'IA Seed'
      THEN 'Northlight Studio'
    ELSE p.owner_name
  END,
  updated_at = now()
WHERE p.id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
  AND 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'::text[]))
  AND p.id NOT IN (
    '41ff5a96-105c-42a2-87b4-787bcfeacb45'::uuid,
    'dddddddd-dddd-4ddd-8ddd-000000000203'::uuid
  )
  AND (
    p.title LIKE '[IA Seed]%'
    OR coalesce(p.description, '') LIKE '[IA Seed]%'
    OR coalesce(p.description, '') LIKE '%Staging専用%'
    OR coalesce(p.overview_introduction, '') LIKE '[IA Seed]%'
    OR coalesce(p.overview_introduction, '') LIKE '%Staging専用%'
    OR coalesce(p.creator, '') ~* 'IA Seed'
    OR coalesce(p.owner_name, '') ~* 'IA Seed'
    OR (
      p.id NOT IN (
        'eeeeeeee-eeee-4eee-8eee-000000000008'::uuid,
        'eeeeeeee-eeee-4eee-8eee-000000000039'::uuid
      )
      AND p.description IS DISTINCT FROM (
        CASE coalesce(p.category, 'game')
          WHEN 'audio' THEN 'ゲームや映像制作に利用できる音楽・音声素材です。'
          WHEN 'asset' THEN 'ゲームやアプリ制作に利用できる素材セットです。'
          WHEN 'dev-tool' THEN '制作や開発作業を支援する開発ツールです。'
          WHEN 'service-app' THEN 'ブラウザから実際に試せるサービス・アプリです。'
          ELSE '探索や戦略を実際に遊んで試せる開発中のゲームです。'
        END
      )
    )
  );

-- Exact seed title repair for …0011 (Staging had U+FFFD replacing 「基」).
-- Canon title from player-ia-staging-seed / generate-player-ia-staging-seed.mjs.
UPDATE public.projects
SET
  title = 'SEキット基礎',
  updated_at = now()
WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000011'::uuid
  AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
  AND title IS DISTINCT FROM 'SEキット基礎';

-- Dedicated IA auth profiles: exact (creator_id, user_id) allowlist from
-- scripts/staging-only/player-ia-auth-seed.ts (n=1..20).
-- Never update by creator_id prefix alone. Never hero HC profiles.
DO $$
DECLARE
  v_match integer;
  v_unexpected integer;
  v_left integer;
BEGIN
  IF to_regclass('public.developer_profiles') IS NULL THEN
    RAISE NOTICE 'beautify: developer_profiles absent — skip dedicated profile rename';
    RETURN;
  END IF;

  SELECT count(*)::integer INTO v_match
  FROM public.developer_profiles dp
  INNER JOIN (
    VALUES
      ('ia-seed-dev-01', 'a1a1a1a1-a1a1-41a1-81a1-000000000001'::uuid),
      ('ia-seed-dev-02', 'a1a1a1a1-a1a1-41a1-81a1-000000000002'::uuid),
      ('ia-seed-dev-03', 'a1a1a1a1-a1a1-41a1-81a1-000000000003'::uuid),
      ('ia-seed-dev-04', 'a1a1a1a1-a1a1-41a1-81a1-000000000004'::uuid),
      ('ia-seed-dev-05', 'a1a1a1a1-a1a1-41a1-81a1-000000000005'::uuid),
      ('ia-seed-dev-06', 'a1a1a1a1-a1a1-41a1-81a1-000000000006'::uuid),
      ('ia-seed-dev-07', 'a1a1a1a1-a1a1-41a1-81a1-000000000007'::uuid),
      ('ia-seed-dev-08', 'a1a1a1a1-a1a1-41a1-81a1-000000000008'::uuid),
      ('ia-seed-dev-09', 'a1a1a1a1-a1a1-41a1-81a1-000000000009'::uuid),
      ('ia-seed-dev-10', 'a1a1a1a1-a1a1-41a1-81a1-000000000010'::uuid),
      ('ia-seed-dev-11', 'a1a1a1a1-a1a1-41a1-81a1-000000000011'::uuid),
      ('ia-seed-dev-12', 'a1a1a1a1-a1a1-41a1-81a1-000000000012'::uuid),
      ('ia-seed-dev-13', 'a1a1a1a1-a1a1-41a1-81a1-000000000013'::uuid),
      ('ia-seed-dev-14', 'a1a1a1a1-a1a1-41a1-81a1-000000000014'::uuid),
      ('ia-seed-dev-15', 'a1a1a1a1-a1a1-41a1-81a1-000000000015'::uuid),
      ('ia-seed-dev-16', 'a1a1a1a1-a1a1-41a1-81a1-000000000016'::uuid),
      ('ia-seed-dev-17', 'a1a1a1a1-a1a1-41a1-81a1-000000000017'::uuid),
      ('ia-seed-dev-18', 'a1a1a1a1-a1a1-41a1-81a1-000000000018'::uuid),
      ('ia-seed-dev-19', 'a1a1a1a1-a1a1-41a1-81a1-000000000019'::uuid),
      ('ia-seed-dev-20', 'a1a1a1a1-a1a1-41a1-81a1-000000000020'::uuid)
  ) AS allowed(creator_id, user_id)
    ON dp.creator_id = allowed.creator_id
   AND dp.user_id = allowed.user_id;

  IF v_match NOT IN (0, 20) THEN
    RAISE EXCEPTION
      'ABORT beautify: dedicated profile exact-pair count % (expected 0 or 20)',
      v_match;
  END IF;

  -- Fail closed: a1a1… + ia-seed-dev-% rows must be exact allowlist pairs only
  SELECT count(*)::integer INTO v_unexpected
  FROM public.developer_profiles dp
  WHERE dp.user_id::text LIKE 'a1a1a1a1-a1a1-41a1-81a1-%'
    AND coalesce(dp.creator_id, '') LIKE 'ia-seed-dev-%'
    AND NOT EXISTS (
      SELECT 1
      FROM (
        VALUES
          ('ia-seed-dev-01', 'a1a1a1a1-a1a1-41a1-81a1-000000000001'::uuid),
          ('ia-seed-dev-02', 'a1a1a1a1-a1a1-41a1-81a1-000000000002'::uuid),
          ('ia-seed-dev-03', 'a1a1a1a1-a1a1-41a1-81a1-000000000003'::uuid),
          ('ia-seed-dev-04', 'a1a1a1a1-a1a1-41a1-81a1-000000000004'::uuid),
          ('ia-seed-dev-05', 'a1a1a1a1-a1a1-41a1-81a1-000000000005'::uuid),
          ('ia-seed-dev-06', 'a1a1a1a1-a1a1-41a1-81a1-000000000006'::uuid),
          ('ia-seed-dev-07', 'a1a1a1a1-a1a1-41a1-81a1-000000000007'::uuid),
          ('ia-seed-dev-08', 'a1a1a1a1-a1a1-41a1-81a1-000000000008'::uuid),
          ('ia-seed-dev-09', 'a1a1a1a1-a1a1-41a1-81a1-000000000009'::uuid),
          ('ia-seed-dev-10', 'a1a1a1a1-a1a1-41a1-81a1-000000000010'::uuid),
          ('ia-seed-dev-11', 'a1a1a1a1-a1a1-41a1-81a1-000000000011'::uuid),
          ('ia-seed-dev-12', 'a1a1a1a1-a1a1-41a1-81a1-000000000012'::uuid),
          ('ia-seed-dev-13', 'a1a1a1a1-a1a1-41a1-81a1-000000000013'::uuid),
          ('ia-seed-dev-14', 'a1a1a1a1-a1a1-41a1-81a1-000000000014'::uuid),
          ('ia-seed-dev-15', 'a1a1a1a1-a1a1-41a1-81a1-000000000015'::uuid),
          ('ia-seed-dev-16', 'a1a1a1a1-a1a1-41a1-81a1-000000000016'::uuid),
          ('ia-seed-dev-17', 'a1a1a1a1-a1a1-41a1-81a1-000000000017'::uuid),
          ('ia-seed-dev-18', 'a1a1a1a1-a1a1-41a1-81a1-000000000018'::uuid),
          ('ia-seed-dev-19', 'a1a1a1a1-a1a1-41a1-81a1-000000000019'::uuid),
          ('ia-seed-dev-20', 'a1a1a1a1-a1a1-41a1-81a1-000000000020'::uuid)
      ) AS allowed(creator_id, user_id)
      WHERE dp.creator_id = allowed.creator_id
        AND dp.user_id = allowed.user_id
    );

  IF v_unexpected <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify: unexpected a1a1/ia-seed-dev profile pairs=%',
      v_unexpected;
  END IF;

  IF v_match = 0 THEN
    RAISE NOTICE 'beautify: no dedicated exact-pair profiles present — skip rename';
    RETURN;
  END IF;

  UPDATE public.developer_profiles AS target
  SET
    public_name = allowed.display_name
  FROM (
    VALUES
      ('ia-seed-dev-01', 'a1a1a1a1-a1a1-41a1-81a1-000000000001'::uuid, 'ゲーム職人'),
      ('ia-seed-dev-02', 'a1a1a1a1-a1a1-41a1-81a1-000000000002'::uuid, 'ホラー好きDev'),
      ('ia-seed-dev-03', 'a1a1a1a1-a1a1-41a1-81a1-000000000003'::uuid, 'Unity屋'),
      ('ia-seed-dev-04', 'a1a1a1a1-a1a1-41a1-81a1-000000000004'::uuid, 'UEクリエイター'),
      ('ia-seed-dev-05', 'a1a1a1a1-a1a1-41a1-81a1-000000000005'::uuid, 'Godot民'),
      ('ia-seed-dev-06', 'a1a1a1a1-a1a1-41a1-81a1-000000000006'::uuid, '配信者A'),
      ('ia-seed-dev-07', 'a1a1a1a1-a1a1-41a1-81a1-000000000007'::uuid, '配信者B'),
      ('ia-seed-dev-08', 'a1a1a1a1-a1a1-41a1-81a1-000000000008'::uuid, 'ドット絵師'),
      ('ia-seed-dev-09', 'a1a1a1a1-a1a1-41a1-81a1-000000000009'::uuid, '3Dキャラ職人'),
      ('ia-seed-dev-10', 'a1a1a1a1-a1a1-41a1-81a1-000000000010'::uuid, 'BGM制作'),
      ('ia-seed-dev-11', 'a1a1a1a1-a1a1-41a1-81a1-000000000011'::uuid, 'SE職人'),
      ('ia-seed-dev-12', 'a1a1a1a1-a1a1-41a1-81a1-000000000012'::uuid, 'ツール屋'),
      ('ia-seed-dev-13', 'a1a1a1a1-a1a1-41a1-81a1-000000000013'::uuid, 'サービス開発'),
      ('ia-seed-dev-14', 'a1a1a1a1-a1a1-41a1-81a1-000000000014'::uuid, '分析屋'),
      ('ia-seed-dev-15', 'a1a1a1a1-a1a1-41a1-81a1-000000000015'::uuid, 'Bot作者'),
      ('ia-seed-dev-16', 'a1a1a1a1-a1a1-41a1-81a1-000000000016'::uuid, 'マルチA'),
      ('ia-seed-dev-17', 'a1a1a1a1-a1a1-41a1-81a1-000000000017'::uuid, 'マルチB'),
      ('ia-seed-dev-18', 'a1a1a1a1-a1a1-41a1-81a1-000000000018'::uuid, 'テスト募集'),
      ('ia-seed-dev-19', 'a1a1a1a1-a1a1-41a1-81a1-000000000019'::uuid, '制作に使える派'),
      ('ia-seed-dev-20', 'a1a1a1a1-a1a1-41a1-81a1-000000000020'::uuid, '超長い制作者プロフィール名の折り返し検証用ABCDEFG')
  ) AS allowed(creator_id, user_id, display_name)
  WHERE target.creator_id = allowed.creator_id
    AND target.user_id = allowed.user_id
    AND target.public_name IS DISTINCT FROM allowed.display_name;

  SELECT count(*)::integer INTO v_left
  FROM public.developer_profiles dp
  INNER JOIN (
    VALUES
      ('ia-seed-dev-01', 'a1a1a1a1-a1a1-41a1-81a1-000000000001'::uuid),
      ('ia-seed-dev-02', 'a1a1a1a1-a1a1-41a1-81a1-000000000002'::uuid),
      ('ia-seed-dev-03', 'a1a1a1a1-a1a1-41a1-81a1-000000000003'::uuid),
      ('ia-seed-dev-04', 'a1a1a1a1-a1a1-41a1-81a1-000000000004'::uuid),
      ('ia-seed-dev-05', 'a1a1a1a1-a1a1-41a1-81a1-000000000005'::uuid),
      ('ia-seed-dev-06', 'a1a1a1a1-a1a1-41a1-81a1-000000000006'::uuid),
      ('ia-seed-dev-07', 'a1a1a1a1-a1a1-41a1-81a1-000000000007'::uuid),
      ('ia-seed-dev-08', 'a1a1a1a1-a1a1-41a1-81a1-000000000008'::uuid),
      ('ia-seed-dev-09', 'a1a1a1a1-a1a1-41a1-81a1-000000000009'::uuid),
      ('ia-seed-dev-10', 'a1a1a1a1-a1a1-41a1-81a1-000000000010'::uuid),
      ('ia-seed-dev-11', 'a1a1a1a1-a1a1-41a1-81a1-000000000011'::uuid),
      ('ia-seed-dev-12', 'a1a1a1a1-a1a1-41a1-81a1-000000000012'::uuid),
      ('ia-seed-dev-13', 'a1a1a1a1-a1a1-41a1-81a1-000000000013'::uuid),
      ('ia-seed-dev-14', 'a1a1a1a1-a1a1-41a1-81a1-000000000014'::uuid),
      ('ia-seed-dev-15', 'a1a1a1a1-a1a1-41a1-81a1-000000000015'::uuid),
      ('ia-seed-dev-16', 'a1a1a1a1-a1a1-41a1-81a1-000000000016'::uuid),
      ('ia-seed-dev-17', 'a1a1a1a1-a1a1-41a1-81a1-000000000017'::uuid),
      ('ia-seed-dev-18', 'a1a1a1a1-a1a1-41a1-81a1-000000000018'::uuid),
      ('ia-seed-dev-19', 'a1a1a1a1-a1a1-41a1-81a1-000000000019'::uuid),
      ('ia-seed-dev-20', 'a1a1a1a1-a1a1-41a1-81a1-000000000020'::uuid)
  ) AS allowed(creator_id, user_id)
    ON dp.creator_id = allowed.creator_id
   AND dp.user_id = allowed.user_id
  WHERE coalesce(dp.public_name, '') ~* 'IA Seed';

  IF v_left <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify post: % exact-pair profiles still carry IA Seed name',
      v_left;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- B. Seed announcement display copy (status / published_at / importance unchanged)
--    Natural user-facing copy for Staging seed IDs only — no Preview/Staging/seed markers.
-- ---------------------------------------------------------------------------
WITH ann_copy (announcement_id, title, body) AS (
  VALUES
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000001'::uuid,
      '作品へのフィードバックを募集しています',
      '気になった作品を試して、良かった点や改善してほしい点を開発者へ届けてみてください。'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000002'::uuid,
      '制作に使える素材・ツールを探せます',
      '音楽・音声、アセット、開発ツールなど、制作に活用できる作品をまとめて探せます。'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000003'::uuid,
      'サムネイル未設定作品の表示を改善しました',
      '画像がない作品でも内容を確認しやすいフォールバック表示に対応しました。'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000004'::uuid,
      '作品同士のつながりを確認できます',
      '素材やツールが別の作品で使われた関係を、Homeから確認できます。'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000005'::uuid,
      '新着作品と更新作品を見つけやすくしました',
      '公開されたばかりの作品や、最近更新された作品をHomeで確認できます。'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000006'::uuid,
      '5カテゴリの掲載に対応しました',
      'ゲーム、音楽・音声、アセット、開発ツール、サービス・アプリを掲載・探索できます。'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000007'::uuid,
      '開発者プロフィールの表示改善',
      '作品と制作者の活動がより分かりやすくなる表示改善を準備しています。'
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-000000000008'::uuid,
      'フィードバック機能の改善',
      '送ったフィードバックや開発者からの返信を追いやすくする改善を準備しています。'
    )
)
UPDATE public.platform_announcements a
SET
  title = c.title,
  body = c.body,
  updated_at = now()
FROM ann_copy c
WHERE a.id = c.announcement_id
  AND a.id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
  AND (
    a.title IS DISTINCT FROM c.title
    OR a.body IS DISTINCT FROM c.body
  );

-- ---------------------------------------------------------------------------
-- C. Assign Staging-only local thumbnails (38 projects; keep 2 noImage)
--    Real schema (035): thumbnail_urls text[] NOT NULL DEFAULT '{}'.
--    App no-image = thumbnail_url IS NULL AND empty thumbnail_urls (see lib/project-thumbnails.ts).
--    Never set thumbnail_urls = NULL (violates NOT NULL on Staging/Production).
-- ---------------------------------------------------------------------------
WITH assignments (project_id, image_path) AS (
  VALUES
    ('eeeeeeee-eeee-4eee-8eee-000000000001'::uuid, '/images/staging-only/player-ia/hero-wind-memory.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000002'::uuid, '/images/staging-only/player-ia/dungeon-depths.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000003'::uuid, '/images/staging-only/player-ia/neon-city.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000005'::uuid, '/images/staging-only/player-ia/sea-voyage.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000006'::uuid, '/images/staging-only/player-ia/village-story.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000007'::uuid, '/images/staging-only/player-ia/witch-workshop.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000008'::uuid, '/images/staging-only/player-ia/light-ruins.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000009'::uuid, '/images/staging-only/player-ia/lofi-beats.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000010'::uuid, '/images/staging-only/player-ia/orchestra.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000011'::uuid, '/images/staging-only/player-ia/dungeon-bgm.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000012'::uuid, '/images/staging-only/player-ia/ambient-forest.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000013'::uuid, '/images/staging-only/player-ia/lofi-beats.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000014'::uuid, '/images/staging-only/player-ia/orchestra.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000015'::uuid, '/images/staging-only/player-ia/dungeon-bgm.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000016'::uuid, '/images/staging-only/player-ia/ambient-forest.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000017'::uuid, '/images/staging-only/player-ia/forest-tileset.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000018'::uuid, '/images/staging-only/player-ia/village-tileset.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000019'::uuid, '/images/staging-only/player-ia/fantasy-furniture.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000020'::uuid, '/images/staging-only/player-ia/ui-animation-kit.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000022'::uuid, '/images/staging-only/player-ia/japanese-arch.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000023'::uuid, '/images/staging-only/player-ia/forest-tileset.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000024'::uuid, '/images/staging-only/player-ia/ui-animation-kit.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000025'::uuid, '/images/staging-only/player-ia/auth-sdk.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000026'::uuid, '/images/staging-only/player-ia/savedata-plugin.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000027'::uuid, '/images/staging-only/player-ia/logviewer.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000028'::uuid, '/images/staging-only/player-ia/realtime-db.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000029'::uuid, '/images/staging-only/player-ia/auth-sdk.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000030'::uuid, '/images/staging-only/player-ia/savedata-plugin.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000031'::uuid, '/images/staging-only/player-ia/logviewer.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000032'::uuid, '/images/staging-only/player-ia/realtime-db.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000033'::uuid, '/images/staging-only/player-ia/planly-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000034'::uuid, '/images/staging-only/player-ia/mytracker-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000035'::uuid, '/images/staging-only/player-ia/streamnote-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000036'::uuid, '/images/staging-only/player-ia/cyber-buildings.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000037'::uuid, '/images/staging-only/player-ia/planly-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000038'::uuid, '/images/staging-only/player-ia/mytracker-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000039'::uuid, '/images/staging-only/player-ia/streamnote-app.webp'),
    ('eeeeeeee-eeee-4eee-8eee-000000000040'::uuid, '/images/staging-only/player-ia/cyber-buildings.webp')
)
UPDATE public.projects p
SET
  thumbnail_url = a.image_path,
  thumbnail_urls = ARRAY[a.image_path]::text[],
  updated_at = now()
FROM assignments a
WHERE p.id = a.project_id
  AND 'forge-ia-seed-v1' = ANY (coalesce(p.tags, '{}'::text[]))
  AND (
    p.thumbnail_url IS DISTINCT FROM a.image_path
    OR p.thumbnail_urls IS DISTINCT FROM ARRAY[a.image_path]::text[]
  );

UPDATE public.projects
SET
  thumbnail_url = NULL,
  thumbnail_urls = '{}'::text[],
  updated_at = now()
WHERE id IN (
  'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
  'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
)
AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
AND (
  thumbnail_url IS NOT NULL
  OR thumbnail_urls IS DISTINCT FROM '{}'::text[]
);

-- ---------------------------------------------------------------------------
-- Post-asserts (unexpected → rollback entire transaction)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_seed_n integer;
  v_cat_bad integer;
  v_prefix_left integer;
  v_thumbs integer;
  v_no_image_ok integer;
  v_tag_ok integer;
  v_owner_changed integer;
  v_ann_prefix_left integer;
  v_ann_n integer;
  v_ann_pub integer;
  v_ann_draft integer;
  v_devlog_touched integer;
  v_thumb_mismatch integer;
  v_non_seed_thumb integer;
BEGIN
  SELECT count(*)::integer INTO v_seed_n
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]));

  IF v_seed_n <> 40 THEN
    RAISE EXCEPTION
      'ABORT beautify post: seed count % (expected 40)', v_seed_n;
  END IF;

  SELECT count(*)::integer INTO v_cat_bad
  FROM (
    SELECT coalesce(category, 'game') AS category, count(*) AS n
    FROM public.projects
    WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    GROUP BY coalesce(category, 'game')
  ) c
  WHERE c.n <> 8;

  IF v_cat_bad <> 0 THEN
    RAISE EXCEPTION 'ABORT beautify post: category 8-each violated';
  END IF;

  SELECT count(*)::integer INTO v_prefix_left
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    AND (
      title LIKE '[IA Seed]%'
      OR coalesce(description, '') LIKE '[IA Seed]%'
      OR coalesce(overview_introduction, '') LIKE '[IA Seed]%'
    );

  IF v_prefix_left <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify post: % projects still carry [IA Seed] prefix',
      v_prefix_left;
  END IF;

  SELECT count(*)::integer INTO v_prefix_left
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    AND (
      coalesce(description, '') LIKE '%Staging専用%'
      OR coalesce(overview_introduction, '') LIKE '%Staging専用%'
    );

  IF v_prefix_left <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify post: % projects still carry Staging専用 marker',
      v_prefix_left;
  END IF;

  -- Seed titles must not retain Unicode replacement char (U+FFFD)
  SELECT count(*)::integer INTO v_prefix_left
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    AND position(chr(65533) in coalesce(title, '')) > 0;

  IF v_prefix_left <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify post: % seed project titles still contain U+FFFD',
      v_prefix_left;
  END IF;

  IF (
    SELECT title FROM public.projects
    WHERE id = 'eeeeeeee-eeee-4eee-8eee-000000000011'::uuid
  ) IS DISTINCT FROM 'SEキット基礎' THEN
    RAISE EXCEPTION
      'ABORT beautify post: seed …0011 title must be SEキット基礎';
  END IF;

  SELECT count(*)::integer INTO v_prefix_left
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    AND (
      coalesce(creator, '') ~* 'IA Seed'
      OR coalesce(owner_name, '') ~* 'IA Seed'
    );

  IF v_prefix_left <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify post: % projects still carry IA Seed creator/owner_name',
      v_prefix_left;
  END IF;

  -- Hero HC profiles must remain untouched (shared with Smoke / hero carousel)
  IF to_regclass('public.developer_profiles') IS NOT NULL
     AND EXISTS (
    SELECT 1
    FROM public.developer_profiles dp
    WHERE dp.user_id IN (
      'dddddddd-dddd-4ddd-8ddd-000000000001'::uuid,
      'dddddddd-dddd-4ddd-8ddd-000000000002'::uuid
    )
    AND coalesce(dp.creator_id, '') LIKE 'hc-%'
    AND dp.public_name IN (
      'Lumen Works', 'Northlight Studio'
    )
  ) THEN
    RAISE EXCEPTION 'ABORT beautify post: hero developer_profiles were modified';
  END IF;

  SELECT count(*)::integer INTO v_thumbs
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND thumbnail_url LIKE '/images/staging-only/player-ia/%'
    AND thumbnail_urls = ARRAY[thumbnail_url]::text[];

  IF v_thumbs <> 38 THEN
    RAISE EXCEPTION
      'ABORT beautify post: staging-only thumbs aligned=% (expected 38)', v_thumbs;
  END IF;

  SELECT count(*)::integer INTO v_thumb_mismatch
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
    AND id NOT IN (
      'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
      'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
    )
    AND (
      thumbnail_url IS NULL
      OR cardinality(thumbnail_urls) <> 1
      OR thumbnail_urls[1] IS DISTINCT FROM thumbnail_url
    );

  IF v_thumb_mismatch <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify post: thumbnail_url/thumbnail_urls mismatch rows=%',
      v_thumb_mismatch;
  END IF;

  SELECT count(*)::integer INTO v_no_image_ok
  FROM public.projects
  WHERE id IN (
    'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
    'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
  )
  AND thumbnail_url IS NULL
  AND thumbnail_urls = '{}'::text[];

  IF v_no_image_ok <> 2 THEN
    RAISE EXCEPTION
      'ABORT beautify post: noImage edges must be thumbnail_url NULL and thumbnail_urls={}';
  END IF;

  SELECT count(*)::integer INTO v_tag_ok
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]));

  IF v_tag_ok <> 40 THEN
    RAISE EXCEPTION 'ABORT beautify post: forge-ia-seed-v1 tag missing on some seeds';
  END IF;

  -- owner_id must remain non-null on all seeds (never rewritten by this script)
  SELECT count(*)::integer INTO v_owner_changed
  FROM public.projects
  WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND owner_id IS NULL;

  IF v_owner_changed <> 0 THEN
    RAISE EXCEPTION 'ABORT beautify post: seed owner_id became NULL';
  END IF;

  -- Non-seed projects must not receive staging-only player-ia thumbs from this script
  SELECT count(*)::integer INTO v_non_seed_thumb
  FROM public.projects
  WHERE id::text NOT LIKE 'eeeeeeee-eeee-4eee-8eee-%'
    AND thumbnail_url LIKE '/images/staging-only/player-ia/%';

  IF v_non_seed_thumb <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify post: non-seed projects unexpectedly have staging-only thumbs=%',
      v_non_seed_thumb;
  END IF;

  SELECT count(*)::integer INTO v_ann_n
  FROM public.platform_announcements
  WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%';

  IF v_ann_n <> 8 THEN
    RAISE EXCEPTION 'ABORT beautify post: announcement seed count % (expected 8)', v_ann_n;
  END IF;

  SELECT
    count(*) FILTER (WHERE status = 'published')::integer,
    count(*) FILTER (WHERE status = 'draft')::integer
  INTO v_ann_pub, v_ann_draft
  FROM public.platform_announcements
  WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%';

  IF v_ann_pub <> 6 OR v_ann_draft <> 2 THEN
    RAISE EXCEPTION
      'ABORT beautify post: announcements published/draft must stay 6/2 (got %/%)',
      v_ann_pub, v_ann_draft;
  END IF;

  SELECT count(*)::integer INTO v_ann_prefix_left
  FROM public.platform_announcements
  WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
    AND (
      lower(coalesce(title, '') || ' ' || coalesce(body, '')) ~ '(preview|staging|seed|確認用|確認メモ)'
      OR coalesce(title, '') LIKE '%[IA Seed]%'
      OR coalesce(body, '') LIKE '%[IA Seed]%'
      OR coalesce(title, '') ~* '\[IA Seed\]'
      OR coalesce(body, '') ~* '\[IA Seed\]'
    );

  IF v_ann_prefix_left <> 0 THEN
    RAISE EXCEPTION
      'ABORT beautify post: % announcements still carry Preview/Staging/seed/[IA Seed]/確認 markers',
      v_ann_prefix_left;
  END IF;

  -- Exact copy must match allowlist (fail closed if any of 8 drifted)
  IF (
    SELECT count(*)
    FROM public.platform_announcements a
    JOIN (
      VALUES
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000001'::uuid,
         '作品へのフィードバックを募集しています',
         '気になった作品を試して、良かった点や改善してほしい点を開発者へ届けてみてください。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000002'::uuid,
         '制作に使える素材・ツールを探せます',
         '音楽・音声、アセット、開発ツールなど、制作に活用できる作品をまとめて探せます。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000003'::uuid,
         'サムネイル未設定作品の表示を改善しました',
         '画像がない作品でも内容を確認しやすいフォールバック表示に対応しました。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000004'::uuid,
         '作品同士のつながりを確認できます',
         '素材やツールが別の作品で使われた関係を、Homeから確認できます。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000005'::uuid,
         '新着作品と更新作品を見つけやすくしました',
         '公開されたばかりの作品や、最近更新された作品をHomeで確認できます。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000006'::uuid,
         '5カテゴリの掲載に対応しました',
         'ゲーム、音楽・音声、アセット、開発ツール、サービス・アプリを掲載・探索できます。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000007'::uuid,
         '開発者プロフィールの表示改善',
         '作品と制作者の活動がより分かりやすくなる表示改善を準備しています。'),
        ('aaaaaaaa-aaaa-4aaa-8aaa-000000000008'::uuid,
         'フィードバック機能の改善',
         '送ったフィードバックや開発者からの返信を追いやすくする改善を準備しています。')
    ) AS expected(id, title, body)
      ON a.id = expected.id
     AND a.title = expected.title
     AND a.body = expected.body
  ) <> 8 THEN
    RAISE EXCEPTION 'ABORT beautify post: announcement exact copy match count must be 8';
  END IF;

  -- Status unchanged: published 6 / draft 2. Importance on …0001 stays important.
  IF (
    SELECT count(*) FROM public.platform_announcements
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001'::uuid
      AND status = 'published'
      AND importance = 'important'
  ) <> 1 THEN
    RAISE EXCEPTION
      'ABORT beautify post: important published announcement …0001 drifted';
  END IF;

  -- Safety: this script must never have updated project_devlogs. Prefix may remain.
  SELECT count(*)::integer INTO v_devlog_touched
  FROM public.project_devlogs
  WHERE id::text LIKE '66666666-6666-4666-8666-%'
    AND content NOT LIKE '[IA Seed]%'
    AND title NOT LIKE '[IA Seed]%';

  -- Do not fail if seed was regenerated without prefix; only ensure we did not
  -- require content mutation. Immutable rows may still be prefixed — that is OK.
  RAISE NOTICE 'beautify post: seed_devlogs with both title+content unprefixed=% (informational)', v_devlog_touched;
END $$;

COMMIT;

SELECT
  'beautify-player-ia-seed-display OK' AS status,
  (
    SELECT count(*) FROM public.projects
    WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND 'forge-ia-seed-v1' = ANY (coalesce(tags, '{}'::text[]))
  ) AS seed_project_count,
  (
    SELECT count(*) FROM public.projects
    WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND (
        title LIKE '[IA Seed]%'
        OR coalesce(description, '') LIKE '[IA Seed]%'
      )
  ) AS projects_still_prefixed,
  (
    SELECT count(*) FROM public.projects
    WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
      AND thumbnail_url LIKE '/images/staging-only/player-ia/%'
  ) AS staging_only_thumb_count,
  (
    SELECT count(*) FROM public.projects
    WHERE id IN (
      'eeeeeeee-eeee-4eee-8eee-000000000004'::uuid,
      'eeeeeeee-eeee-4eee-8eee-000000000021'::uuid
    )
    AND thumbnail_url IS NULL
    AND thumbnail_urls = '{}'::text[]
  ) AS no_image_edge_count,
  (
    SELECT count(*) FROM public.platform_announcements
    WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
      AND title NOT LIKE '[IA Seed]%'
      AND body NOT LIKE '[IA Seed]%'
  ) AS announcements_cleaned_count,
  0 AS immutable_table_updates;
