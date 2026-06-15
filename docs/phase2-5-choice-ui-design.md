# Phase2 #5 — カスタム選択肢 UI 詳細設計

> ステータス: 設計レビュー待ち（実装 GO 前）  
> スコープ: #5 のみ。#3 / #6 / 「自由記述」rename は含まない。

---

## 1. UI モック

### 1-A. 開発者 — 問いカード内（回答形式 = カスタム選択肢）

```
┌─ 問い 1 ───────────────────────────────────────────── [削除] ─┐
│ 質問文                                                       │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ どの武器が使いやすかった？                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ 回答形式                                                     │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ カスタム選択肢                                      ▼   │ │
│ └──────────────────────────────────────────────────────────┘ │
│ 2〜4個の選択肢を設定                                         │
│                                                              │
│ 選択肢数                                                     │
│ ┌──────────┐                                                 │
│ │ 3     ▼  │   ← select: 2 / 3 / 4                          │
│ └──────────┘                                                 │
│                                                              │
│ 選択肢1                                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 武器A                                                    │ │
│ └──────────────────────────────────────────────────────────┘ │
│ 選択肢2                                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 武器B                                                    │ │
│ └──────────────────────────────────────────────────────────┘ │
│ 選択肢3                                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 武器C                                                    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ プレイヤーにこう見える（プレビュー） ─────────────────┐ │
│ │ どの武器が使いやすかった？                               │ │
│ │ [ 武器A ]  [ 武器B ]  [ 武器C ]   ← 非操作・muted      │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 1-B. バリデーションエラー時（保存前・カード内）

```
│ 選択肢2                                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │                                                          │ │  ← border-red
│ └──────────────────────────────────────────────────────────┘ │
│ ⚠ 選択肢2を入力してください（2個以上必要です）              │
```

### 1-C. プレイヤー — 作品詳細 初声（変更なし・参考）

```
┌─ v0.1 への返事 ─────────────────────────────────────────────┐
│ どの武器が使いやすかった？                                   │
│ [ 武器A ]  [ 武器B ]  [ 武器C ]   ← VoicePromptCard 既存   │
│                         [ 返事を届ける ]                   │
└──────────────────────────────────────────────────────────────┘
```

**#5 でプレイヤー UI は変更しない**（`VoicePromptCard` のボタン列は現状維持）。

---

## 2. 状態管理案

### 2-A. Draft 型（`lib/version-prompt-form.ts`）

```typescript
export type DeveloperPromptDraft = {
  clientId: string;
  id?: string;
  promptText: string;
  responseKind: VersionPromptResponseKind;
  /** choice 用: 2 | 3 | 4（未設定時 3） */
  choiceCount?: number;
  /** choice 用: 長さ = choiceCount。各要素が選択肢ラベル */
  choiceOptions?: string[];
  /** @deprecated 読み込み互換のみ。新規入力では使わない */
  choiceLabels?: string;
};
```

### 2-B. 初期化ルール

| イベント | 処理 |
|---|---|
| 回答形式を `choice` に変更 | `choiceCount: 3`, `choiceOptions: ["", "", ""]` |
| 他形式 → `choice` 再選択 | 既存 `choiceOptions` があれば維持。なければ上記 |
| `choiceCount` 3→4 | `choiceOptions` に `""` を 1 件 append |
| `choiceCount` 4→3 | `slice(0,3)`。4 番目に文字があれば破棄（確認ダイアログなし・MVP） |
| 新規問い追加 | `createEmptyPromptDraft()` — choice 以外デフォルト |

### 2-C. 親コンポーネント（変更最小）

| 画面 | 状態 | 変更 |
|---|---|---|
| `submit-page.tsx` | `promptDrafts`, `testerNotesMode` | **変更なし**（VersionPromptEditor 経由） |
| `project-edit-page.tsx` | `promptDrafts`, `promptMode` | **変更なし** + 保存バリデーション関数だけ差し替え |

状態は引き続き **親が保持・VersionPromptEditor が controlled component**。

### 2-D. 新規サブコンポーネント（案）

| ファイル | 責務 |
|---|---|
| `components/choice-prompt-fields.tsx` | 選択肢数 select + N 個 input + インラインエラー |
| `components/developer-choice-preview.tsx` | 読み取り専用 VoicePromptCard 風プレビュー |

`version-prompt-editor.tsx` から textarea ブロックを上記 2 つに置換。

---

## 3. 既存データとの互換性

### 3-A. DB / API

- `response_kind = 'choice'`、`options` jsonb — **変更なし**
- `saveDeveloperVersionPrompts` / immutable — **変更なし**
- **migration 不要**

### 3-B. 編集画面ロード（`draftFromVersionPrompt`）

```typescript
// choice かつ options あり
choiceCount = clamp(options.length, 2, 4)
choiceOptions = options.map(o => o.label)
// choiceCount に満たない場合は "" で pad
```

### 3-C. レガシー `choiceLabels` 文字列

- ロード時 `choiceOptions` が空で `choiceLabels` がある場合のみ `parseChoiceLabels` で復元
- 保存時は常に `choiceOptions` → `options` jsonb（`choiceLabels` は書かない）

### 3-D. 集計・プレイヤー

- `VoicePromptCard` / `get_public_voice_aggregates` — options の id/label 構造不変
- 既存プレイヤー回答の `answer_value` は option id — **ラベル変更時は immutable ルールどおり**

---

## 4. submit / edit 両画面への反映

両画面とも **すでに `VersionPromptEditor` を共有**しているため、実装は **Editor + form  lib のみ**。

```
submit-page.tsx ──┐
                  ├── VersionPromptEditor ── choice-prompt-fields.tsx
