# localStorage 解消 — 実施順序・DB設計・確認手順

最終更新：2026-06-12  
前提：`docs/forge-principles.md` の localStorage 方針に従う。

---

## 全体の実施順序（安全な順）

| Step | 内容 | コード変更 | DB |
|:---:|---|:---:|:---:|
| **1** | migration 002 本番適用 + 動作確認 | なし | 002 |
| **2** | デモ用 LS / デッドコード削除 | 小 | なし | **実施済み（2026-06-13）** |
| **3** | migration 003（devlogs + notifications）適用 | 中 | 003 |
| **4** | devlog / watch通知を Supabase 化 | 中 | — |
| **5** | migration 004（projects extras カラム）適用 | 小〜中 | 004 |

**原則**：DB テーブルを先に作ってから LS 読み書きを外す。LS 削除だけ先行しない。

---

## Step 1：migration 002 本番適用

### 対象テーブル（`supabase/migrations/002_user_engagement.sql`）

- `project_supports` — 応援
- `project_watches` — 更新を追う
- `project_bookmarks` — あとで見る
- `project_plays` — プレイ済み
- `project_feedback` — フィードバック

### 適用手順

**A. Supabase Dashboard（推奨・初回）**

1. [Supabase Dashboard](https://supabase.com/dashboard) → 対象プロジェクト
2. **SQL Editor** → New query
3. `supabase/migrations/002_user_engagement.sql` の全文を貼り付け → **Run**
4. **Table Editor** で上記5テーブルが存在するか確認
5. **Authentication → Policies** で RLS ポリシーが有効か確認

**B. Supabase CLI（運用が CLI 中心の場合）**

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
```

**C. Vercel 環境変数（適用とセットで必須）**

本番デプロイに以下が入っていること：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 適用で壊れる可能性がある箇所

| リスク | 内容 | 対策 |
|---|---|---|
| **002 未適用のまま** | 応援・追跡・保存・FB・プレイ記録が保存されない（現状最大リスク） | 002 適用で**改善**される。壊れるのではなく「動いていなかった」状態が解消 |
| **二重適用** | `create table if not exists` のため通常は安全。ポリシー名衝突で失敗する可能性 | 失敗したらエラー行のみ確認。既存ポリシーと同名なら `drop policy if exists` 後に再実行 |
| **`project_id` が text** | mock 作品 ID（`emberfall` 等）と Supabase UUID の両方を格納。FK なし | **意図通り**。002 適用自体では問題にならない |
| **RLS による insert 拒否** | 未ログイン・セッション切れで書き込み失敗 | ログイン必須 UX と整合。エラーは UI で「保存できませんでした」表示を将来追加 |
| **support 二重 insert** | unique `(user_id, project_id)` — コード側で 23505 を握りつぶし済み | 問題なし |
| **feedback 公開 read** | 誰でも FB 読める RLS | 原典どおり「改善材料として公開」。意図通り |
| **本番のみ env 未設定** | Supabase client が null → サイレントに保存されない | Vercel env を適用前後で確認 |

**002 適用で既存表示が壊れることは基本ない**（読み取りは mock + projects のまま。エンゲージメントは追加データ）。

### 本番適用前の確認

- [ ] 001（`projects`, `developer_profiles`）が既に適用済み
- [ ] 本番 Supabase と Vercel の env が同一プロジェクトを指している
- [ ] `002_user_engagement.sql` をステージング or ローカル Supabase で一度実行しエラーなし
- [ ] 本番 DB のバックアップ（Dashboard → Database → Backups）または適用時刻を記録

### 本番適用後の確認（非エンジニア向けチェックリスト）

**未ログイン**

- [ ] トップ・一覧・詳細が見える
- [ ] 「ログインしてプレイ」等のボタンが表示される

**ログイン後（同一ブラウザ）**

- [ ] 作品詳細 → **ログインしてプレイ** → 外部リンクへ（またはプレイ記録）
- [ ] **応援する** → 「応援中」になり、リロード後も維持
- [ ] **更新を追う** → 追跡中表示、リロード後も維持
- [ ] **あとで見る** → `/bookmarks` に表示
- [ ] プレイ後 → フィードバック送信 → 詳細の「プレイヤーの声」に反映

**別ブラウザ or シークレット（同一アカウント）**

- [ ] 応援中・追跡中・保存済み・プレイ済み FB が**再現される**（002 の本番価値）

**Supabase Table Editor で確認（開発者）**

- [ ] `project_supports` / `project_watches` / `project_bookmarks` / `project_plays` / `project_feedback` に行が増える

---

## Step 2：デモ用 localStorage / デッドコード削除

### 削除してよいもの（Step 2 で実施可 — 画面影響小）

| 対象 | 理由 | 画面への影響 |
|---|---|---|
| `lib/play-session.ts` 全体 | 未 import。`project_plays` に置換済み | **なし** |
| `lib/game-feedback-storage.ts` の `loadStoredFeedback` / `saveStoredFeedback` / `hasUserSubmittedFeedback` | 本線は Supabase。型・ラベル関数のみ残す | **なし**（`getFeedbackSummaryText` 等は残す） |
| `lib/developer-profiles.ts` の `loadDeveloperProfiles` | 未使用。Supabase 経由のみ | **なし** |
| `lib/demo-setup.ts` の LS 書込：`forge-support-counts`, `forge-game-feedback` | games-provider は読まない | **なし**（mock の応援数は `getDefaultSupportCount` が表示） |
| `lib/demo-setup.ts` の `forge-support-counts` 関連 `removeDemoLocalData` 処理 | 上に同じ | **なし** |

### Step 2 では削除しないもの（Step 3〜5 まで保持）

| キー / 対象 | 理由 |
|---|---|
| `forge-devlogs` | `games-provider` が読み書き中。**Step 3 DB 化後に削除** |
| `forge-notifications` | 通知一覧が依存。**Step 3 DB 化後に削除** |
| `forge-game-extras` | 投稿作品のプレイ時間・観点。**Step 5 カラム追加後に削除** |
| `forge-applicant-counts` | テスター応募数表示に使用中（今回スコープ外） |
| `forge-follower-counts` / `forge-following-creators` | フォロー機能（今回スコープ外） |
| `lib/project-activity.ts` の `PLACEHOLDER_DEVLOGS` | 組み込み18作品のサンプル履歴。**意図的に残す** |

### demo-setup の devlog LS seed について

| タイミング | 対応 |
|---|---|
| Step 2 のみ | devlog の LS seed **は残しても可**（削除対象から外す） |
| Step 3 完了後 | demo devlog を `project_devlogs` に insert するよう変更し、LS seed 削除 |

### LS 削除時に画面が壊れないか（まとめ）

- **Step 2 だけ実施** → 組み込み作品・通常 UX は壊れない
- **devlog LS を DB 化前に削除** → ユーザー投稿の開発ログが消え、プレースホルダー表示に戻る → **NG**
- **notification LS を DB 化前に削除** → 通知一覧が常に空 → **NG**
- **extras LS を カラム追加前に削除** → 投稿作品のプレイ時間・観点が消える → **NG**

---

## Step 3：migration 003 — DB 設計案

### 方針

- CMS 化しない。`projects` に紐づく**子テーブル1本** + **通知テーブル1本**
- Realtime / プッシュなし。通知ページを開いたときに DB から fetch

---

### テーブル A：`project_devlogs`

**目的**：作品ごとの更新履歴を、他ユーザー・他端末から見られるようにする。

| カラム | 型 | 必須 | 説明 |
|---|---|:---:|---|
| `id` | uuid PK | ✓ | default `gen_random_uuid()` |
| `project_id` | text | ✓ | 002 と同様（mock ID / UUID 両対応）。FK なし |
| `author_id` | uuid FK → auth.users | ✓ | 投稿者（開発者） |
| `title` | text | ✓ | 見出し（例：「v0.2 チュートリアル改善」） |
| `content` | text | ✓ | 本文 |
| `created_at` | timestamptz | ✓ | default now() |

**意図的に持たないもの**：slug, 下書き, 公開フラグ, リッチテキスト, カテゴリ, サムネ, 並び替え用 weight

**インデックス**

- `(project_id, created_at desc)`

**RLS（最小案）**

- SELECT：全員可（feedback と同様。非公開作品はアプリ側で詳細アクセス制御済み）
- INSERT：`author_id = auth.uid()` かつ `projects.owner_id = auth.uid()` かつ `projects.id = project_id`
- UPDATE / DELETE：同上（本人のみ）

---

### テーブル B：`user_notifications`

**目的**：「更新を追っている作品に開発ログが追加されたら、通知一覧で見える」

| カラム | 型 | 必須 | 説明 |
|---|---|:---:|---|
| `id` | uuid PK | ✓ | |
| `user_id` | uuid FK → auth.users | ✓ | **通知を受け取るユーザー**（watch している人） |
| `type` | text | ✓ | まず `'devlog'` のみ。将来 `support` 等を追加 |
| `project_id` | text | ✓ | 対象作品 |
| `devlog_id` | uuid FK → project_devlogs | | devlog 通知時にセット。詳細リンク用 |
| `message` | text | ✓ | 表示文（例：「『余燼の王国』に開発日誌が投稿されました」） |
| `read_at` | timestamptz | | null = 未読 |
| `created_at` | timestamptz | ✓ | default now() |

**意図的に持たないもの**：Realtime channel, push token, メール送信状態, 集約スレッド

**インデックス**

- `(user_id, created_at desc)`
- `(user_id)` where `read_at is null`（未読カウント用・任意）

**RLS（最小案）**

- SELECT / UPDATE：`user_id = auth.uid()`（自分の通知のみ）
- INSERT：**service role または authenticated** — 実装は **devlog 投稿成功後のアプリ側**で watch ユーザー分を bulk insert（Realtime 不要）

---

## Step 4：通知の最小仕様

### トリガー

| イベント | 誰に通知 | Step |
|---|---|---|
| 開発ログ投稿 | `project_watches` にいるユーザー（**投稿者本人を除く**） | Step 4 で実装 |
| 応援 / FB / テスター応募 | 現状 LS のまま or 将来 owner 向けに拡張 | **後回し** |

### フロー（devlog のみ）

```
開発者が devlog 投稿
  → project_devlogs に insert
  → project_watches から project_id 一致を取得
  → 各 watcher（author 除く）に user_notifications を insert
  → watcher が /notifications を開く
  → user_id で fetch・表示
  → クリックで既読（read_at 更新）+ 作品詳細へ
```

### やらないこと（今回）

- Supabase Realtime 購読
- プッシュ / メール
- ヘッダーバッジの即時更新（ページ load / 操作後 refetch で十分）
- 開発者向け「応援が届きました」通知の Supabase 化（LS 継続可）

### 既存 LS 通知との移行

- Step 4 完了後：`forge-notifications` の read/write を削除
- 移行時に LS 内の旧通知を DB へ移す必要は**なし**（端末ローカルだったため）

---

## Step 5：migration 004 — projects extras

| カラム | 型 | 説明 |
|---|---|---|
| `estimated_play_time` | text nullable | 想定プレイ時間（例：「15〜30分」） |
| `focus_notes` | text nullable | 特に見てほしい観点 |

- submit / edit で DB に保存
- 既存 `forge-game-extras` は読込時フォールバック → 保存時 DB 優先 → 最後に LS 削除
- mock 作品は `mock-games.ts` のインライン値のまま

---

## migration 003 SQL 草案（参考・未適用）

```sql
-- 003_project_devlogs_and_notifications.sql（草案）

create table if not exists public.project_devlogs (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_devlogs_project_id_idx
  on public.project_devlogs (project_id, created_at desc);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('devlog')),
  project_id text not null,
  devlog_id uuid references public.project_devlogs (id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_id_idx
  on public.user_notifications (user_id, created_at desc);

-- RLS + policies は実装 PR で 002 と同粒度で追加
```

---

## 確認観点クイックリファレンス

| Step | 成功の定義 |
|---|---|
| 1 | 別端末で応援・追跡・FB が再現される |
| 2 | build 通過、デモページ・詳細・通知が従来どおり |
| 3 | 003 適用後 Table Editor にテーブル存在 |
| 4 | A が B を watch → B の owner が devlog 投稿 → A の通知一覧に1件 |
| 5 | 投稿作品のプレイ時間が別端末の詳細に表示 |

---

## 関連ファイル（実装時の主な触りどころ）

| 領域 | ファイル |
|---|---|
| 002 | 既存。適用のみ |
| LS 削除 | `lib/demo-setup.ts`, `lib/play-session.ts`, `lib/game-feedback-storage.ts` |
| devlog | `components/games-provider.tsx`, `components/devlog-new-page.tsx`, `lib/supabase/*` 新規 |
| 通知 | `components/games-provider.tsx`, `components/notifications-page.tsx`, `components/forge-header.tsx` |
| extras | `lib/supabase/projects.ts`, `lib/game-extra-storage.ts`, `components/submit-page.tsx` |
