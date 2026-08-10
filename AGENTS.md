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

## Forge とは

ゲーム開発者が**作りかけの作品**を公開し、プレイヤーからフィードバックを受けて次の ver へ改善していく学習ループのプラットフォーム。中核は「発見 → プレイ → 初回FB → 改善 → 次ver」。Next.js (App Router) + Supabase + Vercel。

## 環境と branch

| 環境 | 用途 | Supabase | 誰が触るか |
|---|---|---|---|
| **Production** | 公開本番 | `bpnisgzxuwdxelhnduuf` | コードは Cursor（オーナー指示時）。**DB / Storage write はオーナー手動のみ** |
| **Preview** | `preview/landing-01` の Vercel Preview。通常作業の到達点 | Staging を参照 | Cursor が自律 push / deploy / smoke |
| **Staging** | 検証用 DB | `vuqpwvjvgyxffmvpfrxo` | **SQL 適用はオーナー手動（2026-07-30 オーナー方針）**。Cursor は SQL 提示と read-only 検証 |

- `main` = Production に出るコード。オーナーが「本番反映して」等と言ったときだけ触る
- `preview/landing-01` = 通常作業ブランチ。本番 push 後は `main` に fast-forward して同期
- **Production DB / Storage への write（migration / INSERT / UPDATE / DELETE / backfill / Storage 変更）を Cursor が実行することはない**。service_role を持っていても実行しない（Production hard-stop）
- **Staging DB write も自律実行しない**（2026-07-30 オーナー方針）。SQL・実行順・影響範囲・確認 SQL を提示し、オーナー適用後に read-only 検証する
- Supabase の **read-only（SELECT / 件数 / 行特定）は Staging / Production ともいつでも可**

## Feature decisions

- 新機能・変更は **版ごとの学習ループ**（発見→プレイ→初回FB→改善→次ver）を強化するかで判断。変化を見る・再プレイ・見届け人は増幅
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

## UI copy & information design（恒常）

正本: **`docs/forge-ui-copy-rules.md`**（`.cursor/rules/forge.mdc` にも要約）

### 用語

- **ユーザー向け UI で「声」を使わない**
- 禁止例: 声を届ける / みんなの声 / プレイヤーの声 / 届けた声 / 届いた声 / プレイヤー向けの「初声」表示
- 原則 **フィードバック**。短いバッジ内のみ **FB** 可
- DB / 内部識別子の `voice_*` や historical docs は **即リネームしない**（表示文字列だけ直す）
- **ユーザー向け UI で「版」を原則使わない** — 短い表示は **ver**（`ver N` / `最新ver`）、文章は **バージョン**
- 禁止寄り: 最新版 / 次版 / この版 / N版 / 版ごとの声
- 推奨: 最新ver / 次ver / このver / ver N / verごとのフィードバック
- **例外（許容）**: 状態ラベルの **正式版** / **正式版候補**。これらを「正式ver」に置き換えない
- DB の `version_*` 等は即リネーム不要

### 文字量

- 説明文を足す前に、バッジ・チップ・アイコン・表・カード構造を検討する
- セクション説明文は原則なし（置くなら 1 行まで）
- 日付・ver・件数は本文ではなくメタ / バッジ / チップ
- 同じ意味の情報を左右・上下に重複表示しない

### Special Thanks

- `/games/[id]` タブのみ。プラットフォーム名簿・LP/footer ではない
- 目的: **この作品に誰がどう関わったか**。開発ログ・分析・FB 本文一覧ではない
- 載っている理由はバッジ / メタで示す。文章で補わない
- 同じプレイヤーが複数セクションに出てもよい

### 一覧 UI の確認

- **1 件 seed で PASS にしない**
- 10 件以上・長い名前・avatar 有無・handle 有無・複数 ver/件数・2 列/展開/mobile を確認する

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

一気通貫で進めてよい: 設計 → 実装 → typecheck/lint/test/build →（§対象なら）**Codex 独立レビュー PASS** → commit → **Preview push / deploy / smoke**。Supabase の write は Staging / Production とも**オーナー手動**（2026-07-30 方針）。

オーナーの明示指示はその作業範囲全体の承認。指示内では commit / push / smoke の再確認をしない（Supabase write は指示があっても Cursor が実行しない）。

**Production Supabase**（`bpnisgzxuwdxelhnduuf`）: migration / INSERT / UPDATE / DELETE / backfill / Storage 変更は **オーナー手動**。Cursor は適用 SQL・実行順・影響範囲・適用後確認 SQL を提示。オーナー適用後の read-only 検証と smoke は自律。

**Production コード**: チャットの「本番反映して」「リリースして」等 = **一度の承認**で main 反映+push・Vercel Production deploy・smoke・changelog・main↔preview 同期（工程再確認なし。DB 手動分は上記）。

停止するのは次のみ: 指示外未commit差分の混在、対象環境・行の特定不能、想定外の大量変更、依頼外の不可逆操作、secret 本体の表示（依頼超過データ変更・重大リスク判明も含む）。加えて **§10.2**。

Cursor ALLOW / Run Mode（full-auto 寄り・Staging / Production とも DB write は手動）: `docs/cursor-allow-vs-forge-go.md` / `.cursor/rules/stall-detection-resume.mdc`。

## Codex 独立レビュー（重大見落とし検出）

