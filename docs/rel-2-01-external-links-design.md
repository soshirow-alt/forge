# REL-2-01 — 外部リンク（X / YouTube / 表示順整理）

**ステータス**: migration 021 適用済み — **アプリ実装済み（2026-06-27）**  
**SQL 草案**: `supabase/migrations/021_project_external_links.sql`  
**適用方法**: Supabase Dashboard SQL（`docs/supabase-dashboard-migration-guide.md`）  
**適用後**: `docs/supabase-post-migration-checklist.md`

---

## GO の区別（重要）

| GO 種別 | 状態 | 意味 |
|---------|------|------|
| **設計 GO** | ✅ 2026-06-27 |
| **migration 021 適用 GO** | ✅ 2026-06-27 |
| **実装 GO** | ✅ 2026-06-27 |

本番 deploy / main merge / `PLAYER_VISIBLE=true` は引き続き禁止。

---

## 背景

- `projects` には Steam / itch / Discord / GitHub / 公式 URL 列が既にある（`001`）
- 表示順が仕様とずれている（現状 `getExternalLinks`: Steam → itch → **GitHub** → Discord → 公式）
- 作品詳細 v0（`/games/[id]`）は **外部リンク UI 未配線**（play のみ）
- 開発者プロフィールの `developer_profiles.x_account` は **開発者単位**。作品用 X は別列が必要

---

## DB 案

`projects` に列追加（正規化テーブル不要）。

| 列 | 型 | NULL | 役割 |
|----|-----|------|------|
| `steam_url` | `text` | YES（既存） | Steam ストア |
| `itch_url` | `text` | YES（既存） | itch.io |
| `discord_url` | `text` | YES（既存） | Discord 招待 |
| `x_url` | `text` | YES（**新規**） | **作品**の X アカウント / 投稿 URL |
| `official_url` | `text` | YES（既存） | 公式サイト |
| `youtube_url` | `text` | `YES`（**新規**） | トレーラー / チャンネル / 動画 |
| `github_url` | `text` | YES（既存） | リポジトリ（後方表示） |

### 開発者 X との役割分担

| データ | テーブル | 表示場所 |
|--------|---------|----------|
| 開発者の X | `developer_profiles.x_account` | `/creators/[id]` |
| **作品**の X | `projects.x_url` | 作品詳細の外部リンク |

**初期版**: 作品 `x_url` 未設定時に開発者 X へフォールバック**しない**（混同を避ける）。必要なら将来検討。

---

## 表示順（確定案）

**Steam → itch → Discord → X → 公式 → YouTube → GitHub**

- 未設定（NULL / 空文字）は **ボタン非表示**
- ダミー URL を出さない（REL-1 系と同様）
- `getExternalLinks` をこの順の**単一正本**にする

---

## 保存ルール

| ルール | 内容 |
|--------|------|
| 空入力 | 保存時 `null`（列ごとクリア） |
| トリム | 前後空白除去 |
| 必須 | **なし**（X も任意。投稿ハードルを上げない） |
| バリデーション | 既存と同様 `type="url"` + trim。サーバー側は空→null のみ（厳密 URL パースは初期版不要） |
| submit | 既存のトグル UI に **X・YouTube** を追加（順序は上記） |
| edit | 同フィールドを同順で編集 |

### プレースホルダー案

| ラベル | placeholder |
|--------|-------------|
| X | `https://x.com/...` |
| YouTube | `https://www.youtube.com/...` または `https://youtu.be/...` |

---

## RLS 要否

**新規ポリシー不要。** `001` の `projects` SELECT / UPDATE が新列にも適用される。

---

## 既存データへの影響

| 項目 | 影響 |
|------|------|
| 既存行 | `x_url` / `youtube_url` は **NULL** |
| 既存 5 リンク | **変更なし**（表示順のみアプリ側修正） |
| 検索・一覧 | 新列は検索対象外 |

---

## Rollback 方針

021 は **単独 rollback 可**。

```sql
BEGIN;
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS x_url,
  DROP COLUMN IF EXISTS youtube_url;
COMMIT;
```

