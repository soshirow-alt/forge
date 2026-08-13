# Staging apply audit — 102 / 103 (fact log)

Project: `vuqpwvjvgyxffmvpfrxo` (Staging only)  
Production `bpnisgzxuwdxelhnduuf`: **not applied**

## How / who

- Applied by Cursor via Supabase Staging MCP `apply_migration` during Owner task chat that instructed Staging-only apply.
- Standing policy afterward: future Staging/Production SQL remains Owner-manual.
- Approximate wall time (local): 2026-08-13 ~18:10–18:20 JST (session).

## Preflight (before apply)

- `watch_update_coalesce_rows` = **0**
- Duplicate groups for `watch-update:%` = **0**
- authenticated `project_watches` privileges before: SELECT (no INSERT/DELETE)

Therefore migration 103 DELETE of rn>1 rows affected **0 rows** (no irreversible user notification deletion occurred).

## Applied SQL (names)

1. `project_watches_authenticated_grants` (= repo `102_project_watches_authenticated_grants.sql`)
2. `user_notifications_watch_update_coalesce_unique` (= repo `103_…sql` including ranked DELETE + unique index)

## Post-apply read-only (rechecked)

- authenticated: SELECT, INSERT, DELETE
- unique index `user_notifications_watch_update_coalesce_uidx` present, indisunique=true, pred `coalesce_key ~~ 'watch-update:%'`
- dup_groups = 0
- RLS policies (4): own select/insert/delete + owner read watches

## Owner follow-up

Owner should re-run `read-only-postapply-watch-update-102-103.sql` in Staging Dashboard and keep the result screenshot/export as independent confirmation.
