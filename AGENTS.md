<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:forge-agent-rules -->
# Forge development rules

## Source of truth

- **プロダクト原典を最優先** — `docs/forge-principles.md`（プロダクト体験）
- **事業仮説** — `docs/forge-business-hypothesis.md`（マネタイズ・North Star・無料期間の意味）
- 原典の**意味を勝手に変更しない**（整理・参照のみ。更新はオーナー GO）
- MVP スコープ外は `docs/out-of-scope.md` を確認（**正式リリース初期版** — 2026-06 方針更新済み）

## Feature decisions

- 新機能・変更は **版ごとの学習ループ**（発見→プレイ→初声→次に直すこと→次版）を強化するかで判断。変化を見る・再プレイ・見届け人は増幅
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

**GPT 用メモは廃止（2026-06 オーナー方針）** — 以下は**通常タスクでは行わない**：

- `docs/chatgpt-summary.md` の更新
- レスポンス末尾の ` ```text ` ブロック（GPT 貼付用の二重出力）

代わりに、**返答本文**をオーナー向けに書く（何をしたか・確認手順・オーナーがやること・リスク）。オーナーが必要な部分を**手動でコピー**する。

### Handoff（2種類・通常は触らない）

| ファイル | 用途 | 更新タイミング |
|---|---|---|
| `docs/forge-handoff.md` | Cursor / リポジトリ向けの現在地メモ | **節目のみ**（下記トリガー） |
| `docs/chatgpt-handoff.md` | 新 ChatGPT スレッド用の**全量**スナップショット | **節目のみ**（下記トリガー） |

**節目トリガー**（このときだけ handoff を**全量**更新してよい）：

- 大テーマ完了
- migration 完了（本番適用・確認済み）
- **ロードマップ順位変更**（次テーマの優先順位・Cursor 推奨1位が変わったとき）
- オーナーが引継ぎを指示したとき

通常タスクでは handoff 系ファイル・`chatgpt-summary-format.md` 形式の長文サマリは**読み直してまとめない**（利用量削減）。

オーナーが明示的に「GPTメモ」「summary 更新」「引継ぎ」と言ったときだけ、従来形式（`docs/chatgpt-summary-format.md`）に戻してよい。

### 返答本文の目安（デフォルト）

- 変更内容と理由（簡潔）
- UI 変更時は URL・画面位置・確認手順
- オーナーがやること / Cursor だけでできること（分けて書く）
- 設計判断時は推奨案・理由・懸念を短く

**やらないこと**：毎タスクの厚い `■` サマリ、ファイルと返答の二重出力、リポジトリ全体の再読み込みによる引継ぎ再生成。

## Run 確認前の停止 — GPT判断用メモ

**§10.2 の 9 条件のみ**停止。`docs/forge-triage-operations.md` §10、`docs/gpt-run-decision-memo.md` 参照。

一気通貫で進めてよい: 設計 → 実装 → build → staging 確認 → **main 反映準備**（commit / push 含む）。

停止例: 課金・新規 API 契約・**本番公開**・PLAYER_VISIBLE=true・DB 破壊・データ移行・原典変更・ロードマップ順位変更・不可逆操作。

サマリ `■ 今すぐ私がやるべきこと` は **オーナーしかできないことだけ**（Cursor 実行可能な項目は書かない）。※ 通常は返答本文に記載。GPT 用ファイルは更新しない。

## Owner × ChatGPT × Cursor トリガー運用（恒久）

正本: **`docs/forge-triage-operations.md`**

| トリガー | 意味 |
|---|---|
| オーナーが **`CURSOR`** のみ送信 | ChatGPT が直前会話を踏まえ **Cursor 貼付用完成文 1 本**を出力（断片・追記禁止）。オーナー判断未確定なら判断材料のみ |
| Run/Deploy/Migration **スクショ** | ChatGPT が Run 判断依頼。結論 **[A]〜[D]**（Run推奨 / 事前確認 / 追加確認 / Run禁止）。Forge価値・ユーザー影響・復旧難易度も考慮 |
| **chatgpt-handoff** 貼付 / オーナーが返答を手動コピー | ChatGPT が要約ではなく **レビュー**（現在地・リスク・次アクション・原典整合） |
| オーナーの **UX 違和感**（分かりにくい等） | UX レビュー依頼。他ユーザーにも起きうるか検討。プロダクトレビュー優先（原典＞ユーザー＞開発者＞MVP＞技術） |

ChatGPT の役割は **コードレビューではなくプロダクトレビュー**。Cursor 向け指示は完成版 1 本。

## Preview / main デプロイ（Cursor）

正本: **`docs/forge-triage-operations.md` §8**

- 実装は **`preview/landing-01`** → commit + push（Preview デプロイ）
- オーナー Preview 確認後、`main` merge + push（本番）
- **本番 push 後は必ず `preview/landing-01` を `main` に fast-forward して push** — 両ブランチ同一 commit を維持（Preview だけ / 本番だけが進んだ状態を残さない）

## Supabase migration（本番）

- オーナー方針：**Supabase Dashboard SQL** で手動適用（CLI より可視性優先）
- 手順: `docs/supabase-dashboard-migration-guide.md`
- 適用後確認: `docs/supabase-post-migration-checklist.md`
- プラン・課金: `docs/supabase-owner-operations.md`（オーナーが Dashboard で確認）
<!-- END:forge-agent-rules -->