アプリが新列を参照している場合は **アプリ rollback と同時**。

---

## 読み書き設計（実装時）

### 型・マッピング

```typescript
// Game / ProjectRow に追加
xUrl?: string | null;
youtubeUrl?: string | null;

// lib/supabase/projects.ts — projectRowToGame, insert, update 各経路
x_url: data.xUrl?.trim() || null,
youtube_url: data.youtubeUrl?.trim() || null,
```

### `lib/game-links.ts`（単一正本）

```typescript
export const EXTERNAL_LINK_SPECS = [
  { field: "steamUrl", label: "Steam" },
  { field: "itchUrl", label: "itch.io" },
  { field: "discordUrl", label: "Discord" },
  { field: "xUrl", label: "X" },
  { field: "officialUrl", label: "公式サイト" },
  { field: "youtubeUrl", label: "YouTube" },
  { field: "githubUrl", label: "GitHub" },
] as const;

export function getExternalLinks(game: { ... }): ExternalLink[];
// 上記順で truthy URL のみ返す
```

submit の `externalLinkOptions` もこの spec から生成すると順序ドリフトを防げる（任意リファクタ）。

### 表示経路

| 画面 | 現状 | 実装後 |
|------|------|--------|
| `/games/[id]`（v0 正本） | 外部リンク **なし** | `submittedGame` から `GameExternalLinks` を hero 下またはアクション付近に追加 |
| `GameDetailSidebar`（旧） | あり | spec 順 + x/youtube props 追加 |
| submit / edit | 5 種のみ | X・YouTube 追加、編集フォームの並びを spec 順に |

### Write 経路

| 画面 | 変更 |
|------|------|
| `submit-page.tsx` | `ExternalLinkKey` に `x` / `youtube`、options 順序更新 |
| `project-edit-page.tsx` | 入力欄追加・並び替え |
| `lib/project-form.ts` | `xUrl?`, `youtubeUrl?` |
| `lib/supabase/projects.ts` | read/write 全経路 |

---

## 配線一覧（実装タスク分解）

| # | ファイル | 変更 |
|---|---------|------|
| 1 | `supabase/migrations/021_project_external_links.sql` | Dashboard 適用 |
| 2 | `lib/supabase/schema.ts` | 型追加 |
| 3 | `lib/mock-games.ts` | `xUrl`, `youtubeUrl` |
| 4 | `lib/project-form.ts` | フォーム型 |
| 5 | `lib/supabase/projects.ts` | マッピング |
| 6 | `lib/game-links.ts` | 表示順正本 + 新列 |
| 7 | `components/game-external-links.tsx` | props 追加 |
| 8 | `components/game-detail-sidebar.tsx` | props 渡し |
| 9 | `components/game-detail-v0-page.tsx` | **外部リンクセクション追加** |
| 10 | `components/submit-page.tsx` | 入力 UI |
| 11 | `components/project-edit-page.tsx` | 入力 UI |

---

## 確認観点

### migration 適用直後

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name IN ('x_url', 'youtube_url');
```

### アプリ（実装後）

- [ ] edit で X / YouTube 保存 → `/games/[id]` にボタン表示（設定したものだけ）
- [ ] 表示順: Steam → itch → Discord → X → 公式 → YouTube → GitHub
- [ ] 未設定 URL は非表示（空ボタンなし）
- [ ] submit から新規投稿 → リンク保存 → Player 詳細で一致
- [ ] 他ユーザーの作品リンクを UPDATE できない（RLS）
- [ ] 本番モードでダミー URL が出ない

---

## オーナー判断待ち

1. **設計 GO** — 本 doc + SQL 草案
2. **migration 021 Dashboard 適用 GO** — SQL レビュー後
3. **作品 X 未設定時** — 開発者 `x_account` へフォールバック**しない**方針でよいか（推奨: しない）

---

## 関連 Issue

- REL-2-02 — 作品概要（完了）
- REL-2-03 — 開発者プロフィール（`x_account` 既存）
