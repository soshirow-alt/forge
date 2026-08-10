# Production rollout SQL — 2026-08 (076–100)

Paste order (Owner Dashboard, Production `bpnisgzxuwdxelhnduuf` only):

1. `00_preflight_READONLY.sql`
2. `01_core_schema_and_category.sql` (076–085)
3. `02_collaboration_and_messaging.sql` (086–092)
4. `03_notifications_email_and_finalization.sql` (093–100)
5. `04_postflight_READONLY.sql`
6. `05_publish_release_announcement_LAST.sql` — stub; **no publish** until Owner GO
7. `06_migration_history_repair_NOTES.sql` — notes; repair only after postflight PASS

Full runbook: `docs/production-rollout-2026-08.md`

Do **not** include `scripts/staging-only/**` seeds/beautify.
Do **not** edit `supabase/migrations/*`.
