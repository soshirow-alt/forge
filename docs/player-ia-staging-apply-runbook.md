# Player IA Staging 手動適用 Runbook（076–081 + seed）

> **⚠ Production (`bpnisgzxuwdxelhnduuf`) では実行しない**  
> **対象 DB は Staging Supabase `vuqpwvjvgyxffmvpfrxo` のみ**  
> Production Storage / main への自動適用も禁止

この runbook は **オーナーが Supabase Dashboard → SQL Editor**（および必要な場合のみ service role スクリプト）で実行するための手順です。  
Cursor はこの文書作成時点では Staging へ **未適用**（適用は別指示）。

---

## Migration 履歴と採用方式（必読）

### SQL Editor 単独実行では履歴に載らない

Dashboard **SQL Editor で migration 本文を Run しただけ**では、`supabase_migrations.schema_migrations` には **記録されない**（公式ドキュメント: remote を SQL Editor で直接変更すると migration history を bypass する）。

SQL Editor のクエリ履歴 UI に残ることと、`schema_migrations` は別物。

| 後続操作 | SQL Editor のみで 076–081 を適用した場合 |
|---|---|
| `supabase db push` | 履歴に無ければ **再適用対象**になり得る |
| Supabase CLI migration 適用 | 同上 |
| CI/CD で `db push` | 同上 |

Forge は従来 **Dashboard SQL Editor 正本**（`docs/supabase-dashboard-migration-guide.md`）。リポジトリに `supabase/config.toml` は無く、CI の `db push` も常用していない。

### 今回 Staging で採る方式（決定）

**A. Dashboard SQL Editor で 076→081 を本文適用し、確認 SQL で成功判定する（採用）**

理由:

1. Forge 既存運用と一致（可視性優先・オーナー手動）
2. CLI `db push` を初導入すると、過去 001–075 の履歴未同期時に **古い migration まで再適用試行**する危険がある
3. `schema_migrations` への **独自 INSERT は採用しない**（公式・既存運用で安全と確認できない）
4. 076–081 は概ね再実行安全（詳細は `docs/player-ia-migrations-076-081-audit.md` §再実行安全性）なので、誤って同 SQL を再 Run しても破壊的副作用は小さい

**採用しない**

- 今回の必須手順としての `supabase db push`（履歴全体未検証のため）
- `schema_migrations` への手書き INSERT
- SQL 適用前に必須とする `migration repair`（CLI 運用へ移行する別判断時のみ検討）

**将来 CLI を使う場合（今回の必須手順外）**

1. 先に `supabase migration list` で Local/Remote 差分を読む  
2. スキーマが既に正しいことを確認 SQL で担保したうえで、公式  
   `supabase migration repair --status applied <version>`  
   のみで履歴同期（SQL は再実行しない）  
3. version はファイル名先頭（例: `076`）。**repair は履歴テーブルのみ更新**

---

## 実行順（全体）

1. migrations **076 → 081**（Dashboard SQL Editor）
2. migration 確認 SQL（成功の正本）
3. **auth/profile 拡張 seed**（service role・推奨。credentials が無ければ省略可）
4. **基本 seed**（SQL）— 専用ユーザーがいれば所有を結び、無ければ hero owners にフォールバック。既存 profile は変更しない
5. **validate SQL**
6. Preview 確認
7. **cleanup**（**基本 SQL 先** → 拡張 auth。逆順禁止: auth CASCADE）

### seed 所有関係（要約）

- 基本 seed 40 作品の `owner_id` = `COALESCE(専用 a1a1…, hero dddd…0001/0002)`
- 専用 20 プロフィールは各 ≥1 作品を所有（孤立プロフィールにしない）
- 複数カテゴリ: `ia-seed-dev-16` = game/audio/asset、`ia-seed-dev-17` = game/dev-tool/service-app
- 詳細: `scripts/staging-only/player-ia-staging-seed-README.md`

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

**080 後（必須・型不一致修正版）**

```sql
-- 関数 4 本が存在すること
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_home_review_highlights',
    'get_home_meaningful_updates',
    'get_home_newest_projects',
    'get_public_projects_by_category'
  )
ORDER BY 1;
-- 期待: 4 行

-- 呼び出しが 42883 (uuid=text) なく成功すること
SELECT * FROM public.get_home_newest_projects(5, NULL);
SELECT * FROM public.get_home_review_highlights(5);
SELECT * FROM public.get_home_meaningful_updates(5);
SELECT * FROM public.get_public_projects_by_category('game', 'newest', NULL, NULL, NULL, NULL, NULL, 5, 0);
SELECT * FROM public.get_public_projects_by_category(NULL, 'updated', NULL, NULL, NULL, NULL, NULL, 5, 0);
-- 期待: いずれもエラーなし（0 行でも可）
```

**081 へ進んでよい条件**

