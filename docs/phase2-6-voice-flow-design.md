# Phase2 #6 — プレイ後初声導線 詳細設計

> ステータス: **実装済**（deploy 前）  
> 優先順位: **#5 完了 → #6 → #3**（オーナー判断 2026-06-15）  
> スコープ: プレイヤー初声導線 + 選択肢アフォーダンス。**#3 / 育成ハブ本格 / AI / 変化を見る は含まない**

---

## 0. 背景（本番確認フィードバック）

| 論点 | 内容 | #6 で扱う |
|---|---|---|
| 開発者導線 | サイドバー「編集する」がプレイヤー画面に混在。詳細→育成ハブ→編集は **Phase3** | サイドバー状態設計で ** interim 整理** のみ |
| 初声導線 | 「返事を届ける」まで遠い・弱い | **本丸** |
| 選択肢 UI | 選択後色差は OK。**未選択が押せる UI に見えない** | VoicePromptCard 未選択状態 |

---

## 1. 現状構造（問題の整理）

### 1-A. main 列（プレイ後・ログイン済）

```
Overview
PostPlayFeedbackBanner     ← CTA「返事を届ける」（scroll）
新版バナー
説明
みんなの声
開発の歩み
GameVoiceSection           ← 初声フォーム（最下部付近）
```

**問題**: バナー CTA とフォームの間に 4 ブロック。scroll 後も「ここで答える」と直感しづらい。

### 1-B. サイドバー（lg 以上・sticky）

```
[プレイする | 感想を届ける]  primary
もう一度プレイ / watch / bookmark / 編集する(canEdit)
```

**問題**:

- `played && !voiceComplete` でも「感想を届ける」だが、初声未完了状態が見えない
- `voiceComplete` 後も同じ CTA のまま（状態不一致）
- オーナーが自分の作品を見ると **返事 CTA と 編集** が同列（開発者導線混在 → Phase3 で本格整理）

### 1-C. モバイル（`< lg`）

- grid 1 列 → **main 全文 → その後 sidebar**
- サイドバー sticky は効きにくい
- 初声フォームは main 最下部。バナーからフォームまでスクロール長い

### 1-D. VoicePromptCard 未選択ボタン

```tsx
// 未選択: border-zinc-800 bg-zinc-900/60 text-zinc-400
// hover: border-zinc-700 — 差が小さく「タグ/ラベル」に見える
```

---

## 2. 原典コアループとの整合

| 原典 | #6 設計での扱い |
|---|---|
| プレイ → 声を届ける | **厳守**。プレイ前に初声フォーム本体は出さない |
| 初声完了 = 1 問以上回答 | サイドバー状態 `voice_complete` で反映 |
| 深い改善材料は任意・折りたたみ | 現状維持。初声完了後も下部 |
| 「評価/アンケート」禁止 | copy は「返事を届ける」維持 |
| 詳細直後に迫らない | 未プレイ時は文言のみ（現状 OK） |
| 応援 ≠ 初声 | サイドバーで GameSupport は CTA 下・視覚的 secondary のまま |

**NG（#6 でもやらない）**

- プレイ前に初声フォーム表示
- 全問回答の強制
- プレイ前に「返事を届ける」primary

---

## 3. UX 設計 — 全体像

### 3-A. ページレベル状態（新規）

```typescript
type PlayerVoiceFlowState =
  | "not_played"       // 未ログイン or 未プレイ
  | "played_pending"   // プレイ済・初声未完了
  | "voice_complete";  // 初声完了（1+ 回答）
```

**取得**:

- `played`: 既存 `hasPlayedGame`
- `voice_complete`: `getMyVoiceResponses` → `hasInitialVoiceComplete`（GameVoiceSection から **親へ lift**）

**親コンポーネント**: `game-detail-page-client.tsx` が state を保持し、Sidebar / Banner / 列順序に渡す。

### 3-B. main 列 — 条件付き並び替え（中核）

