# migration 004 設計整理 — バージョン別フィードバック + phase 同梱

> **ステータス**：設計のみ（未実装・未適用）  
> **最終更新**：2026-06-13  
> オーナー合意済み方針を反映。

---

## 0. 本番 DB 確認結果（2026-06-13）

| 項目 | 値 |
|------|-----|
| 総件数 | 1 |
| phase | プロトタイプ × 1 |
| status | テスター募集中 × 1 |
| 作品名 | 消えるかな？ |
| 判断 | 今すぐ phase 一括更新は不要。004 同梱で 1 件だけ UPDATE |

**status** は 004 では触らない（将来別途整理）。

---

## 1. migration 004 の目的

Forge のコアループ **プレイ → フィードバック → 改善 → 再プレイ** を、バージョン単位で追えるようにする。

| 解決したいこと | 内容 |
|----------------|------|
| スパム・同版重複 | 1ユーザー×1作品×1プレイ可能版 = 1 FB |
| 成長の記録 | 版ごと FB 履歴が残る |
| 再プレイのトリガー | 新版公開 → 新 FB 枠 |
| 技術的負債 | 本番 1 件の旧 phase `プロトタイプ` を正規値 `試作版` に揃える |

**今回やらない**：AI 要約、開発者返信、版公開の watch 通知強化、status 整理、phase CHECK 制約。

---

## 2. 追加・変更する DB 項目（概要）

| テーブル | 変更種別 | 列名 | 型 | 備考 |
|----------|----------|------|-----|------|
| `projects` | ADD | `playable_version` | `text NOT NULL DEFAULT '0.1'` | 現在のプレイ可能版（開発者自由入力） |
| `project_feedback` | ADD | `version_key` | `text NOT NULL DEFAULT '0.1'` | 投稿時スナップショット |
| `project_feedback` | ADD | `updated_at` | `timestamptz` | 編集日時（NULL 可→UPDATE 時セット） |
| `project_feedback` | INDEX/UNIQUE | `(user_id, project_id, version_key)` | UNIQUE | 同版1件制約 |
| `project_devlogs` | ADD（任意・推奨） | `published_version` | `text NULL` | 版 bump した devlog の記録 |
| `projects` | UPDATE | `phase` | — | `プロトタイプ` → `試作版`（1件） |

---

## 3. project_feedback に追加する項目

```
version_key   text NOT NULL DEFAULT '0.1'
updated_at    timestamptz NULL
```

**既存行の扱い**

- 全既存 FB に `version_key = '0.1'` を設定
- `updated_at` は NULL のまま（未編集扱い）

**UNIQUE 追加前の注意**

- 現行 DB は同一 `(user_id, project_id)` の複数 insert 可
- UNIQUE 追加前に **重複行がないか SELECT で確認**
- 重複があれば最新 `created_at` 1 件を残し、他は削除 or `version_key` を手動で分ける（本番 FB 件数が少ないうちに実施）

---

## 4. projects に追加する項目

```
playable_version   text NOT NULL DEFAULT '0.1'
```

| ルール | 内容 |
|--------|------|
| 初期値 | 新規作品・既存作品とも migration 後 `0.1` |
| 更新 | devlog 投稿時チェック ON + 開発者入力 |
| 自動連番 | **しない**（Forge が勝手に固定しない） |
| 将来 | 自動採番 / 手動入力の選択 UI は Phase 2 以降 |

新規投稿（`/submit`）時も `playable_version = '0.1'` で insert。

---

## 5. RLS 変更の要否

| テーブル | 現状 | 004 で必要な変更 |
|----------|------|------------------|
| `project_feedback` SELECT | 公開 readable | **変更なし** |
| `project_feedback` INSERT | 自分のみ | **変更なし** |
| `project_feedback` UPDATE | **なし** | **追加必須**：`auth.uid() = user_id` |
| `project_feedback` DELETE | なし | **追加しない**（履歴保持） |
| `projects` UPDATE | オーナーのみ | **変更なし**（`playable_version` もオーナー UPDATE で更新） |
| `project_devlogs` INSERT | オーナーのみ | **変更なし** |

