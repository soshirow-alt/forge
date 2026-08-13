# Production apply handoff — watch-update 102 / 103

**Do not run from Cursor.** Owner applies in Production Dashboard SQL Editor only after Staging PASS.

Staging ref applied: `vuqpwvjvgyxffmvpfrxo` (2026-08-13) — PASS  
Production ref: `bpnisgzxuwdxelhnduuf` — **not applied**

## Order

1. Read-only audit grants: `read-only-audit-project-watches-grants.sql`
2. Read-only preflight coalesce: `read-only-preflight-watch-update-coalesce.sql`
3. **STOP if** unexpected large duplicate groups or wrong project ref
4. Apply `apply_project_watches_authenticated_grants.sql` (= migration 102)
5. Apply `apply_watch_update_coalesce_unique.sql` (= migration 103; includes safe DELETE of watch-update coalesce duplicates keeping newest only)
6. Post-check: `read-only-postapply-watch-update-102-103.sql`

## Expected results

### After 102

`authenticated` privileges on `project_watches` include: **SELECT, INSERT, DELETE**  
`anon` has no INSERT/UPDATE/DELETE

### After 103

Index `user_notifications_watch_update_coalesce_uidx` exists, `indisunique = true`, predicate `coalesce_key ~~ 'watch-update:%'`  
Duplicate groups for `watch-update:%` = **0**

### Cleanup scope (103)

DELETE only rows where `coalesce_key LIKE 'watch-update:%'` and `row_number > 1` per `(user_id, coalesce_key)`.  
Does **not** delete other notification types / non-matching coalesce keys.

## Rollback / stop

- Wrong project ref → stop
- Preflight shows unexpected mass duplicates of non-test data → Owner review before apply
- Apply failure → transaction aborts (each file is BEGIN/COMMIT); do not partially invent fixes in Production
- **103 DELETE is irreversible after COMMIT** for removed duplicate notification rows (keeps newest per key). Index DROP does **not** restore deleted rows. If restore may be needed, Owner must export candidate rows during preflight before apply.
- Rollback of GRANT only: `REVOKE INSERT, DELETE ON public.project_watches FROM authenticated;` (breaks toggle)
- Rollback of index only: `DROP INDEX IF EXISTS public.user_notifications_watch_update_coalesce_uidx;` (dedupe softens to app-only; does not undelete)

## Staging apply note (2026-08-13)

Fact: migrations 102/103 were applied on Staging `vuqpwvjvgyxffmvpfrxo` during this gate task (Cursor MCP), after Owner's explicit instruction in that chat to apply Staging only.  
**Standing policy unchanged:** future Staging/Production SQL apply remains Owner-manual. This handoff does not create a standing Cursor-write exception.  
Optional write probe `scripts/staging-only/verify-watch-update-102-103-gate.mjs` is Owner-run only; default verification is read-only post-check SQL.

## App coupling

Preview/main code already writes `coalesce_key` and uses INSERT-not-upsert for watches. Prefer apply 102/103 **before or immediately with** that code on Production.
