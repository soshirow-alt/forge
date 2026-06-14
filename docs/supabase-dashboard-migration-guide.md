# Supabase Dashboard — migration 002 / 003 / 004 適用手順

非エンジニア向け。コピペで進められます。

**対象プロジェクト**: `bpnisgzxuwdxelhnduuf`（本番 Forge が接続している Supabase）  
**本番 URL**: https://forge-flame-gamma.vercel.app  
**所要時間**: 約 10〜15 分

---

## 事前確認（5分）

### 1. 正しい Supabase プロジェクトを開く

1. ブラウザで [https://supabase.com/dashboard](https://supabase.com/dashboard) を開く
2. ログイン（Forge 用の Supabase アカウント）
3. プロジェクト一覧から **`bpnisgzxuwdxelhnduuf`** を含む名前のプロジェクトを選ぶ  
   - 左上または Settings → General に **Reference ID** が表示されます
   - `bpnisgzxuwdxelhnduuf` と一致すること

### 2. 001 が適用済みか確認

左メニュー **Table Editor** を開き、次のテーブルがあるか見る：

- `projects`
- `developer_profiles`

**両方ある** → 002 に進んで OK。  
**ない** → **先に STEP 1（001）を実行**してから 002 へ（下記）。

---

## migration 001 を適用する（001 がない場合のみ）

002・003 の前に **必ず** 001 が必要です。

### 画面の開き方

1. 左メニュー **SQL Editor**（`</>` アイコン）
2. 右上 **New query** をクリック

### コピペするもの

1. PC で Forge リポジトリの次のファイルを開く：  
   `supabase/migrations/001_projects_and_developer_profiles.sql`
2. **ファイルの中身をすべて** 選択してコピー（約 110 行）
3. Supabase SQL Editor の大きな入力欄に **そのまま貼り付け**

### 実行

1. 右下 **Run**（または Ctrl+Enter）
2. 数秒待つ

### 成功の見え方

- 下部に **Success. No rows returned** のような緑系メッセージ
- エラー赤文字が **出ない**

### 001 適用後の確認

1. 左メニュー **Table Editor**
2. 次の **2 テーブル** があるか：

| テーブル名 | 役割 |
|---|---|
| `developer_profiles` | 開発者プロフィール |
| `projects` | 作品（ゲーム） |

**001 ができたら** → 下の migration 002 へ。

---

## migration 002 を適用する

### 画面の開き方

1. 左メニュー **SQL Editor**（`</>` アイコン）
2. 右上 **New query** をクリック

### コピペするもの

1. PC で Forge リポジトリの次のファイルを開く：  
   `supabase/migrations/002_user_engagement.sql`
2. **ファイルの中身をすべて** 選択してコピー（約 90 行）
3. Supabase SQL Editor の大きな入力欄に **そのまま貼り付け**

### 実行

1. 右下 **Run**（または Ctrl+Enter）
2. 数秒待つ

### 成功の見え方

- 下部に **Success. No rows returned** のような緑系メッセージ
- エラー赤文字が **出ない**

### 失敗の見え方と対処

| 表示 | 意味 | 対処 |
|---|---|---|
| `relation "project_supports" already exists` | **すでに適用済み** | 002 はスキップして 003 へ |
| `policy "..." already exists` | ポリシーが重複 | 002 はほぼ適用済み。003 へ進む |
| `relation "projects" does not exist` | 001 未適用 | 001 を先に実行 |
| その他の赤エラー | 内容をメモ | 実行を止め、ChatGPT / Cursor にエラー全文を共有 |

### 002 適用後の確認

1. 左メニュー **Table Editor**
2. 次の **5 テーブル** が増えているか：

| テーブル名 | 役割（ざっくり） |
|---|---|
| `project_supports` | 応援 |
| `project_bookmarks` | あとで見る |
| `project_watches` | 更新を追う |
| `project_plays` | プレイ記録 |
| `project_feedback` | フィードバック |

---

## migration 003 を適用する

### 画面の開き方

1. 再度 **SQL Editor** → **New query**（002 とは別クエリ推奨）

### コピペするもの

1. ファイル `supabase/migrations/003_project_devlogs_and_notifications.sql` を開く
2. **中身すべて** をコピー
3. SQL Editor に貼り付け

### 実行

1. **Run**
2. 数秒待つ

### 成功の見え方

- **Success. No rows returned**（エラーなし）

### 失敗の見え方と対処

| 表示 | 意味 | 対処 |
|---|---|---|
| `relation "project_devlogs" already exists` | 003 適用済み | 確認手順へ |
| `relation "project_watches" does not exist` | 002 未適用 | 002 を先に実行 |
| その他 | — | 実行停止、エラー全文を共有 |

### 003 適用後の確認

**Table Editor** に次が **追加** されているか：

| テーブル名 | 役割 |
|---|---|
| `project_devlogs` | 開発ログ |
| `user_notifications` | 通知（watch → devlog） |

---

## migration 004 を適用する

**目的**：プレイ可能版（`playable_version`）ごとの FB 制約、同版編集、devlog からの版公開、`published_version` 記録、phase `プロトタイプ`→`試作版`（1件想定）。

**重要**：004 対応コードの **本番 deploy より先** に Dashboard で 004 を実行してください。

### 事前確認（必須）

SQL Editor で次を実行し、**行が 0 件** であることを確認：

```sql
SELECT user_id, project_id, COUNT(*)
FROM public.project_feedback
GROUP BY 1, 2
HAVING COUNT(*) > 1;
```

行がある場合：004 内の dedupe が古い行を削除します。内容を確認してから続行。

### 適用手順

1. ファイル `supabase/migrations/004_feedback_versions_and_phase_cleanup.sql` を開く
2. **全文** を SQL Editor に貼り付け
3. **Run**（1回）

### 004 適用後の確認

```sql
-- phase が試作版になっているか（本番1件想定）
SELECT id, title, phase, playable_version FROM public.projects;

-- FB に version_key があるか
SELECT user_id, project_id, version_key, updated_at FROM public.project_feedback;
```

**Table Editor** で列が追加されているか：

| テーブル | 追加列 |
|---|---|
| `projects` | `playable_version`（default `0.1`） |
| `project_feedback` | `version_key`（default `0.1`）、`updated_at` |
| `project_devlogs` | `published_version`（nullable） |

### よくあるエラー

| メッセージ | 意味 | 対処 |
|---|---|---|
| `duplicate key value violates unique constraint "project_feedback_user_project_version_idx"` | FB 重複が残っている | 事前 SELECT を確認。dedupe 後に再実行 |
| `policy "Users update own feedback" already exists` | 004 適用済み | 確認 SELECT へ |
| その他 | — | 実行停止、エラー全文を共有 |

004 適用後 → **Vercel 本番 deploy**（004 対応 commit）→ [`docs/supabase-post-migration-checklist.md`](./supabase-post-migration-checklist.md)

---

## migration 005 を適用する

**目的**：版 bump 時の **version_published** 通知（watch ユーザー向け）。devlog 通知とは別 type。

**重要**：005 対応コードの **本番 deploy より先** に Dashboard で 005 を実行してください。

### 適用手順

1. ファイル `supabase/migrations/005_version_published_notifications.sql` を開く
2. **全文** を SQL Editor に貼り付け
3. **Run**（1回）

### 005 適用後の確認

```sql
-- type 制約確認（version_published が許可されている）
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_notifications'
  AND column_name IN ('type', 'published_version');
```

### よくあるエラー

| メッセージ | 意味 | 対処 |
|---|---|---|
| `violates check constraint "user_notifications_type_check"` | 005 未適用でコードが version_published を insert | **005 を先に適用** |
| `policy "Project owners insert notifications" already exists` | 005 適用済み | 確認へ |

005 適用後 → **Vercel 本番 deploy** → [`docs/e2e-version-published-loop-production.md`](./e2e-version-published-loop-production.md) で本番 E2E 確認

---

## 最終チェック（Dashboard だけで OK）

Table Editor に以下が **すべて** ある状態がゴール：

- [ ] `projects`
- [ ] `developer_profiles`
- [ ] `project_supports`
- [ ] `project_bookmarks`
- [ ] `project_watches`
- [ ] `project_plays`
- [ ] `project_feedback`
- [ ] `project_devlogs`
- [ ] `user_notifications`

---

## 安全性（なぜ Dashboard が安全か）

- 実行する SQL は **テーブル追加と権限設定のみ**
- 既存の `projects` / `developer_profiles` の **中身は消えない**
- `IF NOT EXISTS` のため、**二重実行してもテーブルは壊れにくい**
- いつ・何を実行したかが Dashboard 履歴に残る

---

## 次のステップ

migration 適用後 → [`docs/supabase-post-migration-checklist.md`](./supabase-post-migration-checklist.md) の画面確認へ。