project-edit-page.tsx ──┘
                  │
                  └── sanitizePromptDrafts / validatePromptDrafts (lib)
```

| 画面 | 保存タイミング | 問い保存 |
|---|---|---|
| `/submit` | 投稿成功後 | `saveDeveloperVersionPrompts` |
| `/projects/{id}/edit` | 更新ボタン | `updateProjectDetails` → `saveDeveloperVersionPrompts` |

edit 側のみ既存の `saveError` + choice 向けメッセージを `validatePromptDrafts` 結果に統一。

submit 側は **同様の try/catch + エラー表示を #5 で追加**（現状 unhandled のため）。

---

## 5. 保存バリデーション

### 5-A. レイヤー

| 層 | タイミング | 内容 |
|---|---|---|
| インライン | 入力中 | 空の選択肢 input に subtle hint（任意） |
| 保存前 | submit / 更新 | `validatePromptDrafts(drafts)` → エラー配列 |
| sanitize | 保存直前 | 従来どおり。choice は validate 通過後のみ |

### 5-B. choice ルール

| ルール | エラーメッセージ（案） |
|---|---|
| 質問文が空 | （従来どおりその問いはスキップ） |
| 質問文あり + choice + 有効ラベル < 2 | 「問い{N}: 選択肢は2個以上入力してください」 |
| ラベル 1 件あたり max 40 文字（新規） | 「問い{N}: 選択肢{M}は40文字以内にしてください」 |
| 重複ラベル（trim 後） | 警告のみ or 保存可（MVP は **保存可**。集計は別 id） |

### 5-C. edit 保存フロー（変更案）

```typescript
const validation = validatePromptDrafts(promptDrafts);
if (promptMode === "custom" && validation.blocking) {
  setSaveError(validation.message);
  return;
}
const promptsToSave = sanitizePromptDrafts(promptDrafts);
```

`sanitize` で黙って drop しない — **validate で先に止める**。

### 5-D. submit 保存フロー

edit と同一メッセージ。投稿本体は成功後に問い保存のため、問いエラー時は **成功画面に行かずフォーム上に表示**。

---

## 6. プレイヤー側プレビュー

### 6-A. 開発者 UI 内プレビュー（#5 で追加）

- 位置: 選択肢入力ブロックの直下
- 条件: `responseKind === "choice"` かつ trim 後ラベル ≥ 2
- 見た目: `VoicePromptCard` と同型（ボタンは `pointer-events-none` / opacity 付き）
- 質問文未入力時: 「（質問文を入力）」プレースホルダ

### 6-B. 本番プレイヤー UI

- **変更なし**（`components/voice-prompt-card.tsx`）
- 開発者が保存した `options` がそのままボタン表示される

---

## 7. ファイル変更一覧（#5 実装時）

| ファイル | 変更 |
|---|---|
| `lib/version-prompt-form.ts` | 型・normalize・validate・resolve 更新 |
| `components/choice-prompt-fields.tsx` | **新規** |
| `components/developer-choice-preview.tsx` | **新規** |
| `components/version-prompt-editor.tsx` | textarea → 新コンポーネント |
| `components/submit-page.tsx` | 問い保存エラー UX のみ |
| `components/project-edit-page.tsx` | validate メッセージ統一 |
| `docs/forge-changelog.md` | 体験変更記録 |

**触らない**: DB migration、`voice-engagement.ts`（save ロジック）、`VoicePromptCard`（プレイヤー）

---

## 8. 工数・テスト観点

- 工数: **0.5〜1 日**
- 本番確認:
  1. edit: choice 3 個設定 → 保存 → 詳細初声に 3 ボタン
  2. edit: 既存 choice 問いロード → 個別フィールドに復元
  3. edit: 選択肢 1 個だけ → 保存阻止 + メッセージ
  4. submit: 新規投稿 + choice 問い → 同上
  5. 開発者プレビュー: 2 個以上入力でプレビュー表示

---

## 9. スコープ外（#5 に含めない）

- 回答形式 dropdown の整理（#3）
- 「自由記述（短文）」→「自由記述」rename（#3）
- プレイ後初声導線（#6）
- 選択肢のドラッグ並び替え
