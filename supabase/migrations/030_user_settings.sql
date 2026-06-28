-- 030: user_settings — notification, privacy, studio public preferences
-- Prerequisite: 019 (influence ranking), 009 (voice notifications)

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  notify_player jsonb NOT NULL DEFAULT '{
    "watch-updates": true,
    "developer-follow": true,
    "community": true,
    "system": false
  }'::jsonb,
  notify_studio jsonb NOT NULL DEFAULT '{
    "voice": true,
    "witness": true,
    "version-play": true,
    "community": true
  }'::jsonb,
  privacy jsonb NOT NULL DEFAULT '{
    "profile": true,
    "activity": true,
    "ranking": true
  }'::jsonb,
  studio_public jsonb NOT NULL DEFAULT '{
    "dev-profile": true,
    "follower-list": true,
    "activity-log": true
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_settings IS
  'Per-user notification, privacy, and studio public visibility preferences.';

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_settings_set_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_set_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Public read of studio visibility only (for creator pages)
CREATE OR REPLACE FUNCTION public.get_user_studio_public_settings(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT studio_public
      FROM public.user_settings
      WHERE user_id = p_user_id
    ),
    '{"dev-profile": true, "follower-list": true, "activity-log": true}'::jsonb
  );
$$;

REVOKE ALL ON FUNCTION public.get_user_studio_public_settings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_studio_public_settings(uuid) TO anon, authenticated;

-- Filter recipient lists by notification prefs (player channel)
CREATE OR REPLACE FUNCTION public.filter_users_by_player_notification_pref(
  p_user_ids uuid[],
  p_pref_key text
)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(ids.uid), '{}'::uuid[])
  FROM unnest(p_user_ids) AS ids(uid)
  WHERE COALESCE(
    (
      SELECT (notify_player ->> p_pref_key)::boolean
      FROM public.user_settings
      WHERE user_id = ids.uid
    ),
    CASE p_pref_key
      WHEN 'system' THEN false
      ELSE true
    END
  );
$$;

