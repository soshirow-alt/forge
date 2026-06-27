-- 023 fixup: 旧版（public SELECT）適用後 → 新版 RLS + count RPC へ揃える
-- Dashboard で 023 全文の再 RUN が policy 重複で失敗した場合に、このファイルだけ実行
-- Design: docs/rel-2-05-developer-follows-design.md
--
-- 前提: developer_follows テーブルは既に存在（旧 023 で作成済み）
-- データ行があっても保持される（ポリシー・RPC のみ差し替え）

BEGIN;

ALTER TABLE public.developer_follows ENABLE ROW LEVEL SECURITY;

-- 旧版・新版のポリシー名をすべて除去してから再作成
DROP POLICY IF EXISTS "Developer follows are publicly readable"
  ON public.developer_follows;
DROP POLICY IF EXISTS "Users can read own developer follows"
  ON public.developer_follows;
DROP POLICY IF EXISTS "Users can follow developers"
  ON public.developer_follows;
DROP POLICY IF EXISTS "Users can unfollow developers"
  ON public.developer_follows;

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
