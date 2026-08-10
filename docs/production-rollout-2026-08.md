# Production rollout package — 2026-08 (migrations 076–101)

**Status:** Package ready for Owner review. **Do NOT apply to Production from this document alone.**  
**Target DB:** Production Supabase `bpnisgzxuwdxelhnduuf`  
**Baseline assumption:** `origin/main` / Production schema stops at migration **075**  
**Source of truth for SQL objects:** `supabase/migrations/076_*.sql` … `101_*.sql` (untouched; this package concatenates copies)  
**Package path:** `scripts/production-rollout/2026-08/`
**RC Preview HEAD (at package refresh):** see git `origin/preview/landing-01`

This package is **SQL Editor paste-safe** (pure SQL, no `\i` / `\set` / psql meta). Staging seed / beautify / fixture SQL is **excluded**.

---

## 1. Owner steps (minimal)

1. Confirm Dashboard project is **Production** (`bpnisgzxuwdxelhnduuf`), not Staging.
2. Run `00_preflight_READONLY.sql` → require `preflight_verdict = PASS`. Record section D row counts.
3. Run `01_core_schema_and_category.sql` → success, then spot-check (category column exists).
4. Run `02_collaboration_and_messaging.sql` → success.
5. Run `03_notifications_email_and_finalization.sql` → success.
6. Run `04_postflight_READONLY.sql` → require `postflight_verdict = PASS`. Compare A counts to preflight.
7. Optional: open `06_migration_history_repair_NOTES.sql` (read-only first). Repair history **only** after postflight PASS and Owner GO.
8. **Do not** run a live publish from `05_publish_release_announcement_LAST.sql` (stub). Wait for separate Owner GO; real publish SQL is `scripts/production-ops/ops-publish-release-announcement-2026-08.sql`.
9. **Production email sender (OWNER ACTION, parallel / before enabling sends):** Production must **not** use `@resend.dev`. Configure custom domain in Resend + DNS; set `RESEND_FROM_EMAIL` to a Forge domain From (see `docs/preview-real-email-e2e.md` §Production sender). Verify with `npm run verify:production-email-sender` when code is on Production.

**This runbook does not authorize Production apply, main merge, or Vercel Production deploy.** Those require a separate Owner instruction (e.g. 「本番反映して」).

---

## 2. Files and run order

| Order | File | Kind | Migrations |
|------:|------|------|------------|
| 0 | `00_preflight_READONLY.sql` | Read-only | — |
| 1 | `01_core_schema_and_category.sql` | APPLY (1 txn) | **076–085** |
| 2 | `02_collaboration_and_messaging.sql` | APPLY (1 txn) | **086–092** |
| 3 | `03_notifications_email_and_finalization.sql` | APPLY (1 txn) | **093–101** |
| 4 | `04_postflight_READONLY.sql` | Read-only | — |
| 5 | `05_publish_release_announcement_LAST.sql` | Stub / no-op write | — |
| 6 | `06_migration_history_repair_NOTES.sql` | Notes + commented repair | history only |

**Apply SQL count:** **3** files (`01`–`03`).  
Within budget (goal ~3, max 6). Split 086–100 into `02`+`03` for safer resume around email/messaging.

Approximate sizes: `01` ~107KB, `02` ~65KB, `03` ~47KB (all under ~500KB).

---

## 3. What each APPLY contains

### 01 — core schema + category / catalog / home (076–085)

| Ver | File | Role |
|-----|------|------|
| 076 | `player_ia_categories_attributes` | `projects.category` + attributes; `activity_tags`; backfill category=`game` |
| 077 | `project_usage_relations` | usage graph table + public RPC |
| 078 | `platform_announcements` | announcements table + public RPCs |
| 079 | `global_public_search` | `search_public_catalog*` |
| 080 | `player_ia_home_feed` | home feed RPCs |
| 081 | `guest_feedback_public_reenable` | guest cards in public listing (app Prod gate separate) |
| 082 | `guest_feedback_service_role_grants` | service_role GRANTs for guest FB tables |
| 083 | `player_ia_home_v0_shelves` | FB gathering / updates / newest shelves |
| 084 | `catalog_search_query_genres_tags` | catalog query/genres/tags args (superseded arity by 085) |
| 085 | `catalog_five_category_filters` | five-category filters; final `get_public_projects_by_category` |

