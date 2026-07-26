# Player IA Staging 手動適用 Runbook（076–081 + seed）

> **⚠ Production (`bpnisgzxuwdxelhnduuf`) では実行しない**  
> **対象 DB は Staging Supabase `vuqpwvjvgyxffmvpfrxo` のみ**  
> Production Storage / main への自動適用も禁止

この runbook は **オーナーが Supabase Dashboard → SQL Editor**（および必要な場合のみ service role スクリプト）で実行するための手順です。  
Cursor はこの文書作成時点では Staging へ **未適用**（適用は別指示）。

---

## 実行順（全体）

1. migrations **076 → 081**
2. migration 確認 SQL
3. **基本 seed**（SQL）— 既存 profile を変更しない
4. 必要な場合のみ **auth/profile 拡張 seed**（service role）
5. **validate SQL**
6. Preview 確認
7. **cleanup**（基本 SQL → 拡張 auth）

---

## 0. 適用前チェック（必須）

Dashboard 左上の project ref が **`vuqpwvjvgyxffmvpfrxo`** であることを目視確認する。

```sql
-- Staging 目印（Smoke A / hero-carousel）がいること
SELECT id, title, visibility
FROM public.projects
WHERE id IN (
  '41ff5a96-105c-42a2-87b4-787bcfeacb45',
  'dddddddd-dddd-4ddd-8ddd-000000000203'
);
-- 期待: 2 行
```

```sql
-- まだ category が無いこと（初回適用時）
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name = 'category';
-- 初回: 0 行 / 再適用途中: 1 行でも可（076 は IF NOT EXISTS）
```

**Production ref ではここで中止。**

---

## 1. Schema migrations（076 → 081）

各ファイルを **1 本ずつ** SQL Editor に貼って Run。失敗したら次へ進まない。

| 順 | ファイル | 内容 |
|---:|---|---|
| 1 | `supabase/migrations/076_player_ia_categories_attributes.sql` | `projects.category` 等 + `developer_profiles.activity_tags` |
| 2 | `supabase/migrations/077_project_usage_relations.sql` | 使用関係テーブル + read RPC |
| 3 | `supabase/migrations/078_platform_announcements.sql` | お知らせテーブル + read RPC |
| 4 | `supabase/migrations/079_global_public_search.sql` | `search_public_catalog` (+ suggest) |
| 5 | `supabase/migrations/080_player_ia_home_feed.sql` | home 用 RPC 群 |
| 6 | `supabase/migrations/081_guest_feedback_public_reenable.sql` | 公開ゲスト FB カード再許可 |

Seed は **migrations 列に置かない**。  
場所: `scripts/staging-only/player-ia-staging-seed*.sql`

### 1.1 各実行後の確認 SQL

**076 後**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name IN (
    'category', 'category_attributes', 'quick_try', 'usable_for_creation',
    'stream_policy', 'stream_policy_note', 'asset_kinds', 'purpose_tags'
  )
ORDER BY column_name;
-- 期待: 8 行

SELECT category, count(*) FROM public.projects GROUP BY 1 ORDER BY 1;
-- 期待: 既存行は category = game（NULL 無し）

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'developer_profiles'
  AND column_name = 'activity_tags';
-- 期待: 1 行
```

**077 後**

```sql
SELECT to_regclass('public.project_usage_relations') IS NOT NULL AS table_ok;
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'get_public_project_usage_relations';
-- 期待: table_ok true / 関数 1 行

SELECT
  has_table_privilege('anon', 'public.project_usage_relations', 'SELECT') AS anon_select,
  has_table_privilege('anon', 'public.project_usage_relations', 'INSERT') AS anon_insert;
-- 期待: anon_select true, anon_insert false
```

**078 後**

```sql
SELECT to_regclass('public.platform_announcements') IS NOT NULL AS table_ok;
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_public_platform_announcements',
    'get_public_platform_announcement_by_slug'
  )
ORDER BY 1;
-- 期待: 2 関数
```

**079 後**

```sql
SELECT public.search_public_catalog('test', 5);
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('search_public_catalog', 'search_public_catalog_suggest', 'forge_search_normalize')
ORDER BY 1;
-- 期待: 3 行
```

**080 後**

```sql
SELECT * FROM public.get_home_newest_projects(5, NULL);
SELECT * FROM public.get_home_review_highlights(5);
SELECT * FROM public.get_home_meaningful_updates(5);
SELECT * FROM public.get_public_projects_by_category('game', 'newest', NULL, NULL, NULL, NULL, NULL, 5, 0);
```

**081 後**

```sql
SELECT proname, pg_get_function_identity_arguments(oid)
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_public_feedback_cards',
    'resolve_feedback_card_id',
    'assert_public_feedback_card_source'
  )
