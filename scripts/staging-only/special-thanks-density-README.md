# Special Thanks density seed（Staging only）

## 目的

Special Thanks タブで **10件以上** のプレイヤーカード密度（2列 / 初期6件+展開 / avatar・handle混在）を確認する。

対象作品: Smoke A `41ff5a96-105c-42a2-87b4-787bcfeacb45`  
対象 ref: `vuqpwvjvgyxffmvpfrxo` のみ

## 安全性

- 既存 **Player A / Owner auth を再利用・更新しない**
- Smoke A の title / thumbnail / playable_version / owner は変更しない
- density 専用 email: `st-st-density-01@…`〜`12@forge-st-special-thanks.local`
- 全 density 行は固定 UUID（`bbbbbbbb-bbbb-4ccc-…`）または density email で追跡
- rollback で完全削除できること（verify 付き）
- production ref なら即 abort
- default は dry-run（`--execute` 必須）

## 実行（オーナー GO 後）

前提: Staging に更新版 `049` 適用済み

```bash
node scripts/staging-only/special-thanks-density-seed.mjs
node scripts/staging-only/special-thanks-density-seed.mjs --execute

node scripts/staging-only/special-thanks-density-rollback.mjs
node scripts/staging-only/special-thanks-density-rollback.mjs --execute
```

## rollback 後の検証 SQL（Dashboard）

```sql
-- density auth: Admin API 側。SQL では identities/email で確認可
select id, email from auth.users
where email like 'st-st-density-%@forge-st-special-thanks.local';
-- expect 0

select count(*) from public.voice_adoptions
where matcher_run_id = 'bbbbbbbb-bbbb-4ccc-8ddd-000000000021';
-- expect 0

select count(*) from public.project_voice_responses
where id::text like 'bbbbbbbb-bbbb-4ccc-8ee%';
-- expect 0

select count(*) from public.project_version_prompts
where id in (
  'bbbbbbbb-bbbb-4ccc-8ddd-000000000001',
  'bbbbbbbb-bbbb-4ccc-8ddd-000000000002',
  'bbbbbbbb-bbbb-4ccc-8ddd-000000000003'
);
-- expect 0

select count(*) from public.project_devlogs
where id in (
  'bbbbbbbb-bbbb-4ccc-8ddd-000000000011',
  'bbbbbbbb-bbbb-4ccc-8ddd-000000000012'
);
-- expect 0

select count(*) from public.voice_adoption_matcher_runs
where id = 'bbbbbbbb-bbbb-4ccc-8ddd-000000000021';
-- expect 0

select id, title, thumbnail_url, playable_version, owner_id, release_status, visibility
from public.projects
where id = '41ff5a96-105c-42a2-87b4-787bcfeacb45';
-- expect unchanged
```

## 禁止

- production ref への実行
- main merge / 本番 deploy / 本番 049
- 047 / OGP / backfill / restore との混在
