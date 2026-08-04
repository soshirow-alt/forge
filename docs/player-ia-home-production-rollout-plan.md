# Player IA Home v0 — Production rollout plan

**Status:** Planning only (this document does not authorize deploy).  
**Plan base (Preview tip):** `5ed7769adf23324326285169416458469bd35bfc`  
**`origin/main` at plan authoring:** `7b570b3b00917be0d97c74a859e659f8b3c4b41c`  
**Ahead/behind:** `origin/main...origin/preview/landing-01` = `0	66` (Preview **66** commits ahead; main not ahead).  
**Preview URL:** https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app  
**Production URL:** https://forge-flame-gamma.vercel.app  
**Staging ref:** `vuqpwvjvgyxffmvpfrxo`  
**Production ref:** `bpnisgzxuwdxelhnduuf`

Cursor/Codex **must not** apply Production/Staging DB writes, merge to main, or Production-deploy as part of *this* planning task. Owner applies SQL in Dashboard; a future explicit「本番反映して」task executes code rollout.

---

## 1. Scope

### In scope (Production product)

Player IA Home v0 as accepted on Preview:

1. フィードバックが集まっている作品  
2. Forgeでできること（CTA）  
3. 最近アップデートされた作品  
4. Forgeでつながった作品  
5. Forgeからのお知らせ  
6. 新着作品  

CTA targets: `/search`, `/studio/submit`, `/search?usable_for_creation=1`.

### Out of scope (this plan)

- Running Production deploy / main merge in this planning commit  
- Moving Staging seed / beautify / `ia-seed-*` announcements / staging-only images into Production data  
- Renaming Preview announcement slugs (`ia-seed-*`) — **not a Production blocker** (Production uses its own published rows only)

---

## 2. Current state

| Surface | State |
|---|---|
| Preview `/home` | Player IA Home — acceptance **PASS** |
| Production `/home` | Legacy `DiscoveryHomePage` only (`origin/main` `app/(player)/home/page.tsx`) |
| Production `/api/discovery/player-ia-home` | **404** by design (`shouldServeFutureDiscoveryHome` → false when `VERCEL_ENV=production`) |
| Migrations 076–083 | Present on Preview only; **absent on `origin/main` tree** |
| Tracked Staging artifacts on Preview | `scripts/staging-only/**`, `public/images/staging-only/player-ia/**` (24 images) — **must not land on Production main artifact** |
| Explore prototypes on Preview | Large `app/(player)/explore/prototype/**`, `components/explore-prototype/**`, `public/images/explore-prototype/**` — exclude from Production Home release |

---

## 3. Go/no-go prerequisites

All must be true before Owner starts Production execution:

1. Preview tip still contains accepted Home behavior (or Owner re-accepts after newer commits).  
2. Owner has run **Production readiness** SQL (`scripts/production-readiness/audit-player-ia-home-prod-readiness.sql`) on ref `bpnisgzxuwdxelhnduuf` and recorded counts.  
3. Owner decision on soft-launch if FB / updates / usage / announcements candidates are near-zero (see §14).  
4. Release branch built with **include/exclude matrix** (§5) — no staging-only images/SQL in the commit that will become Production.  
5. Codex PASS on the release implementation task (future task; not this plan-only commit).  
6. Explicit Owner「本番反映して」(or equivalent) for code; SQL remains Owner-manual.

**Stop if:** wrong Supabase project; readiness SQL fails; release branch contains `public/images/staging-only/**` or seed SQL; Production gate would enable Home before migrations succeed.

---

## 4. Production data readiness

### Method

Safe read-only audit for Owner SQL Editor:

`scripts/production-readiness/audit-player-ia-home-prod-readiness.sql`

- SELECT / presence checks only  
- No DDL, no function create, no temp schema pollution that writes permanently  
- If `projects.category` is absent, skip the category breakdown query noted in-file  

**This planning task did not connect to Production DB** (no credential display / no agent Production session). Treat readiness numbers as **Owner-filled** before go.

### Expected interpretation

