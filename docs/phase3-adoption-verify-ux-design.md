# Phase3「変化を確かめる」UX 設計案

**ステータス**: matcher **本番 GO**（2026-06-16 Run [A]）+ Phase3 実装 GO  
**日付**: 2026-06-16  
**優先順位**: matcher 本番 deploy → **Phase3 実装** → プレイ履歴 → 正式版 → バッジ

**オーナー判断（2026-06-16）**

- Phase3 の価値は非常に高い → **実装 GO**（matcher 本番 GO 後）
- **`PLAYER_VISIBLE=false` 維持** — Phase3 コードは入るがプレイヤー表示は別 GO

**今進めてよい（設計のみ）**

- CTA 文言（「変化を確かめる」）
- AdoptionVerifyBanner 文言
- URL 設計（`?adoption=` / `#adoption-verify`）
- PlayLaunchDialog copy
- UX モック

**実装 GO 前にやらない**

- `AdoptionVerifyBanner` コンポーネント本番接続
- query パース + DB 読み取りの本番配線
- CTA href の Phase3 切替

---

## 0. なぜ Phase3 か

| フェーズ | プレイヤーの内側 | 体験の強度 |
|----------|------------------|------------|
| matcher 前 | 「更新はあった」 | 弱 |
| Phase2 | 「自分が言ったことが、更新説明と対になって **見える**」 | 中（読むだけ） |
| **Phase3** | 「**自分の目で**、ゲームの中で変わったのを **確認した**」 | **強** |

Forge 価値の本体:

> 俺が言ったことが変わった

Phase2 だけでは **因果は読んだだけ**。Phase3 で **再プレイ中の帰属** に接続する。

---

## 1. 設計目標

### 1.1 Primary goal

adoption カードから **意図的な再プレイ** へ導き、プレイヤーが

「確かに変わった（または変わっていないと分かった）」

と **自分で確かめる** 体験を作る。

### 1.2 Non-goals（MVP Out）

- ゲーム内ハイライト / SDK hook
- voice_adopted 通知
- レジャー / バッジ
- 採用率・件数の表示
- LLM によるプレイ中ヒント

---

## 2. プレイヤー旅程（全体）

```text
[A] マイページ / 作品詳細 — Phase2 adoption セクション
    「あなたは『テンポが悪い』と答えました」
         ↓
    「今回『序盤の待ち時間を短縮』されました」
    [変化を確かめる]  ← Phase3 primary CTA

[B] 作品詳細（personal 文脈）
    AdoptionVerifyBanner
    「前回のあなたの声 → 今回の更新。版 0.3 で確かめに行きましょう」
    [プレイして確認する]

[C] PlayLaunchDialog（adoption コンテキスト）
    「『テンポが悪い』について『序盤の待ち時間を短縮』が変わっているか確かめましょう」

[D] プレイ（既存 iframe / 起動フロー）

[E] プレイ後 — 既存 voice フロー
    文言のみ: 「変更を確かめたあと、新版への感想をどうぞ」（軽微）
```

---

## 3. 画面別設計

### 3.1 Phase2 adoption カード — CTA 変更

**URL**: `/mypage#voice-adoptions` 、 `/games/{id}`（compact セクション）

**画面位置**: 各 adoption カード下部。現状「もう一度プレイする」の **左または置換**

| 要素 | 変更前 | 変更後（Phase3） |
|------|--------|------------------|
| Primary CTA | もう一度プレイする | **変化を確かめる** |
| href | `#new-playable-version-banner` | `/games/{id}?adoption={adoptionId}#adoption-verify` |
| Secondary | この関連は違う | **維持** |
| footer disclaimer | AI 紐づけ説明 | **維持** |

**将来（Phase3+）**: `buildAdoptionVerifyCta(updateSummary)` → 「序盤の待ち時間短縮を確かめる」

**プレイヤー視点**: 「もう一度遊ぶ」より「**自分の声の結果を確かめに行く**」意図が明確。

**開発者視点**: 汎用再プレイと personal 再プレイの CTR 分離（計測は将来）。

---

### 3.2 作品詳細 — AdoptionVerifyBanner（新規）

**URL**: `/games/{projectId}?adoption={adoptionId}`  
**アンカー**: `#adoption-verify`（バナー設置位置）

**表示条件**

- ログイン済み
- `adoptionId` が **自分の active adoption** として存在
- ownerPreview ではない
- invalid / 他人 / suppressed id → **バナー非表示**（エラー UI なし、静かに無視）

**画面位置**: ヒーロー下、**NewPlayableVersionBanner の上**（personal 文脈優先）

**文言案**

```text
見出し: あなたの声が、今回の更新に届いています

あなたは「{player_quote}」と答えました。
今回の更新で「{update_summary}」されました。

版 {published_version} で、変わったか確かめに行きましょう。

[プレイして確認する]
```

**データ**: DB の `voice_adoptions` のみ。LLM 禁止。

**汎用バナーとの関係**

- adoption コンテキストあり → AdoptionVerifyBanner **表示**
- NewPlayableVersionBanner → **下に配置** または adoption 版があるとき折りたたみ（実装時 A/B 不要、**personal 優先** で固定）

