# Forge collaboration / marketplace gap audit

**Date:** 2026-08-09  
**Kind:** Read-only audit only  
**Staging ref:** `vuqpwvjvgyxffmvpfrxo`  
**Scope:** Repo + Staging anon **SELECT / GET-RPC** only. **No DB writes. No collaboration / marketplace implementation in this task.** Mutation (POST/INSERT/…) probes are forbidden.  
**Branch context:** Preview / Player IA direction. Production keeps legacy discovery unless IA redesign is enabled.

**Status legend:** `IMPLEMENTED` | `PARTIAL` | `PROTOTYPE` | `LEGACY-DEAD` | `MISSING`  
**Community reuse legend:** `REUSABLE` | `PARTIALLY REUSABLE` | `NOT REUSABLE` | `ALREADY REMOVED`

---

## Executive summary

| # | Feature | Status |
|---|---------|--------|
| 10-1 | 利用相談チャット | **MISSING** |
| 10-2 | 旧コミュニティ | **LEGACY-DEAD** under Player IA (code exists, soft-redirect); live when IA redesign is off |
| 10-3 | 使用関係登録 | **PARTIAL** (public read + seed only; client writes revoked in 077) |
| 10-4 | 双方確認 | **MISSING** |
| 10-5 | consultation → usage flow | **MISSING** |
| 10-6 | Notifications (consult / relation) | **MISSING** (existing notifs are follow / FB / devlog) |
| 10-7 | Email notifications | **PARTIAL** (ops Resend only) |
| 10-8 | Streamer tag / `stream_policy` | **PARTIAL** (schema + hidden Search URL; no Studio write) |
| 10-9 | Developer search / Profile collab discoverability | **PARTIAL** |
| 10-10 | Follow / notif adequacy for collab | **PARTIAL** (adequate for nurture; inadequate for marketplace collab) |
| 10-11 | Special Thanks vs usage relation | **IMPLEMENTED** (ST); usage **PARTIAL** — roles orthogonal |
| 10-12 | Other 4 category Homes | **PARTIAL** (Coming Soon spotlight; Search works) |

**Strict P0 (clear breakage of a shipped end-to-end product path):** **none.** Collab marketplace flows are largely unimplemented or intentionally gated, not broken mid-flight.

---

## Term scan (product-meaningful)

| Term | Finding |
|------|---------|
| `community` | Full hub: DB 018/020/025, UI, join, posts. Soft-redirected under Player IA. |
| `consult` / `consultation` | Essentially absent (docs only mention as “not searched”). |
| `conversation` / `chat` / `thread` / `message` / `dm` | Community board threads only. No project consultation / free DM. Screen def: feedback is **DM なし**. X OAuth: no DM scopes. |
| `contact` | Legal お問い合わせ / platform feedback — not creator-to-creator. |
| `collab` | No product module named collab; intent lives in IA categories + usage shelf. |
| `usage` / `relation` | `project_usage_relations` + Home shelf + GET API. Client writes revoked. |
| `stream` / `streamer` | `stream_policy` on projects; `streamer_creator` in `activity_tags`. Search UI hidden; Studio write = no. |
| `special thanks` | Live `/games/[id]?tab=special-thanks` via RPC 049. Not usage-credit. |
| `inbox` / `unread` | FB owner unread (075), in-app `user_notifications`. Not collab inbox. |
| `mail` / `email` | Auth verify + Resend for **platform_feedback** to ops. Settings mock 「メールで受け取る」 not wired. |

---

## Feature matrix

### 10-1. 利用相談チャット (project-tied consultation, not free DM)

| Field | Detail |
|-------|--------|
| **Past intent** | Marketplace / 5-category world: creators negotiate use of assets/audio/tools before publishing a usage relation. Distinct from free DM and from community board broadcast. UI mocks show header 「メッセージ」 icons (pending owner Q); screen inventory says FB path is DM-less. |
| **Status** | **MISSING** |
| **UI** | None. No routes `/messages`, `/inbox`, `/consult*`. |
| **DB** | No `consultation_*` / `message_*` / `thread_*` / `dm_*` tables in migrations. |
| **Write path** | None |
| **Read path** | None |
| **Notification** | None |
| **Key files / routes / DB** | Negative evidence: `docs/forge-screen-definition.md` (DM なし); `docs/x-auth-setup-runbook.md` (no DM scopes); UI mocks 05/06/16 header message icons unresolved. |
| **Gaps** | Entire product surface: thread model, project binding, RLS, UI, moderation. |
| **Reusable assets** | Community **board** UX patterns only (one-to-many posts/replies) — wrong topology for 1:1 consult. **NOT REUSABLE** as consultation chat without redesign. |
| **Needed before Production?** | Yes, if marketplace “ask to use” is in formal release. Else keep explicit out-of-scope. |
| **Recommended next** | Owner product GO: (A) defer, (B) external link-only contact, or (C) design project-scoped consult threads + confirmation → usage. Do not ship free DM. |

