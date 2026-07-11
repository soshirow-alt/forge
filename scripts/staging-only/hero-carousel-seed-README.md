# Hero Carousel Seed — Staging Only

Verification seed for the hero carousel feature: 6 projects (P1–P6), 2 seed developers (DevB, DevC), and 10 players with varied engagement across play sessions, feedback, watches, bookmarks, and developer follows.

## Guard

Aborts unless `NEXT_PUBLIC_SUPABASE_URL` points to staging ref `vuqpwvjvgyxffmvpfrxo`.
Never writes to production ref `bpnisgzxuwdxelhnduuf`.

## Files

| File | Purpose |
|---|---|
| `hero-carousel-seed.mjs` | Create/upsert all seed data |
| `hero-carousel-seed-cleanup.mjs` | Delete all seed data (safe order; targets derived from live DB) |
| `hero-carousel-service-role-grants.sql` | Minimal Staging GRANTs for service_role (owner applies) |

## Prerequisite (Staging grants)

If `--execute` fails with `permission denied for table …`, apply once on **Staging** Dashboard SQL:

`scripts/staging-only/hero-carousel-service-role-grants.sql`

Do **not** apply on production. Same pattern as `special-thanks-density-service-role-grants.sql`.

## Usage

```sh
# Dry-run (print plan, no writes)
node scripts/staging-only/hero-carousel-seed.mjs

# Execute seed
node scripts/staging-only/hero-carousel-seed.mjs --execute

# Dry-run cleanup (reads Staging and counts real delete targets)
node scripts/staging-only/hero-carousel-seed-cleanup.mjs

# Execute cleanup
node scripts/staging-only/hero-carousel-seed-cleanup.mjs --execute
```

## What it seeds

- **2 developers** (`hc-dev-b@…`, `hc-dev-c@…`) + `developer_profiles`
- **10 players** (`hc-u01@…` – `hc-u10@…`) with display names HC Player 01–10
- **6 projects** (P1–P6): public, in_development, varied genres / thumbnail assets
- **5 devlogs** across P1(×2), P2, P4, P5 — all `is_initial_publish: false`
- **25 play sessions**, **12 feedback rows**, **16 watches**, **6 bookmarks**, **2 developer follows**

### Bookmark pairs (canonical — 6 total)

| User | Projects |
|---|---|
| U05 | P5 |
| U08 | P1, P3, P6 |
| U10 | P3, P6 |

U02 does **not** bookmark P3 (intentionally omitted so P3 bookmarks = 2).

All UUIDs are fixed under namespace `dddddddd-dddd-4ddd-8ddd-*`. Marker: `forge-st-hero-carousel-v1`. Re-run is idempotent.

## Cleanup derivation

Cleanup does **not** use a stale fixed engagement-ID list. Dry-run / execute discover:

1. Auth users: `@forge-st-hero-carousel.local` **or** fixed UUID namespace **or** `user_metadata.forge_seed_marker`
2. Projects: fixed P1–P6 UUIDs **or** tags contain marker **or** description starts with `[hero-carousel-seed]`
3. Child rows: related to those seed `project_id`s (follows: seed user as follower or developer)

Never deletes Smoke A/B, owner, or public-wide tables.

## Protected IDs (never deleted)

- Smoke A: `41ff5a96-105c-42a2-87b4-787bcfeacb45`
- Smoke B: `aa910df8-afdf-4cbb-a00e-42a9518afc52`
- Owner: `4bdc4a2f-2a39-4599-a14c-91303310ef56`

## After seed `--execute`

Script automatically:
1. Re-queries DB counts for P1–P6 and compares to expected totals (exits 1 on mismatch)
2. Calls `get_home_discovery_feed` via anon key and prints hero selection
3. Confirms Smoke A/B still present

## first_published_at note

Staging trigger keeps `first_published_at` immutable after first set, so P1–P6 may share the same timestamp. Trending / updated / newest shelves still populate; strict newest ordering among seed titles alone is not guaranteed.
