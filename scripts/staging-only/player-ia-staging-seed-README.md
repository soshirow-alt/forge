# Player IA Staging seed（Staging 専用・Preview 評価用）

| 項目 | 値 |
|---|---|
| Target | `vuqpwvjvgyxffmvpfrxo` only |
| Forbidden | Production `bpnisgzxuwdxelhnduuf` |
| Basic seed | `player-ia-staging-seed.sql` |
| Cleanup | `player-ia-staging-seed-cleanup.sql` |
| Validate SQL | `player-ia-staging-seed-validate.sql` |
| Coverage (static) | `player-ia-staging-seed-coverage.json` |
| Generator | `generate-player-ia-staging-seed.mjs` |
| Auth extension | `player-ia-auth-seed.ts` / `player-ia-auth-seed-cleanup.ts` |
| Schema prereq | `supabase/migrations/076`–`081` |
| Tag | `forge-ia-seed-v1` |
| Title prefix | `[IA Seed]` |

**Production では実行しない。** `supabase/migrations/` に置かない。

---

## seed 間の参照構造（重要）

### 基本 seed の owner

40 作品の `owner_id` は次の式で決まる（行ごとに dedicated slot 1–20 を割当）:

```sql
COALESCE(
  (SELECT id FROM auth.users WHERE id = '<a1a1…slot>'::uuid),
  '<hero OWNER_A or OWNER_B>'::uuid
)
```

| 状況 | 実際の owner |
|---|---|
| **auth seed 済み**（専用 20 ユーザー存在） | `a1a1a1a1-a1a1-41a1-81a1-…0001`–`…0020` |
| **auth seed なし** | hero `dddddddd-…0001` / `…0002` にフォールバック |

FB 投稿者は常に既存 hero players（`…0101`–`…0110`）。既存 profile の公開情報は UPDATE しない。

### 専用 20 プロフィールとの結びつき

- `search_public_catalog` の developer / activity_tags ヒットは **公開作品を ≥1 所有**が条件（079）
- そのため専用プロフィールは **孤立させず**、40 作品を slot 1–20 へ割当（各 ≥1 件）
- 複数カテゴリ制作者:
  - `ia-seed-dev-16` → game + audio + asset
  - `ia-seed-dev-17` → game + dev-tool + service-app

### 推奨実行順

1. migrations 076→081  
2. **auth/profile 拡張**（service role・任意だが推奨）  
3. **基本 seed**（SQL）— 専用ユーザーがいれば所有を結ぶ  
4. validate  
5. Preview 確認  

**auth を後から足す場合:** 基本 seed を再実行すれば `ON CONFLICT` で `owner_id` が専用ユーザーへ付け替わる。

### auth 省略時でも基本 seed は成立するか

**成立する。** hero owners / players が FK として存在する前提（hero-carousel seed 済み Staging）。

### auth 省略で確認不能になる項目

- 専用 20 プロフィール / `activity_tags`（配信者・複数活動タグ）
- 開発者検索・グローバル検索の **developer ヒット**としての専用プロフィール
- 専用プロフィールページでの複数カテゴリ作品一覧（auth 時のみ dedicated owners）
- 長い制作者 **プロフィール名**（作品側の長い creator 表示は基本 seed でもあり）

auth 省略でも確認できる:

- 40 作品・カテゴリ・使用関係・お知らせ・FB・更新・属性/配信条件
- 作品詳細（owner は hero A/B。A/B は全カテゴリに作品を持つ）
- プロジェクト側タグ検索（ローグライク / Unity / 配信者 等）

---

## Cleanup 順

1. `player-ia-staging-seed-cleanup.sql`（作品など seed 行削除）  
2. `player-ia-auth-seed-cleanup.ts --execute`（専用ユーザー削除）  

**逆順禁止:** `projects.owner_id → auth.users ON DELETE CASCADE` のため、先に auth を消すと seed 作品も消える。

---

## なぜ A（SQL）と B（Auth）を分けるか

| 方式 | 内容 |
|---|---|
| **A. 基本 seed（SQL）** | 作品・FB・更新・使用関係・お知らせ。owner は dedicated 優先 / hero フォールバック |
| **B. Auth 拡張（service role）** | Admin API で専用 20 ユーザー + `developer_profiles`（`activity_tags`） |

既存 profile を UPDATE しない。`auth.users` 生 INSERT しない。Production ref 停止。credentials 無しは B を SKIP。

---

## 識別子

| 対象 | 識別 |
|---|---|
| projects | UUID `eeeeeeee-eeee-4eee-8eee-*` / tag `forge-ia-seed-v1` / title `[IA Seed]%` |
| usage | UUID `ffffffff-ffff-4fff-8fff-*` / `relation_type='used'` |
| announcements | UUID `aaaaaaaa-aaaa-4aaa-8aaa-*` / slug `ia-seed-%` |
| registered FB | UUID `99999999-9999-4999-8999-*` |
| guest FB | UUID `bbbbbbbb-bbbb-4bbb-8bbb-*` |
| empathies / replies / devlogs / release | `8888…` / `7777…` / `6666…` / `5555…` |
| auth users (B) | UUID `a1a1a1a1-a1a1-41a1-81a1-*` / `creator_id` `ia-seed-dev-*` |

---

## 基本 seed 件数（静的 coverage）

再生成: `node scripts/staging-only/generate-player-ia-staging-seed.mjs`  
正本: `player-ia-staging-seed-coverage.json`

| 種類 | 件数 |
|---|---:|
| projects | **40**（各カテゴリ 8） |
| usage relations | **12** |
| announcements published / draft | **6 / 2** |
| registered FB / guest FB | **31 / 7** |
| empathy rows / replies | **72 / 13** |
| devlogs / release events | **45 / 8** |

配信: ok 9 / conditional 9 / no 7 / unset 15  
属性: quick_try 17 / looking_for_testers 9 / usable_for_creation 25

検索 0 件用: `zzz-ia-seed-nohit-999`

---

## 画像

Smoke A の `thumbnail_url` 再利用、または `NULL`。Storage 書き込みなし（必要なら別手順）。

---

## Runbook

正本: `docs/player-ia-staging-apply-runbook.md`
