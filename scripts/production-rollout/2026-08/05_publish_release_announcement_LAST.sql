-- =============================================================================
-- Production rollout — release announcement LAST (OWNER GO REQUIRED)
-- File: 05_publish_release_announcement_LAST.sql
-- Target: Production Supabase bpnisgzxuwdxelhnduuf
--
-- EXECUTION ORDER (mandatory):
--   1) APPLY 01–03 success
--   2) 04_postflight_READONLY.sql = PASS
--   3) migration history repair (06) as needed
--   4) main merge + Production code deploy + Production smoke
--   5) transactional email sender ready (custom domain — not @resend.dev)
--   6) THEN run this file (LAST)
--
-- This file is the Production-executable publish SQL (same body as
-- scripts/production-ops/ops-publish-release-announcement-2026-08.sql).
-- Do NOT run until Owner explicitly authorizes announcement publish.
-- Do NOT copy Staging ia-seed / beautify rows.
-- =============================================================================

-- Pre-check (read-only): table + publish-window columns must exist.
DO $$
BEGIN
  IF to_regclass('public.platform_announcements') IS NULL THEN
    RAISE EXCEPTION 'BLOCKED: platform_announcements missing — apply 01 first';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'platform_announcements'
      AND column_name = 'starts_at'
  ) THEN
    RAISE EXCEPTION 'BLOCKED: starts_at missing — apply 03 (094) first';
  END IF;
END $$;

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
  $body$Forgeで、ゲームに加えて音楽・音声、素材、開発ツール、サービスを掲載・検索できるようになりました。

さらに、クリエイタープロフィールのコミュニティ、利用・コラボ相談、作品同士の使用関係、フィードバックをくれた相手の作品へお返しにフィードバックするための導線も追加しています。

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

SELECT
  slug,
  title,
  status,
  published_at,
  starts_at,
  ends_at,
  cta_label,
  cta_url
FROM public.platform_announcements
WHERE slug = 'forge-five-category-collab-2026-08';
