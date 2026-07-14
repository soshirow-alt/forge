-- 068: Add distinct play player_count to get_public_project_stats
-- Prerequisite: 045 (and project_plays from 002)
-- Definition: COUNT of project_plays rows = distinct registered users who recorded a play
--   (PK is user_id+project_id). Guests are not in project_plays.
-- Staging first. Production: owner-manual apply.
-- No PII returned.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_project_stats(
  p_project_ids uuid[]
)
RETURNS TABLE (
  project_id uuid,
  feedback_participant_count bigint,
  watch_count bigint,
  witness_grant_count bigint,
  latest_devlog_at timestamptz,
  play_player_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH requested AS (
    SELECT p.id AS project_id
    FROM public.projects p
    WHERE p.visibility = 'public'
      AND p.id = ANY(COALESCE(p_project_ids, ARRAY[]::uuid[]))
  ),
  feedback_participants AS (
    SELECT
      combined.project_id,
      COUNT(DISTINCT combined.participant_key)::bigint AS feedback_participant_count
    FROM (
      SELECT r.project_id, vr.user_id::text AS participant_key
      FROM requested r
      INNER JOIN public.project_voice_responses vr
        ON vr.project_id = r.project_id::text
      WHERE vr.moderation_status = 'visible'
        AND vr.user_id IS NOT NULL
      UNION
      SELECT r.project_id, fb.user_id::text AS participant_key
      FROM requested r
      INNER JOIN public.project_feedback fb
        ON fb.project_id = r.project_id::text
      WHERE fb.moderation_status = 'visible'
        AND fb.user_id IS NOT NULL
    ) combined
    GROUP BY combined.project_id
  ),
  watch_counts AS (
    SELECT
      r.project_id,
      COUNT(w.*)::bigint AS watch_count
    FROM requested r
    LEFT JOIN public.project_watches w
      ON w.project_id = r.project_id::text
    GROUP BY r.project_id
  ),
  witness_grant_counts AS (
    SELECT
      r.project_id,
      COUNT(wg.*)::bigint AS witness_grant_count
    FROM requested r
    LEFT JOIN public.project_witness_grants wg
      ON wg.project_id = r.project_id
    GROUP BY r.project_id
  ),
  latest_devlogs AS (
    SELECT
      r.project_id,
      MAX(d.created_at) AS latest_devlog_at
    FROM requested r
    LEFT JOIN public.project_devlogs d
      ON d.project_id = r.project_id::text
    GROUP BY r.project_id
  ),
  play_players AS (
    SELECT
      r.project_id,
      COUNT(pp.*)::bigint AS play_player_count
    FROM requested r
    LEFT JOIN public.project_plays pp
      ON pp.project_id = r.project_id::text
    GROUP BY r.project_id
  )
  SELECT
    r.project_id,
    COALESCE(fp.feedback_participant_count, 0)::bigint AS feedback_participant_count,
    COALESCE(wc.watch_count, 0)::bigint AS watch_count,
    COALESCE(wg.witness_grant_count, 0)::bigint AS witness_grant_count,
    ld.latest_devlog_at,
    COALESCE(pp.play_player_count, 0)::bigint AS play_player_count
  FROM requested r
  LEFT JOIN feedback_participants fp ON fp.project_id = r.project_id
  LEFT JOIN watch_counts wc ON wc.project_id = r.project_id
  LEFT JOIN witness_grant_counts wg ON wg.project_id = r.project_id
  LEFT JOIN latest_devlogs ld ON ld.project_id = r.project_id
  LEFT JOIN play_players pp ON pp.project_id = r.project_id;
$$;

COMMENT ON FUNCTION public.get_public_project_stats(uuid[]) IS
  'Public aggregate stats: feedback participants (distinct), watches, witness grants, latest devlog, play_player_count (distinct registered players from project_plays). Guests excluded from plays.';

REVOKE ALL ON FUNCTION public.get_public_project_stats(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_project_stats(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_project_stats(uuid[]) TO authenticated;

COMMIT;