---

### 3.3 PlayLaunchDialog — contextual copy

**トリガー**: AdoptionVerifyBanner または Phase2 CTA 経由のプレイ起動

**通常時（adoption なし）**: 現状維持

**adoption コンテキスト時**

```text
タイトル: 版 {version} をプレイ

本文:
「{player_quote}」と答えた点について、
「{update_summary}」が本当に変わっているか確かめましょう。
```

**Out**: ゲーム内特定シーンへの自動ジャンプ

---

### 3.4 プレイ後 — voice フロー（軽微）

**変更**: 既存 post-play voice プロンプトの **前置き 1 行** のみ

```text
前回の変更を確かめたあと、新版への感想を教えてください。
```

**Out**: adoption ごとの追加質問、スコアリング

---

## 4. URL / ルーティング

| 定数 / helper | 値 |
|---------------|-----|
| `ADOPTION_VERIFY_CTA_DEFAULT` | `変化を確かめる` |
| `adoptionVerifyHref(adoptionId, projectId)` | `/games/{projectId}?adoption={adoptionId}#adoption-verify` |
| クエリ `adoption` | UUID。無効時は無視 |
| ハッシュ `#adoption-verify` | バナー scroll-mt |

**セキュリティ**

- 他人の adoptionId → バナー非表示（情報漏えいなし）
- suppressed → 非表示

---

## 5. コンポーネント / ファイル（実装時）

| ファイル | 役割 |
|----------|------|
| `components/adoption-verify-banner.tsx` | 作品詳細 personal バナー |
| `lib/project-nurture-links.ts` | `adoptionVerifyHref()` 追加 |
| `components/voice-adoptions-section.tsx` | CTA href / 文言 Phase3 化 |
| `components/game-detail-page-client.tsx` | `?adoption=` 読み取り + バナー配置 |
| `components/play-launch-dialog.tsx` | contextual copy 分岐 |
| `hooks/use-adoption-verify-context.ts` | adoptionId → row 取得（既存 hook 拡張可） |

---

## 6. 通知との優先順位

| チャネル | 優先 | Phase3 内容 |
|----------|------|-------------|
| マイページ adoption | **Primary** | 変化を確かめる CTA |
| 作品詳細 personal バナー | **Secondary** | プレイ直前の文脈 |
| version_published 通知 | 維持 | 汎用「新版あり」。**personal 引用は入れない** |
| voice_adopted 通知 | **Out** | Phase3 成立後も当面 Out |

---

## 7. 成功指標（定性）

Phase3 実装後、プレイテストで確認:

- プレイヤーが CTA の意図を **10 秒以内** に言語化できるか
- 「もう一度プレイ」と「変化を確かめる」の **意味差** が伝わるか
- バナー quote / summary が **Phase2 カードと一致** しているか（DB 同一行）
- dispute 率が Phase2 単独より **上がらない** こと（偽陽性体験の悪化信号）

**Out**: DAU、プレイ時間、採用件数ランキング

---

## 8. In / Out

**In（Phase3 MVP）**

- CTA「変化を確かめる」+ personal URL
- AdoptionVerifyBanner
- PlayLaunchDialog contextual copy
- invalid adoption クエリの静かな無視
- `#adoption-verify` スクロール

**Out**

- ゲーム内変化ハイライト
- 通知
- レジャー / バッジ
- `{update_summary}を確かめる` 自動文言（Phase3+）
- analytics ダッシュボード

---

## 9. リスクと対策

| リスク | 対策 |
|--------|------|
| 変化がゲーム内で分からない | copy で「devlog の説明と照らし合わせて確かめてください」。ゲーム hook は将来 |
| 偽陽性で「変化なし」体験 | matcher precision GO + dispute + disclaimer（Phase2 済み） |
| CTA 二重（汎用 vs personal） | personal 優先配置。汎用バナーは下 |
| adoptionId URL 共有 | 他人には表示されない。UUID 推測困難 |

---

## 10. 実装順（Phase3 GO 後）

1. `adoptionVerifyHref` + query パース
2. `useAdoptionVerifyContext`（自分の adoption のみ）
3. `AdoptionVerifyBanner`
4. `VoiceAdoptionsSection` CTA 差し替え
5. `PlayLaunchDialog` copy 分岐
6. 手動確認手順 doc 更新

**見積**: Phase3 MVP 1 テーマ（通知・バッジより先）

---

## 11. オーナー確認手順（設計レビュー）

1. `/mypage` adoption カードで「変化を確かめる」が **Primary** であることの OK
2. 作品詳細バナー文言の OK
3. `{update_summary}を確かめる` は **Phase3+** でよいか
4. 汎用 NewPlayableVersionBanner を下に置く方針の OK

---

## 12. 関連 doc

- `docs/voice-adoptions-openai-matcher-design.md` §5
- `docs/voice-adoptions-staging-precision-guide.md`
- `docs/player-nurture-core-experience-design-review.md`
- `lib/voice-adoption/constants.ts` — `ADOPTION_VERIFY_CTA_DEFAULT`, `buildAdoptionVerifyCta`