REVOKE ALL ON FUNCTION public.filter_users_by_player_notification_pref(uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.filter_users_by_player_notification_pref(uuid[], text) TO authenticated;

-- Voice notifications respect studio "voice" pref
CREATE OR REPLACE FUNCTION public.notify_owner_on_voice_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_title text;
  v_message text;
  v_voice_enabled boolean;
BEGIN
  SELECT p.owner_id, p.title
  INTO v_owner_id, v_title
  FROM public.projects p
  WHERE p.id::text = NEW.project_id;

  IF v_owner_id IS NULL OR NEW.user_id = v_owner_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE((notify_studio ->> 'voice')::boolean, true)
  INTO v_voice_enabled
  FROM public.user_settings
  WHERE user_id = v_owner_id;

  IF v_voice_enabled IS FALSE THEN
    RETURN NEW;
  END IF;

  v_message := format(
    '「%s」にプレイヤーの回答が届きました（v%s）',
    v_title,
    NEW.version_key
  );

  UPDATE public.user_notifications
  SET
    message = v_message,
    created_at = now()
  WHERE user_id = v_owner_id
    AND project_id = NEW.project_id
    AND version_key = NEW.version_key
    AND type = 'voice_received'
    AND read_at IS NULL;

  IF NOT FOUND THEN
    INSERT INTO public.user_notifications (
      user_id,
      type,
      project_id,
      version_key,
      message
    )
    VALUES (
      v_owner_id,
      'voice_received',
      NEW.project_id,
      NEW.version_key,
      v_message
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Exclude users who opted out of influence ranking
CREATE OR REPLACE FUNCTION public.get_monthly_player_influence_ranking(
  p_year int,
  p_month int,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  player_handle text,
  influence_score int,
  dev_eval_count int,
  improvement_linked_count int,
  verification_contribution_count int,
  continued_witness_count int,
  low_voice_contribution_count int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz;
  v_end timestamptz;
  v_low_voice_threshold int := 5;
BEGIN
  v_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
  v_end := v_start + interval '1 month';

  RETURN QUERY
  WITH helpful AS (
    SELECT
      COALESCE(vr.user_id, pf.user_id) AS uid,
      COUNT(*)::int AS cnt
    FROM public.developer_feedback_helpful_marks m
    LEFT JOIN public.project_voice_responses vr
      ON m.source_type = 'voice_response'
      AND vr.id = m.source_id
    LEFT JOIN public.project_feedback pf
      ON m.source_type = 'project_feedback'
      AND pf.id = m.source_id
    WHERE m.created_at >= v_start
      AND m.created_at < v_end
      AND COALESCE(vr.user_id, pf.user_id) IS NOT NULL
    GROUP BY COALESCE(vr.user_id, pf.user_id)
  ),
  improvements AS (
    SELECT
      a.user_id AS uid,
      COUNT(*)::int AS cnt
    FROM public.voice_adoptions a
    WHERE a.created_at >= v_start
      AND a.created_at < v_end
      AND a.status = 'active'
    GROUP BY a.user_id
  ),
  verification AS (
    SELECT
      ps.user_id AS uid,
      COUNT(DISTINCT ps.id)::int AS cnt
    FROM public.project_play_sessions ps
    INNER JOIN public.confirmation_requests cr
      ON cr.project_id = ps.project_id
      AND ps.played_at >= cr.created_at
    WHERE ps.played_at >= v_start
      AND ps.played_at < v_end
    GROUP BY ps.user_id
  ),
  continued AS (
    SELECT
      sub.user_id AS uid,
      COUNT(*)::int AS cnt
    FROM (
      SELECT
        w.user_id,
        w.project_id
      FROM public.project_watches w
      INNER JOIN public.project_play_sessions ps
        ON ps.user_id = w.user_id
        AND ps.project_id = w.project_id
      WHERE ps.played_at >= v_start
        AND ps.played_at < v_end
      GROUP BY w.user_id, w.project_id
      HAVING COUNT(DISTINCT ps.version_key) >= 2
    ) sub
    GROUP BY sub.user_id
  ),
  project_voice_totals AS (
    SELECT
      vr.project_id,
      COUNT(*)::int AS voice_count
    FROM public.project_voice_responses vr
    GROUP BY vr.project_id
  ),
  low_voice AS (
    SELECT
      engagement.user_id AS uid,
      COUNT(*)::int AS cnt
    FROM (
      SELECT user_id, project_id
      FROM public.project_voice_responses
      WHERE created_at >= v_start
        AND created_at < v_end
      UNION ALL
      SELECT user_id, project_id
      FROM public.project_feedback
      WHERE created_at >= v_start
        AND created_at < v_end
    ) engagement
    INNER JOIN project_voice_totals pvt
      ON pvt.project_id = engagement.project_id
      AND pvt.voice_count <= v_low_voice_threshold
    GROUP BY engagement.user_id
  ),
  monthly_fb AS (
    SELECT user_id AS uid, COUNT(*)::int AS cnt
    FROM (
      SELECT user_id
      FROM public.project_voice_responses
      WHERE created_at >= v_start AND created_at < v_end
      UNION ALL
      SELECT user_id
      FROM public.project_feedback
      WHERE created_at >= v_start AND created_at < v_end
    ) fb
    GROUP BY user_id
  ),
  combined AS (
    SELECT
      u.uid,
      COALESCE(h.cnt, 0) AS dev_eval_count,
      COALESCE(i.cnt, 0) AS improvement_linked_count,
      COALESCE(v.cnt, 0) AS verification_contribution_count,
      COALESCE(ct.cnt, 0) AS continued_witness_count,
      COALESCE(lv.cnt, 0) AS low_voice_contribution_count,
      COALESCE(fb.cnt, 0) AS monthly_fb_count
    FROM (
      SELECT uid FROM helpful
      UNION SELECT uid FROM improvements
      UNION SELECT uid FROM verification
      UNION SELECT uid FROM continued
      UNION SELECT uid FROM low_voice
      UNION SELECT uid FROM monthly_fb
    ) u
    LEFT JOIN helpful h ON h.uid = u.uid
    LEFT JOIN improvements i ON i.uid = u.uid
    LEFT JOIN verification v ON v.uid = u.uid
    LEFT JOIN continued ct ON ct.uid = u.uid
    LEFT JOIN low_voice lv ON lv.uid = u.uid
    LEFT JOIN monthly_fb fb ON fb.uid = u.uid
  ),
  scored AS (
    SELECT
      c.uid AS user_id,
      c.dev_eval_count,
      c.improvement_linked_count,
      c.verification_contribution_count,
      c.continued_witness_count,
      c.low_voice_contribution_count,
      (
        c.dev_eval_count * 35
        + c.improvement_linked_count * 25
        + c.verification_contribution_count * 20
        + c.continued_witness_count * 10
        + c.low_voice_contribution_count * 10
      ) * 10 AS influence_score
    FROM combined c
    WHERE c.monthly_fb_count >= 3
      OR c.dev_eval_count >= 1
  )
  SELECT
    s.user_id,
    COALESCE(
      NULLIF(trim(au.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(trim(au.raw_user_meta_data ->> 'name'), ''),
      split_part(au.email, '@', 1),
      'プレイヤー'
    ) AS display_name,
    COALESCE(
      NULLIF(trim(au.raw_user_meta_data ->> 'handle'), ''),
      'player_' || left(s.user_id::text, 8)
    ) AS player_handle,
    s.influence_score::int,
    s.dev_eval_count,
    s.improvement_linked_count,
    s.verification_contribution_count,
    s.continued_witness_count,
    s.low_voice_contribution_count
  FROM scored s
  INNER JOIN auth.users au ON au.id = s.user_id
  LEFT JOIN public.user_settings us ON us.user_id = s.user_id
  WHERE s.influence_score > 0
    AND COALESCE((us.privacy ->> 'ranking')::boolean, true) = true
  ORDER BY s.influence_score DESC, s.user_id
  LIMIT GREATEST(1, LEAST(p_limit, 50));
END;
$$;

COMMIT;
