# Hero Carousel Seed 窶・Staging Only

Verification seed for the hero carousel feature: 6 projects (P1窶撤6), 2 seed developers (DevB, DevC), and 10 players with varied engagement across play sessions, feedback, watches, bookmarks, and developer follows.

## Guard

Aborts unless `NEXT_PUBLIC_SUPABASE_URL` points to staging ref `vuqpwvjvgyxffmvpfrxo`.
Never writes to production ref `bpnisgzxuwdxelhnduuf`.

## Files

| File | Purpose |
|---|---|
| `hero-carousel-seed.mjs` | Create/upsert all seed data |
| `hero-carousel-seed-cleanup.mjs` | Delete all seed data (safe order) |

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

# Dry-run cleanup
node scripts/staging-only/hero-carousel-seed-cleanup.mjs

# Execute cleanup
node scripts/staging-only/hero-carousel-seed-cleanup.mjs --execute
```

## What it seeds

- **2 developers** (`hc-dev-b@窶ｦ`, `hc-dev-c@窶ｦ`) + `developer_profiles`
- **10 players** (`hc-u01@窶ｦ` 窶・`hc-u10@窶ｦ`) with display names HC Player 01窶・0
- **6 projects** (P1窶撤6): public, in_development, varied genres, PNG thumbnails uploaded to `project-thumbnails/hero-carousel-seed/{pId}/{n}.png`
- **5 devlogs** across P1(ﾃ・), P2, P4, P5 窶・all `is_initial_publish: false`
- **14 play sessions**, **6 feedback rows**, **7 watches**, **3 bookmarks**, **2 developer follows**

All UUIDs are fixed under namespace `dddddddd-dddd-4ddd-8ddd-*`. Re-run is idempotent.

## Protected IDs (never deleted)

- Smoke A: `41ff5a96-105c-42a2-87b4-787bcfeacb45`
- Smoke B: `aa910df8-afdf-4cbb-a00e-42a9518afc52`
- Owner: `4bdc4a2f-2a39-4599-a14c-91303310ef56`

## After `--execute`

Script automatically:
1. Re-queries DB counts for P1窶撤6 and compares to expected totals (exits 1 on mismatch)
2. Calls `get_home_discovery_feed` via anon key and prints hero selection
3. Confirms Smoke A/B still present

