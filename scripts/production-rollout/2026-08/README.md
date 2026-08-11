# Production rollout package 2026-08

- Apply SQL: `01` `02` `03` (076–101). Preflight `00`, postflight `04`.
- Announcement LAST: `05_publish_release_announcement_LAST.sql` (Owner GO after deploy/smoke).
- History repair notes: `06_migration_history_repair_NOTES.sql` (076–101).
- Rebuild APPLY from canonical: `node scripts/production-rollout/2026-08/rebuild-apply-bundles.mjs`
- Equivalence gate: `npm run verify:production-rollout-bundle`
- Runbook: `docs/production-rollout-2026-08.md`
