# Static audit: Player IA migrations 076–081

Date: 2026-07-26  
Branch: `preview/landing-01`  
Scope: schema/RPC only（seed は `scripts/staging-only/`、本監査対象外の適用はしない）

## Execution order

| Order | File | Depends on |
|---:|---|---|
| 1 | `076_player_ia_categories_attributes.sql` | 075 / projects + developer_profiles |
| 2 | `077_project_usage_relations.sql` | 076 (`projects.category`) |
| 3 | `078_platform_announcements.sql` | 001+ |
| 4 | `079_global_public_search.sql` | 076 columns |
| 5 | `080_player_ia_home_feed.sql` | 076–078, feedback card helpers, release/devlog |
| 6 | `081_guest_feedback_public_reenable.sql` | 071 |

Seed（旧 migrations/082）→ `scripts/staging-only/player-ia-staging-seed.sql`（076–081 後・Staging のみ）

## Existing-data compatibility

| Change | Compat |
|---|---|
| `projects.category` NOT NULL DEFAULT `game` + backfill | Existing rows become `game` |
| New bool/array/jsonb columns with defaults | Additive; no rewrite of titles/visibility |
| `stream_policy` DEFAULT `unset` | Games without policy stay unset |
| `developer_profiles.activity_tags` DEFAULT `{}` | Additive |
| 081 guest public cards | Opt-in via `p_include_guest` + moderation / aggregate flags; registered cards unchanged |

## RLS / privileges

| Object | SELECT | INSERT/UPDATE/DELETE (anon/authenticated) |
|---|---|---|
| `project_usage_relations` | RLS: published + both projects public；`GRANT SELECT` | Revoked |
| `platform_announcements` | RLS: `status=published`；`GRANT SELECT` | Revoked |
| New RPCs | `GRANT EXECUTE` to anon/authenticated/service_role（resolve_feedback_card_id は service_role のみ — 071 踏襲） | n/a |

## SECURITY DEFINER + search_path

All public read RPCs in 077–081 use:

- `SECURITY DEFINER`
- `SET search_path = public`

`080` / feedback helpers reference `auth.users` with schema-qualified name（email は SELECT しない）。

## Non-public data leakage

| Surface | Guard |
|---|---|
| Global search | `projects.visibility = 'public'` only |
| Developer search hits | Requires ≥1 public project |
| Tag candidates from `activity_tags` | Same public-owner EXISTS filter（079 修正済み） |
| Announcements RPC | `status = 'published'` only |
| Usage RPC | published + both public |
| Review highlights | public projects; author display from metadata names only |
| Guest cards | `include_in_public_aggregate` + `moderation_status = 'visible'` |

Not searched: email, private projects, Studio drafts, notifications, consultation chat.

## Guest FB rate limit

Not in SQL 081. App layer:

- `lib/guest-feedback/rate-limit.ts`
- stores `ip_hash` in `guest_feedback_rate_events`（raw IP 非保存）
- Preview write APIs enabled only when `VERCEL_ENV !== 'production'`

## Production future-apply safety

| OK | Not OK |
|---|---|
| Apply 076–081 on Production after Staging verify（owner Dashboard） | Apply staging seed on Production |
| Additive defaults / IF NOT EXISTS | Assuming Cursor auto-applies Production |
| Keep guest write disabled in Production web until explicit release | Shipping seed UUIDs / `[IA Seed]` titles to Production |

## Issues found & fixed in this整理 pass

1. **079** — `activity_tags` tag hits previously scanned all developer_profiles；restricted to owners with public projects.
2. **077 / 078** — explicit `GRANT SELECT` for anon/authenticated（RLS still filters）.
3. **082** — removed from `supabase/migrations/` → staging-only seed + cleanup + README.
4. Seed — removed broad `UPDATE projects SET category=game`（076 の責務）；added Staging Smoke/hero guards.

---

## Migration 履歴（SQL Editor vs CLI）

| 事実 | 内容 |
|---|---|
| SQL Editor で本文 Run | **`supabase_migrations.schema_migrations` に記録されない**（公式: remote 直接変更は history bypass） |
| SQL Editor のクエリ履歴 UI | 別物。CLI の適用判定には使われない |
| その後の `supabase db push` / CLI / CI | 履歴に無ければ **再適用対象**になり得る |
| `schema_migrations` への手書き INSERT | **採用しない**（公式・Forge 運用で安全と未確認） |
| 公式の履歴同期 | `supabase migration repair --status applied <version>`（履歴のみ更新、SQL 非実行） |

Forge 正本運用は Dashboard SQL Editor（`docs/supabase-dashboard-migration-guide.md`）。`supabase/config.toml` 無し・CI `db push` 非常用。

