# Production go-live: migrations 070–074

**Target:** Production Supabase `bpnisgzxuwdxelhnduuf`  
**Apply via:** Supabase Dashboard → SQL Editor (owner manual)  
**Do NOT run:** `scripts/staging-only/sql/sync-project-watches-authenticated-select.sql`  
**Do NOT run:** Staging-only `confirmation_requests` GRANT sync

## Execution order

| Step | File | Action |
|------|------|--------|
| 0 | `00-pre-audit.sql` | Read-only. **Stop if any FAIL row appears.** Record counts. |
| 1 | `08-rollback-snapshot-before-apply.sql` | Read-only. Save output before any migration. |
| 2 | `supabase/migrations/070_age_rating_feedback_engagement.sql` | Paste **full file** from repo and Run. Confirm success before next. |
| 3 | `supabase/migrations/071_public_feedback_engagement_harden.sql` | Paste full file and Run. |
| 4 | `supabase/migrations/072_registered_voice_answer_value_max_1000.sql` | Paste full file and Run. |
| 5 | `supabase/migrations/073_user_notifications_authenticated_read_access.sql` | Paste full file and Run. |
| 6 | `supabase/migrations/074_user_notification_follower_recipient_helper.sql` | Paste full file and Run immediately after 073. |
| 7 | `07-post-audit.sql` | Read-only. Confirm schema/grants/policies and unchanged row counts. |

## Pre-audit stop rules

1. Any `answer_value` or `optional_comment` row with `char_length > 1000` → **stop** (no truncate/UPDATE).
2. Any 070–074 object already exists (column/table/function from later migrations) → **stop** (manual review).
3. `authenticated` lacks `SELECT` on `project_watches` → **stop** (do not apply Staging sync SQL; fix GRANT drift separately).
4. `authenticated` lacks `SELECT` on `confirmation_requests` → **stop** (same as above).

## After DB apply

- Cursor: `preview/landing-01` → `main` merge/push, Production deploy, read-only smoke (separate owner instruction).
- Owner: Production manual UX verification (FB input, empathy, replies, R18, notifications).
