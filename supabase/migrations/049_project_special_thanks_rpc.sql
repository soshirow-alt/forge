-- 049: get_project_special_thanks — public Special Thanks for /games/[id]
-- Prerequisite: 001–046 applied (041 moderation, 042 user_x_profiles)
-- Additive only. No new tables. Does NOT use 047 / 048 / special_thanks_entries.
-- Staging-first via Dashboard SQL. Do NOT apply to production without owner GO.
--
-- Returns watchers (named), witnesses, adoptions, early_players.
-- No user_id / email. Guests / anonymized / empty / 退会済みユーザー excluded.

BEGIN;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_project_special_thanks(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_release_status text;
  v_project_id_text text;
  v_empty jsonb := jsonb_build_object(
    'project_id', null,
    'release_status', null,
    'watch_count', 0,
    'watchers', '[]'::jsonb,
    'witnesses', '[]'::jsonb,
    'adoptions', '[]'::jsonb,
    'early_players', '[]'::jsonb
  );
  v_watch_count bigint := 0;
  v_watchers jsonb := '[]'::jsonb;
  v_witnesses jsonb := '[]'::jsonb;
  v_adoptions jsonb := '[]'::jsonb;
  v_early_players jsonb := '[]'::jsonb;
BEGIN
  IF p_project_id IS NULL THEN
    RETURN v_empty;
  END IF;

  SELECT p.release_status
  INTO v_release_status
  FROM public.projects p
  WHERE p.id = p_project_id
    AND p.visibility = 'public';

  IF NOT FOUND THEN
    RETURN v_empty;
  END IF;

  v_project_id_text := p_project_id::text;

  SELECT COUNT(*)::bigint
  INTO v_watch_count
  FROM public.project_watches w
  WHERE w.project_id = v_project_id_text;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'display_name', e.display_name,
        'handle', e.handle,
        'watched_at', e.watched_at
      )
      ORDER BY e.watched_at ASC
    ),
    '[]'::jsonb
  )
  INTO v_watchers
  FROM (
    SELECT
      resolved.display_name,
      resolved.handle,
      w.created_at AS watched_at
    FROM public.project_watches w
    INNER JOIN LATERAL (
      SELECT
        nullif(
          btrim(
            coalesce(
              nullif(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'name'), ''),
              nullif(btrim(xp.x_display_name), '')
            )
          ),
          ''
        ) AS display_name,
        nullif(btrim(xp.x_username), '') AS handle
      FROM auth.users au
      LEFT JOIN public.user_x_profiles xp ON xp.user_id = au.id
      WHERE au.id = w.user_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.account_anonymizations aa
          WHERE aa.user_id = au.id
        )
    ) resolved ON true
    WHERE w.project_id = v_project_id_text
      AND resolved.display_name IS NOT NULL
      AND resolved.display_name <> '退会済みユーザー'
    ORDER BY w.created_at ASC
    LIMIT 24
  ) e;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'display_name', e.display_name,
        'handle', e.handle,
        'granted_at', e.granted_at
      )
      ORDER BY e.granted_at ASC
    ),
    '[]'::jsonb
  )
  INTO v_witnesses
  FROM (
    SELECT
      resolved.display_name,
      resolved.handle,
      wg.granted_at
    FROM public.project_witness_grants wg
    INNER JOIN LATERAL (
      SELECT
        nullif(
          btrim(
            coalesce(
              nullif(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'name'), ''),
              nullif(btrim(xp.x_display_name), '')
            )
          ),
          ''
        ) AS display_name,
        nullif(btrim(xp.x_username), '') AS handle
      FROM auth.users au
      LEFT JOIN public.user_x_profiles xp ON xp.user_id = au.id
      WHERE au.id = wg.user_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.account_anonymizations aa
          WHERE aa.user_id = au.id
        )
    ) resolved ON true
    WHERE wg.project_id = p_project_id
      AND resolved.display_name IS NOT NULL
      AND resolved.display_name <> '退会済みユーザー'
    ORDER BY wg.granted_at ASC
    LIMIT 24
  ) e;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'display_name', e.display_name,
        'handle', e.handle,
        'player_quote', e.player_quote,
        'update_summary', e.update_summary,
        'published_version', e.published_version
      )
      ORDER BY e.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_adoptions
  FROM (
    SELECT
      resolved.display_name,
      resolved.handle,
      a.player_quote,
      a.update_summary,
      a.published_version,
      a.created_at
    FROM public.voice_adoptions a
    INNER JOIN LATERAL (
      SELECT
        nullif(
          btrim(
            coalesce(
              nullif(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'name'), ''),
              nullif(btrim(xp.x_display_name), '')
            )
          ),
          ''
        ) AS display_name,
        nullif(btrim(xp.x_username), '') AS handle
      FROM auth.users au
      LEFT JOIN public.user_x_profiles xp ON xp.user_id = au.id
      WHERE au.id = a.user_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.account_anonymizations aa
          WHERE aa.user_id = au.id
        )
    ) resolved ON true
    WHERE a.project_id = v_project_id_text
      AND a.status = 'active'
      AND resolved.display_name IS NOT NULL
      AND resolved.display_name <> '退会済みユーザー'
    ORDER BY a.created_at DESC
    LIMIT 12
  ) e;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'display_name', e.display_name,
        'handle', e.handle,
        'first_contributed_at', e.first_contributed_at
      )
      ORDER BY e.first_contributed_at ASC
    ),
    '[]'::jsonb
  )
  INTO v_early_players
  FROM (
    SELECT
      resolved.display_name,
      resolved.handle,
      first_hit.first_contributed_at
    FROM (
      SELECT
        contrib.user_id,
        MIN(contrib.contributed_at) AS first_contributed_at
      FROM (
        SELECT vr.user_id, vr.created_at AS contributed_at
        FROM public.project_voice_responses vr
        WHERE vr.project_id = v_project_id_text
          AND vr.moderation_status = 'visible'
        UNION ALL
        SELECT fb.user_id, fb.created_at AS contributed_at
        FROM public.project_feedback fb
        WHERE fb.project_id = v_project_id_text
          AND fb.moderation_status = 'visible'
      ) contrib
      GROUP BY contrib.user_id
    ) first_hit
    INNER JOIN LATERAL (
      SELECT
        nullif(
          btrim(
            coalesce(
              nullif(btrim(au.raw_user_meta_data ->> 'display_name'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'name'), ''),
              nullif(btrim(xp.x_display_name), '')
            )
          ),
          ''
        ) AS display_name,
        nullif(btrim(xp.x_username), '') AS handle
      FROM auth.users au
      LEFT JOIN public.user_x_profiles xp ON xp.user_id = au.id
      WHERE au.id = first_hit.user_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.account_anonymizations aa
          WHERE aa.user_id = au.id
        )
    ) resolved ON true
    WHERE resolved.display_name IS NOT NULL
      AND resolved.display_name <> '退会済みユーザー'
    ORDER BY first_hit.first_contributed_at ASC
    LIMIT 12
  ) e;

  RETURN jsonb_build_object(
    'project_id', p_project_id,
    'release_status', v_release_status,
    'watch_count', v_watch_count,
    'watchers', v_watchers,
    'witnesses', v_witnesses,
    'adoptions', v_adoptions,
    'early_players', v_early_players
  );
END;
$$;

COMMENT ON FUNCTION public.get_project_special_thanks(uuid) IS
  'Public Special Thanks for a project detail tab. Public projects only. Returns named watchers/witnesses/adoptions/early_players. No user_id/email.';

REVOKE ALL ON FUNCTION public.get_project_special_thanks(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_special_thanks(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_project_special_thanks(uuid) TO authenticated;

COMMIT;

-- Rollback (manual):
-- DROP FUNCTION IF EXISTS public.get_project_special_thanks(uuid);