**今回 Staging 採用方式:** SQL Editor で 076→081 を適用し、**確認 SQL を成功の正本**とする。必須手順に `db push` / 独自 INSERT / 必須 repair は含めない。詳細手順: `docs/player-ia-staging-apply-runbook.md` §Migration 履歴と採用方式 / §10。

---

## 再実行安全性（同じ SQL を誤って再 Run した場合）

判定: **破壊的副作用なしで再実行可能（概ね idempotent）**。seed データ削除や DROP TABLE は含まない。

| Migration | duplicate column | constraint | policy | index | trigger | grant | backfill | RPC | 破壊的副作用 | 再実行 |
|---|---|---|---|---|---|---|---|---|---|---|
| **076** | `ADD COLUMN IF NOT EXISTS` | `DROP … IF EXISTS` → `ADD CONSTRAINT` | なし | `CREATE INDEX IF NOT EXISTS` | なし | なし | `UPDATE category='game' WHERE NULL OR ''` のみ（既存非空カテゴリは維持） | なし | なし | **安全** |
| **077** | テーブル `IF NOT EXISTS` | テーブル定義内（既存時スキップ） | `DROP POLICY IF EXISTS` → `CREATE` | `IF NOT EXISTS` | なし | `GRANT`/`REVOKE` 冪等 | データ INSERT なし | `CREATE OR REPLACE` | なし | **安全** |
| **078** | 同上 | 同上 | 同上 | 同上 | なし | 同上 | なし | `CREATE OR REPLACE` | なし | **安全** |
| **079** | なし（extension `IF NOT EXISTS`） | なし | なし | なし | なし | `REVOKE`/`GRANT` | なし | `CREATE OR REPLACE` | なし | **安全** |
| **080** | なし | なし | なし | なし | なし | 同上 | なし | `CREATE OR REPLACE`（4 関数） | なし。全体 `BEGIN`/`COMMIT` のため失敗時は関数も残らない | **安全**（再 Run 可） |

### 080 uuid/text join 修正（2026-07-26 Staging 適用失敗対応）

Staging 適用時エラー: `42883 operator does not exist: uuid = text` at `p.id = d.project_id`.

| 列 | 型（migration 正本 / Staging 実体） |
|---|---|
| `public.projects.id` | **uuid** |
| `public.project_devlogs.project_id`（エイリアス `d`） | **text**（003 以来） |
| `public.project_release_events.project_id`（エイリアス `e`） | **uuid**（013） |
| feedback / guest / voice の `project_id` | **text**（080 内は既に `p.id::text = …`） |

| 箇所（修正前） | 問題 | 修正 |
|---|---|---|
| `get_home_meaningful_updates` JOIN `p.id = d.project_id` | uuid = text | `p.id::text = d.project_id` |
| `get_public_projects_by_category` 相関 `d.project_id = p.id`（2 箇所） | text = uuid | `d.project_id = p.id::text` |
| release_events `p.id = e.project_id` / `e.project_id = p.id` | uuid = uuid | **変更なし** |

**採用理由:** Forge 既存（015/038/068 等）と同じく **uuid 側を `::text` に揃える**。`d.project_id::uuid` は使わない（非 UUID の legacy text があると cast error）。不正 text は JOIN 不一致で落ちるだけで公開 RPC から除外される。visibility=`public` 条件は維持。

静的ガード: `node scripts/staging-only/verify-080-project-id-joins.mjs`

**ROLLBACK:** 080 は単一 transaction。Staging での失敗時、080 由来の関数は作成されない（部分適用なし）。076–079 は別 transaction 済みのため残存。
| **081** | なし | なし | なし | なし | なし | 同上 | なし | `DROP FUNCTION IF EXISTS` → `CREATE OR REPLACE`（ゲスト公開再許可の意図的差し替え） | 行削除なし。公開カード定義がゲスト含む版へ戻る（081 の目的） | **安全**（意図どおり） |

### 注意点（再実行時）

1. **076 backfill** — 2 回目以降も NULL/空文字だけ `game` に戻す。seed で付けた `audio` 等は消えない。  
2. **077/078 `CREATE TABLE IF NOT EXISTS`** — 既に存在するテーブルの定義差分は自動修正しない（同内容の再 Run では問題なし。途中失敗で壊れた定義が残った場合は手修正が必要）。  
3. **081** — 071 の「ゲスト公開除外」を上書きする。再 Run はゲスト公開 RPC を維持/復元するだけで、FB 行は消さない。  
4. **GRANT 重複** — PostgreSQL では同じ GRANT の再実行はエラーにならない。  
5. **destructive** — いずれのファイルも `DROP TABLE` / 広範 `DELETE` / Storage 変更なし。

### CLI 再適用との関係

再実行安全であっても、**未記録のまま `db push` すると 076–081（場合によりそれ以前も）が再適用キューに入る**。Forge が CLI 運用へ移るまでは、成功判定を確認 SQL に置き、不用意な `db push` を避ける。