### 02 — collaboration / requests / seen-ack / email outbox+hooks (086–092)

| Ver | File | Role |
|-----|------|------|
| 086 | `developer_community_open_posting` | open community posting |
| 087 | `collab_consultations` | consultations + messages + reads + `user_blocks` + RPCs |
| 088 | `usage_relation_requests` | request/decide/withdraw/remove usage relations |
| 089 | `notification_seen_ack` | seen/ack RPCs |
| 090 | `transactional_email_outbox` | outbox table + enqueue |
| 091 | `collab_notification_email_hooks` | collab/usage → notification + email enqueue |
| 092 | `consultation_message_email_read_to_unread` | message email on read→unread |

### 03 — reciprocity / announcement window / email prefs / messaging (093–101)

| Ver | File | Role |
|-----|------|------|
| 093 | `feedback_reciprocity_notifications` | reciprocity notify + triggers |
| 094 | `platform_announcement_publish_window` | `starts_at`/`ends_at`/CTA + RPC refresh |
| 095 | `feedback_reciprocity_project_id_text_cast` | fix text `project_id` cast in triggers |
| 096 | `transactional_email_preferences` | `user_settings.notify_email` + pref gates |
| 097 | `transactional_email_pref_allows_harden` | harden pref JSON |
| 098 | `remove_dead_notify_studio_voice` | strip dead `notify_studio.voice` key |
| 099 | `messaging_pair_identity` | soft-close dup open pairs + unique open-pair index + list/create/read |
| 100 | `messaging_context_segments` | create appends context segment within pair |
| 101 | `messaging_pair_email_read_harden` | pair-scoped message email + mark_read `FOR UPDATE` |

Bundles keep **full ordered content** of each migration (section headers `-- === NNN_... ===`). Later files that replace earlier functions are **both** included (e.g. 084 then 085; 087/091/092/099/100/101 create paths; 093 then 095).

---

## 4. Success / failure / rerun / resume

### 00 Preflight

| Outcome | Action |
|---------|--------|
| `PASS` | Proceed to 01 |
| `FAIL baseline incomplete` | Stop. Production is not at 075 expectations |
| `FAIL objects already present` | Stop. Partial/full 076–101 apply — do **not** re-run 01 blindly. Diff objects vs postflight checklist; resume from the first missing apply boundary only after Owner review |

### 01 / 02 / 03 APPLY

| Outcome | Action |
|---------|--------|
| Statement success + COMMIT | Proceed to next file |
| Error mid-file | Transaction aborts → **no partial commit for that file**. Fix cause; re-run **the same apply file** from scratch (idempotent `IF NOT EXISTS` / `CREATE OR REPLACE` / `DROP FUNCTION IF EXISTS` in sources). Do **not** skip to the next apply |
| 01 OK, 02 fails | Leave 01 in place. Re-run **02 only** after fix. Do not re-run 01 unless objects were dropped |
| 02 OK, 03 fails | Re-run **03 only** |
| Timeout | Re-run the **same** apply file (full file). If Dashboard timeout persists, Owner may need to raise statement timeout or ask for a further split (not done in this package) |

**Do not** paste individual `supabase/migrations/NNN_*.sql` in parallel with these bundles (double-apply risk). Use the bundles for Production go-live.

### 04 Postflight

| Outcome | Action |
|---------|--------|
| `PASS` | Schema go-live for 076–101 objects complete |
| `FAIL` | Inspect failing `check_name` rows. Re-run the apply file that owns the missing object (01 vs 02 vs 03). Do not publish announcements |

### 05 Announcement stub

Always no-op write. Publishing requires separate Owner GO + `scripts/production-ops/ops-publish-release-announcement-2026-08.sql`.

### 06 History notes