| 状態 | main 列順序 |
|---|---|
| `not_played` | **現状維持**（Overview → … → 初声 placeholder 文言） |
| `played_pending` | Overview → **PostPlayBanner** → **GameVoiceSection** → 説明 → みんなの声 → devlog |
| `voice_complete` | Overview → **Success カード（コンパクト）** → 説明 → みんなの声 → devlog → （深い FB 折りたたみ） |

**意図**: プレイ直後は **バナーの次がフォーム**。理解・集計・履歴はその後。

**voice_complete 時**: フルフォームは非表示。成功メッセージのみ（現 GameVoiceSection 完了 UI を上寄せ）。

### 3-C. PostPlayFeedbackBanner 強化

```
┌ プレイありがとう ─────────────────────────────┐
│ 開発者からの質問に、短く返事を届けてください   │
│                                              │
│ 「{先頭問いの promptText 1行}」              │  ← 追加
│                                              │
│ [ 返事を届ける ]  → scroll to #game-voice    │
│ 1つ答えるだけでOK                            │
└──────────────────────────────────────────────┘
```

- `getVersionPrompts` の先頭 1 問を表示（親で 1 回 fetch し Banner + Sidebar に共有）
- ボタンラベル: **「返事を届ける」**（sidebar と統一。原典 copy）

### 3-D. サイドバー状態設計

#### 状態別 UI

| 状態 | Primary CTA | Secondary | 補足 |
|---|---|---|---|
| **not_played** | プレイする | — | 未ログイン時「ログインしてプレイ」 |
| **played_pending** | **返事を届ける**（scroll） | もう一度プレイ | 先頭問い 1 行プレビュー + 「1つ答えるだけでOK」 |
| **voice_complete** | **返事を届けました ✓**（disabled/muted、非リンク） | もう一度プレイ | 「もっと詳しく伝えたい」→ scroll to deep FB |

#### 開発者（canEdit）— interim（Phase3 前）

**#6 でやる（小）**:

- 「編集する」を primary CTA ブロックから **分離**
- `canEdit` 時: サイドバー下部に **「開発者メニュー」折りたたみ** または secondary リンク群
  - `/my-projects` へ（文言: **作品を育てる**）
  - `編集する` はその中（詳細→編集直リンクは残すが primary から降格）

**Phase3 でやる（本格）**:

- 詳細 → 育成ハブ → 編集
- プレイヤー視点画面から編集を完全非表示

---

## 4. 選択肢の「押せそう感」改善（VoicePromptCard）

**方針**: 選択**後**の見た目は大きく変えない。未選択のアフォーダンスのみ強化。

### 4-A. 未選択ボタン（choice / yes_no / scale_3 / replay_intent 共通）

| 改善 | 内容 |
|---|---|
| 補助文 | 選択式問いの options 上に **「ひとつ選んでください」**（`text-xs text-zinc-500`） |
| cursor | `cursor-pointer` 明示 |
| 未選択見た目 | `border-zinc-600/80` + `bg-zinc-800/80` + `text-zinc-300`（現状より 1 段コントラスト up） |
| hover | `hover:border-orange-500/30 hover:bg-zinc-800 hover:text-zinc-100` + `transition-colors` |
| サイズ | `min-h-[40px] px-4` — タップ領域確保 |
| フォーカス | `focus-visible:ring-2 focus-visible:ring-orange-500/40`（キーボード） |
| 選択済 | **現状維持**（orange border/bg） |

### 4-B. CTA との視覚階層

- 問い内選択肢: **outline ボタン**（中）
- セクション下部「返事を届ける」: **gradient solid**（最強）— 現状維持
- 選択肢を gradient にしない（CTA との競合回避）

### 4-C. 開発者プレビュー（#5）

- `DeveloperChoicePreview` は非操作 `<span>` のまま（プレイヤー UI とは別。混同防止）

---

## 5. モバイル影響

### 5-A. 現状リスク

- 1 列レイアウト → sidebar は **ページ最下部**
- sticky sidebar CTA は実質効かない
- 初声フォームが main 最下部だった場合、スクロールが長い

### 5-B. #6 対応

