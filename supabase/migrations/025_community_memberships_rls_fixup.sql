-- 025 fixup: community_memberships SELECT ポリシーの infinite recursion 解消
-- 018 の "Approved members read memberships in same community" が
-- community_memberships を RLS 下で再参照して 42P17 / HTTP 500 を起こす
-- Dashboard で 018 適用済みの DB にこのファイルだけ実行可

BEGIN;

CREATE OR REPLACE FUNCTION public.is_approved_community_member(
  p_community_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_memberships
    WHERE community_id = p_community_id
      AND user_id = p_user_id
      AND status = 'approved'
  );
$$;

REVOKE ALL ON FUNCTION public.is_approved_community_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_approved_community_member(uuid, uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Approved members read memberships in same community"
  ON public.community_memberships;

CREATE POLICY "Approved members read memberships in same community"
  ON public.community_memberships
  FOR SELECT
  USING (
    status = 'approved'
    AND public.is_approved_community_member(community_id, auth.uid())
  );

COMMIT;