---

### 10-2. 旧コミュニティ (`/studio/community`, `/mypage/community`, participants, join)

| Field | Detail |
|-------|--------|
| **Past intent** | Developer-owned hub: followers/players join, board with Devlog quotes, join approve/reject, confirmation-request targeting via membership (REL-2-06). |
| **Status** | **LEGACY-DEAD** under Player IA Preview; **IMPLEMENTED** code path when IA redesign is off (Production-style). |
| **UI** | Pages exist but IA redirects: `/mypage/community` → `/mypage`, `/studio/community` → `/studio`. Player sidebar hides「参加コミュニティ」. Studio sidebar link still shown but lands on redirect. Join CTA on `/creators/[id]` still in tree for non-IA. |
| **DB** | Staging tables exist (`developer_communities`, `community_memberships`, `community_posts`, replies). Anon SELECT denied (auth/RLS expected). Migrations 018, 020, 025. |
| **Write path** | Supabase via `lib/supabase/community-db.ts` (ensure, apply membership, posts/replies) when not mock-hidden. Preview mock stores remain for non-production mode. |
| **Read path** | `useCommunityHubSupabase` / board hooks. |
| **Notification** | Join approve/reject/request largely **localStorage / mock** (`community-join-v0-store`), not first-class `user_notifications` types. Settings: community prefs = Coming Soon. |
| **Key files** | `app/studio/community/page.tsx`, `app/(player)/mypage/community/page.tsx`, `components/community-hub-page.tsx`, `components/creator-community-join-button.tsx`, `lib/supabase/community-db.ts`, `docs/rel-2-06-community-supabase-design.md` |
| **Gaps** | Soft-deprecated in IA without hard removal; Studio nav stale; community notifs not DB source of truth; not a substitute for project consult. |
| **Reusable assets** | **PARTIALLY REUSABLE** — membership + post/reply schema, hub chrome, join button. **Not** a marketplace consult channel. |
| **Needed before Production?** | Decide keep / freeze / remove. Leaving IA redirect + live Production dual-mode is confusing. |
| **Recommended next** | Owner decision: archive (remove nav + document LEGACY) vs revive for player nurture only. Do not reuse as usage consult. |

---

### 10-3. 使用関係登録 (create UI/API — not only seed + public read)

| Field | Detail |
|-------|--------|
| **Past intent** | Public “使用している” links between published projects (cross-category credit / discovery). Migration 077: “Registration UI comes later; client writes revoked.” |
| **Status** | **PARTIAL** |
| **UI** | Home shelf「Forgeでつながった作品」(`ConnectionsSection`). No Studio create/edit UI. No project-detail shelf found. |
| **DB** | Staging: table live, **12** published seed rows (game→audio/asset/dev-tool, etc.). `status` ∈ {draft, published}; only `relation_type='used'`. |
| **Write path** | **None for clients (PARTIAL).** Migration `077_project_usage_relations.sql` `REVOKE INSERT/UPDATE/DELETE` from `anon` / `authenticated`. No Studio/create UI. Conclusion from migration GRANT text + code paths — **not** from live mutation probes. Status remains PARTIAL (read + seed only), never IMPLEMENTED. |
| **Read path** | RPC `get_public_project_usage_relations`; `lib/supabase/player-ia-home-db.ts`; `GET /api/projects/[projectId]/usage-relations`. |
| **Notification** | None |
| **Key files** | `supabase/migrations/077_project_usage_relations.sql`, `app/api/projects/[projectId]/usage-relations/route.ts`, `components/player-ia/player-ia-home-page.tsx`, staging seed |
| **Gaps** | Create UI, authz (who may claim), draft workflow, project page display, edit/revoke. |
| **Reusable assets** | Table + RPC + Home card layout — **REUSABLE** foundation. |
| **Needed before Production?** | Read shelf OK if seeded/ops-managed. User registration **required** before claiming marketplace completeness. |
| **Recommended next** | Spec claim model (source owner vs mutual) → RLS write policies → Studio 「使用した作品を登録」 → then 10-4. |

---

### 10-4. 双方確認 (counterpart confirmation for usage)