Codex PASS は全変更の絶対条件ではない。優先対象: auth / RLS / private data、security、重要 DB migration、notification / email 等の副作用、大規模横断変更。原則不要: Staging-only seed / fixture / smoke、軽微 UI / 文言、review harness の再帰的 review。

正本: `.cursor/rules/codex-independent-review.mdc` / 手順: `docs/agent-context/cursor-codex-review-flow.md`

- 対象 task では実装開始時にオーナー指示全文を `.agent/tasks/<yyyy-MM-dd-HHmm>-<slug>.md` へ保存
- 実装 → typecheck / lint / build / verify → **PS 5.1 call operator** でレビュー（`-BaseSha` 必須）:

```powershell
& .\scripts\agents\run-codex-review.ps1 -TaskFile .agent\tasks\<task>.md -BaseSha <40-char-sha> -VerifyLog @('.agent\runtime\a.log', '.agent\runtime\b.log')
```

- Codex は `codex exec --sandbox read-only`。**実装させない・ファイルを書かせない**
- 出力は固定 JSON（`verdict` / `summary` / `findings` / `tests_required` / `owner_decisions`）
- 対象 task は `PASS` のみ commit / push 可。`FAIL_FIXABLE` は修正して再レビュー（**最大 3 round**）。Round 3 後は deterministic verify のうえで Owner 判断終了可
- remediation / terminal_closure chain を通常運用として増殖させない
- `NEEDS_OWNER_DECISION` / `BLOCKED` は停止して報告
- Codex の指摘は鵜呑みにせず task 仕様と実コードで照合する。不採用にしたら理由を最終報告に書く
- レビュー基盤自体を触ったら `npm run verify:codex-review-selftest`（Codex を呼ばない受け入れテスト）
- `.agent/tasks` `.agent/reviews` `.agent/runtime` の中身は commit しない（`.gitignore` 済み）

レビューで重く見る順: **仕様適合 → データ安全性 → Production 非退行**。

## Supabase SQL — 最低限の約束

詳細は `.cursor/rules/supabase-sql-safety.mdc`（正本）。要点だけ再掲する。

- **既存 migration ファイルを後から書き換えない**。修正は新しい migration を足す（適用済み環境と履歴がずれるため）
- SQL を書く前に read-only 監査: **schema / 列と型 / PK・FK / CHECK・UNIQUE / trigger / RLS / GRANT / 関数シグネチャ**
- 同じ SQL を **初回適用 / 再実行 / 失敗時 rollback** の 3 通りで検証してから渡す。部分適用が残る SQL は渡さない
- **immutable / append-only 制約を迂回しない**。`DISABLE TRIGGER`、制約 DROP、`session_replication_role` は使わない
- 実 DB（または Postgres 同等環境）で**全文実行して成功**していない SQL をオーナーへ渡さない。未検証なら「未検証」と報告して止まる
- **オーナーを SQL デバッガーとして使わない**。オーナーの実行は最終適用であって、Cursor の試行錯誤の場ではない

## UI 正本と視覚確認

- UI の正本は**オーナー提供のホーム画像（黒×紫）**と `docs/ui-mocks/`（`docs/ui-mock-index.md` から辿る）。実装が正本と食い違う場合は実装側を直す
- **Cursor にスクリーンショット取得やブラウザ自動操作を要求しない**。視覚確認はオーナーが行い、Cursor はコード・データ・構造で検証する
- **mock / fixture / seed を正式なデータ源にしない**。実 UI 経路から mock に fallback しない。デモ用データは Staging 限定で、Production 経路に混ぜない

## 完了報告の必須項目

1. 変更内容と理由
2. 変更ファイル
3. 実行した検証（typecheck / lint / build / verify）と結果
4. Codex レビュー: round 数・各 verdict・対応した findings・不採用の findings と理由
5. commit / push の有無（branch 名と SHA）
6. **オーナーがやること**（SQL 適用・視覚確認・判断待ち）
7. 残リスクと未解決事項

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

正本: **`docs/forge-triage-operations.md` §8** / alias 詳細: **`docs/vercel-preview-project.md`**

- 通常修正: Preview まで自律（調査→編集→verify→**Codex レビュー PASS**→commit→push→**Git Integration deploy**→smoke）。Supabase write はオーナー手動
- Preview 完了は unique deploy URL だけでなく **branch alias**（`forge-git-preview-landing-01-…`）が最新 bundle を配信すること（`npm run verify:preview-branch-alias`）
- 「本番反映して」「リリースして」等 → コードの main / Vercel Production / smoke / 同期を一括（工程再確認なし）。**Production DB はオーナー手動**（SQL 一式を提示）
- 本番 push 後は `preview/landing-01` を `main` に fast-forward + push

## Supabase migration

- **Staging**: **オーナー手動適用**（2026-07-30 方針。それ以前は Cursor 自律だった）。Cursor は SQL 提示・静的検証・適用後 read-only 検証
- **Production**: オーナーが Dashboard SQL で手動適用（可視性優先）。migration / INSERT / UPDATE / DELETE / backfill / Storage は手動。手順提示は Cursor。適用後 read-only 検証は Cursor
- 手順メモ: `docs/supabase-dashboard-migration-guide.md`
- 適用後確認: `docs/supabase-post-migration-checklist.md`<!-- END:forge-agent-rules -->
