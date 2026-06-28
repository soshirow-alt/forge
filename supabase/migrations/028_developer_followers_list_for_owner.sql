-- 028: list_developer_followers_for_owner — Studio フォロワー一覧（開発者本人のみ）
-- Prerequisite: 023 developer_follows
-- Privacy: auth.uid() = developer_user_id の行のみ返す（SECURITY DEFINER + WHERE）

BEGIN;

CREATE OR REPLACE FUNCTION public.list_developer_followers_for_owner(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  follower_id uuid,
  followed_at timestamptz,
  display_name text,
  creator_route_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    df.follower_id,
    df.created_at AS followed_at,
    COALESCE(dp.public_name, 'プレイヤー') AS display_name,
    dp.creator_id AS creator_route_id
  FROM public.developer_follows df
  LEFT JOIN public.developer_profiles dp ON dp.user_id = df.follower_id
  WHERE df.developer_user_id = auth.uid()
  ORDER BY df.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION public.list_developer_followers_for_owner(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_developer_followers_for_owner(integer, integer) TO authenticated;

COMMENT ON FUNCTION public.list_developer_followers_for_owner(integer, integer) IS
  'Studio /studio/mypage followers tab — rows for auth.uid() as followed developer only.';

COMMIT;
