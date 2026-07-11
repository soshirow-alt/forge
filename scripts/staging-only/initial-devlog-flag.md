# Staging: initial-devlog `is_initial_publish` flag

**Environment:** Staging Supabase only (`vuqpwvjvgyxffmvpfrxo`).  
**Production:** read-only candidate SELECT only in this task — no UPDATE without owner GO.

## Steps

1. Apply migration `051` (adds column, default false).
2. Run `scripts/staging-only/initial-devlog-candidates.sql` SELECT in Staging SQL Editor.
3. Confirm each row is the bootstrap initial publish (not a later owner-authored log).
4. UPDATE only confirmed Staging IDs (never paste Staging IDs into shared migrations).
5. Re-run SELECT — confirmed rows should show `current_flag = true`.
6. Then exercise `get_home_discovery_feed`.

## Production prep (do not execute writes now)

Run the same SELECT on production (read-only). Record:

- candidate count
- `devlog_id`, `project_id`, `title`, `published_version`
- `devlog_created_at`, `project_created_at`
- misclassification risk notes
- UPDATE SQL with **production** IDs only (owner GO later)

## Misclassification risk

- No DB unique constraint on `(project_id, title)` / version
- Owner could later insert title `初回公開` + `0.1` via API/scripts
- Prefer per-ID confirmation over mass UPDATE