| Field | Detail |
|-------|--------|
| **Past intent** | Prevent unilateral false “used X” claims; both parties confirm before public publish. |
| **Status** | **MISSING** |
| **UI** | None |
| **DB** | Only coarse `status` draft/published. No `confirmed_by`, counterpart user/project ack, or pending-confirm state machine. |
| **Write / read / notif** | None |
| **Key files** | 077 comments only. Confirmation elsewhere = **devlog confirmation_request** (player nurture), unrelated. |
| **Gaps** | Full confirm protocol + notifications. |
| **Reusable** | Pattern from community membership pending/approve or confirmation_requests — conceptual only. |
| **Needed before Production?** | Yes if public usage claims are user-writable. |
| **Recommended next** | After write path design: add `pending_confirmation` (+ dual ACK) before `published`. |

---

### 10-5. consultation → usage relation flow

| Field | Detail |
|-------|--------|
| **Past intent** | Consult → agree terms → create confirmed usage relation → appear on Home / project. |
| **Status** | **MISSING** |
| **UI / DB / paths / notif** | No bridge entities or CTAs. |
| **Gaps** | Depends on 10-1 + 10-3 + 10-4. |
| **Reusable** | None end-to-end. |
| **Needed before Production?** | Only if marketplace loop is in scope. |
| **Recommended next** | Do not implement in isolation; sequence after product GO on consult + usage claim model. |

---

### 10-6. Notifications for consultation / relation

| Field | Detail |
|-------|--------|
| **Past intent** | In-app alerts: new consult message, confirm request, relation published. |
| **Status** | **MISSING** (for collab). Existing notifs are loop / follow / FB. |
| **UI** | `/notifications` shows `user_notifications` (devlog, version, voice, confirmation_request, follow new/release, feedback_reply). |
| **DB** | `user_notifications` type CHECK has **no** consultation/usage types. |
| **Write path** | Insert helpers in `lib/supabase/user-notifications-db.ts` — no usage/consult helpers. |
| **Key files** | migrations 005/009/017/044/070/073/074; `components/notifications-v0-page.tsx` |
| **Gaps** | Types, writers, deep links, settings prefs. |
| **Needed before Production?** | With any consult/usage write flow. |
| **Recommended next** | Extend type CHECK only when product events exist. |

---

### 10-7. Email notifications

| Field | Detail |
|-------|--------|
| **Past intent** | UI mock settings: 「メールで受け取る / 重要通知メール」. Product emails for collab would be secondary to in-app. |
| **Status** | **PARTIAL** |
| **UI** | Settings toggles; community/system often Coming Soon. No real “email channel” toggle wired to mailer. |
| **DB** | Auth emails (verify). No user notification email outbox table. |
| **Write path** | `lib/platform-feedback-notify.ts` — Resend to **ops** (`PLATFORM_FEEDBACK_NOTIFY_EMAIL` / legal contact). Auth `resend` for verify only. |
| **Read path** | N/A |
| **Notification** | Ops-only for platform feedback. |
| **Gaps** | User-facing email for follow/FB/consult/usage entirely absent. |
| **Needed before Production?** | Not blocking core loop. Needed if collab SLA requires offline reach. |
| **Recommended next** | Keep ops Resend; defer user email until in-app collab events exist. |

---

### 10-8. Streamer tag / `stream_policy` (Profile, Studio, Search, hidden URL compat)

| Field | Detail |
|-------|--------|
| **Past intent** | Games declare streaming policy (`ok` / `conditional` / `no`); creators tag as `streamer_creator` for discoverability. |
| **Status** | **PARTIAL** |
| **UI** | Player IA Search: `stream_policy` **intentionally hidden** (no Studio write). No Profile activity-tag editor found. Game detail stream badge not wired in detail components searched. |
| **DB** | Staging: columns live. Public projects stream_policy dist ≈ unset 24 / ok 9 / conditional 9 / no 7. `developer_profiles.activity_tags` column exists; anon-visible profiles sampled: **0 tagged** (auth seed may be separate). |
| **Write path** | `project-formal-filter-ownership.ts`: `stream_policy` = compatibility-only, **studioWrite: no**. Activity tags: schema + seed script only; no Studio/settings writer found. |
| **Read path** | Catalog RPC accepts `p_stream_policy`; URL parse/preserve in `catalog-search-params` / `search-href` legacy hidden params. Global search 079 indexes `activity_tags`. |
| **Notification** | None |
| **Key files** | `076_player_ia_categories_attributes.sql`, `lib/project-categories.ts` (`STREAM_POLICY_*`, `ACTIVITY_TAG_*`), `lib/project-formal-filter-ownership.ts`, `components/player-ia/player-ia-search-page.tsx` (comment), `scripts/staging-only/player-ia-auth-seed.ts` |
| **Gaps** | Studio write for stream_policy (+ note); Profile multi-select activity tags; Search UI re-enable only after write; display on cards/detail. |
| **Needed before Production?** | If streamer discovery is marketed. Else keep hidden + seeded. |
| **Recommended next** | Owner GO: Studio game field for stream_policy → then unhide Search filter → Profile activity tags. |