```sql
CREATE POLICY "Users update own feedback"
  ON public.project_feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 6. フィードバック編集の扱い

| 状態 | プレイヤー UI | API |
|------|--------------|-----|
| 現版・未投稿 | 新規フォーム | INSERT |
| 現版・投稿済 | 「送り済み」+ **編集する** | UPDATE（同一行） |
| 旧版 | 読取のみ（MVP）または非表示 | — |
| 新版公開後 | 新規フォーム | INSERT（新 `version_key`） |

**編集可能範囲**：`good_points`, `concerns`, `bugs`, `focus_response`, `would_replay` すべて。  
**変更不可**：`version_key`（投稿時固定）、`user_id`, `project_id`。

**updated_at**：UPDATE 成功時にアプリから `now()` をセット。

**開発者側**：ダッシュボード FB 一覧に `version_key` 列を追加（どの版への FB か）。

---

## 7. 1ユーザー×1作品×1プレイ可能バージョン制約の実現方法

```
projects.playable_version  ← 開発者が devlog で bump
         │
         ▼
プレイヤー FB 投稿時に version_key = projects.playable_version をスナップショット
         │
         ▼
UNIQUE (user_id, project_id, version_key)
```

**アプリロジック（擬似）**

1. 作品詳細を開く → `playable_version` を取得（Game 型に載せる）
2. ログインユーザーの `(project_id, version_key = playable_version)` の FB を SELECT
3. 行あり → 編集モード / 行なし → 新規 INSERT
4. INSERT 時 UNIQUE 違反 → 編集モードへフォールバック（競合対策）

**版が変わったとき**

- `playable_version` が `0.1` → `0.2` になったら、プレイヤーは `0.2` 用の新規枠が開く
- `0.1` の FB は DB に残る（履歴）

---

## 8. devlog 投稿時の version bump UI

**優先導線**（オーナー指定）：作品編集ではなく **devlog 投稿画面**。

### UI 案（`devlog-new-page.tsx`）

```
☐ 今回の更新を新しいプレイ可能版として公開する

（チェック ON 時のみ表示）
  プレイ可能版のバージョン
  [ 0.2        ]  ← 自由入力。placeholder に現在版+提案（例 0.1→0.2）
  現在のプレイ可能版: 0.1
  プレイヤーはこの版向けに新しいフィードバックを送れるようになります
```

| 項目 | 内容 |
|------|------|
| チェック OFF | devlog のみ投稿。`playable_version` 不变 |
| チェック ON | 入力必須。空・空白不可 |
| バリデーション | 現在版と同じ文字列は拒否（「変更なし」防止） |
| 送信処理 | ① devlog insert ② `projects.playable_version` UPDATE ③（任意）devlog.`published_version` = 入力値 |

**通知**：既存 devlog 通知はそのまま。版 bump 専用通知は **004 スコープ外**（feedback-roadmap 参照）。

**「開発の歩み」表示**：`game-project-history-section` の `v0.1` 連番表示を、`published_version` または `playable_version` 履歴に段階的に寄せる（004 実装時 or 直後）。

---

## 9. 既存 FB を 0.1 扱いにする方法

**migration 004 内（UNIQUE 追加前）**

```sql
UPDATE public.project_feedback
SET version_key = '0.1'
WHERE version_key IS NULL OR version_key = '';
-- DEFAULT 付与後は既存行も 0.1 になるが、明示 UPDATE を推奨
```

**作品側**

```sql
UPDATE public.projects
SET playable_version = '0.1'
WHERE playable_version IS NULL OR playable_version = '';
```

本番「消えるかな？」も `playable_version = '0.1'`。

---

## 10. phase「プロトタイプ」→「試作版」同梱 UPDATE 案

本番 1 件のみ。status は触らない。

```sql
UPDATE public.projects
SET phase = '試作版'
WHERE phase = 'プロトタイプ';
-- 期待: 1 row updated
```

**確認用 SELECT（適用前後）**

```sql
SELECT id, title, phase, status FROM public.projects;
```

---

## 11. migration 004 SQL 全体イメージ

```sql
-- ============================================================
-- 004: playable_version, feedback version_key, phase cleanup
-- 適用前: 002/003 済み、本番 projects 1件・FB件数要確認
-- ============================================================

BEGIN;

-- A. phase（本番1件）
UPDATE public.projects SET phase = '試作版' WHERE phase = 'プロトタイプ';

-- B. projects.playable_version
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS playable_version text NOT NULL DEFAULT '0.1';

UPDATE public.projects SET playable_version = '0.1'
WHERE playable_version IS NULL OR playable_version = '';

-- C. project_feedback 列追加
ALTER TABLE public.project_feedback
  ADD COLUMN IF NOT EXISTS version_key text NOT NULL DEFAULT '0.1';
ALTER TABLE public.project_feedback
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NULL;

UPDATE public.project_feedback SET version_key = '0.1';

-- C-1. 重複チェック（0件であること。あれば COMMIT 前に手動対応）
-- SELECT user_id, project_id, COUNT(*) FROM project_feedback
-- GROUP BY 1,2 HAVING COUNT(*) > 1;

