-- 015: Owner version play stats (P0 Phase C — **GO 待ち・未適用**)
-- 目的: 開発者が版単位の再プレイ人数を Studio で確認する
-- 適用: Supabase Dashboard 手動（docs/supabase-dashboard-migration-guide.md）
-- Prerequisite: 012 project_play_sessions

BEGIN;

CREATE OR REPLACE FUNCTION public.get_owner_version_play_stats(p_project_id text)
RETURNS TABLE (
  version_key text,
  total_players bigint,
  replay_players bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH authorized AS (
    SELECT 1
    FROM public.projects p
    WHERE p.id::text = p_project_id
      AND p.owner_id = auth.uid()
  ),
  per_user_version AS (
    SELECT
      ps.version_key,
      ps.user_id,
      MIN(ps.played_at) AS first_played_at
    FROM public.project_play_sessions ps
    WHERE ps.project_id = p_project_id
      AND EXISTS (SELECT 1 FROM authorized)
    GROUP BY ps.version_key, ps.user_id
  ),
  user_first_version AS (
    SELECT
      user_id,
      MIN(first_played_at) AS first_ever_at
    FROM per_user_version
    GROUP BY user_id
  ),
  version_stats AS (
    SELECT
      puv.version_key,
      COUNT(DISTINCT puv.user_id)::bigint AS total_players,
      COUNT(
        DISTINCT CASE
          WHEN EXISTS (
            SELECT 1
            FROM per_user_version older
            WHERE older.user_id = puv.user_id
              AND older.version_key <> puv.version_key
              AND older.first_played_at < puv.first_played_at
          ) THEN puv.user_id
        END
      )::bigint AS replay_players
    FROM per_user_version puv
    GROUP BY puv.version_key
  )
  SELECT version_key, total_players, replay_players
  FROM version_stats
  ORDER BY version_key DESC;
$$;

REVOKE ALL ON FUNCTION public.get_owner_version_play_stats(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_version_play_stats(text) TO authenticated;

COMMIT;
