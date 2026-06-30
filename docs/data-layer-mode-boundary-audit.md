# Data-layer mode boundary — gap audit（2026-06）

**Branch:** `refactor/data-layer-mode-boundary`  
**Goal:** UI は本番/Preview/mock を意識しない。mode 差分は data provider / server loader / app provider に閉じる。  
**Out of scope this pass:** production deploy、v0 ファイル名の一括リネーム

正本ポリシー: オーナー指示（2026-06）+ `docs/production-mode-audit.md`

**互換方針（2026-06-30）** — 本番実データはオーナーテスト 1 件のみ。既存データ互換のための複雑な fallback や旧 demo 導線は残さない。本体に残る v0 / mock / demo / ad screenshot 分岐は **削除・隔離を優先**（認証・RLS・open redirect・env・migration 整合性は維持）。

---

## 最終形（target）

| # | ルール |
|---|--------|
| 1 | 本体 UI は `shouldHideV0MockContent` / ad demo / bypass を直接持たない |
| 2 | 本番/Preview/local の差は data provider・server loader・app provider に閉じる |
| 3 | UI は渡されたデータを表示、0 件なら空状態のみ |
| 4 | 本番で mock fallback しない（データ層） |
| 5 | Preview/local の mock はデータ層でのみ注入可 |
| 6 | ad screenshot demo は本体導線に混ぜず、期限付き・1 箇所に隔離 |
| 7 | mock 専用コンポーネントが本体導線に残っていれば削除 or 隔離 |
| 8 | `v0` 名前のリネームは今回しない。本体に混ざった旧 mock ロジックは整理対象 |

---

## 現状サマリ（優先 4 URL）

| URL | 深刻度 | 主なズレ |
|-----|--------|----------|
| `/home` | 中 | ページが mock カタログを import し `mergeHomeCards` を編成 |
| `/studio` | 高 | セクション丸ごと差し替え + ad demo が owned-projects に直結 |
| `/studio/mypage` | **最高** | `StudioProjectsTabPanel` ↔ `DirectoryPanel` の二重 UI |
| `/games/[id]` | 高 | 404 分岐・voice 二重スタック・タブ差し替えが UI 内 |

**既に target に近いもの:** `ForgeDeploymentProvider`、`GamesProvider` の多く、`use-game-devlogs-v0` のデータ源差し替え。

**repo 全体:** `shouldHideV0MockContent()` 直呼び ≈33 ファイル。`useHideV0MockContent()` は 5 ファイルのみ。

---

## Route 1: `/home`

### チェーン

`app/home/page.tsx` → `DiscoveryHomePage` → `PlayerShell` + `useGames` + `mergeHomeCards`

### ズレ

- `discovery-home-page.tsx` が `lib/home-v0-mock-data` を import
- `useHideV0MockContent()` で merge 可否を UI が決定
- コンポーネント差し替えはない（データ配列の merge のみ）

### 最終形

- `GamesProvider`（または専用 hook）が `{ hero, updated, popular, new }` を返す
- UI は配列を描画 + 空メッセージのみ
- mock import はページから消す

---

## Route 2: `/studio`

### チェーン

`app/studio/layout.tsx`（Guard）→ `StudioHomePage` → `StudioOwnedProjectsSection` + 下部セクション

### ズレ

| 箇所 | 現状 |
|------|------|
| 今週の伸び | `hideV0Mock` ? Coming Soon : `RankingSnippetsSection`（mock） |
| 最近の動き | `!hideV0Mock` のとき mock activity セクション |
| 通知バッジ | `hideV0Mock && !adDemo` で mock 件数 |
| あなたの作品 | `isAdScreenshotDemoEnabled()` → `StudioAdDemoOwnedPreview` に差し替え |
| 未ログイン | `shouldBypassStudioLoginOnPreview()` が section UI 内 |

### 最終形

- provider が `studioHomeViewModel`（ownedProjects, activities, rankings, notificationBadge）を返す
- UI は単一セクションコンポーネント + 空/Coming Soon は **props の copy** で表現（別コンポーネント木を切り替えない）
- ad demo は `/studio` 本体から外す（隔離ルート or layout 分岐 1 箇所）