---

### 10-9. Developer search / Profile collaboration discoverability

| Field | Detail |
|-------|--------|
| **Past intent** | Find creators (incl. streamers / audio / asset makers) to collaborate or follow. |
| **Status** | **PARTIAL** |
| **UI** | `/search/creators` live; `/creators/[id]` live. Genre/sort/follow/gacha. **No** activity_tag / streamer filter chips on creator search. |
| **DB** | Public projects + developer_profiles; follower counts RPC. |
| **Write path** | Follow write yes; activity_tags write **no**. |
| **Read path** | Production mode: `buildPublicDeveloperSearchResults` from catalog owners. Preview mock list when v0 not hidden. |
| **Notification** | Follow → new project / release notifs (separate). |
| **Key files** | `app/search/creators/page.tsx`, `components/developer-search-v0-page.tsx`, `lib/discovery-public-developers.ts`, `079_global_public_search.sql` |
| **Gaps** | Collab-oriented filters (activity_tags, categories authored, “looking for collab”); profile surfaces for tags. |
| **Needed before Production?** | Basic search OK. Collab discovery incomplete without tags. |
| **Recommended next** | Wire activity_tags to Profile edit + creator search facets. |

---

### 10-10. Follow / notification adequacy for collab

| Field | Detail |
|-------|--------|
| **Past intent** | Developer follow as 「応援」; notify on new work / formal release. Collab would need denser signals (consult, usage confirm) — follow alone is weak. |
| **Status** | **PARTIAL** (adequate for nurture/follow; **inadequate** for marketplace collab) |
| **UI** | Follow button on creator/search; mypage「フォロー中」real panel in production mode; Studio followers list Coming Soon. |
| **DB** | `developer_follows` (023); follower count RPC. |
| **Write path** | `followDeveloperInDb` / unfollow via `game-provider`. |
| **Read path** | Following list, counts. |
| **Notification** | `followed_developer_new_project`, `followed_developer_released_project` + settings pref `developer-follow`. |
| **Gaps** | No collab-specific events; follower list privacy-limited; community follow overlap confusing under IA deprecate. |
| **Needed before Production?** | Follow stack is already a Production capability. Collab needs more than follow. |
| **Recommended next** | Keep follow as-is; do not stretch it into usage consult. |

---

### 10-11. Special Thanks vs usage relation role

| Field | Detail |
|-------|--------|
| **Past intent (ST)** | `/games/[id]` tab: who contributed **to this project’s learning loop** (watchers, witnesses, update contributors, early players) — badges/meta, not FB body list. |
| **Past intent (usage)** | Catalog edge “project A 使用している project B” for cross-work credit / discovery. |
| **Status** | ST **IMPLEMENTED**; usage **PARTIAL** (read). Roles are **orthogonal** — not interchangeable. |
| **UI** | ST tab live. Usage on Home shelf only. |
| **DB** | ST: RPC `get_project_special_thanks` (049), no `special_thanks_entries` (047/048 unused). Usage: 077 table. Staging ST RPC OK. |
| **Write path** | ST derived from existing play/watch/FB data (no manual credit UI). Usage: seed only. |
| **Read path** | ST hook/RPC; usage Home/API. |
| **Notification** | Neither is a collab chat notif. |
| **Key files** | `components/game-special-thanks-tab.tsx`, `lib/supabase/project-special-thanks-db.ts`, `docs/forge-ui-copy-rules.md` §C; usage files under 10-3. |
| **Gaps** | Do not merge ST with usage. Optional future: ST badge for “credited usage partner” only after confirmed relations. |
| **Needed before Production?** | ST already Production-ready. Usage registration separate. |
| **Recommended next** | Document role split in owner backlog; never overload ST as marketplace license registry. |

---

### 10-12. Other 4 category Homes (Coming Soon vs prototypes)