1. 上記 080 確認 SQL がすべて成功（特に `get_home_meaningful_updates` / `updated` sort）  
2. `42883` / `uuid = text` が出ない  
3. Staging ref が `vuqpwvjvgyxffmvpfrxo` のまま  
4. まだ 081 を適用していない（未適用ならそのまま 081 本文へ）

前回 080 が失敗して rollback 済みなら、修正済み `080_player_ia_home_feed.sql` を **全文再 Run** してよい（`CREATE OR REPLACE`・単一 transaction・再実行安全）。

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

## 2. Auth / profile 拡張 seed（推奨・service role）

専用プロフィール・`activity_tags`・開発者検索を評価するなら **基本 seed より先**に実行。

```bash
npx --yes tsx scripts/staging-only/player-ia-auth-seed.ts           # dry-run
npx --yes tsx scripts/staging-only/player-ia-auth-seed.ts --execute # Staging 書き込み
```

必要な環境変数（値は表示・共有しない）:

- `NEXT_PUBLIC_SUPABASE_URL`（Staging `vuqpwvjvgyxffmvpfrxo`）
- `SUPABASE_SERVICE_ROLE_KEY`

- Admin API で専用ユーザー 20 人 + `developer_profiles` を作成
- **Production ref では必ず停止**
- credentials が無い場合は **実行しない（SKIP）** → 基本 seed は hero owners で成立
- 既存 hero / Smoke の profile は触らない
- `auth.users` への生 SQL INSERT はしない

---

## 3. 基本 seed（SQL・既存 profile 非変更）

```text
scripts/staging-only/player-ia-staging-seed.sql
```

Dashboard で全文 Run。

**重要**

- 既存 `developer_profiles` / 既存プロジェクト / 既存 FB を **UPDATE しない**
- owner は専用 auth がいればそちら、無ければ hero `…0001/0002`
- FB 投稿者は既存 hero players（`…0101`–`…0110`）を FK 参照のみ
- seed 作成行は固定 UUID / tag `forge-ia-seed-v1` / title `[IA Seed]` で識別
- cleanup で seed 由来行を **完全削除**でき、seed 前の既存データ状態へ戻る
- 再実行安全（`ON CONFLICT` upsert。auth 後の再実行で owner 付け替え可）

詳細件数・coverage: `scripts/staging-only/player-ia-staging-seed-README.md`  
静的結果: `scripts/staging-only/player-ia-staging-seed-coverage.json`

### 期待（概数）

| 対象 | 件数 |
|---|---:|
| projects（各カテゴリ 8） | ≥40 |
| usage relations（`used` のみ） | ≥10 |
| announcements published / draft | ≥6 / ≥1 |
| registered + guest FB | 数十件規模 |
| auth 実行時: 専用 profile が seed 作品を所有 | 20 |

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

**必ず 6.1 → 6.2 の順。** auth ユーザーを先に消すと `ON DELETE CASCADE` で所有プロジェクトも消える。

### 6.1 基本 seed 削除（先）

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

### 6.2 Auth 拡張を使った場合（後）

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
- 再実行安全性・migration 履歴挙動も同監査ファイル参照

---

## 10. オーナー最終実行手順（コピペ用・1本）

対象: Staging **`vuqpwvjvgyxffmvpfrxo` のみ**。Production **`bpnisgzxuwdxelhnduuf` では中止**。

### 10.0 secrets（残さない）

| 環境変数名 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Staging URL（ref が `vuqpwvjvgyxffmvpfrxo` であること） |
| `SUPABASE_SERVICE_ROLE_KEY` | auth seed / cleanup のみ |

- `.env.local` に置く（gitignored）。**commit / PR / チャット / ログに値を貼らない**
- シェル履歴に残したくなければ `read -s` や一時 export 後に `unset`
- Cursor / CI に service role を常設しない（今回の適用はオーナー環境で実行）

### 10.1 Dashboard: ref 確認

1. https://supabase.com/dashboard → Staging プロジェクト  
2. Settings → General の Reference ID = `vuqpwvjvgyxffmvpfrxo`  
3. 不一致なら **全停止**

確認 SQL（SQL Editor）:

```sql
SELECT id, title FROM public.projects
WHERE id IN (
  '41ff5a96-105c-42a2-87b4-787bcfeacb45',
  'dddddddd-dddd-4ddd-8ddd-000000000203'
);
-- 期待: 2 行
```

### 10.2 Dashboard: migrations 076→081（本文適用）

各ファイルを **全文** コピー → SQL Editor → **Run**。失敗したら次へ進まない（その番号で停止）。

