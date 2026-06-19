<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:forge-agent-rules -->
# Forge development rules

## Source of truth

- **Forge原典を最優先** — `docs/forge-principles.md` が憲法
- 原典の**意味を勝手に変更しない**（整理・参照のみ）
- MVP スコープ外は `docs/out-of-scope.md` を確認（**正式リリース初期版** — 2026-06 方針更新済み）

## Feature decisions

- 新機能・変更は **「投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ」** を強化するかで判断
- **実装都合で仕様を変更しない**
- **正式リリース初期版** — 小さな MVP ではなく必要機能を初期から盛り込む（`docs/out-of-scope.md`）
- 投げ銭、販売、SDK 実装（説明 UI 除く）は作らない
- **含む（2026-06 方針）**: 月間見届け人ランキング、実績バッジ、共感、開発者「開発に役立った」評価、影響度スコア

## Data & storage

- **本番でユーザー間共有される情報を localStorage に保存しない**
- localStorage は **下書き・UI状態・デモ暫定** のみ
- 永続データは **Supabase** を前提

## Login UX (when touching auth flows)

- 発見（トップ・一覧・詳細閲覧）は公開
- プレイ以降はログイン必須。ボタンは隠さず `/login` へ
- モーダルで阻まない。redirect クエリは複雑化しない
- 詳細は `docs/forge-principles.md` §ログイン方針

## Documentation duty (every completed task)

作業完了時に必ず更新：

1. `docs/forge-changelog.md` — ユーザー体験・仕様の変化
2. `docs/forge-handoff.md` — 現在地（Cursor / リポジトリ向け Markdown）
3. **`docs/chatgpt-summary.md`** — ChatGPT に貼る**差分サマリ**（**プレーンテキストのみ**：`■` 見出し可、Markdown 表・`#` 見出し・`---` 区切り・コードフェンス・余分な空行は不可）
4. レスポンス末尾 — 上記 3 と**同一内容**を **1つの ` ```text ` ブロック** に入れる（**オーナーはここの Copy ボタンが主経路**）

**`docs/chatgpt-handoff.md`** — 新 GPT スレッド用**全量スナップショット**。毎タスクでは更新しない。以下のトリガー時のみ全量更新：

- 大テーマ完了
- migration 完了（本番適用・確認済み）
- **ロードマップ順位変更**（次テーマの優先順位・Cursor 推奨1位が変わったとき）
- オーナーが引継ぎを指示したとき

**粒度標準（必読・恒久）**: `docs/chatgpt-summary-format.md` が**唯一の形式標準**。オーナーがフォーマット変更を明示するまで、毎タスク従う。**薄い要点メモは禁止**。ロードマップ整理時は **60行以上**、実装完了時は **40行以上** を目安。各 `■` は複数行・具体例・オーナー判断・理由まで書く。「詳細は docs/xxx」のみの省略不可。**UI 変更がある実装**では `■ 今回変更した画面` を必須（画面名・URL・**画面位置**・変更前/後・プレイヤー/開発者視点・確認手順）。既存の設計判断セクション（なぜこの設計 / 他案不採用 / In Out / リスク / オーナー確認手順）は削らない。

### GPT用メモ省略禁止（Cursor 自身への指示）

**返答を送る直前に必ず確認：** レスポンス末尾に `docs/chatgpt-summary.md` と同内容の **` ```text ` ブロック** があるか。

- **省略してはいけない場面**：作業完了時、状態確認・Deploy 確認、本番検証報告、ドキュメント更新、ユーザーが「GPT用メモ」と言及したとき、**説明のみの返答でも Forge の現在地が変わる／伝わる内容なら常に**
- **省略してよい場面**：ユーザーが「メモ不要」「コードブロック不要」と明示したときのみ
- **薄くしてはいけない**：各 `■` を1行だけにまとめる、ロードマップ・判断理由・スコープ In/Out を削る、オーナー判断を省略する — **すべて NG**（`docs/chatgpt-summary-format.md` 参照）
- **忘れた場合**：ユーザーから指摘される前に、次の返答で必ず載せる。指摘されたら **その返答の最優先** でメモ + `docs/chatgpt-summary.md` 更新
- **チェックリスト**（送信前 3 秒）：
  1. chatgpt-summary.md 更新済みか
  2. 末尾 text ブロックがあるか
  3. **粒度**：ロードマップ系 60行+ / 実装完了 40行+ / 各■が複数行か（薄くないか）
  4. UI 変更あり → `■ 今回変更した画面`（画面位置含む）入っているか
  5. 引継ぎトリガー該当 → chatgpt-handoff.md 全量更新済みか
  6. 「今すぐ私がやるべきこと」「Cursorだけで完了できること」が必要なら入っているか

