-- 007: Immutable version prompts — include answered archived prompts in public aggregates
-- Prerequisite: 006 applied

BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_voice_aggregates(
  p_project_id text,
  p_version_key text
)
RETURNS TABLE (
  prompt_id uuid,
  prompt_text text,
  response_kind text,
  options jsonb,
  sort_order smallint,
  source text,
  answer_value text,
  answer_label text,
  response_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS prompt_id,
    p.prompt_text,
    p.response_kind,
    p.options,
    p.sort_order,
    p.source,
    r.answer_value,
    r.answer_label,
    COUNT(r.id)::bigint AS response_count
  FROM public.project_version_prompts p
  LEFT JOIN public.project_voice_responses r ON r.prompt_id = p.id
  WHERE p.project_id = p_project_id
    AND p.version_key = p_version_key
    AND (
      p.archived_at IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.project_voice_responses rv
        WHERE rv.prompt_id = p.id
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.projects pr
      WHERE pr.id::text = p_project_id AND pr.visibility = 'public'
    )
  GROUP BY
    p.id,
    p.prompt_text,
    p.response_kind,
    p.options,
    p.sort_order,
    p.source,
    p.archived_at,
    r.answer_value,
    r.answer_label
  ORDER BY
    (p.archived_at IS NULL) DESC,
    p.sort_order ASC,
    p.created_at ASC,
    response_count DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_voice_aggregates(text, text) TO anon, authenticated;

COMMIT;
