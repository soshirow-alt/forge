# Static audit: Player IA migrations 076–081

Date: 2026-07-26  
Branch: `preview/landing-01`  
Scope: schema/RPC only（seed は `scripts/staging-only/`、本監査対象外の適用はしない）

## Execution order

| Order | File | Depends on |
|---:|---|---|
| 1 | `076_player_ia_categories_attributes.sql` | 075 / projects + developer_profiles |
| 2 | `077_project_usage_relations.sql` | 076 (`projects.category`) |
| 3 | `078_platform_announcements.sql` | 001+ |
| 4 | `079_global_public_search.sql` | 076 columns |
| 5 | `080_player_ia_home_feed.sql` | 076–078, feedback card helpers, release/devlog |
| 6 | `081_guest_feedback_public_reenable.sql` | 071 |

Seed（旧 migrations/082）→ `scripts/staging-only/player-ia-staging-seed.sql`（076–081 後・Staging のみ）

## Existing-data compatibility

| Change | Compat |
|---|---|
| `projects.category` NOT NULL DEFAULT `game` + backfill | Existing rows become `game` |
| New bool/array/jsonb columns with defaults | Additive; no rewrite of titles/visibility |
| `stream_policy` DEFAULT `unset` | Games without policy stay unset |
| `developer_profiles.activity_tags` DEFAULT `{}` | Additive |
| 081 guest public cards | Opt-in via `p_include_guest` + moderation / aggregate flags; registered cards unchanged |

## RLS / privileges

| Object | SELECT | INSERT/UPDATE/DELETE (anon/authenticated) |
|---|---|---|
| `project_usage_relations` | RLS: published + both projects public；`GRANT SELECT` | Revoked |
| `platform_announcements` | RLS: `status=published`；`GRANT SELECT` | Revoked |
| New RPCs | `GRANT EXECUTE` to anon/authenticated/service_role（resolve_feedback_card_id は service_role のみ — 071 踏襲） | n/a |

## SECURITY DEFINER + search_path

All public read RPCs in 077–081 use:

- `SECURITY DEFINER`
- `SET search_path = public`

`080` / feedback helpers reference `auth.users` with schema-qualified name（email は SELECT しない）。

## Non-public data leakage

| Surface | Guard |
|---|---|
| Global search | `projects.visibility = 'public'` only |
| Developer search hits | Requires ≥1 public project |
| Tag candidates from `activity_tags` | Same public-owner EXISTS filter（079 修正済み） |
| Announcements RPC | `status = 'published'` only |
| Usage RPC | published + both public |
| Review highlights | public projects; author display from metadata names only |
| Guest cards | `include_in_public_aggregate` + `moderation_status = 'visible'` |

Not searched: email, private projects, Studio drafts, notifications, consultation chat.

## Guest FB rate limit

Not in SQL 081. App layer:

- `lib/guest-feedback/rate-limit.ts`
- stores `ip_hash` in `guest_feedback_rate_events`（raw IP 非保存）
- Preview write APIs enabled only when `VERCEL_ENV !== 'production'`

## Production future-apply safety

| OK | Not OK |
|---|---|
| Apply 076–081 on Production after Staging verify（owner Dashboard） | Apply staging seed on Production |
| Additive defaults / IF NOT EXISTS | Assuming Cursor auto-applies Production |
| Keep guest write disabled in Production web until explicit release | Shipping seed UUIDs / `[IA Seed]` titles to Production |

## Issues found & fixed in this整理 pass

1. **079** — `activity_tags` tag hits previously scanned all developer_profiles；restricted to owners with public projects.
2. **077 / 078** — explicit `GRANT SELECT` for anon/authenticated（RLS still filters）.
3. **082** — removed from `supabase/migrations/` → staging-only seed + cleanup + README.
4. Seed — removed broad `UPDATE projects SET category=game`（076 の責務）；added Staging Smoke/hero guards.
