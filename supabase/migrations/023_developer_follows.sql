-- 023: developer_follows — 開発者フォロー（REL-2-05）
-- Prerequisite: 001 (developer_profiles)
--
-- STATUS: SQL draft — Dashboard 適用はオーナー別 GO 後のみ
-- Design: docs/rel-2-05-developer-follows-design.md
--
-- 正本キー: developer_user_id = 開発者の auth.users.id
-- フォロー関係の行は本人（follower）のみ SELECT 可。フォロワー数は RPC で集計。

BEGIN;

CREATE TABLE IF NOT EXISTS public.developer_follows (
  follower_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  developer_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, developer_user_id),
  CONSTRAINT developer_follows_no_self_follow CHECK (follower_id <> developer_user_id)
);

CREATE INDEX IF NOT EXISTS developer_follows_developer_user_id_idx
  ON public.developer_follows (developer_user_id);

CREATE INDEX IF NOT EXISTS developer_follows_follower_id_idx
  ON public.developer_follows (follower_id);

COMMENT ON TABLE public.developer_follows IS
  'Player follows a developer (by developer auth user id). Row visible only to follower; counts via RPC.';

COMMENT ON COLUMN public.developer_follows.follower_id IS
  'Player who follows (auth.users.id).';

COMMENT ON COLUMN public.developer_follows.developer_user_id IS
  'Followed developer (auth.users.id = developer_profiles.user_id).';

COMMENT ON COLUMN public.developer_follows.created_at IS
  'When the follow was created.';

ALTER TABLE public.developer_follows ENABLE ROW LEVEL SECURITY;

-- 旧版 public SELECT 含め、再 RUN 時の重複を避ける
DROP POLICY IF EXISTS "Developer follows are publicly readable"
  ON public.developer_follows;
DROP POLICY IF EXISTS "Users can read own developer follows"
  ON public.developer_follows;
DROP POLICY IF EXISTS "Users can follow developers"
  ON public.developer_follows;
DROP POLICY IF EXISTS "Users can unfollow developers"
  ON public.developer_follows;

-- 本人のフォロー行のみ読める（/mypage フォロー中、フォロー済み判定）
CREATE POLICY "Users can read own developer follows"
  ON public.developer_follows
  FOR SELECT
  USING (auth.uid() = follower_id);

CREATE POLICY "Users can follow developers"
  ON public.developer_follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow developers"
  ON public.developer_follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- フォロワー数のみ公開（行内容・誰がフォローしたかは返さない）
CREATE OR REPLACE FUNCTION public.count_developer_followers(p_developer_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.developer_follows
  WHERE developer_user_id = p_developer_user_id;
$$;

REVOKE ALL ON FUNCTION public.count_developer_followers(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_developer_followers(uuid) TO anon, authenticated;

-- 複数開発者のフォロワー数（一覧ページ用。関係行は返さない）
CREATE OR REPLACE FUNCTION public.count_developer_followers_batch(p_developer_user_ids uuid[])
RETURNS TABLE (developer_user_id uuid, follower_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ids.developer_user_id, coalesce(c.cnt, 0)::integer AS follower_count
  FROM unnest(p_developer_user_ids) AS ids(developer_user_id)
  LEFT JOIN (
    SELECT df.developer_user_id, count(*) AS cnt
    FROM public.developer_follows df
    WHERE df.developer_user_id = ANY (p_developer_user_ids)
    GROUP BY df.developer_user_id
  ) c ON c.developer_user_id = ids.developer_user_id;
$$;

REVOKE ALL ON FUNCTION public.count_developer_followers_batch(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_developer_followers_batch(uuid[]) TO anon, authenticated;

COMMIT;

-- Rollback（023 単独可）:
-- BEGIN;
-- REVOKE ALL ON FUNCTION public.count_developer_followers_batch(uuid[]) FROM anon, authenticated;
-- REVOKE ALL ON FUNCTION public.count_developer_followers(uuid) FROM anon, authenticated;
-- DROP FUNCTION IF EXISTS public.count_developer_followers_batch(uuid[]);
-- DROP FUNCTION IF EXISTS public.count_developer_followers(uuid);
-- DROP TABLE IF EXISTS public.developer_follows CASCADE;
-- COMMIT;