| Signal | Implication |
|---|---|
| `approx_shelf_candidates_effective_window` = 0 | FB shelf hidden (`items.length === 0` → section `return null`) — Home still loads; Features CTA remains |
| `effective_window_days` = 90 | 083-equivalent fallback: fewer than 4 qualifying projects in 30d |
| `object_presence.has_usage_table` = false | Expected pre-077; NOTICE shows `usage_published_used_count=NOT_APPLIED` |
| announcements NOTICE `NOT_APPLIED` / published 0 | Announcements section hidden until 078 + real published rows |
| newest / updates low | Soft-launch OK if Owner accepts sparse Home |
| `newest_shelf_candidates` | Equals public project count (083 uses all public; `coalesce(first_published_at, created_at)`) |
| `newest_data_quality.public_with_null_first_published_at` | Data-quality only — does **not** mean newest shelf is empty |

**Forbidden:** copying Staging seed, beautify, or `ia-seed-*` rows into Production to “fill” shelves.

### Empty-shelf UI (code)

`components/player-ia/player-ia-home-page.tsx`: each data section returns `null` when `items.length === 0`. `FeaturesSection` always renders. API fetch error shows dashed empty state — not a crash.

---

## 5. Include / exclude matrix

Classification of `origin/main...origin/preview/landing-01` (~199 paths).

### INCLUDE — must ship for Home (+ gated search chrome)

**Core Home**

- `app/(player)/home/page.tsx`  
- `components/player-ia/player-ia-home-page.tsx`  
- `lib/supabase/player-ia-home-db.ts`  
- `lib/player-ia/home-shelf-selection.ts`  
- `lib/player-ia/format.ts`  
- `app/api/discovery/player-ia-home/route.ts`  
- `lib/player-ia-mode.ts`  
- `lib/production-mode.ts` (**gate change in implementation task**)  
- `lib/forge-deployment-context.tsx`, `components/app-providers.tsx`, `components/player-shell.tsx`  

**Shared UI / libs**

- `components/project-thumbnail.tsx`, `components/discovery-game-thumbnail.tsx`, `components/generated-thumbnail-poster.tsx`  
- `lib/public-project-thumbnail.ts`, `lib/project-thumbnails.ts`, `lib/safe-http-thumbnail.ts`, `lib/thumbnail-bitmap.ts`  
- `lib/project-categories.ts`, `lib/game-detail-tabs.ts`  
- `lib/game-detail-v0-mock-data.ts` (runtime needs `gameDetailHref` only)  
- `lib/supabase/anon-client.ts`  

**Announcements (linked from Home)**

- `app/(player)/announcements/**`  
- `components/player-ia/player-ia-announcements-page.tsx`  
- `components/player-ia/player-ia-announcement-detail-page.tsx`  
- `app/api/announcements/**`  

**Search CTA surface + global search chrome (same Preview gate — required with player-shell)**

- `app/(player)/search/page.tsx`  
- `app/(player)/search/global/page.tsx`  
- `components/player-ia/player-ia-search-page.tsx`  
- `components/player-ia/player-ia-category-tabs.tsx`  
- `components/player-ia/player-ia-project-card.tsx`  
- `components/player-ia/player-ia-global-search-input.tsx`  
- `components/player-ia/player-ia-global-search-page.tsx`  
- `lib/forge-shell-header.ts`  
- `app/api/search/catalog/route.ts`  
- `app/api/search/global/route.ts`  
- `app/api/search/suggest/route.ts`  
- `lib/supabase/public-catalog-db.ts`  
- Any additional modules imported by the above (verify with `main`-based `tsc`/`build` on the release branch — **dependency closure gate**)  

**If Owner chooses NOT to ship global search in v0:** do **not** path-checkout Preview `components/player-shell.tsx` as-is. Keep main’s legacy shell/search chrome, and only mount Player IA on `/home` + home API. Document that fork explicitly in the release PR.

**Migrations (Owner Dashboard, Production)**

- `076_player_ia_categories_attributes.sql`  
- `077_project_usage_relations.sql`  
- `078_platform_announcements.sql`  
- `079_global_public_search.sql` (required once search chrome ships with the same gate)  
- `080_player_ia_home_feed.sql`  
- `083_player_ia_home_v0_shelves.sql`  

**Soft INCLUDE (product consistency; not hard for Home RPC reads)**

- `081_guest_feedback_public_reenable.sql`  
- `082_guest_feedback_service_role_grants.sql`  
- Related guest route tweaks under `app/api/projects/[projectId]/guest-*` if shipping 081/082  

### EXCLUDE — never Production runtime / never Production data

