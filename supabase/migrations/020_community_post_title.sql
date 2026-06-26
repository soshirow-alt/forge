-- 020: community_posts.title — スレッド見出し（自由入力）
-- Prerequisite: 018

BEGIN;

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';

COMMIT;
