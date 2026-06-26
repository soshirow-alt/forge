# REL-2-02 — 作品概要・見どころの Supabase 永続化（設計）

**ステータス**: 設計 GO 済み（2026-06-27）— **migration 022 Dashboard 適用 GO 済み（2026-06-27）** — **アプリ実装は適用確認後**  
**SQL 草案**: `supabase/migrations/022_project_overview.sql`  
**適用方法**: Supabase Dashboard SQL（`docs/supabase-dashboard-migration-guide.md`）  
**適用後**: `docs/supabase-post-migration-checklist.md`

---

## GO の区別（重要）

| GO 種別 | 状態 | 意味 |
|---------|------|------|
| **設計 GO** | ✅ 2026-06-27 | 本 doc + SQL 草案の方向で進めてよい |
| **migration 022 適用 GO** | ✅ 2026-06-27 | Dashboard で `022_project_overview.sql` を適用してよい |
| **実装 GO** | ❌ 未 | Dashboard 適用確認後にアプリ配線 |

本番 deploy / main merge / `PLAYER_VISIBLE=true` は引き続き禁止。

---

## 背景

- 作品詳細の「作品紹介」「作品の特徴」は `localStorage`（`forge-v0-project-overview`）にのみ保存されている
- 実作品は `gameToDetailV0` で `introduction = description`、`features = []`（REL-1-04 でタグ由来ダミー禁止済み）
- 本番では **Supabase を正本**にし、Preview のみ localStorage overlay を残す（最終廃止）

---

## DB 案

`projects` に列追加（正規化テーブルは不要）。

| 列 | 型 | NULL | 役割 |
|----|-----|------|------|
| `description` | `text` | NOT NULL（既存） | 一覧・検索・カード・hero の短い説明 |
| `overview_introduction` | `text` | YES | 作品詳細タブ「作品紹介」の長文 |
| `overview_features` | `jsonb` | YES | 見どころカード（最大 4） |

### `overview_features` JSON 形

```json
[
  { "title": "探索", "description": "ランタンの光で照らしながら、森の奥へ進む探索体験" },
  { "title": "謎解き", "description": "手がかりを集めて、廃村の秘密に迫る" }
]
```

- 配列長: **0〜4**（DB CHECK で `<= 4`）
- 各要素: `title` + `description` とも **非空 trimmed** のみ保存・表示
- 空配列は **NULL と同義**（保存時に `null` に正規化）

### 空カードの保存・表示ルール（確定）

| 入力状態 | 保存時 | Player 表示 |
|----------|--------|-------------|
| title / description **両方空** | 保存前に**除外**（行ごと捨てる） | — |
| **片方だけ**入力 | **保存しない** — UI に「タイトルと説明の両方を入れてください」 | — |
| 両方非空 | 有効カードとして保存（最大 4） | 表示 |

保存ボタン押下時: 片方だけのカードが 1 件でもあればエラー表示し、DB 更新は行わない。

### スコープ外（今回触らない）

| 項目 | 扱い |
|------|------|
| `developerWorry` | 版ごと devlog / 版問い側（localStorage・mock のみ） |
| `wantedVoices` | 同上 |
| タグ（`tags`） | 検索・フィルタ用。特徴カードの素材に**しない** |

---

## 表示ルール（Player `/games/[id]`）

| 条件 | 作品紹介セクション | 特徴カードセクション |
|------|-------------------|---------------------|
| `overview_introduction` あり | その本文（120字折りたたみ既存 UI） | — |
| `overview_introduction` なし、`description` あり | **`description` をフォールバック表示** | — |
| 両方なし | **セクション非表示** | — |
| `overview_features` に有効カード ≥1 | — | カード表示（最大 4） |
| 未設定 / 空 / 全件無効 | — | **セクション非表示** |

**禁止**: タグから `「〇〇の特徴のひとつ」` 等のダミーカードを生成しない（REL-1-04 維持）。

