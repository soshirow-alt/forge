-- 049: get_project_special_thanks — public Special Thanks for /games/[id]
-- Prerequisite: 001–046 applied (041 moderation, 042 user_x_profiles)
-- Additive only. No new tables. Does NOT use 047 / 048 / special_thanks_entries.
-- Staging-first via Dashboard SQL. Do NOT apply to production without owner GO.
--
-- Returns named player cards: watchers / witnesses / update_contributors / early_players.
-- Includes avatar_url. No user_id / email.
-- Guests / anonymized / empty / 退会済みユーザー excluded.

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
    'update_contributors', '[]'::jsonb,
    'early_players', '[]'::jsonb
  );
  v_watch_count bigint := 0;
  v_watchers jsonb := '[]'::jsonb;
  v_witnesses jsonb := '[]'::jsonb;
  v_update_contributors jsonb := '[]'::jsonb;
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
        'avatar_url', e.avatar_url,
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
      resolved.avatar_url,
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
        nullif(btrim(xp.x_username), '') AS handle,
        nullif(
          btrim(
            coalesce(
              nullif(btrim(xp.x_avatar_url), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'avatar_url'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'picture'), '')
            )
          ),
          ''
        ) AS avatar_url
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
        'avatar_url', e.avatar_url,
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
      resolved.avatar_url,
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
        nullif(btrim(xp.x_username), '') AS handle,
        nullif(
          btrim(
            coalesce(
              nullif(btrim(xp.x_avatar_url), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'avatar_url'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'picture'), '')
            )
          ),
          ''
        ) AS avatar_url
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

  -- Player-aggregated active adoptions (not raw feedback rows)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'display_name', e.display_name,
        'handle', e.handle,
        'avatar_url', e.avatar_url,
        'adopted_feedback_count', e.adopted_feedback_count,
        'latest_published_version', e.latest_published_version,
        'latest_update_summary', e.latest_update_summary,
        'latest_adopted_at', e.latest_adopted_at
      )
      ORDER BY e.latest_adopted_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_update_contributors
  FROM (
    SELECT
      resolved.display_name,
      resolved.handle,
      resolved.avatar_url,
      agg.adopted_feedback_count,
      agg.latest_published_version,
      agg.latest_update_summary,
      agg.latest_adopted_at
    FROM (
      SELECT
        a.user_id,
        COUNT(*)::int AS adopted_feedback_count,
        (array_agg(a.published_version ORDER BY a.created_at DESC))[1]
          AS latest_published_version,
        (array_agg(a.update_summary ORDER BY a.created_at DESC))[1]
          AS latest_update_summary,
        MAX(a.created_at) AS latest_adopted_at
      FROM public.voice_adoptions a
      WHERE a.project_id = v_project_id_text
        AND a.status = 'active'
        AND a.user_id IS NOT NULL
      GROUP BY a.user_id
    ) agg
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
        nullif(btrim(xp.x_username), '') AS handle,
        nullif(
          btrim(
            coalesce(
              nullif(btrim(xp.x_avatar_url), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'avatar_url'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'picture'), '')
            )
          ),
          ''
        ) AS avatar_url
      FROM auth.users au
      LEFT JOIN public.user_x_profiles xp ON xp.user_id = au.id
      WHERE au.id = agg.user_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.account_anonymizations aa
          WHERE aa.user_id = au.id
        )
    ) resolved ON true
    WHERE resolved.display_name IS NOT NULL
      AND resolved.display_name <> '退会済みユーザー'
    ORDER BY agg.latest_adopted_at DESC
    LIMIT 12
  ) e;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'display_name', e.display_name,
        'handle', e.handle,
        'avatar_url', e.avatar_url,
        'first_contributed_at', e.first_contributed_at,
        'first_version_key', e.first_version_key
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
      resolved.avatar_url,
      first_hit.first_contributed_at,
      first_hit.first_version_key
    FROM (
      SELECT DISTINCT ON (contrib.user_id)
        contrib.user_id,
        contrib.contributed_at AS first_contributed_at,
        contrib.version_key AS first_version_key
      FROM (
        SELECT vr.user_id, vr.created_at AS contributed_at, vr.version_key
        FROM public.project_voice_responses vr
        WHERE vr.project_id = v_project_id_text
          AND vr.moderation_status = 'visible'
          AND vr.user_id IS NOT NULL
        UNION ALL
        SELECT fb.user_id, fb.created_at AS contributed_at, fb.version_key
        FROM public.project_feedback fb
        WHERE fb.project_id = v_project_id_text
          AND fb.moderation_status = 'visible'
          AND fb.user_id IS NOT NULL
      ) contrib
      ORDER BY contrib.user_id, contrib.contributed_at ASC
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
        nullif(btrim(xp.x_username), '') AS handle,
        nullif(
          btrim(
            coalesce(
              nullif(btrim(xp.x_avatar_url), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'avatar_url'), ''),
              nullif(btrim(au.raw_user_meta_data ->> 'picture'), '')
            )
          ),
          ''
        ) AS avatar_url
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
    'update_contributors', v_update_contributors,
    'early_players', v_early_players
  );
END;
$$;

COMMENT ON FUNCTION public.get_project_special_thanks(uuid) IS
  'Public Special Thanks player cards for a project detail tab. Public only. Named watchers/witnesses/update_contributors/early_players with avatar_url. No user_id/email.';

REVOKE ALL ON FUNCTION public.get_project_special_thanks(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_special_thanks(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_project_special_thanks(uuid) TO authenticated;

COMMIT;

-- Rollback (manual):
-- DROP FUNCTION IF EXISTS public.get_project_special_thanks(uuid);
