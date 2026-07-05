# 041 Public Feedback Cards — Phase 1 Dashboard 適用 RUN 手順

> **前提**: Phase 0（`95eb470`）受領済み。041 は **Preview / 本番とも同一 Supabase**（`bpnisgzxuwdxelhnduuf`）への変更。  
> **オーナー GO 後のみ実行**。Cursor は Dashboard 操作しない。

---

## 実行する SQL ファイル

| 項目 | 値 |
|------|-----|
| リポジトリ | `supabase/migrations/041_public_feedback_cards.sql` |
| commit | `95eb470` 以降の当該ファイル版 |
| 方式 | Supabase Dashboard → **SQL Editor** → 全文コピペ → **Run**（1 トランザクション `BEGIN`/`COMMIT`） |

**適用前**: Dashboard プロジェクト Reference ID が `bpnisgzxuwdxelhnduuf` であることを確認。

---

## 実行前確認 SQL（Read-only）

以下を **個別に Run**（041 本体の前）。すべて期待どおりなら Phase 1 実行へ。

```sql
-- 1) 正しいプロジェクトか（結果 1 行）
SELECT current_database(), current_user;

-- 2) 040 前提テーブル存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'project_guest_voice_responses',
    'project_guest_feedback',
    'project_voice_responses',
    'project_feedback'
  )
ORDER BY 1;
-- 期待: 4 行

-- 3) 041 未適用（列が無いこと）
SELECT column_name, table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'optional_comment'
  AND table_name IN ('project_voice_responses', 'project_guest_voice_responses');
-- 期待: 0 行

SELECT to_regclass('public.feedback_reports') AS feedback_reports;
-- 期待: NULL

-- 4) 現行 get_public_voice_aggregates シグネチャ（040 版）
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'get_public_voice_aggregates';
-- 期待: args に boolean（3 引数版）

-- 5) backfill 対象件数（任意 — 影響把握）
SELECT 'registered_voice' AS src, count(*) AS rows_with_em_dash
FROM public.project_voice_responses
WHERE answer_label IS NOT NULL AND position(' — ' IN answer_label) > 0
UNION ALL
SELECT 'guest_voice', count(*)
FROM public.project_guest_voice_responses
WHERE answer_label IS NOT NULL AND position(' — ' IN answer_label) > 0;
```

**止める条件（041 を Run しない）**

- 040 テーブルが 4 つ揃わない
- `optional_comment` 列が既に存在（二重適用）
- `feedback_reports` が既に存在
- Reference ID が `bpnisgzxuwdxelhnduuf` でない

---

## 041 実行

1. `041_public_feedback_cards.sql` **全文**を SQL Editor に貼付
2. **Run** 1 回
3. 成功: `Success`（COMMIT 済み）。赤エラーなし

**失敗時にどこで止まるか**

- ファイル全体が **1 トランザクション** のため、途中エラー → **全体 ROLLBACK**（スキーマ変更は残らない）
- 典型停止点:
  - `ALTER TABLE` — 列/制約名衝突
  - `CREATE TABLE feedback_reports` — 既存
  - `DROP FUNCTION get_public_voice_aggregates` — 依存オブジェクト（現状想定なし）
  - `CREATE OR REPLACE FUNCTION` — `auth.users` 参照権限（Supabase では通常 OK）

---

## 実行後確認 SQL

