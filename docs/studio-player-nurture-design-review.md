# 設計レビュー — Studio Hero 統合 + プレイヤー「育ててる感」

**ステータス**: P0/P1 **実装済み**（2026-06-16） / P2 AI 採用体験は `docs/player-voice-adoption-ai-design-review.md`（設計のみ）  
**トリガー**: 本番画面レビュー — Hero と育成サイクルの二重感、プレイヤー更新 UI の価値不明瞭

**原典参照**: `docs/forge-principles.md` — プレイヤーサイクル「声を届ける → **変化を見る** → 再プレイ」

---

## 現状診断（なぜ伝わらないか）

### Studio（開発者）

| 問題 | 原因（コード / UI） |
|------|---------------------|
| 上と下で同じことを言っている | Hero の `heroTitle` が**イベント**（「回答が届きました」）、サイクルが**工程名**（「ゲームを修正する」）。読了後も Hero タイトルがイベントのまま |
| 今どの工程か分からない | 「次にやること」見出し + 別ブロック「育成サイクル」。進捗 rail が Hero から視覚的に切れている |
| 「次: プレイヤーの回答が届きました」 | `project-list-card` が `display.heroTitle` を「次:」に流用。工程ではなく**状態ログ**になっている |
| Forge 内で直せそう | CTA「ゲームを修正する」が primary ボタン＝アプリ内アクションに見える（モーダルはあるが Hero 単体では不明） |

正本: `lib/project-growth-state.ts` `buildNurtureDisplayContext`, `components/game-growth-cycle.tsx`

### プレイヤー

| 問題 | 原因 |
|------|------|
| 何が変わったか分からない | カードに通知 `message` + 「変更の要点: devlog 抜粋」。開発者メモがそのまま見える |
| 自分の回答と関係不明 | プレイヤー ID と更新の因果を UI が示さない（DB も未連携） |
| なぜ見るか不明 | セクション説明が「devlog と新版の変更要点」（開発者語） |
| 育てている感がない | リンクが「開発の歩みを見る」「作品詳細へ」＝**閲覧導線**で、再プレイ・参加の闭环が弱い |
| 抽象語 | `開発日誌` / `開発の歩み` / `変更の要点` / `新しいプレイ可能版`（`getNotificationTypeLabel`） |

正本: `components/mypage-updates-section.tsx`, `components/game-project-history-section.tsx`

---

## 1. Studio Hero + 育成サイクル統合案

### 推奨: **単一「フェーズパネル」**（Hero = 現在工程 + アクション、Rail = 同パネル内の進捗）

**「次にやること」と「育成サイクル」を別セクションにしない。**

```
┌─ フェーズパネル（1ブロック）────────────────────────────┐
│  [●回答][○修正][○記録][○公開][○待つ]  ← 5段 rail（常時・コンパクト） │
│       ↑ current                                           │
│                                                           │
│  いま: ゲームを修正する          ← 工程名のみ（イベント語禁止）      │
│                                                           │
│  回答は確認済みです。手元の開発環境で直してください。              │
│  終わったら Forge で変更内容を記録し、新版を公開します。           │
│                                                           │
│  [ 修正の進め方を見る ]  [ 記録に進む → ]   ← primary / secondary │
└───────────────────────────────────────────────────────────┘

（その下）プレイヤーの回答 — 集計（参照用、Hero と競合しない）
```

### 設計原則

1. **Hero タイトル = 常に現在フェーズ名**（`NURTURE_STEPS[currentPhase].label`）
2. **サブコピー = そのフェーズで何をするか**（Forge 内 / Forge 外を1文で区別）
3. **Rail = フェーズパネル上部** — 「別の育成サイクル」見出しを廃止
4. **イベント**（回答が届いた等）は rail の ✓ やバッジ、またはサブコピー1行に降格
5. **CTA はフェーズに1 primary + 最大1 secondary** — サイクルクリックは詳細パネル（補助）

### Hero から削除するもの

- 見出し「次にやること」（フェーズ名が主語になるため冗長）
- 独立した `border-t` 付き「育成サイクル」ブロック
- イベント語を `heroTitle` に置くパターン（例: 「プレイヤーの回答が届きました」）

