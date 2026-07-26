# Player IA Staging seed（Staging 専用）

| 項目 | 値 |
|---|---|
| Target | `vuqpwvjvgyxffmvpfrxo` only |
| Seed SQL | `scripts/staging-only/player-ia-staging-seed.sql` |
| Cleanup SQL | `scripts/staging-only/player-ia-staging-seed-cleanup.sql` |
| Schema prereq | `supabase/migrations/076`–`081` |
| Tag | `forge-ia-seed-v1` |
| Title prefix | `[IA Seed]` |

**Production (`bpnisgzxuwdxelhnduuf`) では実行しない。**

このファイルは `supabase/migrations/` に置かない（schema migration と一緒に自動適用されない）。

## 件数（1 回分）

| 種類 | 件数 | 備考 |
|---|---:|---|
| projects | 5 | 各カテゴリ 1（game/audio/asset/dev-tool/service-app） |
| project_usage_relations | 2 | 「使用した」 |
| platform_announcements | 3 | published 2 + draft 1 |
| project_guest_feedback | 1 | 公開集計対象 |
| developer_profiles touch | 1 | 共有 Staging user（cleanup で非 revert） |

## 適用

1. Staging Dashboard SQL Editor（ref 確認）
2. `076`→`081` 適用済みであること
3. `player-ia-staging-seed.sql` 全文 Run
4. 再実行可（`ON CONFLICT` upsert）

## 削除

`player-ia-staging-seed-cleanup.sql` 全文 Run。

代替特定:

```sql
SELECT id, title FROM public.projects
WHERE 'forge-ia-seed-v1' = ANY (tags) OR title LIKE '[IA Seed]%';
```

## Runbook

正本: `docs/player-ia-staging-apply-runbook.md`
