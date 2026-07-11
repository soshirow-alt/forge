# Staging-only: home discovery shelf seed

**Target:** `vuqpwvjvgyxffmvpfrxo` only. Never apply to Production.

## Purpose

Add public works C–F so Preview `/home` can show shelves after hero exclusion
(Smoke A/B alone both become heroes → all shelves hidden).

## Seed

| ID | Title | Role |
|---|---|---|
| `cccccccc-cccc-4ccc-8ddd-000000000001` | Home Seed C (newest-only) | newest head |
| `cccccccc-cccc-4ccc-8ddd-000000000002` | Home Seed D (updated) | updated head (+ non-initial devlog) |
| `cccccccc-cccc-4ccc-8ddd-000000000003` | Home Seed E (trending) | trending head (+ feedback/watch 7d) |
| `cccccccc-cccc-4ccc-8ddd-000000000004` | Home Seed F (shelf filler) | secondary update + mild engagement |

Does **not** mutate Smoke A / B project fields.

Marker: `[home-discovery-shelf-seed]`

Auth engager (created if missing): `home-discovery-engager@forge-st-home-discovery.local`

## Apply

`service_role` has **SELECT-only** on `projects` (Staging safety). Prefer Dashboard SQL:

1. Open Staging SQL Editor (`vuqpwvjvgyxffmvpfrxo`)
2. Paste / run `scripts/staging-only/home-discovery-shelf-seed.sql` (full file)
3. Optional check: `SELECT section, rank, title FROM public.get_home_discovery_feed() ORDER BY section, rank;`

Node helper (engagement-only after SQL, or dry-run plan):

```bash
node scripts/staging-only/home-discovery-shelf-seed.mjs
```

## Rollback

SQL comments at bottom of `home-discovery-shelf-seed.sql`, or:

```bash
node scripts/staging-only/home-discovery-shelf-seed.mjs --rollback --execute
```

(Rollback via node deletes engagement/devlogs/projects **if** service_role has DELETE on those tables; projects DELETE may also be denied — use SQL rollback in that case.)

## Note on `first_published_at`

Insert trigger sets `first_published_at = now()` for public rows. C–F therefore show
「今日公開」. Older 「○日前公開」 remains visible on Smoke A/B.