サマリ形式：**最小セット**は下記。ロードマップ・優先順位整理時は **`docs/chatgpt-summary-format.md` の必須セクションすべて** を含めること（60行以上目安）。

```
■ 現在の状態
■ 今回実装したこと（または今回確認したこと）
■ ユーザー目線の変化
■ 注意事項
■ 今すぐ私がやるべきこと
■ Cursorだけで完了できること
■ 次に検討すべきこと
■ ChatGPTに相談したい論点
```

**設計判断が絡むときだけ**、上記の末尾（または「相談したい論点」の直前）に **論点ごと** 以下を追加する。各項目 **3〜5行**、長文議論は不要。

```
■ Cursorの推奨案
■ 推奨理由
■ 懸念点
```

追加する場面（該当時のみ。毎回不要）：

- DB設計 / 認証設計 / 通知設計 / 権限設計
- データ保存先（localStorage vs Supabase 等）
- 将来の拡張性に関わる判断
- ChatGPT に意見を聞きたい設計論点

目的：ChatGPT が「結論」だけでなく「なぜそう考えたか」を把握して Cursor案を評価できるようにする。

## Handoff for ChatGPT

**2ファイル運用**（詳細: `docs/chatgpt-summary-format.md`）：

| ファイル | いつ貼る | 内容 |
|---|---|---|
| `docs/chatgpt-handoff.md` | **新 GPT スレッドの最初に1回** | 全量スナップショット（今どこを作っているか・画面マップ・優先順位） |
| `docs/chatgpt-summary.md` | **以降の毎タスク** | 差分中心（設計判断・画面変更・確認手順） |

コピー方法（優先順）：

1. **Cursor 返答末尾の `text` ブロック右上 Copy**（推奨・主経路 — summary 用）
2. ターミナルで `npm run copy-summary` → クリップボード（summary と同一内容）
3. 新スレッド開始時 — `docs/chatgpt-handoff.md` をファイルから Copy（Ctrl+A 可。プレーンテキスト）

**やらないこと**：Cursor 返答全文のコピー、`chatgpt-summary.md` の Ctrl+A（Markdown エディタ表示と貼り付け結果がずれるため）。

サマリは情報量は多くてよいが、**表形式にしない**（GPT 貼り付けで崩れる）。箇条書き・`-` リストで書く。**薄い1行サマリは禁止** — 詳細は `docs/chatgpt-summary-format.md`。

## Run 確認前の停止 — GPT判断用メモ

**§10.2 の 9 条件のみ**停止。`docs/forge-triage-operations.md` §10、`docs/gpt-run-decision-memo.md` 参照。

一気通貫で進めてよい: 設計 → 実装 → build → staging 確認 → **main 反映準備**（commit / push 含む）。

停止例: 課金・新規 API 契約・**本番公開**・PLAYER_VISIBLE=true・DB 破壊・データ移行・原典変更・ロードマップ順位変更・不可逆操作。

サマリ `■ 今すぐ私がやるべきこと` は **オーナーしかできないことだけ**（Cursor 実行可能な項目は書かない）。

## Owner × ChatGPT × Cursor トリガー運用（恒久）

正本: **`docs/forge-triage-operations.md`**

| トリガー | 意味 |
|---|---|
| オーナーが **`CURSOR`** のみ送信 | ChatGPT が直前会話を踏まえ **Cursor 貼付用完成文 1 本**を出力（断片・追記禁止）。オーナー判断未確定なら判断材料のみ |
| Run/Deploy/Migration **スクショ** | ChatGPT が Run 判断依頼。結論 **[A]〜[D]**（Run推奨 / 事前確認 / 追加確認 / Run禁止）。Forge価値・ユーザー影響・復旧難易度も考慮 |
| **chatgpt-summary / handoff / GPT判断用メモ** 貼付 | ChatGPT が要約ではなく **レビュー**（現在地・リスク・次アクション・原典整合） |
| オーナーの **UX 違和感**（分かりにくい等） | UX レビュー依頼。他ユーザーにも起きうるか検討。プロダクトレビュー優先（原典＞ユーザー＞開発者＞MVP＞技術） |

ChatGPT の役割は **コードレビューではなくプロダクトレビュー**。Cursor 向け指示は完成版 1 本。

## Supabase migration（本番）

- オーナー方針：**Supabase Dashboard SQL** で手動適用（CLI より可視性優先）
- 手順: `docs/supabase-dashboard-migration-guide.md`
- 適用後確認: `docs/supabase-post-migration-checklist.md`
- プラン・課金: `docs/supabase-owner-operations.md`（オーナーが Dashboard で確認）
<!-- END:forge-agent-rules -->
