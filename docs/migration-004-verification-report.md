# migration 004 — 実地確認・整理レポート

**日付**: 2026-06-12  
**本番**: https://forge-flame-gamma.vercel.app  
**前提**: migration 004 適用済み、deploy 完了（commit 2b89588 付近）

---

## 確認方法の区分

| 区分 | 内容 |
|---|---|
| **コード確認** | Cursor が実装・ロジックを追跡（完了） |
| **公開 UI 確認** | 未ログインで本番ページを閲覧（完了・mock 作品） |
| **本番 E2E** | ログイン＋プレイ＋FB＋devlog が必要 → **オーナー確認待ち** |

Cursor は本番ログイン資格情報を持たないため、DB 連動の 7 項目は **コード上は成立** だが **本番 E2E はオーナー手順で確定** する。

---

## 7 項目チェックリスト

| # | 確認項目 | コード | 本番 E2E |
|---|---|---|---|
| 1 | playable_version = 0.1 表示 | ○ FB フォーム内に表示 | 未 |
| 2 | 同版 FB 再送 → 編集 | ○ insert/update 分岐 | 未 |
| 3 | devlog 版公開 → playable_version 更新 | ○ addDevlog 内 UPDATE | 未 |
| 4 | 新版公開後 → 新 FB 枠 | ○ version_key 別 fetch | 未 |
| 5 | published_version 保存 | ○ devlog insert | 未 |
| 6 | 開発の歩み version 表示 | △ 一部 | 未 |
| 7 | my-projects FB 一覧 version | ○ versionKey 表示 | 未 |

---

## 実際に動作した項目（Cursor 確認分）

- 本番サイトが正常応答（トップ・作品詳細）
- mock 作品詳細で「開発の歩み」の版ラベル（v0.1, v0.2…）が表示される
- 未ログイン時 FB エリアは「ログインしてフィードバック」「プレイ後に…」と案内表示
- 実装ロジック：`submitProjectFeedback` が既存 `(user, project, version_key)` を UPDATE、なければ INSERT
- 実装ロジック：`addDevlog` + `publishPlayableVersion` で devlog・projects・local state を更新

---

## 動作未確認項目（オーナー E2E 必須）

1. 「消えるかな？」での playable_version **0.1** 表示（ログイン＋プレイ後）
2. 同版 FB 再送信 → 「フィードバックを**更新**しました」＋ボタン「更新する」
3. devlog チェック ON → **0.2** 入力 → `projects.playable_version` 更新
4. 0.2 公開後、プレイヤー側 FB フォームが空（0.1 の内容は読み込まれない）
5. `project_devlogs.published_version = 0.2` が Dashboard で保存されている
6. 開発の歩みで版 bump した devlog に **0.2**（入力値そのまま）が表示
7. `/my-projects` で「プレイ可能版 0.1」「0.2」が FB 一覧に並ぶ

---

## 想定どおりだった点

- **版ごと 1 FB**：`fetchUserFeedbackForVersion` が現行 `playable_version` のみ取得
- **同版編集**：UPDATE + RLS「Users update own feedback」
- **devlog 版 bump UI**：チェック＋入力＋現在版表示。同版名はエラー
- **既存 FB**：migration で `version_key = 0.1`
- **開発者向け版表示**：my-projects  inbox に `versionKey`
- **旧版 FB プレイヤー表示なし**：意図どおり未実装

---

## 想定と違った点・UX ギャップ

### 1. playable_version の見える場所が限定的

- **表示場所**：FB フォーム内の小さなテキストのみ（`プレイ可能版 0.1`）
- **非表示**：作品概要（Overview）、サイドバー、ヘッダー
- **影響**：プレイヤーは「今どの版向け FB か」をプレイ前・送信前に気づきにくい

### 2. v0.1 → FB → v0.2 → FB の流れが暗黙

開発者：devlog チェックで版 bump できる（説明文あり）  
プレイヤー：新版公開の**通知・バナーなし**。再度プレイして FB フォームを開くまで「新 FB 枠」に気づけない

### 3. 版表記のゆれ

| 場所 | 表記例 |
|---|---|
| DB / FB フォーム | `0.1`, `0.2`（v なし） |
| 開発の歩み（published_version なし） | `v0.1`, `v0.2`（連番 fallback） |
| 開発の歩み（published_version あり） | 入力値そのまま `0.2` |

→ 同一作品内で **v あり/なしが混在** しうる

### 4. 「プレイヤーからの改善材料」に版ラベルなし

- 詳細ページの FB 一覧は **全 version_key 混在**（created_at 降順）
- 版ラベル非表示（FeedbackStructuredCard）
- v0.1 と v0.2 の FB が両方あると、どちら向けか判別不能（旧版表示後回しの副作用）

### 5. ページリロード前提

- 開発者が版 bump 後、**既に詳細を開いているプレイヤー**はリロードまで `playable_version` が古い可能性
- `games-provider` は devlog 投稿者側のみ state 更新

---

## 不具合候補（要 E2E で確定）

| 優先度 | 内容 | 備考 |
|---|---|---|
| 低 | 版 bump 直後、他ユーザーの画面が stale | リロードで解消。通知なし設計 |
| 中 | 複数版 FB がある作品の「改善材料」混在 | 仕様後回しの結果。意図確認要 |
| 要確認 | 初回 UPDATE で `updatedAt` が null の既存行 | migration で `updated_at` NULL のまま。2 回目以降は「更新しました」 |

---

## UX 改善候補（実装は今回スコープ外）

1. **作品概要に「現在のプレイ可能版: 0.2」** を常時表示
2. **版 bump 時**：watch ユーザーへ「新しいプレイ可能版が公開されました。再度プレイして FB を送れます」（通知 or バナー）
3. **FB フォーム前**：「0.1 向け FB は送信済み。新版 0.2 が公開されたら再プレイ後に新 FB を送れます」
4. **版表記統一**：`0.1` か `v0.1` か一方に揃える
5. **改善材料**：当面は **現行版 FB のみ** 表示（旧版は開発者 inbox のみ）— ループの見え方が明確に

---

## Forge 原典ループの評価（コード＋UI レビュー）

```
プレイ → FB → 改善（devlog）→ 再プレイ → 新 FB
```

| ステップ | 成立度 | コメント |
|---|---|---|
| プレイ | ○ | 外部リンク＋ recordPlay |
| FB | ○ | プレイ後フォーム。版表示あり |
| 改善 | ○ | devlog＋版 bump |
| 再プレイ | △ | 技術的には可能。新版を知る導線が弱い |
| 新 FB | △ | 版 bump 後フォームは空になるが、**なぜ空か**が伝わりにくい |

**結論**：基盤は成立。**「次の FB を書ける条件」がプレイヤーに伝わる UI が不足**。開発者向け devlog UI は比較的明確。

---

## オーナー向け：5 分で終わる本番確認手順

別紙 [`docs/migration-004-owner-checklist-5min.md`](./migration-004-owner-checklist-5min.md)