| 施策 | 内容 |
|---|---|
| **main 列 reorder** | `played_pending` 時、Banner 直下に GameVoiceSection → **モバile でも最優先** |
| **Banner** | モバile でも先頭問い 1 行 + CTA（scroll） |
| **Sticky bottom bar（推奨）** | `played_pending` かつフォームが viewport 外のとき、下部固定 **「返事を届ける」**（scroll）。desktop では非表示 |
| **sidebar** | モバile では CTA 重複を避け、sidebar の primary を **プレイ/再プレイ + watch** に寄せ、返事は Banner + bottom bar + フォームに集約 |

### 5-C. タップ

- 選択肢 `min-h-[40px]` — 44px 近傍
- bottom bar とフォーム submit の二重 gradient は **bottom bar = scroll only**、submit はフォーム内

---

## 6. 実装案

### 6-A. 新規 / 変更ファイル（見込み）

| ファイル | 変更 |
|---|---|
| `game-detail-page-client.tsx` | `PlayerVoiceFlowState` lift、列 reorder、prompts prefetch |
| `game-detail-sidebar.tsx` | 状態別 CTA、canEdit interim、先頭問い preview |
| `post-play-feedback-banner.tsx` | 先頭問い表示、copy 調整 |
| `game-voice-section.tsx` | `onVoiceStateChange` callback、完了 UI を親制御可能に |
| `voice-prompt-card.tsx` | 未選択アフォーダンス + 補助文 |
| `components/post-play-voice-sticky-cta.tsx` | **新規（任意）** モバile bottom bar |
| `lib/player-voice-flow-state.ts` | **新規** 状態型 + helper（任意） |

**触らない**: DB、migration、問い editor（#3）、my-projects 本格 IA（Phase3）

### 6-B. データフロー

```
GameDetailPageClient
  ├─ fetch prompts + voice responses (once)
  ├─ derive PlayerVoiceFlowState
  ├─ PostPlayFeedbackBanner(firstPrompt)
  ├─ GameVoiceSection(onStateChange)  ← played_pending 時はここに配置
  ├─ … description, voices, devlog …
  └─ GameDetailSidebar(state, firstPrompt, onScrollToVoice)
```

### 6-C. migration

**なし**

---

## 7. 工数感

| 塊 | 工数 |
|---|---|
| 状態 lift + main reorder + Banner | 1〜1.5 日 |
| Sidebar 3 状態 + canEdit interim | 0.5〜1 日 |
| VoicePromptCard アフォーダンス | 0.25〜0.5 日 |
| Mobile sticky bottom bar（推奨） | 0.5 日 |
| regression（未プレイ/完了/オーナー視点） | 0.5 日 |
| **合計** | **2.5〜3.5 日** |

**分割 deploy 案（Phase1 同様）**:

1. **#6a**: main reorder + Banner + Sidebar 状態（アフォーダンス除く）
2. **#6b**: VoicePromptCard + mobile sticky bar

---

## 8. 本番確認手順（#6 GO 後）

### プレイヤー（別アカウント）

1. 未プレイ: 初声フォーム非表示、プレイ CTA のみ
2. プレイ後: Banner に先頭問い + その直下に初声フォーム
3. サイドbar（desktop）: 「返事を届ける」+ 問い preview
4. choice 問い: 「ひとつ選んでください」、hover で反応、タップで選択
5. 1 問回答 → 返事を届ける → 成功 → sidebar「返事を届けました ✓」
6. モバile: Banner 直下フォーム、bottom bar（実装時）

### 開発者（オーナー・自分の作品）

7. canEdit: 「編集する」が primary CTA と混在しない（interim 配置）
8. 自分の作品でもプレイ → 声の導線はプレイヤーと同じ

---

## 9. スコープ外（#6 に含めない）

- #3 テンプレート / 回答形式分離
- 「自由記述（短文）」→「自由記述」
- my-projects 育成ハブ本格（Phase3 #1）
- AI 集約 / 変化を見る UI
- プレイ前初声 / 全問強制

---

## 10. Phase3 への引き継ぎメモ

- 詳細 sidebar から **編集直リンクを外し**、`/my-projects` 育成ハブ経由のみ
- 開発者の「次にやること」を my-projects で提示
- #6 interim の「開発者メニュー」は Phase3 で育成ハブ CTA に置換