```sql
-- A) 列追加
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'project_voice_responses',
    'project_guest_voice_responses',
    'project_feedback',
    'project_guest_feedback'
  )
  AND column_name IN (
    'optional_comment',
    'moderation_status',
    'hidden_at',
    'report_count'
  )
ORDER BY table_name, column_name;
-- optional_comment: voice 2 テーブルのみ。moderation 系: 4 テーブル

-- B) feedback_reports + RLS
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'feedback_reports';
-- relrowsecurity = true

SELECT policyname FROM pg_policies WHERE tablename = 'feedback_reports';
-- 期待: 0 行（クライアント用ポリシーなし）

-- C) 関数存在 + GRANT
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'feedback_public_card_id',
    'resolve_feedback_card_id',
    'get_public_feedback_cards',
    'get_public_voice_aggregates'
  )
ORDER BY 1;

-- D) resolve は service_role のみ（anon に EXECUTE 無いこと）
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'resolve_feedback_card_id';
-- service_role に EXECUTE。anon/authenticated 無し

-- E) 公開 RPC スモーク（公開作品 ID / version_key に差し替え）
-- SELECT * FROM public.get_public_feedback_cards('<project_id>', '<version_key>', true, 5, 0);
-- SELECT * FROM public.get_public_voice_aggregates('<project_id>', '<version_key>', true);

-- F) anon 直接 INSERT 拒否（SQL Editor は service role のため、API/anon キーで別途確認推奨）
```

**止める条件（Phase 2 以降へ進まない）**

- 関数が 4 つ揃わない
- `get_public_voice_aggregates` が 2 引数版に戻っている
- `feedback_reports` に anon INSERT ポリシーがある

---

## ロールバックできる / できない

| 操作 | 041 適用後 |
|------|------------|
| **041 全体を取り消す** | 専用 DOWN migration **なし**。手動 DROP/ALTER が必要で **非推奨** |
| **トランザクション失敗** | 自動 ROLLBACK → **変更なし** |
| **`optional_comment` backfill** | UPDATE 済み。**元の answer_label 合成形式への復元は未提供** |
| **新規列 DEFAULT** | `moderation_status='visible'` — 既存行は visible のまま |
| **`DROP FUNCTION` + 再 CREATE 集計 RPC** | 041 成功時点で **040 版から置換済み**。旧定義への戻しは 040 SQL 再実行が必要 |
| **`feedback_reports` 削除** | `DROP TABLE` 可能だが通報データ消失 |

**方針**: 041 は **前に進む前提**。本番 GO 前に pre-check SQL で二重適用を防ぐ。

---

## 適用後に確認する画面（DB のみ — UI 未実装でも）

| 確認 | 方法 |
|------|------|
| 既存「みんなのFB」集計 | Preview/本番の作品詳細 → 集計タブが **壊れていない**（040 + アプリ側マージ） |
| 集計 RPC 変更 | 同一 `answer_value` の分裂が DB 側でも解消（041 後） |
| ゲスト API | guest-voice / guest-feedback が **200**（列追加で壊れないこと） |
| Studio | 開発者向け FB 一覧が表示される |
| `/privacy` `/terms` | Phase 0 文案（041 とは独立） |

**Phase 2 UI 未デプロイ時**: `get_public_feedback_cards` は RPC 直叩き確認のみ。カード UI はまだ出ない。

---

## テストデータ削除手順

041 適用確認で INSERT した行は **必ず削除**（本番 DB 共有のため）。

```sql
-- ゲスト voice / detailed（submitter_key または created_at で特定）
DELETE FROM public.project_guest_voice_responses
WHERE id IN ('<uuid1>', '<uuid2>');

DELETE FROM public.project_guest_feedback
WHERE id IN ('<uuid>');

-- 登録ユーザー voice / detailed
DELETE FROM public.project_voice_responses WHERE id = '<uuid>';
DELETE FROM public.project_feedback WHERE id = '<uuid>';

-- 通報テスト行
DELETE FROM public.feedback_reports WHERE id = '<uuid>';
```

**注意**: FK 依存は 041 時点では feedback → voice 親なし。CASCADE は reporter の user 削除時のみ。

---

## 041 適用後の次ステップ（別 GO）

1. Phase 2: 公開カード UI + 送信前同意チェック + `optional_comment` 書き込み
2. Phase 4: `POST /api/feedback/report`
3. Preview 確認 → main / prod deploy（別 GO）

---

## 関連

- Phase 0 整理: `docs/public-feedback-cards-phase0.md`
- Dashboard 一般手順: `docs/supabase-dashboard-migration-guide.md`
- 適用後チェック: `docs/supabase-post-migration-checklist.md`（041 専用は本ファイル）