| 順 | ファイル（リポジトリパス） | 失敗時 |
|---:|---|---|
| 1 | `supabase/migrations/076_player_ia_categories_attributes.sql` | 停止。seed に進まない |
| 2 | `supabase/migrations/077_project_usage_relations.sql` | 停止 |
| 3 | `supabase/migrations/078_platform_announcements.sql` | 停止 |
| 4 | `supabase/migrations/079_global_public_search.sql` | 停止 |
| 5 | `supabase/migrations/080_player_ia_home_feed.sql`（devlog は `p.id::text` join） | 停止。**081 に進まない**。修正版を再 Run |
| 6 | `supabase/migrations/081_guest_feedback_public_reenable.sql` | 080 成功確認後のみ |

各成功後の確認 SQL は **§1.1**。最低限の一括成功確認:

```sql
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects' AND column_name='category') AS has_category,
  to_regclass('public.project_usage_relations') IS NOT NULL AS has_usage,
  to_regclass('public.platform_announcements') IS NOT NULL AS has_ann,
  EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace='public'::regnamespace AND proname='search_public_catalog'
  ) AS has_search,
  EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace='public'::regnamespace AND proname='get_home_newest_projects'
  ) AS has_home,
  EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace='public'::regnamespace AND proname='get_public_feedback_cards'
  ) AS has_fb_cards;
-- 期待: すべて true / 1
```

**成功の正本は上記スキーマ確認**（`schema_migrations` ではない）。

任意（履歴観察のみ・今回必須ではない）:

```sql
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
ORDER BY version;
-- SQL Editor のみ適用後: 076–081 が無くて正常（記録されないため）
```

### 10.3 ローカル / Cursor 環境: auth seed（推奨）

```bash
# リポジトリ root、branch preview/landing-01（HEAD に a81e902 以降の seed 所有修正を含むこと）
export NEXT_PUBLIC_SUPABASE_URL='https://vuqpwvjvgyxffmvpfrxo.supabase.co'
# SUPABASE_SERVICE_ROLE_KEY は .env.local から読むか、対話で export（値をログに出さない）
npx --yes tsx scripts/staging-only/player-ia-auth-seed.ts           # dry-run
npx --yes tsx scripts/staging-only/player-ia-auth-seed.ts --execute
```

- Production ref / キー無し → スクリプトが停止または SKIP。その場合は 10.4 へ（基本 seed は hero fallback）
- 失敗時: 基本 seed 前に原因切り分け。専用プロフィール無しでも 10.4 は実行可

### 10.4 Dashboard: 基本 seed

1. `scripts/staging-only/player-ia-staging-seed.sql` 全文 → SQL Editor → Run  
2. 失敗時: seed / validate / Preview に進まない。schema は残してよい

### 10.5 Dashboard: validate

1. `scripts/staging-only/player-ia-staging-seed-validate.sql` 全文 → Run  
2. 期待の目安: projects_total=40、各カテゴリ8、usage=12、ann published/draft=6/2、FB 31/7、empathies=72、devlogs=45、release_events=8、protected_*=ok、zero_hit_search=0  
3. auth 実行時: `auth_seed_profiles=20` かつ `auth_profiles_owning_seed_projects=20`

### 10.6 Preview 検証（HTTP・オーナーまたは Cursor）

Preview alias（既存）:

`https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app`

確認例（ブラウザ自動操作不要）:

```bash
BASE='https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app'
curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/api/discovery/player-ia-home"
curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/api/search/catalog?category=game"
curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/api/search/global?q=%E3%83%AD%E3%83%BC%E3%82%B0%E3%83%A9%E3%82%A4%E3%82%AF"
curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/search"
curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/home"
```

画面の最終目視はオーナー。

### 10.7 Cleanup（必要なときだけ）

```text
# Dashboard 先:
scripts/staging-only/player-ia-staging-seed-cleanup.sql

# その後ローカル（auth を使った場合のみ）:
npx --yes tsx scripts/staging-only/player-ia-auth-seed-cleanup.ts --execute
```

### 10.8 途中失敗時の停止位置

| 失敗箇所 | 停止 | やってよい / いけない |
|---|---|---|
| ref 不一致 | 全停止 | 何も実行しない |
| 076–081 の途中 | その番号で停止 | seed 禁止。失敗 migration を修正・再 Run（再実行安全は監査参照） |
| auth seed | 記録して継続可 | 基本 seed は hero fallback で可 |
| 基本 seed | validate/Preview 前に停止 | schema は残してよい |
| validate 件数不一致 | Preview 前に停止 | cleanup して原因確認してから再 seed |

### 10.9 migration 履歴の最終確認（任意）

今回の成功判定は **§10.2 のスキーマ確認 SQL**。  
履歴テーブルは SQL Editor 適用では更新されないため、076–081 が `schema_migrations` に無くても適用成功と矛盾しない。

将来 CLI を使う前に必ず:

```bash
npx supabase@latest migration list
# 差分が大きい場合は db push しない。公式 repair で履歴を揃える別作業にする
```