Read-only by default. Commented INSERT is **last resort** after postflight PASS.

---

## 5. Migration history handling

Dashboard SQL Editor **does not** record `supabase_migrations.schema_migrations` when you paste APPLY bundles.

| Topic | Policy |
|-------|--------|
| Success criterion | **Object postflight**, not history rows |
| After PASS | Optionally repair history so future CLI `db push` does not re-apply 076–101 |
| Preferred repair | Official `supabase migration repair --status applied <version>` (or Dashboard equivalent) against Production |
| Hand INSERT | Only as documented in `06_…NOTES.sql`, Owner GO, after confirming column shape |
| Forward-only | Never edit/delete/squash `supabase/migrations/*`. Fixes = new migration files |

---

## 6. Forward-only policy

- Canonical migrations **076–101 remain as-is** in the repo.
- This package **copies** their bodies into APPLY files; it does not replace the migration tree.
- Production hotfixes after apply → **new** migration `102+` (or a dated ops SQL under `scripts/production-ops/`), never rewrite 076–101.
- Do not squash, renumber, or delete applied versions.

---

## 7. Production sender — OWNER ACTION (`@resend.dev`)

Transactional email (090–097, 091–093 hooks) will enqueue on Production once code + outbox worker run. **Sending with `@resend.dev` on Production is forbidden.**

Owner one-time:

1. Add Forge sending domain in Resend + DNS.
2. Set Production `RESEND_FROM_EMAIL` to that domain (not `@resend.dev`).
3. Keep `RESEND_API_KEY` on Production.
4. Run `npm run verify:production-email-sender` after env is set.

Preview may still use `@resend.dev` for smoke; Production must not. Details: `docs/preview-real-email-e2e.md`.

---

## 8. Excluded / STAGING_ONLY (do not apply with this package)

**No migration in 076–101 is classified STAGING_ONLY.** All are Production-canonical schema/RPC.

**Excluded from this package (do not paste on Production as part of this rollout):**

| Class | Examples |
|-------|----------|
| Staging seed / beautify / fixture | `scripts/staging-only/player-ia-staging-seed.sql`, `beautify-player-ia-seed-display.sql`, `home-discovery-shelf-seed.sql`, `ops-seed-messages-example-conversation.sql`, `phase-a-special-thanks-seed.sql`, `seed-featured-hero-visibility.sql`, … |
| Staging auth / E2E helpers | `scripts/staging-only/player-ia-auth-seed.ts`, `bootstrap-messages-empty-viewer.ts`, email E2E scripts |
| Staging GRANT sync one-offs | `scripts/staging-only/sql/sync-project-watches-authenticated-select.sql`, `fix-guest-feedback-service-role-grants.sql` (082 already covers guest grants in APPLY 01) |
| Staging announcement twin | `scripts/staging-only/ops-publish-release-announcement-2026-08.sql` |
| Staging images / explore prototypes | `public/images/staging-only/**`, explore-prototype trees (code rollout concern; not in this SQL package) |

Real Production announcement publish (later): `scripts/production-ops/ops-publish-release-announcement-2026-08.sql` — **not** auto-run by file `05`.

---

## 9. Notable data mutations inside APPLY (not Staging seed)

These are intentional, scoped, from canonical migrations:

| Migration | Mutation |
|-----------|----------|
| 076 | `UPDATE projects SET category='game' WHERE null/blank` |
| 094 | `UPDATE platform_announcements SET starts_at = published_at` for published rows missing starts_at |
| 098 | Strip `notify_studio.voice` key from `user_settings` |
| 099 | Soft-close duplicate **open** consultation pairs before unique index (Production likely empty) |

No Staging demo rows / `ia-seed-*` inserts are included.

---

## 10. Related docs

- Prior go-live pattern: `scripts/production-only/sql/070-074-go-live/`
- Player IA Staging runbook (history bypass notes): `docs/player-ia-staging-apply-runbook.md`
- Home Production plan (broader code scope): `docs/player-ia-home-production-rollout-plan.md`
- Email sender: `docs/preview-real-email-e2e.md`
