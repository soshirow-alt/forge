# Special Thanks density seed（Staging only）

## 目的

Special Thanks タブで **10件以上** のプレイヤーカード密度（2列 / 初期6件+展開 / avatar・handle混在）を確認する。

対象作品: Smoke A `41ff5a96-105c-42a2-87b4-787bcfeacb45`  
対象 ref: `vuqpwvjvgyxffmvpfrxo` のみ

## 既存ユーザーが足りない場合の方針（実行前整理）

### 推奨: Auth Admin API で Staging-only ユーザーを作る

| 項目 | 内容 |
|---|---|
| 手段 | `supabase.auth.admin.createUser`（service role） |
| ガード | URL ref が staging 以外 / production なら **即 abort** |
| 識別 | email `st-st-density-*@forge-st-special-thanks.local` |
| 利点 | Auth 正規経路。パスワード・confirmed を正しく作れる。rollback で `deleteUser` 可能 |
| リスク | service role 漏洩時は危険 → ローカル `.env.local` のみ。本番キーを混ぜない |
| 本番誤爆 | script が production ref を検出したら書き込み拒否 |

### 非推奨: `auth.users` へ直接 INSERT

| 項目 | 内容 |
|---|---|
| 手段 | Dashboard SQL で `auth.users` / `auth.identities` を手書き |
| 欠点 | identities・encrypted_password・制約を壊しやすい。rollback が危険 |
| 判断 | **使わない**（Admin API で足りる） |

### 既存 Staging ユーザーの再利用

- Phase A の `ST Smoke Player A`（固定 UUID）は **再利用可**
- それ以外を無断で実ユーザーに紐づけない（表示名・Xプロフィールを上書きするため）
- 足りなければ Admin API で density 専用ユーザーを追加（推奨）

## 実行（オーナー GO 後）

前提: Staging に更新版 `049` 適用済み

```bash
# 計画のみ（書き込みなし）
node scripts/staging-only/special-thanks-density-seed.mjs

# Staging 書き込み
node scripts/staging-only/special-thanks-density-seed.mjs --execute

# 巻き戻し（計画）
node scripts/staging-only/special-thanks-density-rollback.mjs

# 巻き戻し（実行）
node scripts/staging-only/special-thanks-density-rollback.mjs --execute
```

## seed 内容（最低限）

- watchers: 12
- early_players: 12
- update_contributors: 8（採用件数 1 / 3 / 5 を混在）
- version: `0.1` / `0.1.1` / `0.2`
- avatar あり/なし、handle あり/なし、長い display_name を混在

## 禁止

- production ref への実行
- main merge / 本番 deploy / 本番 049
- 047 / OGP / backfill / restore との混在
