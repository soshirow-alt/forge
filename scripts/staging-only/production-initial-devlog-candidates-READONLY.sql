# Production prep — initial-devlog candidates (READ-ONLY)

**Do not UPDATE production in this task.**

## Read-only candidate SELECT

```sql
SELECT
  d.id AS devlog_id,
  d.project_id,
  d.title,
  d.published_version,
  d.created_at AS devlog_created_at,
  d.is_initial_publish AS current_flag,
  p.created_at AS project_created_at,
  p.visibility,
  p.title AS project_title
FROM public.project_devlogs d
LEFT JOIN public.projects p
  ON p.id::text = d.project_id
WHERE d.title = '初回公開'
  AND d.published_version = '0.1'
ORDER BY d.created_at ASC;
```

## After owner GO (template — fill production IDs only)

```sql
UPDATE public.project_devlogs
SET is_initial_publish = true
WHERE id IN (
  -- production-confirmed uuids only
);
```

## Misclassification risk

Heuristic is not unique-guaranteed. Confirm each ID before UPDATE.
