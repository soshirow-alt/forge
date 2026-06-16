# UI 全面レビュー — P0/P1 設計案

**ステータス**: 実装完了（2026-06-16） — verify 18/18 PASS  
**前提**: prod deploy 保留 / PLAYER_VISIBLE=false / /notifications 未着手 / 本番 DB seed 禁止

---

## 1. P0 — future-demo seeder 変更案

### 現状ギャップ

| 項目 | Demo Veteran 今日 |
|------|-------------------|
| プレイヤー側 | Gold・見届け人 12・プレイ履歴厚い — **成立** |
| 開発者側 | `projects.owner_id = veteranId` が **0 本** — **空** |
| developer_profiles | Veteran 用レコード **なし** |

Veteran は NPC 作品への engagement のみ。`my-projects` / 作品管理タブが将来像レビューの半分を欠く。

### 最小充足ライン（オーナー指定）

- Veteran **所有** 6〜8 本（10 本固定不要）
- うち **Released 複数**、**Reopened 1 本以上**
- 各作品に **Devlog 複数**、**NPC Voice 複数**
- Watch / Play / Voice が絡む世界（Veteran 自身の player engagement は別系統で維持）
- **`/mypage?tab=developer`** でカードが並び、開発者密度を確認できる

### 設計方針

**既存 25 作品 + Veteran player arc は維持。** 新規 **7 本** を Veteran 所有として **追加**（additive patch）。

理由:

- staging は witness grants **append-only** — 既存 25 本削除不可
- Veteran の 12 grants / Gold は **NPC 所有 Released 12 本**への player engagement に依存
- `grant_witnesses_on_first_released` は **owner を除外** — Veteran 所有作品の Released では Veteran に grant されない（正しい）

### 追加 7 本の内訳（案）

| 属性 | 数 | 備考 |
|------|-----|------|
| 総数 | **7** | `[future-demo]` 接頭辞、`owner_id = veteranId` |
| Released | **5** | `insertReleaseEvent(..., veteranId, "released")` |
| Reopened | **1** | 5 本中 1 本を reopen → 再 Released |
| Devlog / 作品 | **4〜5** | 既存 `seedDevlogs` ロジックを index ベースで上乗せ |
| NPC Voice | **3〜4 NPC × 1〜2** | `seedNpcEngagement` — Studio フィードバック密度 |
| Veteran player engagement | **なし**（所有作品上） | 自己プレイは witness 対象外・履歴ノイズ |

**Veteran 表示名（案）**: `デモベテラン` / creator `Demo Veteran` — walkthrough と整合。

### 実装: `--patch-veteran-developer`

新 CLI フラグ（`scripts/future-demo-seed.ts`）:

```
npm run patch:veteran-developer:staging
```

**処理順**:

1. `.future-demo-world-state.json` から `veteranId` 読込（既存 world 必須）
2. `ensureDeveloperProfile(veteranId, "future-demo-veteran", "デモベテラン")`
3. 7 プロジェクト insert（新 `PROJECT_TITLE_SUFFIXES` 7 件 or 接尾辞 `·V` 系列）
4. `seedDevlogs` 相当（author = veteranId）
5. `seedNpcEngagement`（player NPC から Voice / Play / Watch）
6. 5 Released + 1 Reopened イベント
7. `saveWorldState` — meta に `veteranOwnedProjectIds` 追加
8. **冪等**: 既に patch 済みなら exit 0（再実行安全）

**触らないもの**: 既存 25 本、Veteran の 12 witness grants、player engagement パス。

### verify 追加（`future-demo-verify.ts`）

| 断言 | 閾値 |
|------|------|
| Veteran 所有 projects | ≥ 6 |
| Veteran 所有 Released | ≥ 4 |
| Veteran 所有 Reopened | ≥ 1 |
| Veteran 所有 devlogs | ≥ 20 |
| Veteran 所有 voices（NPC→Veteran 作品） | ≥ 15 |
| 既存 veteran grants | ≥ 10（回帰） |
| veteran tier | Gold（回帰） |

### npm script（案）

```json
"patch:veteran-developer:staging": "npx --yes tsx scripts/future-demo-seed.ts --patch-veteran-developer"
```

---

## 2. P1 — 標準ゲームカード設計案

### 原則

