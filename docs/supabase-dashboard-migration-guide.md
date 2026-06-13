# Supabase Dashboard — migration 002 / 003 適用手順

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