### クリック挙動

- Rail 各段: 詳細パネル展開（現状維持）+ `cursor-pointer`
- Primary CTA: フェーズのアクションのみ
- **Rail と CTA のラベルを一致させる**（同じ工程を二つの言い方で言わない）

---

## 2. 開発者フローの状態定義

### フェーズ（5段 — サイクル rail と1:1）

| phaseId | 表示名 | 進入条件（現行 data モデル） | Forge でやること | Forge 外 |
|---------|--------|------------------------------|------------------|----------|
| `read` | 回答を見る | `feedback_pending` && !voiceRead | 回答確認・読了 | — |
| `improving` | ゲームを修正する | `feedback_pending` && voiceRead | 修正メモ（任意） | **ゲーム本体の修正** |
| `record` | 変更内容を記録する | devlog 下書きなし & voice 処理済み、または明示「修正完了」後 | devlog 作成 | — |
| `publish` | 新版を公開する | `devlog_unpublished`（記録済み・未公開） | 版公開 UI | — |
| `wait` | 反応を待つ | `no_feedback` / `published_waiting` | プレビュー・公開状態確認 | — |

### 現行 `dataPhase` との対応（実装時）

| dataPhase | voiceRead | フェーズ |
|-----------|-----------|----------|
| `no_feedback` | — | `wait` |
| `feedback_pending` | false | `read` |
| `feedback_pending` | true | `improving` |
| `devlog_unpublished` | — | `publish`（記録済み前提。draft のみなら `record` 要検討） |
| `published_waiting` | — | `wait` |

### 追加検討（GO 時）

- **`record` と `publish` の分離**: 現状 `devlog_unpublished` が両方に使われている。下書きあり・版未公開 = `publish`、voiceRead 後 devlog 未作成 = `record` と分けると Hero が明確になる
- **`improving` 完了の明示**: MVP では devlog 作成 or secondary CTA「記録に進む」で十分。将来「修正完了チェック」は optional

### 作品一覧カードの「次:」

**廃止または置換:**

- ❌ `次: プレイヤーの回答が届きました`
- ✅ `いま: ゲームを修正する` またはバッジのみ（新しい回答 N件 / 記録待ち / 公開待ち）

---

## 3. 「ゲームを修正する（Forge外）」の UI 伝え方

### 方針

- **Forge が修正機能を持っているように見せない**
- **工程として必須**であることはフェーズ名で明示

### 推奨 UI パターン

| 要素 | 推奨文言 / 表現 |
|------|------------------|
| フェーズ名 | ゲームを修正する |
| フェーズ補助 | 小ラベル **Forge の外** または 🔧 外部（rail の improving 下に1行） |
| 説明文 | 「Forge ではゲームファイルは直せません。Unity 等の開発環境で修正してください。」 |
| Primary CTA | **修正の進め方を見る**（モーダル。In-app 編集に見えない） |
| Secondary CTA | **修正が終わった → 変更を記録する**（`/devlog/new`） |
| モーダル | 現行内容を維持しつつタイトル **Forge の外でゲームを直す** も検討 |

### やらない

- Primary を「ゲームを修正する」単体ボタン（アプリ内エディタ連想）
- 修正完了を Forge 上で必須チェック（MVP 過剰）

---

## 4. プレイヤー側「育ててる感」UI 案

### コンセプト

原典: **変化を見る** = 自分の声 → 作品の変化 → 再プレイ

プレイヤーに見せるストーリー:

```
あなたが遊んだ / 答えた
    ↓
作品が更新された（版 or 内容）
    ↓
もう一度遊べる
```

### セクション再命名

| 現状 | 推奨 |
|------|------|
| 更新を見る | **前回プレイ後の更新** または **あなたの参加で変わったこと** |

オーナー判断用メモ: 後者は因果が強いが DB 未連携時はやや先走り。**MVP 推奨は「前回プレイ後の更新」**（事実ベース）。追跡中作品全体の更新フィードとして honest。

### 更新カード（1件）