| Field | Detail |
|-------|--------|
| **Past intent** | Per-category Homes like `/home/game` for audio / asset / dev-tool / service-app. |
| **Status** | **PARTIAL** |
| **UI** | `/home` feature cards: game spotlight → `/home/game`; other four spotlight = **Coming Soon** (non-link). All five have「条件で探す」→ `/search?category=…`. Only route `app/(player)/home/game/page.tsx` exists. Older `lib/prototype/domain-expansion.ts` fixtures are Preview prototypes, not current Home. |
| **DB** | Catalog/RPC category filter works (085 / five-category search). |
| **Write path** | Studio five-category submit/edit progressing separately (formal filters); not Home-specific. |
| **Read path** | Search + game Home loaders. |
| **Key files** | `lib/player-ia/home-feature-cards.ts`, `app/(player)/home/game/page.tsx`, verify scripts for Coming Soon semantics |
| **Gaps** | No `/home/audio` etc.; no per-category featured shelves. |
| **Needed before Production?** | Search-by-category may suffice initially; dedicated Homes are polish / IA completeness. |
| **Recommended next** | Clone game Home pattern per category after featured/RPC strategy is clear; keep Coming Soon until data density OK. |

---

## Community reuse verdict (explicit)

| Asset | Verdict | Notes |
|-------|---------|-------|
| Community hub UI + membership + posts | **PARTIALLY REUSABLE** | Soft-killed in IA Preview; useful for nurture, not consult. |
| Community join notifications (localStorage) | **NOT REUSABLE** for Production collab | Must be DB `user_notifications` if revived. |
| Community as consult chat | **NOT REUSABLE** | Broadcast board ≠ project-tied 1:1. |
| Usage relation table/RPC/Home cards | **REUSABLE** | Needs write + confirm. |
| Special Thanks | **REUSABLE** as-is for loop thanks; **NOT** for usage registry |
| Follow + follower notifs | **REUSABLE** for discovery/loyalty only |
| stream_policy / activity_tags schema | **PARTIALLY REUSABLE** | Schema ready; UI/write missing |
| Free DM / message header mocks | **ALREADY REMOVED** / never built as product |

---

## Staging probe notes (read-only)

| Probe | Result |
|-------|--------|
| Host | `vuqpwvjvgyxffmvpfrxo.supabase.co` |
| `project_usage_relations` | Readable; count **12** (SELECT) |
| `get_public_project_usage_relations` | 200; cross-category pairs present |
| Client write path | **Formal verification: not run.** Judged PARTIAL from migration 077 `REVOKE` + no product write UI/API. |
| `stream_policy` on public projects | Mixed seeded values (SELECT) |
| `activity_tags` (anon sample) | Empty on visible profiles |
| Community / follows / notifications tables | Exist but anon SELECT denied (expected) |
| `get_project_special_thanks` | RPC callable |

### Process incident (prior task — do not repeat)

Staging write-path の動作確認は正式には未実施。監査中に禁止された POST probe が `project_usage_relations` へ 1 回試行されたが **401** で拒否され、read-only SELECT 上 dummy UUID の relation row = **0**（row 作成なし）。危険な runtime probe script は削除済み。**以降 write probe（POST/INSERT/UPDATE/DELETE/PATCH/PUT）は実施していないし、実施しない。**

この incident を理由に usage write を IMPLEMENTED と判定しない（status は PARTIAL: migration 077 REVOKE + no product UI）。

Secrets not printed.

---

## Priority of gaps

### P0 — clear breakage of a shipped end-to-end flow

**None.**

No Production/Preview user is mid-flow in consultation or usage registration; those surfaces are not shipped. Community IA redirect is intentional deprecation, not a half-broken path.

### P1 — blocks marketplace / collab thesis if that thesis is in formal release

1. Usage relation **write + authz + project UI** (10-3)
2. **双方確認** state machine (10-4)
3. Product decision on **利用相談** vs external contact (10-1 / 10-5)
4. Studio **stream_policy** write + Search unhide (10-8)
5. Profile **activity_tags** write + creator-search facets (10-8 / 10-9)
6. In-app notifs for confirm/consult events (10-6)
7. Owner decision: community **archive vs revive** under IA (10-2)

### P2 — polish / later amplifiers

1. Per-category Homes beyond game (10-12)
2. User email notifications (10-7)
3. Usage shelf on project detail
4. Studio nav cleanup for dead community link under IA
5. ST optional badge linking to confirmed usage partners (10-11)
6. Remove or quarantine prototype domain-expansion fixtures from mental model

---

## Recommended owner decisions (no implementation in this task)

1. Is **project-tied consultation** in formal release initial version, or defer?
2. May users **self-register** usage relations, or ops/seed only through first public launch?
3. Is **旧コミュニティ** retired for IA forever, or nurture-only later?
4. Priority between **stream_policy Studio write** vs **usage registration** vs **category Homes**?

---

*Read-only audit dated 2026-08-09 (updated 2026-08-09 for POST-probe incident honesty). Staging ref `vuqpwvjvgyxffmvpfrxo`. No collaboration implementation in this task. Mutation probes forbidden going forward.*