- **カード枠とサムネを同時導入** — 文字だけの行 UI をやめる
- **Forge はゲームの場所** — 小さいサムネ = ゲームの顔
- セクション間で **同じコンポーネント思想**、密度は **variant** で調整

### 既存資産

- `components/game-thumbnail.tsx` — URL または `GeneratedThumbnailPoster`（title/genre/phase から生成）
- `Game.thumbnailUrl` — 任意。未設定でも poster 生成可

### 新規: `ForgeGameCard`

**ファイル（案）**: `components/forge-game-card.tsx`

#### Props（最小）

```typescript
type ForgeGameCardVariant = "compact" | "row" | "grid";

type ForgeGameCardProps = {
  game: Game;
  variant: ForgeGameCardVariant;
  badges?: ForgeGameCardBadge[];  // 作品単位バッジ（関係性）
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  meta?: string;                  // 例: 正式版リリース日
  showCreator?: boolean;
  showGenre?: boolean;
};
```

#### 共通レイアウト（全 variant）

```
┌─────────────────────────────────────────┐
│ [サムネ 64–80px] │ 作品名               │
│  aspect-square   │ ジャンル             │
│  or 4:3 mini     │ [バッジ][バッジ]     │
│                  │ [主要CTA] 詳細 →     │
└─────────────────────────────────────────┘
```

| 要素 | 仕様 |
|------|------|
| サムネ | `GameThumbnail` compact、`aspect-[4/3]`、`w-16`〜`w-20`、`showStatus=false` |
| 作品名 | `truncate`，link `/games/{id}` |
| ジャンル | `text-xs text-zinc-500` |
| 作品単位バッジ | 既存 chip スタイル（プレイ履歴 badges と同系） |
| 主要アクション | セクション依存（プレイ / 更新を見る 等） |
| 詳細リンク | テキストリンク **作品を見る →** |

#### Variant 密度

| Variant | 用途 | サムネ | 行高 |
|---------|------|--------|------|
| `compact` | ダッシュボード preview（2 件） | 16×12 相当 | 低 |
| `row` | プレイ履歴折りたたみ、更新リスト | 20×15 相当 | 中 |
| `grid` | 正式版セクション | 全幅 mini + 下テキスト | 低（グリッドセル） |

### セクション別マッピング

| セクション | variant | バッジ例 | 主要アクション |
|------------|---------|----------|----------------|
| プレイ履歴（折りたたみ） | `row` | 見届け人 / 声 / 更新 / 複数版 / プレイ済み | （展開 toggle のみ） |
| 更新を追っている | `compact` → 展開 `row` | 更新を追う | もう一度プレイ |
| 応援中 | 同上 | 応援中 | 作品を見る |
| 正式版に到達 | `grid` | 見届け人 / 正式版 | 詳細のみ |

**プレイ履歴展開** — タイムラインは現状維持。折りたたみヘッダのみ `ForgeGameCard` 化。

**更新セクション** — 現 `article` を `ForgeGameCard` + 見出し（プレイヤー視点）に置換。

---

## 3. 正式版セクション再設計案

### 現状の問題

- 1 作品 1 巨大カード（teal witness / dl 詳細）
- 全件常時展開 — 縦に伸びる
- 「最後まで見届けました」見出し — 全員 witness なら冗長
- 情報密度低（grant 詳細 dl、イベント数説明）

### 方向（オーナー指定）

| 項目 | 変更 |
|------|------|
| 初期状態 | **折りたたみ**（`<details>` または section 内 toggle） |
| 配置 | プレイヤータブ **下部寄せ**（`mypage-player-tab.tsx` で順序変更） |
| カード | **小型 grid** — `ForgeGameCard variant="grid"` |
| 削除 | `WITNESS_PLAYER_HEADLINE`（最後まで見届けました）、`WitnessGrantDetails` dl |
| 表示 | サムネ / 作品名 / **正式版リリース日** / 作品バッジ / 詳細リンク |

### レイアウト案

```
正式版に到達した作品          [見届け人 Gold]（セクション tier のみ）
折りたたみ: 12 作品 ▼

（展開時）
┌──────┐ ┌──────┐ ┌──────┐
│thumb │ │thumb │ │thumb │
│ title│ │ title│ │ title│
│ date │ │ date │ │ date │
│ 🏅   │ │ 🏅   │ │      │
│ 詳細 │ │ 詳細 │ │ 詳細 │
└──────┘ └──────┘ └──────┘
  sm:grid-cols-2  lg:grid-cols-3
```