ORDER BY 1;
```

---

## 2. 基本 seed（SQL・既存 profile 非変更）

```text
scripts/staging-only/player-ia-staging-seed.sql
```

Dashboard で全文 Run。

**重要**

- 既存 `developer_profiles` / 既存プロジェクト / 既存 FB を **UPDATE しない**
- 既存 Staging ユーザーは owner / player の **FK 参照のみ**
- seed 作成行は固定 UUID / tag `forge-ia-seed-v1` / title `[IA Seed]` で識別
- cleanup で seed 由来行を **完全削除**でき、seed 前の既存データ状態へ戻る
- 再実行安全（`ON CONFLICT` upsert）

詳細件数・coverage: `scripts/staging-only/player-ia-staging-seed-README.md`  
静的結果: `scripts/staging-only/player-ia-staging-seed-coverage.json`

### 期待（概数）

| 対象 | 件数 |
|---|---:|
| projects（各カテゴリ 8） | ≥40 |
| usage relations（`used` のみ） | ≥10 |
| announcements published / draft | ≥6 / ≥1 |
| registered + guest FB | 数十件規模 |

---

## 3. Auth / profile 拡張 seed（任意・service role）

プロフィール検索・`activity_tags`・配信者評価が必要なときだけ。

```bash
npx --yes tsx scripts/staging-only/player-ia-auth-seed.ts           # dry-run
npx --yes tsx scripts/staging-only/player-ia-auth-seed.ts --execute # Staging 書き込み
```

- Admin API で専用ユーザー 20 人 + `developer_profiles` を作成
- **Production ref では必ず停止**
- credentials が無い場合は **実行しない（SKIP）**
- 既存 hero / Smoke の profile は触らない
- `auth.users` への生 SQL INSERT はしない

---

## 4. Validate SQL

```text
scripts/staging-only/player-ia-staging-seed-validate.sql
```

Dashboard で Run。seed 件数・stream 分布・属性・保護行（Smoke A / Hero）・検索 0 件語を確認。

追加確認例:

```sql
SELECT category, count(*)
FROM public.projects
WHERE 'forge-ia-seed-v1' = ANY (tags)
GROUP BY 1 ORDER BY 1;
-- 期待: 各 8

SELECT count(*) FROM public.project_usage_relations
WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%';
-- 期待: ≥10

SELECT slug, status FROM public.platform_announcements
WHERE slug LIKE 'ia-seed-%' ORDER BY 1;

SELECT * FROM public.get_public_platform_announcements(20, 0);
-- draft が出ないこと

SELECT result_kind, title, category
FROM public.search_public_catalog('ローグライク', 20);

SELECT result_kind, title
FROM public.search_public_catalog('zzz-ia-seed-nohit-999', 10);
-- 期待: 0 行（作品ヒットなし）
```

---

## 5. Preview 確認（適用後・別作業）

- `/api/discovery/player-ia-home` が空配列でなくセクションを返す
- `/api/search/catalog?category=asset` が 200・複数件
- `/api/search/global?q=ホラー` / `Unity` / `配信者` が 200
- カテゴリタブ各 8 件以上の母集団があること

（本パッケージ作業では deploy / ブラウザ自動操作は行わない）

---

## 6. Cleanup（完全復元）

### 6.1 基本 seed 削除

```text
scripts/staging-only/player-ia-staging-seed-cleanup.sql
```

確認:

```sql
SELECT count(*) FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags);
SELECT count(*) FROM public.platform_announcements WHERE slug LIKE 'ia-seed-%';
SELECT count(*) FROM public.project_usage_relations WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%';
SELECT count(*) FROM public.project_feedback WHERE id::text LIKE '99999999-9999-4999-8999-%';
SELECT count(*) FROM public.project_guest_feedback WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%';
-- 期待: すべて 0
```

既存 profile / Smoke A / hero は変更していないため、追加の profile 復元は不要。

### 6.2 Auth 拡張を使った場合

```bash
npx --yes tsx scripts/staging-only/player-ia-auth-seed-cleanup.ts --execute
```

```sql
SELECT count(*) FROM public.developer_profiles WHERE creator_id LIKE 'ia-seed-dev-%';
-- 期待: 0
```

### 6.3 Schema rollback

**通常は行わない。** 076–081 は additive。

---

## 7. Production への注意

| やってよい | やってはいけない |
|---|---|
| 将来、オーナー判断で **076–081 のみ** Production Dashboard 適用 | **seed SQL / auth seed を Production で実行** |
| 適用前に Staging で検証済みであることを確認 | Cursor / CI から Production へ DDL/DML |
| Production 適用後は seed 無しで read-only 確認 | `player-ia-staging-seed*.sql` を migrations に戻す |

---

## 8. Staging Storage について（今回は実行しない）

画像は Smoke A の既存 URL 再利用または `NULL` fallback。  
Staging Storage へ新規アップロードが必要になった場合は **別手順**として切り出す（本 runbook の seed 適用には含めない）。

---

## 9. 静的監査サマリ（076–081）

詳細: `docs/player-ia-migrations-076-081-audit.md`

- 実行順固定: 076→081（seed は別）
- 既存 projects → `category='game'` 互換
- 新テーブル RLS: published/public のみ SELECT；client INSERT/UPDATE/DELETE revoke
- 検索は public 作品＋公開開発者のみ
- ゲスト rate limit は SQL 外（app + hashed IP）