```
┌─────────────────────────────────────────┐
│ [新版]  パルス回路 · v0.2    6/10      │
│                                         │
│ 新しい版が公開されました。               │
│ ジャンプの操作感を調整しました。         │  ← devlog 1行要約（「変更の要点」ラベルなし）
│                                         │
│ [ もう一度プレイする ]  [ 更新の詳細 ]   │
└─────────────────────────────────────────┘
```

- **Primary 常に再プレイ** — 育てている感 = ループの再入
- **Secondary** = 作品詳細のプレイヤー向け更新ブロックへ（`#updates` 新設 or 既存 history を player copy に）

### 参加との関連（MVP / 将来）

| 段階 | 内容 |
|------|------|
| MVP（DB 追加なし） | 「この作品はプレイヤーの声をもとに更新されています」共通1行。版公開カードで「新しい質問に答えられます」 |
| MVP+ | ユーザーが voice 回答済み作品に **あなたも答えました** バッジ |
| 将来 | devlog に「参考にした声」メタ（Out of scope 検討） |

### 作品詳細 `/games/{id}` プレイヤー向け

| 現状 | 推奨 |
|------|------|
| 開発の歩み | **この作品の更新**（オーナー以外） |
| 開発ログを書く | オーナーのみ（現状維持） |

---

## 5. 「更新を見る」カード再設計案

### データソース（変更なし）

- watcher 通知（devlog / version_published）
- devlog fallback

### 表示レイヤー（新規: プレイヤー向けラベルマップ）

| kind | 旧 label | 新 badge | 新 headline |
|------|----------|----------|-------------|
| version_published | 新しいプレイ可能版 | **新版** | 新しい版が公開されました |
| devlog | 開発日誌 | **更新** | 作品が更新されました |

### リンク

| 旧 | 新 |
|----|-----|
| 開発の歩みを見る | **更新の詳細** → `/games/{id}#player-updates` |
| 新版の内容を見る | 同上 or 版バナー anchor |
| 作品詳細へ | 廃止（Primary がプレイ） |
| 新版をプレイして回答 | **もう一度プレイする**（Primary） |

### カード全体

- クリック可能領域を明確化: Primary ボタン + カード hover（optional）に `cursor-pointer`
- 説明段落「追跡中作品の devlog と…」**削除**（セクション名で足りる）

---

## 6. 変更すべき文言一覧

### Studio / 開発者

| 場所 | 現状 | 推奨 |
|------|------|------|
| Hero 見出し | 次にやること | **削除**（フェーズパネルに統合） |
| Hero タイトル | プレイヤーの回答が届きました（読了後も） | **いま: {フェーズ名}** |
| Hero サブ | 次はゲームを修正しましょう | フェーズ別ガイド文（Forge 内/外） |
| Primary CTA | ゲームを修正する | **修正の進め方を見る** |
| Secondary | （なし） | **修正が終わった → 変更を記録する** |
| サイクル見出し | 育成サイクル | **削除**（rail のみ） |
| 作品カード | 次: {heroTitle} | **いま: {フェーズ名}** |
| studio ヘッダー | 現在: {heroTitle} | **いま: {フェーズ名}** |

### プレイヤー

| 場所 | 現状 | 推奨 |
|------|------|------|
| マイページセクション | 更新を見る | **前回プレイ後の更新** |
| セクション説明 | devlog と新版の変更要点 | **削除** |
| 通知 type 表示 | 開発日誌 / 新しいプレイ可能版 | **更新** / **新版** |
| カードサマリラベル | 変更の要点: | **削除**（本文のみ） |
| リンク | 開発の歩みを見る | **更新の詳細** |
| リンク | 作品詳細へ | **削除**（Primary に統合） |
| 作品詳細 | 開発の歩み | **この作品の更新**（非 owner） |

---

## 7. cursor:pointer 対象一覧

**方針**: すべての `<button>`, `<Link>`, `[role=button]`, クリック可能 rail に `cursor-pointer` を明示。`cursor-default` は disabled のみ。