-- D. UNIQUE
CREATE UNIQUE INDEX IF NOT EXISTS project_feedback_user_project_version_idx
  ON public.project_feedback (user_id, project_id, version_key);

-- E. RLS UPDATE
CREATE POLICY "Users update own feedback"
  ON public.project_feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- F.（任意）devlog に published_version
ALTER TABLE public.project_devlogs
  ADD COLUMN IF NOT EXISTS published_version text NULL;

COMMIT;
```

**適用後確認 SELECT**

```sql
SELECT id, title, phase, status, playable_version FROM public.projects;
SELECT id, project_id, version_key, updated_at, created_at FROM public.project_feedback;
```

---

## 12. 本番適用時の手順（非エンジニア向け概要）

1. **事前**：Cursor が `supabase/migrations/004_....sql` をコミット  
2. **バックアップ意識**：件数少ないが、適用前 SELECT で phase / FB 一覧をメモ  
3. **FB 重複確認**：上記 C-1。重複あれば Cursor に相談  
4. **Supabase Dashboard** → SQL Editor → New query  
5. **004 SQL 全文**を貼り付け → **Run**（1回）  
6. **確認 SELECT** 2 本実行  
7. **Vercel 本番デプロイ**（004 対応コード。migration だけでは UI 未対応）  
8. **動作確認**：FB 新規/編集、devlog 版 bump、ダッシュボード FB 一覧に version 表示  

詳細手順書は 001〜003 と同様 `docs/supabase-dashboard-migration-guide.md` に 004 章を追記予定。

**重要**：**migration 先か deploy 先か**  
- **推奨**：① migration 004 適用 → ② アプリ deploy  
- migration のみ先でも旧アプリは動く（新列は DEFAULT）。ただし UNIQUE 後は旧アプリが同版2回 INSERT するとエラー。

---

## 13. 想定リスク

| リスク | 対策 |
|--------|------|
| 既存 FB 重複で UNIQUE 失敗 | 適用前 SELECT。最新1件残し整理 |
| 版 bump 忘れ | devlog チェック UI を主導線に |
| 版表記ゆれ（0.2 / v0.2 / 0.2.0） | 自由入力の代价。UI に「プレイヤーに表示される版名」と注釈 |
| deploy 前に UNIQUE だけ先 | 旧コードが二重 INSERT → エラー。deploy を遅らせない |
| `project_id` text vs projects.id uuid | 現行どおり text 維持。004 でも変更しない |
| status が旧 phase のまま | 意図的放置。表示は `lookingForTesters` + `displayGameStatus` |
| 編集履歴なし | MVP は `updated_at` のみ |

---

## 14. 実装順序（コード側・承認後）

| Phase | 内容 | 依存 |
|-------|------|------|
| **0** | `004_....sql` 作成 + ドキュメント | — |
| **1** | 型・schema・projects insert に `playable_version` | migration 004 |
| **2** | Game に `playableVersion` 載せる | 1 |
| **3** | FB: 現版取得 + INSERT/UPDATE 分岐 + 編集 UI | 2, RLS UPDATE |
| **4** | devlog: 版 bump チェック + 入力 + project UPDATE | 2 |
| **5** | 開発者ダッシュボード・詳細 FB 表示に `version_key` | 3 |
| **6** | （任意）devlog `published_version` + 開発の歩み表示整合 | 4 |
| **7** | legacy fuzzy phase 削除検討 | phase UPDATE 後 |

**テスト観点**

- 同版2回目 → UPDATE（編集）
- bump 後 → 新規 INSERT
- チェック OFF devlog → version 不变
- 本番「消えるかな？」phase=試作版、playable_version=0.1

---

## 15. オーナー判断済み / 残論点

**済**

- 版は開発者自由入力、初期 0.1
- devlog チェックを主導線
- 既存 FB は 0.1
- phase UPDATE は 004 同梱（プロトタイプ→試作版、1件）
- status は放置

**残（実装前に決めてよい）**

- devlog に `published_version` 列を 004 に含めるか（推奨：含める）
- 旧版 FB をプレイヤーに見せるか（MVP：開発者ダッシュボードのみでも可）
- deploy と migration の実行順（推奨：migration → deploy を同一メンテ窓）

---

## 16. 関連ドキュメント

- `docs/feedback-roadmap.md` — 全体方針
- `docs/phase-migration-inventory.md` — phase 棚卸し
- `docs/supabase-dashboard-migration-guide.md` — Dashboard 手順（004 章は未追記）