- `scripts/staging-only/**` (seed, beautify, audit, cleanup, auth-seed, PGlite gate, Staging verify)  
- `public/images/staging-only/**`  
- Staging announcement content / `ia-seed-*` slug rows  
- `.agent/tasks/**`, `.agent/reviews/**`, `.agent/runtime/**` contents  
- `.env*`  
- `docs/player-ia-staging-apply-runbook.md` as an *execution* path for Production (keep in repo as Staging history only)  

### EXCLUDE from Production Home release commit (Preview-only UX)

- `app/(player)/explore/prototype/**`  
- `app/prototype/**`  
- `components/explore-prototype/**`  
- `components/home-prototype-router.tsx`  
- `lib/prototype/**`  
- `public/images/explore-prototype/**`  
- Category-submit prototype-only components not required by formal `/studio/submit`  

### TEST / DEV-ONLY — keep in repository, not required for Production runtime

- `scripts/verify-home-discovery-selection.ts`  
- `scripts/verify-player-ia-home-display.ts`  
- `scripts/verify-preview-branch-alias.mjs`  
- `scripts/verify-supabase-sql-safety.mjs`  
- `scripts/verify-production-auth-guards.ts`  
- `scripts/agents/**` + Codex review docs (dev workflow)  
- `scripts/production-readiness/audit-player-ia-home-prod-readiness.sql` (Owner read-only)  
- `scripts/staging-only/local-sql-gate-player-ia-home.mjs` (Staging/local gate; never run against Production writes)  

### 要確認 (Owner)

| Item | Question |
|---|---|
| Studio submit category UI diffs | Ship with Home or defer? Prefer ship if `/studio/submit` CTA is in Home Features |
| Global search (`/search/global`, suggest APIs, 079) | Include with gate flip — **recommended yes** so shell search matches Preview |
| 081/082 | Include if Production guest public cards must match Preview |
| Post-release Preview sync | See §7 — **do not FF-delete staging-only** |

---

## 6. Migration dependency

### Preview-only migrations vs main

| # | File | On main? | Home need |
|---|---|---|---|
| 076 | categories / `usable_for_creation` | No | **Hard** |
| 077 | `project_usage_relations` + `get_public_project_usage_relations(uuid,integer)` | No | **Hard** (usage shelf) |
| 078 | `platform_announcements` + public RPCs (published only) | No | **Hard** (announcements shelf) |
| 079 | global public search | No | **Hard if search chrome ships** |
| 080 | home feed RPCs + category catalog RPC | No | **Hard** (083 drops/recreates 080 shapes) |
| 081 | guest feedback public reenable | No | Soft |
| 082 | guest service_role grants | No | Soft (writes) |
| 083 | FB gathering + meaningful/newest OUT upgrades | No | **Hard** |

**Owner Production apply order (minimum Home + search):**

`076 → 077 → 078 → 079 → 080 → 083`  
then optional `081 → 082`.

### 083 RPC summary

| Function | Action | Grants | Security |
|---|---|---|---|
| `get_home_feedback_gathering_projects(integer)` | CREATE | `anon, authenticated, service_role` | DEFINER, `search_path=public` |
| `get_home_meaningful_updates(integer)` | **DROP** then CREATE (OUT shape +label/summary/version) | same | DEFINER |
| `get_home_newest_projects(integer,text)` | **DROP** then CREATE (+description) | same | DEFINER |

Filters (083 / 078): `projects.visibility = 'public'`; announcements `status = 'published'` only; guest rows require `include_in_public_aggregate` + visible moderation.

**Legacy Production Home** uses older discovery RPCs (052+). **083 does not alter those.** DB-first is safe for current Production UI.

`get_home_review_highlights` (080) left untouched by 083 — not used by Home v0 UI.

---

## 7. Release strategy

### Diff facts

- **66** commits; **~199** files  
- Early commits are Explore **prototypes**  
- Mid/late commits are Player IA + migrations + Staging tooling + Codex agents  
- **44** staging-only paths + **48** prototype-ish paths tracked on Preview  

### Options

| Option | Idea | Staging-only risk | Dependency risk | Resync | Rollback |
|---|---|---|---|---|---|
| **1** Merge Preview → main then delete excludes | Fast | High unless delete commit is perfect before deploy | Low (full history) | FF preview→main **destroys** staging-only on Preview | Revert merge hard |
| **2** Cherry-pick “safe” commits onto main | Selective | Medium (easy to miss exclude files inside commits) | **High** across 66 commits | Medium | Per-commit |
| **3** Main-based release branch + path checkout of INCLUDE set | Curated tree | **Lowest** if checkout list omits staging-only/prototype | Medium (must not miss imports) | Merge main→preview (preserve Preview-only) | Revert release commit(s) |

