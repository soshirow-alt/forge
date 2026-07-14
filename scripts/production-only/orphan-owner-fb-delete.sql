-- Production Dashboard: delete OWNER orphan FB rows only
-- (project missing → UI shows 「非公開または削除された作品」)
-- Owner creator_id used by prior prod smokes: dev-9834cefc-ce64-4e28-b070-bfa023c9b577
-- DO NOT run against Staging. Ref: bpnisgzxuwdxelhnduuf
-- Keep real public games (Skunk Boost / もみじまんじゅうマン / ぬを探せ！ etc.)

BEGIN;

-- 1) Resolve owner
CREATE TEMP TABLE _owner AS
SELECT dp.user_id
FROM public.developer_profiles dp
WHERE dp.creator_id = 'dev-9834cefc-ce64-4e28-b070-bfa023c9b577';

-- Guard: exactly one owner
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM _owner) <> 1 THEN
    RAISE EXCEPTION 'owner resolve failed: expected 1 row';
  END IF;
END $$;

-- 2) Preview orphans (missing project)
CREATE TEMP TABLE _orphan_feedback AS
SELECT pf.id, pf.project_id, pf.created_at
FROM public.project_feedback pf
JOIN _owner o ON o.user_id = pf.user_id
LEFT JOIN public.projects p ON p.id = pf.project_id
WHERE p.id IS NULL;

CREATE TEMP TABLE _orphan_voice AS
SELECT vr.id, vr.project_id, vr.created_at
FROM public.project_voice_responses vr
JOIN _owner o ON o.user_id = vr.user_id
LEFT JOIN public.projects p ON p.id = vr.project_id
WHERE p.id IS NULL;

CREATE TEMP TABLE _orphan_adoptions AS
SELECT va.id, va.project_id, va.voice_response_id
FROM public.voice_adoptions va
JOIN _owner o ON o.user_id = va.user_id
WHERE va.voice_response_id IN (SELECT id FROM _orphan_voice)
   OR (
     va.project_id IN (SELECT project_id FROM _orphan_feedback
                       UNION SELECT project_id FROM _orphan_voice)
     AND NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = va.project_id)
   );

-- 3) Counts before delete (run these SELECTs and note results)
SELECT 'project_feedback' AS tbl, COUNT(*)::int AS n FROM _orphan_feedback
UNION ALL
SELECT 'project_voice_responses', COUNT(*)::int FROM _orphan_voice
UNION ALL
SELECT 'voice_adoptions', COUNT(*)::int FROM _orphan_adoptions;

-- Safety: zero rows matching keep titles (should be empty)
SELECT p.title, pf.id
FROM public.project_feedback pf
JOIN public.projects p ON p.id = pf.project_id
JOIN _owner o ON o.user_id = pf.user_id
WHERE p.title ~* '(Skunk[[:space:]]*Boost|もみじまんじゅう|ぬを探せ)'
  AND pf.id IN (SELECT id FROM _orphan_feedback);

-- 4) Delete (adoptions → voice → feedback)
DELETE FROM public.voice_adoptions
WHERE id IN (SELECT id FROM _orphan_adoptions);

DELETE FROM public.project_voice_responses
WHERE id IN (SELECT id FROM _orphan_voice);

DELETE FROM public.project_feedback
WHERE id IN (SELECT id FROM _orphan_feedback);

-- 5) Remaining owner FB on existing projects
SELECT
  (SELECT COUNT(*) FROM public.project_feedback pf JOIN _owner o ON o.user_id = pf.user_id) AS remaining_feedback,
  (SELECT COUNT(*) FROM public.project_voice_responses vr JOIN _owner o ON o.user_id = vr.user_id) AS remaining_voice,
  (SELECT COUNT(*) FROM public.project_feedback pf
     JOIN _owner o ON o.user_id = pf.user_id
     JOIN public.projects p ON p.id = pf.project_id
     WHERE p.visibility = 'public') AS remaining_public_feedback;

-- If counts look wrong: ROLLBACK;
-- If OK: COMMIT;
COMMIT;
