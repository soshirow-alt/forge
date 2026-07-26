# Player IA Staging 手動適用 Runbook（076–081 + seed）

**対象 DB:** Staging Supabase `vuqpwvjvgyxffmvpfrxo` のみ  
**禁止:** Production `bpnisgzxuwdxelhnduuf` / 本番 Storage / main への自動適用

この runbook は **オーナーが Supabase Dashboard → SQL Editor** で実行するための手順です。  
Cursor はこの文書作成時点では Staging へ **未適用**（適用は別指示）。

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

Seed（旧 082）は **migrations 列に置かない**。  
場所: `scripts/staging-only/player-ia-staging-seed.sql`

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

SELECT
  has_table_privilege('anon', 'public.platform_announcements', 'SELECT') AS anon_select,
  has_table_privilege('anon', 'public.platform_announcements', 'INSERT') AS anon_insert;
-- 期待: select true / insert false
```

**079 後**

```sql
SELECT public.search_public_catalog('test', 5);
-- 期待: エラーなく実行（0 行でも可）

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
-- 期待: いずれもエラーなし（行数は Staging データ次第）
```

**081 後**

```sql
-- シグネチャ確認（guest を再度解決できること）
SELECT proname, pg_get_function_identity_arguments(oid)
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_public_feedback_cards',
    'resolve_feedback_card_id',
    'assert_public_feedback_card_source'
  )
ORDER BY 1;

-- 公開カード RPC が呼べること（適当な public project / version）
-- ※ version_key は実データに合わせる
-- SELECT * FROM public.get_public_feedback_cards('<project_id_text>', '<version_key>', true, 10, 0);
```

---

## 2. Staging 専用 seed（schema 後）

```text
scripts/staging-only/player-ia-staging-seed.sql
```

Dashboard で全文 Run。

### 件数（期待）

| 対象 | 件数 |
|---|---:|
| `[IA Seed]` projects | 5 |
| usage relations | 2 |
| announcements（slug `ia-seed-%`） | 3（うち draft 1） |
| guest feedback seed 行 | 1 |

### seed 後確認 SQL

```sql
SELECT id, title, category, quick_try, usable_for_creation, looking_for_testers, stream_policy, asset_kinds
FROM public.projects
WHERE 'forge-ia-seed-v1' = ANY (tags)
ORDER BY category;
-- 期待: 5 行（game/audio/asset/dev-tool/service-app）

SELECT count(*) AS usage_n
FROM public.project_usage_relations
WHERE id IN (
  'ffffffff-ffff-4fff-8fff-000000000001',
  'ffffffff-ffff-4fff-8fff-000000000002'
);
-- 期待: 2

SELECT slug, status, importance
FROM public.platform_announcements
WHERE slug LIKE 'ia-seed-%'
ORDER BY slug;
-- 期待: 3 行（draft 1 / published 2）

SELECT * FROM public.get_public_platform_announcements(10, 0);
-- 期待: draft が出ない（published のみ）

SELECT * FROM public.get_public_project_usage_relations(NULL, 10);
-- 期待: ≥2

SELECT result_kind, title, category
FROM public.search_public_catalog('ローグライク', 10);
-- 期待: Forest Roguelike 等がヒット

SELECT result_kind, title
FROM public.search_public_catalog('Unity', 10);
-- 期待: 作品 or タグ

SELECT category, count(*)
FROM public.get_public_projects_by_category(NULL, 'newest', NULL, NULL, NULL, NULL, NULL, 50, 0) g
GROUP BY 1
ORDER BY 1;
```

### ゲスト FB / rate limit（メモ）

- SQL 081 は **公開一覧への guest 再許可**。書き込み rate limit はアプリ（`lib/guest-feedback/rate-limit.ts`）が `guest_feedback_rate_events` に **IP ハッシュのみ**保存。
- Preview API は `VERCEL_ENV=production` 以外で guest write 可。Production Web はコード側で disabled 維持。

---

## 3. 最終確認 SQL（一括）

```sql
-- Schema present
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects' AND column_name='category') AS has_category,
  to_regclass('public.project_usage_relations') IS NOT NULL AS has_usage,
  to_regclass('public.platform_announcements') IS NOT NULL AS has_ann,
  EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace='public'::regnamespace AND proname='search_public_catalog'
  ) AS has_search;

-- Seed present
SELECT
  (SELECT count(*) FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags)) AS seed_projects,
  (SELECT count(*) FROM public.platform_announcements WHERE slug LIKE 'ia-seed-%') AS seed_ann,
  (SELECT count(*) FROM public.project_usage_relations
     WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%') AS seed_usage;

-- Draft leak check
SELECT count(*) AS draft_leaked
FROM public.get_public_platform_announcements(50, 0) a
JOIN public.platform_announcements p ON p.id = a.id
WHERE p.status <> 'published';
-- 期待: 0

-- Existing Staging 9 件が消えていないこと（目安）
SELECT count(*) FILTER (WHERE visibility = 'public') AS public_n
FROM public.projects;
-- 期待: 既存 + 5（初回 seed 後はおおよそ 14 前後。環境依存）
```

Preview smoke（適用後・別作業）:

- `/api/discovery/player-ia-home` が空配列でなくセクションを返す
- `/api/search/catalog?category=asset` が 200
- `/api/search/global?q=ホラー` が 200

---

## 4. Cleanup / rollback

### 4.1 Seed のみ削除（推奨）

```text
scripts/staging-only/player-ia-staging-seed-cleanup.sql
```

Dashboard で全文 Run。

確認:

```sql
SELECT count(*) FROM public.projects WHERE 'forge-ia-seed-v1' = ANY (tags);
SELECT count(*) FROM public.platform_announcements WHERE slug LIKE 'ia-seed-%';
-- 期待: 0 / 0
```

### 4.2 Schema rollback

**通常は行わない。** 076–081 は additive（列・テーブル・RPC 追加）。  
Production 未適用なら Staging で残して問題ない。どうしても落とす場合はオーナー判断で個別 DROP（本 runbook では自動 DROP スクリプトを提供しない）。

---

## 5. Production への注意

| やってよい | やってはいけない |
|---|---|
| 将来、オーナー判断で **076–081 のみ** Production Dashboard 適用 | **seed SQL を Production で実行** |
| 適用前に Staging で検証済みであることを確認 | Cursor / CI から Production へ DDL/DML |
| Production 適用後は seed 無しで read-only 確認 | `player-ia-staging-seed*.sql` を migrations に戻す |

ゲスト FB を Production Web で有効化するのは **別のコードリリース判断**（現状 `VERCEL_ENV=production` で API disabled）。

---

## 6. 静的監査サマリ（076–081）

詳細は同梱の監査結果を完了報告に記載。要点:

- 実行順固定: 076→081（seed は別）
- 既存 projects → `category='game'` 互換
- 新テーブル RLS: published/public のみ SELECT；client INSERT/UPDATE/DELETE revoke
- SECURITY DEFINER RPC は `SET search_path = public`（080 の `auth.users` は修飾参照）
- 検索は public 作品＋公開開発者のみ（activity_tags タグ候補も public owner 限定）
- メール等の非公開列は検索ドキュメントに含めない
- ゲスト rate limit は SQL 外（app + hashed IP）