### Recommendation: **案3**

**Do not** merge all 66 commits blindly. **Do not** ad-hoc cherry-pick without a file allowlist.

**Procedure (execution task):**

1. From clean clone/worktree dedicated to release (do **not** disturb `C:\Forge\forge-app` shared common dir):  
   `git fetch origin`  
   `git checkout -b release/player-ia-home-v0 origin/main`  
2. Path-checkout INCLUDE files + migrations 076–083 (+ soft 081/082 if decided) from  
   `origin/preview/landing-01` (`5ed7769…` or newer accepted tip).  
3. Explicitly verify **absent**:  
   `git ls-files public/images/staging-only scripts/staging-only` → empty on release branch.  
4. Implement Production gate change on this branch (§8).  
5. Full verify + Codex + Owner GO → merge release branch to `main` → Production deploy.  
6. **Preview resync:** `git checkout preview/landing-01 && git merge origin/main`  
   (**not** `reset --hard` / FF that drops staging-only). Resolve conflicts keeping Staging tooling.

### Why not 案1

Tracked `public/images/staging-only/**` would enter `main` history and risk Vercel Production static hosting unless deleted before deploy. Prototype routes also pollute Production surface area.

---

## 8. Exact execution order

### A. Planning (this document) — done when committed to Preview

### B. Owner preflight (before any Production write)

1. Confirm SQL Editor project = Production `bpnisgzxuwdxelhnduuf`.  
2. Run `scripts/production-readiness/audit-player-ia-home-prod-readiness.sql` (read-only).  
3. Record counts; decide soft-launch (§14).  

### C. Build release branch (Cursor, future task)

1. Base: `origin/main` SHA recorded in release notes.  
2. Path-include matrix §5; gate implementation §F below.  
3. `verify:*` + Codex PASS.  
4. Owner reviews staged file list (no staging-only).  

### D. DB-first on Production (Owner)

1. Preflight again (optional short RPC presence check).  
2. Apply migrations in order **076→077→078→079→080→083** (full file each).  
3. Optional 081→082.  
4. Post-migration audit (§9).  
5. **Stop on any failure** — do not Production-deploy Home-enabled code.  

### E. Code to Production (Vercel env is deploy-scoped)