**hero の `lead`**: 従来どおり `description` 先頭 100 字（変更なし）。

**重複の許容（初期版）**: hero にも `description` が出るため、作品紹介セクションで同文が繰り返し見える場合がある。**初期版は許容**。違和感が出たら「`overview_introduction` がない場合は作品紹介セクションを出さない」に切り替え可。

---

## RLS 要否

**新規ポリシー不要。**

`001` で `projects` に RLS 済み:

| 操作 | 既存ポリシー | 新列への影響 |
|------|-------------|-------------|
| SELECT | `visibility = 'public' OR auth.uid() = owner_id` | 公開作品は誰でも overview 列を読める |
| UPDATE | `auth.uid() = owner_id` | オーナーのみ overview 列を更新可 |
| INSERT | `auth.uid() = owner_id` | 新規作品は overview とも NULL で INSERT 可 |

追加列は既存行の UPDATE 権限に含まれる。service role / anon の挙動変更なし。

---

## 既存データへの影響

| 項目 | 影響 |
|------|------|
| 既存 `projects` 行 | 新列は **NULL**（非破壊的 ALTER） |
| `description` | **変更なし** |
| Player 表示 | NULL 時は現状と同様（紹介 = description、特徴なし） |
| localStorage 下書き | **サーバー移行しない**（ブラウザローカルのため）。本番 GO 後は開発者が再入力 |
| 検索・一覧 | overview 列は **検索対象外**（初期版）。必要なら将来 FTS |

---

## Rollback 方針

022 は **単独 rollback 可**（後続 migration からの FK 依存なし）。

```sql
BEGIN;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_overview_features_shape;
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS overview_introduction,
  DROP COLUMN IF EXISTS overview_features;
COMMIT;
```

- rollback 後: アプリが新列を参照しているとエラー → **アプリ rollback を先に**するか、同時デプロイ
- データ損失: overview 列に入っていた内容のみ消失（`description` は残る）

---

## 読み書き設計（実装時）

### 型・正規化（アプリ層）

```typescript
// lib/supabase/schema.ts に追加想定
export type ProjectOverviewFeature = { title: string; description: string };

// lib/project-overview.ts（新規想定）
export function sanitizeOverviewFeatures(
  raw: unknown,
): ProjectOverviewFeature[] | null;
// - 配列以外 → null
// - trim、title/description 両方非空のみ残す
// - slice(0, 4)
// - 0 件 → null
```

### Read 経路

```
projects SELECT *
  → projectRowToGame（description のみ既存）
  → gameToDetailV0 拡張:
       introduction = overview_introduction?.trim() || description || ""
       features = sanitizeOverviewFeatures(overview_features) ?? []
  → GameDetailOverviewV0Tab（表示のみ）
```

| 画面 | データ源 |
|------|---------|
| `/games/[id]` 実作品・本番 | **DB のみ**（`applyProjectOverviewV0` しない） |
| `/games/[id]` Preview・mock ID | mock データ + localStorage overlay（Preview のみ） |
| `/games/[id]` Preview・実 UUID | **DB のみ**（overlay しない — 二重正本を避ける） |

**localStorage 方針（確定）**: 実 UUID = DB 一本化 / mock = Preview で localStorage 継続可 / 本番 = overlay 無効。

### Write 経路

| 画面 | 本番 | Preview |
|------|------|---------|
| `/projects/[id]/edit` | **正本の保存先（推奨）** — 概要セクション追加 | 同左 |
| `/projects/[id]/studio` | 改善ループ正本。**初期版は編集リンク**（`edit#overview`）で十分 | 同左 |
| `/studio/projects/[mockId]` | 到達不可（mock のみ） | localStorage（既存）— 実 UUID は redirect |
| `/games/[id]` Player | 読み取りのみ | 読み取りのみ |

**新規 DB 関数（想定）**:

```typescript
updateProjectOverviewInDb(supabase, projectId, {
  overviewIntroduction: string | null,
  overviewFeatures: ProjectOverviewFeature[] | null,
})
```