| コンポーネント | 要素 | 現状 |
|----------------|------|------|
| `game-growth-cycle.tsx` | サイクル rail button | button だが class 未指定 |
| `game-growth-cycle.tsx` | Primary / Read CTA | 同上 |
| `project-list-card.tsx` | 作品を更新する Link | 未指定の可能性 |
| `mypage-updates-section.tsx` | カード内 Link | 未指定 |
| `mypage-dashboard-card.tsx` | さらに表示 button | 未指定 |
| `mypage-page.tsx` | タブ button | 未指定 |
| `project-nurture-actions.tsx` | 補助 Link 行 | hover のみ |
| `forge-header.tsx` | ナビ Link | 未指定 |
| `modify-game-explanation-modal.tsx` | わかった button | OK |
| `game-detail-sidebar.tsx` | 作品を更新する | 要確認 |
| `notifications-page.tsx` | 通知カード Link | 要確認 |
| `MyPageCompactGameList` | カード Link | 要確認 |

**実装時**: `app/globals.css` に `@layer components { a, button:not(:disabled) { @apply cursor-pointer; } }` も検討（一括）。ただし textarea / 非クリック label は除外。

---

## 8. 実装時の変更ファイル見込み

| 優先 | ファイル | 変更内容 |
|------|----------|----------|
| P0 | `lib/project-growth-state.ts` | フェーズモデル、`NurtureDisplayContext` 再設計、カード用 `getPhaseLabel` |
| P0 | `components/game-growth-cycle.tsx` | Hero+Rail 統合コンポーネント、CTA 二段 |
| P0 | `components/project-list-card.tsx` | 「いま:」表示、バッジ整合 |
| P0 | `components/project-studio-page.tsx` | ヘッダー「現在:」修正 |
| P1 | `components/mypage-updates-section.tsx` | カード再設計、ラベルマップ |
| P1 | `lib/notifications.ts` | プレイヤー向け type ラベル（別関数推奨） |
| P1 | `components/game-project-history-section.tsx` | 非 owner タイトル |
| P1 | `components/modify-game-explanation-modal.tsx` | タイトル / CTA トリガー名整合 |
| P2 | `app/globals.css` または各所 | cursor:pointer |
| P2 | `components/notifications-page.tsx` | プレイヤー向けリンク文言 |
| 任意 | `lib/project-nurture-links.ts` | `#player-updates` anchor 追加 |

**DB migration**: なし（MVP）

---

## 9. 実装優先順位

| 順位 | テーマ | 理由 |
|------|--------|------|
| **1** | Studio フェーズパネル統合 + 状態モデル | 開発者の最大 pain。「で、何をすれば」 |
| **2** | Forge 外修正の CTA / ラベル | 誤解防止 + フェーズ2への導線 |
| **3** | 作品カード「次:」修正 | studio と一覧の用語統一 |
| **4** | プレイヤー更新セクション再設計 | コア価値「変化を見る」 |
| **5** | 作品詳細のプレイヤー向け更新ブロック rename | マイページからの secondary 先 |
| **6** | cursor:pointer 一括 | UX 磨き（独立 batch 可） |

**1〜3 は同一 PR 推奨**（Hero / rail / カードが同じ `buildNurtureDisplayContext` に依存）

---

## 10. やらない方がいいこと

- 「更新を見る」「開発の歩み」を**削除だけ**する
- 「作品詳細へ」を別名リンクとして残す
- 説明ブロックを増やして理解させる（前回「3つのリストの違い」削除方針と同じ）
- Hero と Rail を**別々に**文言だけ直す（再び二重化）
- Forge 内ゲームエディタ / ファイルアップロードの示唆
- プレイヤーに devlog / 開発日誌 / 変更の要点 を見せ続ける
- 「あなたの回答が反映されました」の**因果断言**（DB 未連携のまま）
- AI 要約 / 参考にした声の自動生成（スコープ外）
- 新規ルート `/player/updates`（マイページ内で足りる）

---

## GO 判断のためのオーナー確認事項

1. プレイヤーセクション名: **「前回プレイ後の更新」** vs **「あなたの参加で変わったこと」**
2. improving の Primary: **「修正の進め方を見る」** で OK か
3. `record` / `publish` フェーズを devlog 状態で分けるか（Hero 精度）
4. 作品詳細の「開発の歩み」→「この作品の更新」リネーム GO か

---

## 関連

- 前回 Studio 文言 batch: `docs/forge-changelog.md` 2026-06-16
- 原典プレイヤーサイクル: `docs/forge-principles.md`