Vercel environment variables apply to **new deployments**, not retroactively to an already-running Production deployment ([Vercel docs](https://vercel.com/docs/environment-variables/managing-environment-variables)). Therefore “set flag after deploy” or “unset flag for instant rollback without redeploy” is **invalid**.

**Correct order:**

1. Merge release → `main` + push (code contains flag-aware gate; default off when unset).  
2. Set `FORGE_PLAYER_IA_HOME_V0=1` on Vercel **Production** env.  
3. Trigger a **new** Production deploy (or redeploy) so the snapshot includes the flag.  
4. Confirm deploy SHA.  
5. Smoke §11.  
6. Owner visual check (Cursor does not screenshot).  

**Flag-off-first variant (also valid):** deploy once with flag unset (legacy Home) after DB ready → set flag → **redeploy** to enable.

### F. API / Home gate change (implementation detail — do not apply in this planning commit)

**Current:** `lib/production-mode.ts` `shouldServeFutureDiscoveryHome`:

```ts
if (isVercelProductionDeployment()) { // VERCEL_ENV === "production"
  return false;
}
```

**Recommended for rollout:** replace hard-stop with **server env flag** baked into each deployment:

- Name: `FORGE_PLAYER_IA_HOME_V0` (server-only)  
- Unset / not `1` on a Production deployment → legacy Home + API 404  
- `FORGE_PLAYER_IA_HOME_V0=1` on the deployment that is promoted → Player IA Home  
- Preview/local: keep current true behavior  
- **Enable:** env=`1` + **new Production deploy**  
- **Rollback:** promote/rollback to the previous known-good Production deployment (instant). Optionally set env unset and redeploy for a durable flag-off tip.  

**Files to touch in implementation task:** `lib/production-mode.ts` (+ `scripts/verify-production-auth-guards.ts` expectations).  

**Not recommended:** assuming env unset alone flips a live deployment without redeploy/promote.

### DB-first vs code-first

| Order | Verdict |
|---|---|
| **1. DB → audit → code merge → env=`1` → new Production deploy → smoke** | **Recommended** |
| 2. Enable Home on a live deploy before DB | Empty shelves / RPC miss — avoid |
| 3. Code merge with env unset → DB → env=`1` → **redeploy** | Valid equivalent; keeps legacy until second deploy |

**Why (1):** Legacy Discovery Home ignores 076–083 RPCs. Additive schema. 083 DROP only affects Preview-introduced 080 signatures that **do not exist on Production yet**. Env alone does not mutate an old deployment — always pair flag changes with deploy/promote.

---

## 9. Owner SQL handoff

### Identity

1. Dashboard project name + ref **`bpnisgzxuwdxelhnduuf`**  
2. Stop if Staging `vuqpwvjvgyxffmvpfrxo`  

### Preflight

- File: `scripts/production-readiness/audit-player-ia-home-prod-readiness.sql`  
- Expect: public project counts; RPC presence mostly false pre-apply  

### Apply notes (076 data change)

076 **does** mutate existing Production rows (category backfill to `game`). This is intentional catalog defaulting — **not** a Staging seed copy — but it is still a data UPDATE. Record pre/post counts in the handoff checklist (§12 / Owner decisions).

1. `supabase/migrations/076_player_ia_categories_attributes.sql`  
2. `077_project_usage_relations.sql`  
3. `078_platform_announcements.sql`  
4. `079_global_public_search.sql`  
5. `080_player_ia_home_feed.sql`  
6. `083_player_ia_home_v0_shelves.sql`  
7. Optional: `081`, `082`  

### Success checks (post)

- `to_regprocedure` true for:  
  - `get_home_feedback_gathering_projects(integer)`  
  - `get_home_meaningful_updates(integer)`  
  - `get_home_newest_projects(integer,text)`  
  - `get_public_project_usage_relations(uuid,integer)`  
  - `get_public_platform_announcements(integer,integer)`  
- Grants: EXECUTE for `anon, authenticated` on above  
- Announcement RPC returns only `status='published'`  
- Re-run readiness SQL; RPC presence all true  
- Spot-call RPCs as anon (Dashboard or Preview-style read client) — no draft/private titles  

### Failure

- Stop apply sequence  
- Do not enable `FORGE_PLAYER_IA_HOME_V0`  
- Do not Production-deploy Home gate  
- Cursor does not “fix forward” with partial migrations  

### Cursor/Codex

**Never** run these migrations. Owner Dashboard only.

---

## 10. Verification (release implementation task)

Before merge to main:

1. `npm run verify:player-ia-home-sql-gate` (local PGlite; Staging SQL fixtures — not Production write)  
2. `npm run verify:supabase-sql-safety`  
3. `npm run verify:home-discovery-selection`  
4. `npx tsc --noEmit`  
5. eslint on touched TS/TSX  
6. `npm run build`  
7. `npm run verify:codex-review-selftest`  
8. `npm run verify:codex-available`  
9. `npm run verify:preview-branch-alias` (Preview still healthy)  
10. `git diff --check`  
11. `git ls-files public/images/staging-only scripts/staging-only` empty on release branch  

---

## 11. Production smoke (after flag on)

| Check | Expect |
|---|---|
| `/` | LP / existing Production entry — no staging-only URLs |
| `/home` | Player IA 6 sections order (empty sections omitted) |
| `/api/discovery/player-ia-home` | **200** `{ ok: true, home }` |
| `/search`, `/search?usable_for_creation=1` | 200 |
| `/studio/submit` | 200 or login 307 |
| `/announcements`, detail | published only |
| Usage L/R links | 200; direction consumer→used; label「使用している」 |
| Feedback `?tab=voices` | 200 |
| Guest / authenticated / Studio | no private/draft leakage |
| Internal seed strings in Home payload | 0 |
| `staging-only` URL substring | 0 |
| U+FFFD in Home titles | 0 |
| Preview alias API | still 200 |
| Deploy SHA | matches intended `main` |

Owner performs visual confirmation. Cursor: HTTP/JSON only.

---

## 12. Rollback

### Code / flag (preferred unit)

1. **Immediate:** Vercel Production → promote/rollback to the previous known-good deployment (legacy Home). This does **not** require waiting on env edits.  
2. **Durable tip cleanup:** set `FORGE_PLAYER_IA_HOME_V0` unset on Production env, then redeploy/promote a flag-off build if the branch tip should stay off.  
3. `main` revert of release commit only if a flag-less hard enable was used.

### DB

- 077–083 tables/RPCs are largely **additive** for Production (new objects).  
- **076 is not data-neutral:** it `UPDATE`s existing `projects` rows where `category IS NULL OR btrim(category) = ''` to `'game'`, then sets NOT NULL + CHECK.  
  - **Impact:** every unclassified project becomes `game` (usually all Production rows pre-076).  
  - **Pre-count (Owner):**  
    `SELECT count(*) FROM public.projects WHERE category IS NULL OR btrim(coalesce(category,'')) = '';`  
    (errors if column absent — run after ADD COLUMN in same apply, or count all projects before 076 as “will become game”).  
  - **Post-check:**  
    `SELECT category, count(*) FROM public.projects GROUP BY 1 ORDER BY 2 DESC;`  
    expect no NULL; most/all `game` until authors edit.  
  - **Rollback:** leave 076 in place after code rollback (legacy Home ignores `category`). Do **not** improvise DROP COLUMN on Production.  
- **No Staging seed / announcement / usage seed writes** in this rollout.  
- Only if a future Owner-approved rollback SQL exists would RPC DROP be considered — default is **DB object rollback not required**; acknowledge 076 backfill remains.

---

## 13. Known residuals

1. Preview announcement slugs `ia-seed-*` — Preview-only; **not** Production blocker.  
2. Production Home may be sparse until real usage relations / announcements / FB density exist.  
3. `lib/game-detail-v0-mock-data.ts` naming debt — extract `gameDetailHref` later.  
4. Preview still carries staging-only + prototypes — keep on Preview via merge-resync, not FF wipe.  
5. Plan authoring did not execute Production readiness SELECTs — Owner must fill numbers.

---

## 14. Owner decisions

1. Soft-launch with sparse shelves vs wait for more public FB/usage/announcements?  
2. Include 081/082 in first Production SQL batch?  
3. Gate mechanism: env flag + **redeploy/promote** (recommended) vs hard enable in a single deploy?  
   Note: Vercel env changes do not hot-swap an existing deployment.  
4. Studio category-submit UI: include in first release branch?  
5. Confirm Preview resync = **merge main→preview** (preserve staging-only), superseding naive FF for this line of work?  
6. Accept 076 category backfill (`NULL/'' → game` on existing projects) as Production data mutation before apply?  

---

## 15. Completion checklist

### This planning task

- [x] Diff audited (66 commits / ~199 files)  
- [x] Include/exclude matrix written  
- [x] Migration order 076→083 defined  
- [x] DB-first + flag enable recommended  
- [x] staging-only exclusion procedure (案3 path checkout)  
- [x] Readiness SQL path added  
- [x] Rollback = flag/deploy first; DB stay  
- [ ] Codex PASS + plan commit on Preview (process)  

### Future execution task (not now)

- [ ] Owner readiness SQL results recorded  
- [ ] Release branch without staging-only  
- [ ] Owner migrations applied  
- [ ] Post-migration audit PASS  
- [ ] Production deploy + flag on  
- [ ] Smoke + Owner visual  
- [ ] Preview merge-resync  

---

## Appendix A — Command cheatsheet (read-only / verify)

```powershell
git rev-parse origin/main
git rev-parse origin/preview/landing-01
git rev-list --left-right --count origin/main...origin/preview/landing-01
git diff --name-status origin/main...origin/preview/landing-01
npm run verify:home-discovery-selection
npm run verify:supabase-sql-safety
npm run verify:player-ia-home-sql-gate
npm run verify:preview-branch-alias
```

## Appendix B — Document / SQL paths

| Path | Role |
|---|---|
| `docs/player-ia-home-production-rollout-plan.md` | This plan (canonical) |
| `scripts/production-readiness/audit-player-ia-home-prod-readiness.sql` | Owner Production read-only readiness |
| `supabase/migrations/076_*.sql` … `083_*.sql` | Owner apply on Production |
| `docs/player-ia-migrations-076-081-audit.md` | Static migration audit (background) |
| `docs/player-ia-staging-apply-runbook.md` | **Staging** only — do not use as Production seed guide |