- `updateProjectDetailsInDb` とは **分離**（説明・リンク編集と保存タイミングが異なるため）
- `GameDetailOverviewV0Tab` の `onSave` を edit ページから再利用

### localStorage overlay の降格・廃止

| フェーズ | 挙動 |
|---------|------|
| **Phase A**（migration 適用〜実装） | 本番モード + 実 UUID → overlay **無効** |
| **Phase B** | Preview + **非 UUID mock ID** のみ `applyProjectOverviewV0` 継続 |
| **Phase C**（REL-2-02 完了後） | `project-overview-v0-store` 削除または Preview 専用 dead code 除去 |

---

## 配線一覧（実装タスク分解）

| # | ファイル / ルート | 変更 |
|---|------------------|------|
| 1 | `supabase/migrations/022_project_overview.sql` | Dashboard 適用（✅ GO 2026-06-27） |
| 2 | `lib/supabase/schema.ts` | 型追加 |
| 3 | `lib/supabase/projects.ts` | read マッピング + `updateProjectOverviewInDb` |
| 4 | `lib/submitted-game-v0-adapter.ts` | `Game` に overview フィールド渡し、`gameToDetailV0` 更新 |
| 5 | `lib/mock-games.ts` / `Game` 型 | `overviewIntroduction?`, `overviewFeatures?` |
| 6 | `components/project-edit-page.tsx` | 概要編集 UI + 保存 |
| 7 | `components/project-studio-page.tsx` | 「作品紹介を編集」リンク（任意・小） |
| 8 | `components/game-detail-v0-page.tsx` | 本番で `applyProjectOverviewV0` スキップ |
| 9 | `components/games-provider.tsx` | overview 更新メソッド公開 |
| 10 | `hooks/use-project-overview-v0.ts` | 本番実 UUID では no-op（または削除） |

**触らない（確定）**: `submit-page.tsx` — 初回投稿は title / description / ジャンル・タグ / プレイ URL / 外部リンク / 版問いのみ。長文紹介・見どころは **投稿後** `/projects/[id]/edit`（または Studio からの編集リンク）で設定。

---

## オーナー判断（確定 2026-06-27）

1. **紹介フォールバック**: `overview_introduction` → `description` → 両方なければ非表示。**GO**
2. **投稿フロー**: 概要欄は **edit のみ**（submit には載せない）。**GO**
3. **空カード**: 両方空は除外、片方のみは保存拒否 + UI メッセージ。**GO**
4. **localStorage**: 実 UUID = DB 一本化、mock = Preview のみ、本番 overlay 無効。**GO**
5. **migration 022 Dashboard 適用**: **GO**（オーナーが Dashboard で実行）

---

## 確認観点

### migration 適用直後（SQL のみ）

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name IN ('overview_introduction', 'overview_features');

-- CHECK 違反テスト（staging のみ）
-- INSERT 5 件配列 → エラーになること
```

### アプリ（実装後）

- [ ] 新規作品: 特徴セクション非表示、紹介は `description` のみ
- [ ] edit で紹介 + 特徴 2 件保存 → Player で即反映
- [ ] 特徴 5 件入力 → 保存時 4 件に切り詰め
- [ ] title のみ / description のみのカード → **保存拒否** + エラーメッセージ表示
- [ ] 他ユーザーの作品 overview を UPDATE できない（RLS）
- [ ] private 作品: オーナーは edit 可、非オーナーは Player で見えない（既存 visibility）
- [ ] 本番モード: localStorage に下書きがあっても Player に出ない
- [ ] Preview mock 作品: 従来どおり mock + localStorage（回帰）

---

## 関連 Issue

- REL-1-04 — タグ由来ダミー特徴の禁止（維持）
- REL-2-01 — 外部リンク（別 migration 021）
- REL-PRE-01 — lint 棚卸し（production GO 前）
