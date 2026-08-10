-- =============================================================================
-- Production rollout — release announcement STUB (DO NOT PUBLISH YET)
-- File: 05_publish_release_announcement_LAST.sql
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
--
-- OWNER GO REQUIRED before any real INSERT/UPDATE that publishes.
-- This stub is intentionally a no-op write: comments + explanatory SELECT only.
--
-- After postflight PASS + code Production release readiness, Owner may replace
-- this stub with a real publish script (canonical draft lives at
-- scripts/production-ops/ops-publish-release-announcement-2026-08.sql).
-- Do NOT copy Staging ia-seed-* / beautify rows into Production.
-- =============================================================================

-- Guard: require announcement table + publish-window columns from APPLY 01+03.
SELECT
  CASE
    WHEN to_regclass('public.platform_announcements') IS NULL
      THEN 'BLOCKED: platform_announcements missing — apply 01 first'
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'platform_announcements'
        AND column_name = 'starts_at'
    )
      THEN 'BLOCKED: starts_at missing — apply 03 (094) first'
    ELSE 'READY structurally — still WAIT for Owner GO before publishing'
  END AS announcement_stub_status;

SELECT
  'WAIT_FOR_OWNER_GO' AS action,
  'Do not publish forge-five-category-collab-2026-08 (or any release row) until Owner explicitly authorizes.' AS reason,
  'Canonical publish SQL (separate OWNER ACTION later): scripts/production-ops/ops-publish-release-announcement-2026-08.sql' AS source_file,
  'Slug (when authorized): forge-five-category-collab-2026-08' AS intended_slug;

-- ---------------------------------------------------------------------------
-- INTENTIONALLY COMMENTED OUT — DO NOT UNCOMMENT without Owner GO
-- Real publish body belongs in production-ops after authorization.
-- ---------------------------------------------------------------------------
/*
BEGIN;

INSERT INTO public.platform_announcements (
  id,
  slug,
  title,
  body,
  importance,
  status,
  published_at,
  starts_at,
  ends_at,
  cta_label,
  cta_url
)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-000000000091',
  'forge-five-category-collab-2026-08',
  'Forgeが5カテゴリに対応。クリエイター同士の協力機能も追加しました',
  $body$Forgeで、ゲームに加えて音楽・音声、素材、開発ツール、サービス・アプリを掲載・検索できるようになりました。

さらに、開発者プロフィールのコミュニティ、利用・コラボ相談、作品同士の使用関係、フィードバックをくれた相手の作品へお返しにフィードバックするための導線も追加しています。

作品を試すだけでなく、制作に必要な相手や作品とつながり、お互いの制作を前に進められる場としてForgeをアップデートしました。$body$,
  'important',
  'published',
  now(),
  now(),
  NULL,
  'お知らせ一覧',
  '/announcements'
)
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  importance = EXCLUDED.importance,
  status = EXCLUDED.status,
  published_at = coalesce(public.platform_announcements.published_at, EXCLUDED.published_at),
  starts_at = coalesce(public.platform_announcements.starts_at, EXCLUDED.starts_at),
  ends_at = EXCLUDED.ends_at,
  cta_label = EXCLUDED.cta_label,
  cta_url = EXCLUDED.cta_url,
  updated_at = now();

COMMIT;
*/

SELECT 'NO_WRITE_PERFORMED' AS result,
       'Stub completed without publishing. Wait for Owner GO.' AS message;