- **見届け人バッジ**: grant がある作品のみ 🏅（作品単位）
- **正式版リリース日**: `firstReleasedAt` / `firstReleasedLabel`
- **tier バッジ**: セクション見出し横に 1 つだけ（既存 `resolveWitnessTier`）
- witness / non-witness **カード型統一** — teal 枠の二重体系を廃止

### 順序変更（player tab）

```
1. VoiceAdoptionsSection（現状）
2. PlayHistorySection
3. Updates + 応援中 / 更新を追う / あとで見る（grid）
4. OfficialReleaseSection  ← 最下部
```

---

## 4. 実装範囲（フェーズ分割）

### フェーズ A — 軽微 UI（GO 済み・止まらず可）

| 項目 | ファイル |
|------|----------|
| タブ名称 | `mypage-page.tsx` — 遊んだゲーム / 作ったゲーム |
| ヘッダー説明文 | 同上（候補に合わせ微調整） |

### フェーズ B — P0 seeder（オーナー確認後）

| 項目 | ファイル |
|------|----------|
| `--patch-veteran-developer` | `future-demo-seed.ts`, `future-demo-lib.ts` |
| verify 断言 | `future-demo-verify.ts` |
| npm script | `package.json` |
| walkthrough 更新 | `future-demo-walkthrough.md` §4–5 |

**Out**: 本番 DB / `--fresh` 再 seed

### フェーズ C — P1 標準カード（オーナー確認後）

| 項目 | ファイル |
|------|----------|
| `ForgeGameCard` 新規 | `components/forge-game-card.tsx` |
| プレイ履歴 | `play-history-section.tsx` |
| 応援 / 追跡 / bookmark | `mypage-player-tab.tsx`, `mypage-dashboard-card.tsx` |
| 更新 | `mypage-updates-section.tsx` |

### フェーズ D — 正式版再設計（オーナー確認後・C と同 PR 可）

| 項目 | ファイル |
|------|----------|
| grid + 折りたたみ | `official-release-section.tsx` |
| 下部配置 | `mypage-player-tab.tsx` |
| witness 巨大カード削除 | `official-release-section.tsx` |

### 停止（全フェーズ共通）

- `vercel deploy --prod`
- `PLAYER_VISIBLE=true`
- `/notifications` 文言
- ランキング / 見届け人数表示
- 本番 DB seed

---

## 5. build / verify / walkthrough 確認手順

### ローカル build

```bash
npm run build
npx tsc --noEmit
```

### P0 後（staging のみ）

```bash
npm run patch:veteran-developer:staging
npm run verify:future-demo:staging
```

**期待**:

- verify 既存 13/13 + Veteran 開発者断言 PASS
- Veteran grants / Gold 回帰 PASS

### P1 後 — UI 目視（Veteran）

ログイン: `veteran@forge-future-demo.local` / `ForgeDemo!Veteran2026`

| # | URL | 確認 |
|---|-----|------|
| 1 | `/mypage` | タブ「遊んだゲーム」「作ったゲーム」 |
| 2 | `/mypage?tab=developer` | 7 作品カード、Released/Reopened 混在 |
| 3 | `/mypage#play-history` | サムネ付き row カード + 関係性バッジ |
| 4 | `#supported` / `#watching` | 統一 compact カード + サムネ |
| 5 | `#updates` | サムネ + プレイヤー見出し |
| 6 | `#official-release`（最下部） | 折りたたみ → grid、冗長見出しなし |

### Walkthrough 正本

`docs/future-demo-walkthrough.md` §5 — 開発者タブ確認ステップを **必須** に格上げ。

### デプロイ

- preview deploy のみ（`npx vercel deploy`）
- **prod deploy 禁止** — UI 全面レビュー完了 + オーナー GO まで

---

## オーナー確認ポイント

1. **P0**: additive 7 本 patch でよいか（25 本削らない）
2. **P1**: `GeneratedThumbnailPoster` でサムネ不足を当面カバーしてよいか（実画像 URL は後回し可）
3. **正式版**: witness grant dl 削除 — tier はセクション見出しのみでよいか
4. **実装順**: A（タブ）→ B（P0 patch）→ C+D（カード + 正式版）でよいか
