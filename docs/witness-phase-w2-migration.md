# 見届け人 W2 — migration 014

**ステータス**: 草案完了（Dashboard 適用前）  
**SQL**: `supabase/migrations/014_project_witness_grants.sql`  
**前提**: W1 GO、`lib/witness-eligibility.ts` とロジック同期

**Out**: UI、通知、ランキング、PLAYER_VISIBLE、上位 tier、バックフィル

---

## 1. migration 014 SQL

### テーブル `project_witness_grants`

| 列 | 型 | 説明 |
|----|-----|------|
| `id` | uuid PK | |
| `project_id` | uuid FK → projects | |
| `user_id` | uuid FK → auth.users | |
| `first_released_at` | timestamptz | 初回 Released の `created_at`（スナップショット） |
| `grant_path` | text | `multi_version` / `voice` / `watch` |
| `granted_at` | timestamptz | 付与実行時刻 |
| `created_at` | timestamptz | 行 INSERT 時刻 |

**制約**

- `UNIQUE (project_id, user_id)` — 初回のみ、再 Released で二重付与しない
- `grant_path` CHECK — W1 と同一

### append-only

- `BEFORE UPDATE OR DELETE` trigger → `RAISE EXCEPTION`
- RLS: クライアント向け INSERT ポリシー **なし**

---

## 2. RLS 方針

| 操作 | 方針 |
|------|------|
| **SELECT** | 本人（`auth.uid() = user_id`） |
| **SELECT** | 公開作品 or オーナー作品 — release_events と同型（将来作品詳細用） |
| **INSERT** | trigger + `SECURITY DEFINER` のみ |
| **UPDATE / DELETE** | 禁止（mutation trigger） |

service role / Dashboard SQL は RLS バイパス可（検証・seed 用）。

---

## 3. grant function 方針

**関数**: `grant_witnesses_on_first_released()`  
**トリガー**: `AFTER INSERT ON project_release_events`

### フロー

1. `event_type <> 'released'` → 何もしない
2. 同一 `project_id` に **別の** `released` 行が既にあれば → スキップ（**再 Released 対策**）
3. `projects.owner_id` 取得
4. 候補 user — `project_plays` / `project_play_sessions` / `project_voice_responses` / `project_watches` の UNION（owner 除外）
5. 各 user で W1 同等判定:
   - 初回 Released 前プレイ必須（plays + sessions の min ≤ cutoff）
   - path 優先: `multi_version` > `voice` > `watch`
6. `INSERT … ON CONFLICT (project_id, user_id) DO NOTHING`

**Release Reopened**: `event_type = 'release_reopened'` → トリガー内で即 return。**剥奪なし**。

**plays のみユーザー**: sessions=0 → A/C' 不可 → 付与されない（オーナー確定）。

---

## 4. 初回 Released 時の付与タイミング

```
Studio / API → INSERT project_release_events (released)
  → UPDATE projects.release_status（アプリ側、既存）
  → AFTER INSERT trigger → grant_witnesses_on_first_released()
       → eligible users へ project_witness_grants INSERT
```

- **同期** — 同一トランザクション内（release INSERT と grant INSERT）
- 初回 Released **以前** に存在した行のみ参照（`<= NEW.created_at`）
- `first_released_at` = その INSERT 行の `created_at`

---

## 5. 再 Released 時に二重付与されないこと

| ケース | 動作 |
|--------|------|
| 初回 `released` | 候補評価 → grant INSERT |
| `release_reopened` | trigger skip（not released） |
| 2 件目 `released` | 既存 released 行あり → **全体スキップ** |
| 同一 user 再評価 | `UNIQUE (project_id, user_id)` + `ON CONFLICT DO NOTHING` |

---

## 6. verify 用 seed 方針（014 適用後）

**必須ではない** — 014 適用後に任意で実施。

### 目的

grant trigger が path A / B / C' 各 1 件で動くことを staging で確認。

### 手順案

1. Dashboard で **014 適用**
2. テスト用 project（または sandbox 作品）で:
   - **User A**: sessions 2 版（`version_key` 異なる）— path `multi_version`
   - **User B**: session 1 + voice 1 — path `voice`
   - **User C**: watch + sessions 2 — path `watch`
3. 初回 Released **未実施** の作品で seed → Studio Released
4. `npm run verify:witness:grants:staging`（W3 で追加予定）で grant 行確認

### 既存 Released 済み作品について

014 適用 **前** に初回 Released 済みの作品（例: だもんでとなもんでの冒険）は **遡及付与しない**（バックフィルなし）。  
path 検証は **014 適用後に新規 Released** するテスト作品で行う。

---

## 7. Dashboard 適用手順

1. Supabase SQL Editor — `014_project_witness_grants.sql` を Run
2. 確認:

```sql
SELECT * FROM public.project_witness_grants LIMIT 1;
```

3. `docs/supabase-post-migration-checklist.md` 相当の目視（014 行追加は今後）

---

## 8. 関連

- `lib/witness-eligibility.ts` — TypeScript 正本（アプリ表示・verify）
- `npm run verify:witness:staging` — 014 前の eligibility dry-run
- W3: `verify:witness:grants:staging` — grant 行検証（未実装）

---

## 9. オーナー Run 判断（014 適用時）

014 適用は **Dashboard SQL** — オーナー Run。  
適用後: grant seed（任意）→ W3 verify。
