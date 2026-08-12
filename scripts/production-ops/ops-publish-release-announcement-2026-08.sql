-- Production ops (CREATE ONLY — do not apply from Cursor).
-- Owner applies via Production Dashboard SQL after explicit「本番反映して」.
-- Same content as Staging ops; separate file to avoid accidental Staging/Prod mix.

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
  $body$Forgeで、ゲームに加えて音楽・音声、アセット、開発ツール、サービスを掲載・検索できるようになりました。

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