---

## Route 3: `/studio/mypage`（最優先）

### チェーン

`StudioMypagePage` → `StudioMypageProjectsPanel` → **Panel A or B**

### ズレ（`production-mode-audit.md` 高リスク行と同型）

```
if (adDemo)        → StudioProjectsTabPanel      (mock grid)
if (hideV0Mock || hasOwned) → StudioOwnedProjectsDirectoryPanel (real)
else              → StudioProjectsTabPanel      (mock grid)
```

実績タブも `hideV0Mock` で Coming Soon ↔ mock achievements を差し替え。

### 最終形

- **常に** `StudioOwnedProjectsDirectoryPanel`（または後継の単一 Directory）
- リストは provider の `ownedProjects[]`（Preview で mock 注入は provider 内）
- ad demo は本体から削除し隔離先へ

---

## Route 4: `/games/[id]`

### チェーン

`app/games/[id]/page.tsx` → `GameDetailV0Page` → real voice layer **or** feedback-v0-modals

### ズレ

- `shouldHideV0MockContent()` を UI が直呼び（context 未使用）
- `isRealProject` で feedback モーダル木と real layer を二重保持
- voices タブ: Coming Soon ↔ `GameVoicesV0Tab`
- preview で `getGameDetailV0(id)` フォールバック継続

### 最終形

- loader/provider が `GameDetailViewModel | null` を返す（本番は Supabase のみ）
- 単一の detail shell + 単一 feedback フロー
- 404 は loader で完結

---

## 隔離・削除候補（本体導線から外す）

| ファイル / パターン | 扱い |
|---------------------|------|
| `StudioAdDemoOwnedPreview` + `isAdScreenshotDemoEnabled` in owned-projects / mypage | **Phase 2 完了（Preview 確認待ち）** — `/demo/ad-screenshot` に隔離（`4282b4a` + `0d500d0` + `44013bd`） |
| `StudioProjectsTabPanel` in mypage main flow | 削除（Directory に統一） |
| `studio-home-page` の mock section 差し替え | データ層へ |
| `game-detail-v0-page` の dual feedback stack | 統合 |

---

## 実装フェーズ（commit 分割案）

| Phase | commit 単位 | 内容 | 状態 |
|-------|---------------|------|------|
| 0 | `docs: data-layer mode boundary audit` | 本ファイル（一覧化のみ） | **完了** |
| 1 | `28749ed` | `/studio/mypage` Directory 単一化 — Panel 差し替え削除、provider でリスト供給 | **完了** |
| 2 | `4282b4a` + `0d500d0` + `44013bd` | ad demo 隔離 — 本体から `isAdScreenshotDemoEnabled` 分岐除去、`/demo/ad-screenshot` 隔離、legacy redirect 削除、Studio 読み込み中停止修正、Preview demo route 許可 | **ログイン済み Preview 確認待ち**（本番 deploy 禁止） |
| 3 | — | `/studio` home viewModel — セクション差し替えをデータ配列化 | **未着手**（Phase 2 確認後に判断） |
| 4 | — | `/home` sections from provider — mock import をページから除去 | 未着手 |
| 5 | — | `/games/[id]` viewModel + shell 統合 — 404/voice/feedback をデータ層へ | 未着手 |
| 6 | — | verify 強化 — UI 直呼び `shouldHideV0MockContent` を CI で検出（優先 4 URL） | 未着手 |

各 phase 後: `npm run verify:production-mode-guards` + `npm run build`（本番 deploy 禁止）。

---

## 完了報告テンプレ（各 phase）

- 踏んだ URL と結果
- 消えた分岐（ファイル:行 → 移動先）
- 残タスク

### Phase 2 オーナー確認（ログイン済み Preview）

| # | URL / 観点 |
|---|------------|
| 1 | `/studio` — 読み込み中で止まらない |
| 2 | `/studio/mypage` — 同上 |
| 3 | `/mypage` — ad demo 由来の特殊タブ・mock が出ない |
| 4 | `/home`・実作品詳細 — 表示崩れなし |

確認後に Phase 3 着手可否を判断。本番 deploy は Phase 2 確認完了まで禁止。
