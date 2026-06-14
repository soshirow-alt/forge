# Forge Changelog（体験・仕様の変更履歴）

コードの commit 履歴ではなく、**ユーザー体験**と**サービス仕様**がどう変わったかを記録する。

---

## 2026-06-15 version_prompt immutable（同一版内の問い履歴整合）

### 今回やったこと

- **saveDeveloperVersionPrompts**: 初声 1 件以上付いた prompt は文言・形式を UPDATE しない。変更時は archive + 新 INSERT
- 回答 0 件の prompt は同一 id の UPDATE を継続
- 削除は物理削除禁止（archived_at のみ）
- **migration 007**: `get_public_voice_aggregates` — active + 回答済み archived を表示、未回答 archived は非表示
- **fetchOwnerVoiceAggregates**: 上記と同方針の TS 集計（非公開作品も可）
- 共有ロジック: `lib/supabase/voice-prompt-immutable.ts`

### ユーザー体験の変化

- 開発者が問いを直しても、プレイヤーが届けた声の集計ラベル（問い文）が後から書き換わらない
- 回答済み問いを削除しても「みんなの声」から消えない（その版への声として残る）
- プレイヤー向け初声フォームは **active 問いのみ**（変更後の新問いが対象）

### 原典

- `docs/forge-principles.md` §5（版への返答・個別非公開・集計のみ公開）

---

## 2026-06-15 開発者問い設定 UI + migration 006 確認手順

### 今回やったこと

- **開発者問い設定 UI**（`/submit`・`/projects/{id}/edit`）
  - 旧「特に見てほしい観点」（focusNotes テキスト）を **版プレイヤー問い（version_prompt）** エディタに置換
  - 1 版・最大 10 問。回答形式：はい/いいえ、3 段階、もう一度遊びたい、1 行テキスト、カスタム選択肢
  - 未設定時はデフォルト問い「もう一度遊びたい？」（従来どおり）
  - 3 問以上で回答率低下の注意喚起（原典 §5 準拠）
- **Supabase 保存**：`saveDeveloperVersionPrompts` / `fetchDeveloperVersionPrompts`（archived_at で差分同期）
- **migration 006 本番確認チェックリスト** を `docs/supabase-post-migration-checklist.md` §8 に追加

### ユーザー体験の変化

- 開発者：投稿・編集時にプレイヤーへの問いを構造化して設定できる
- プレイヤー：開発者が設定した問いが詳細の「vX.X への返事」に反映（006 適用後）
- focusNotes は新規投稿では保存しない（既存作品の表示は legacy として残る）

### 原典

- `docs/forge-principles.md` §5（版プレイヤー問い・デフォルト問い）

---

## 2026-06-12 初声（version_prompt）+ みんなの声 — プレイヤーサイクル実装 GO

### 今回やったこと

- 原典 §5 更新：1 版・最大 10 問、初声完了 = 返答 1 件以上、応援≠初声、みんなの声（プレイヤー=グラフ / 開発者=解釈）
- migration **006**：`project_version_prompts` / `project_voice_responses` / 公開集計 RPC / feedback RLS 個別非公開
- 1 段目 UI：`GameVoiceSection`（複数問い・1 問 OK・返事を届ける）
- 2 段目：`GameDeepFeedbackForm`（任意・折りたたみ）
- プレイヤー向け「みんなの声」：集計グラフのみ（個別回答非公開）
- 開発者向け：問い別集計 + ルールベース解釈（AI 前段）
- Phase A 接続：プレイ後バナー / モーダル → `#game-voice-section`

### ユーザー体験の変化

- プレイヤー：5 項目フォーム一括ではなく、開発者の問いに短く返事 → 成功体験完結
- プレイヤー：「みんなの声」で集計傾向を確認（レビュー一覧ではない）
- 開発者：my-projects で問い別の解釈 + 数字を確認
- 個別の初声・深い改善材料は公開されない

### 原典

- `docs/forge-principles.md` §1・§5・§7

---

## 2026-06-12 P1-2.5 作品育成ハブ — /my-projects 情報設計

### 今回やったこと

- `/my-projects` を **作品育成ハブ** に再設計（FB inbox 型から転換）
- 3層構造: 作品一覧 → 作品選択（アコーディオン）→ 作品育成
- 各作品カードに **現在地** + **次にやること** を最優先表示
- 成長ステップ: 投稿/発見/プレイ（小）+ FB/改善/新版公開/反応待ち（大ループ）
- 改善サイクル: 前回/今回/次 の文脈表示（競わせない）
- プレイヤーの声（FB）を展開内最後段に格下げ
- 横断 NextActionsPanel / FB inbox 廃止
- `?focus=id` 拡張余地（任意深リンク）
- 投稿 CTA: 作品あり時 tertiary

### ユーザー体験の変化

- 入室直後に「どの作品を育てるか」が分かる
- FB は材料、主行动は devlog / 版公開
- CTA 散在・重複の解消

### 関連

- オーナー GO: P1-2.5 v2 ワイヤ

---

## 2026-06-12 P1-2 my-projects 強化（案 B B1+B2）

### 今回やったこと

- `/my-projects` 冒頭に **NextActionsPanel**（次にやること）を追加
- **FB inbox** を作品管理テーブルより上へ移動
- 各 FB から **開発ログを書く** primary CTA → `/projects/{id}/devlog/new`
- FB 件数バッジを作品テーブルに表示
- B2 ヒューリスティック: FB 受信後 devlog 未対応作品を「要対応」表示

### ユーザー体験の変化

- 開発者がログイン後すぐ「次に何をすればいいか」が分かる
- FB → 改善(devlog) の 1 クリック導線
- 分析ダッシュボード化ではなく行動導線を優先

### Out（今回やらない）

- 作品別 Studio ページ（案 C）
- DB migration / 開発者 FB 通知 Supabase 化 / AI 要約 / ランキング

### 本番 deploy

- Deploy ID: `dpl_BmY7mgTEqocGqSUDNVvgd6GXzy59` — READY
- 本番: https://forge-flame-gamma.vercel.app

---

## 2026-06-12 P1-1 登録〜メール認証導線（案α A+B）

### 今回やったこと

- signUp 後 **session なしではログイン済み扱いにしない**（auth-provider）
- 新規登録成功後 **`/auth/verify-email`** 確認待ち画面へ遷移
- **`/auth/callback`** で Supabase メール確認リンクの code 交換
- **`/auth/welcome`** で「メール確認完了」「Forgeへようこそ」→ CTA は **ホーム `/`**
- signUp / 再送に `emailRedirectTo` を指定（`lib/auth-redirect.ts`）

### ユーザー体験の変化

- 登録直後にホームへ誤リダイレクトしなくなった
- 確認メール送信・待ち状態が専用画面で明示される
- メール Confirm 後、welcome 経由でログイン済みホームへ進める

### オーナー作業

- Supabase Dashboard → Redirect URLs に `/auth/callback`（本番 + localhost）を追加 — **設定済み（2026-06-12）**

### 本番 deploy

- Deploy ID: `dpl_8NwvuGAZcNTED29DfCn3vxL9Lqcm` — READY
- 本番: https://forge-flame-gamma.vercel.app

### 関連

- オーナー GO: P1-1 案α Phase A+B 一括

---

## 2026-06-13 Discovery 統合 — テストプレイ受付中タブ廃止

### 今回やったこと

- ホーム Discovery を **新着作品 + 急上昇** の 2 タブに整理（「テストプレイ受付中」タブ削除）
- 新着 feed に **全 public 投稿作品** を統合（`lookingForTesters` による exclusion 廃止）
- 投稿時 `lookingForTesters: false` をデフォルト化
- recruitingOnly フィルタチップ・「テストプレイ受付中」ソートを削除
- 投稿完了画面 CTA を原典順に再構成（新着確認 → プレイURL → ダッシュボード → devlog）
- テスター募集系 UI を MVP 非露出（作品編集・詳細 Apply・バッジ・Hero 等）
- `looking_for_testers` DB 列・内部型は温存（migration なし）

### ユーザー体験の変化

- 投稿後、**新着作品タブ**に載る（バグ誤認の解消）
- Forge がテスター募集サイトに見えにくくなった
- 主導線: 発見 → プレイ → FB → 改善

### 関連

- オーナー GO: 2026-06-13 Discovery 設計整理

---

## 2026-06-13 本番 E2E 確認手順書 — 再プレイ→新FB ループ

### 今回やったこと

- **`docs/e2e-version-published-loop-production.md` 新設**
  - 事前条件（005・deploy・2 アカウント・実作品・watch/FB 状態）
  - プレイヤー（B）/ 開発者（A）の 1 クリック単位手順
  - 各ステップの期待結果
  - 失敗時切り分け（通知なし / バナーなし / FB 切替なし）
  - ChatGPT・Cursor 貼付用の結果記録テンプレート

### ユーザー体験の変化

- プロダクト UI 変更なし。**検証フェーズ**のドキュメント整備
- オーナーが本番でコアループ最終節を非エンジニアでも確認可能

### 関連リンク

- `docs/version-published-loop-design.md` / `docs/supabase-dashboard-migration-guide.md` §005 から参照

---

## 2026-06-13 オーナー × ChatGPT × Cursor トリガー運用の恒久化

### 今回やったこと

- **`docs/forge-triage-operations.md` 新設** — トリガー運用の正本
  - `CURSOR` キーワード（Cursor 貼付用完成文 1 本）
  - Run スクショ → Run 判断 [A]〜[D]
  - summary / handoff / 判断用メモ → レビュー運用
  - UX 違和感発言 → UX レビュー
  - プロダクトレビュー優先順位（原典＞ユーザー＞開発者＞MVP＞技術）
  - チャット移行（handoff 初回 → summary 追従）
- `docs/gpt-run-decision-memo.md` — 結論を 4 段階 [A]〜[D] に更新
- `AGENTS.md` / `forge.mdc` / `forge-principles.md` / `chatgpt-summary-format.md` / `chatgpt-handoff.md` に反映

### オーナー・ChatGPT 体験の変化

- 「CURSOR」だけで ChatGPT から Cursor へ貼れる完成指示が得られる
- Run スクショ・サマリ貼付時の ChatGPT の振る舞いが明文化され、解釈ブレを防止
- UX の「なんか違う」等が感想ではなくレビュー依頼として扱われる

### 注意事項

- プロダクトコード変更なし。運用ドキュメントのみ
- 旧 Run 結論「[C] 中止推奨」は **[D] Run禁止** または **[C] 追加確認推奨** に読み替え

---

## 2026-06-12 成長ループ接続 — 新版公開通知 + 再プレイバナー（コード実装済み・DB migration 005 未適用）

### 今回やったこと

- devlog で版 bump 時、watch ユーザーへ **version_published** 通知（devlog 通知とは別 type）
- 通知一覧 → 作品詳細（バナーへアンカー）導線
- 追跡中ユーザー向け「新しいプレイ可能版」バナー（再プレイ + 新 FB 案内）
- migration **005**：`user_notifications.type` に `version_published`、`published_version` 列

### ユーザー目線で変わること（005 + deploy 後）

- プレイヤー：追跡作品の新版公開に通知で気づき、詳細で再プレイ・新 FB を促される
- 開発者：版 bump の結果、プレイヤーが戻りやすくなる

### 注意事項

- **005 適用 → deploy の順**（004 と同様）。コード先行 deploy すると通知 insert が失敗する

---

## 2026-06-12 UX P0 — 開発者導線改善

### 今回やったこと

- devlog フォーム：「今回の更新タイトル / 内容」＋説明文
- 投稿完了画面：「次にやること」（開発ログ・プレイURL確認・テスター募集）
- 開発ダッシュボード（`/my-projects`）：作品行に「開発ログを書く」「フィードバックを見る」
- ヘッダー・各所の名称を「開発ダッシュボード」に統一
- ログイン：パスワード欄 Enter で送信

### ユーザー目線で変わったこと

- 開発者：投稿後・ダッシュボードから「次に何をするか」が分かる
- devlog 投稿時に何を書く画面か迷いにくい

### 注意事項

- DB 変更なし。ホーム「テストプレイ受付中」タブは触っていない（中長期で統合検討）

---

### 今回やったこと

- **migration 004 SQL** 作成：`playable_version`、`version_key` / `updated_at`、UNIQUE（user×作品×版）、devlog `published_version`、phase `プロトタイプ`→`試作版`
- 作品ごとに **プレイ可能版**（自由入力、初期 `0.1`）を保持
- FB：**1ユーザー×1作品×1プレイ可能版 = 1件**。同版は **編集可**（UPDATE）
- devlog 投稿時：「新しいプレイ可能版として公開」チェック + 版名入力 → `playable_version` 更新 + devlog に `published_version` 保存
- 既存 FB は `version_key = 0.1` 扱い。旧版 FB のプレイヤー向け表示は **後回し**
- 開発者 FB 一覧・作品詳細 FB フォーム・開発の歩み（`published_version` ラベル）を対応

### ユーザー目線で変わること（migration + deploy 後）

- プレイヤー：現行プレイ可能版に対して FB を投稿・**同版なら編集**できる
- 開発者：devlog から新版を公開すると FB 枠が版ごとに分かれる。ダッシュボードで版ラベル付き FB を確認

### 注意事項

- **本番 DB 変更あり**。適用順：**Dashboard で 004 → その後 deploy**
- `status` 列は変更しない
- 詳細：`docs/migration-004-design.md`、`docs/supabase-dashboard-migration-guide.md` §004

---

### 今回やったこと

- フェーズ4名称を統一：**試作版 / プレイ可能版 / 通しプレイ版 / 公開準備中**
- 投稿フォーム：各選択肢に開発者向け補足（hint）を表示
- 詳細ページ：フェーズ名 + プレイヤー向け1行説明
- 一覧カード：フェーズ名のみ（旧文字列は表示時に正規化）
- mock 18作品・デモ投稿の古い表現（α版/β版/プロトタイプ等）を整理
- 発見フィルタを新4名称に揃え、旧文字列は一時的に fuzzy マッチ

### ユーザー目線で変わったこと

- 開発者：α/β で迷わず「どこまで遊べるか」で選べる
- プレイヤー：詳細で完成度の目安が1行で分かる

### 注意事項

- DB 変更なし。Supabase に旧 phase が残っていても表示は正規化される
- DB 一括移行は任意（後日オーナー判断）

---

## 2026-06-13 フィードバック表示改善 & 開発者 FB 一覧

### 今回やったこと

- 作品詳細：「コミュニティの声」→「プレイヤーからの改善材料」に変更。星評価・平均スコアを廃止（実データ優先、デモはサンプル表示のみ）
- 良かった点 / 気になった点 / バグ / 観点回答 / 再プレイ意向を構造化表示
- クリエイターダッシュボード（`/my-projects`）に自分の作品への FB 一覧を追加
- 将来方針メモ：`docs/feedback-roadmap.md`（バージョン別 FB は未実装）

### ユーザー目線で変わったこと

- プレイヤー：詳細ページでレビューっぽくなく、改善ヒントとして読める
- 開発者：ダッシュボードで届いた FB を一覧確認できる

### 注意事項

- DB 変更なし。既存 Supabase `project_feedback` をそのまま表示
- バージョン別制約・編集・AI 要約・開発者返信は未実装（意図的）

---

## 2026-06-13 プレイ導線 returnUrl（限定）

### 今回やったこと

- 未ログインでプレイ / 外部リンク → `/login?return=/games/{id}` → ログイン成功後に作品詳細へ
- `/games/{id}` のみホワイトリスト。無効時は `/` へ
- 応援・保存・FB 等は従来どおり return なし

### ユーザー目線で変わったこと

- プレイのためにログインしたあと、**同じ作品詳細に戻れる**

---

## 2026-06-13 マイページ最小版

### 今回やったこと

- `/mypage` 新設：応援中・更新を追う・あとで見る・投稿した作品を分けて表示
- ヘッダーに「マイページ」リンク追加（ダッシュボードは開発者向けのまま）
- DB 参照のみ（`userEngagement` + `projects`）。新規テーブルなし

### ユーザー目線で変わったこと

- ログイン後、「押した操作が何だったか」を一覧で確認できる
- 応援・追跡・保存の意味の違いがページ上で説明される

### 注意事項

- `/bookmarks` は従来どおり存続（マイページと同データ）
- フィードバック履歴・通知管理・フォローは未実装（意図的）

---

## 2026-06-13 localStorage 残骸削除（Step 2）

### 今回やったこと

- デッドコード削除：`play-session.ts`、feedback LS 関数、`loadDeveloperProfiles`
- demo-setup から未使用の support/feedback LS seed 削除
- localStorage 分類ドキュメント追加

### ユーザー目線で変わったこと

- なし（本番 UX は同じ）。コア操作はもともと Supabase 保存。

### 注意事項

- 応援・FB 等のオーナー通知は `forge-notifications`（LS）のまま
- extras / follow / テスター応募数も LS 継続

---

## 2026-06-12 本番 Supabase migration 001/002/003 適用完了

### 今回やったこと

- オーナーが Supabase Dashboard SQL Editor で 001 → 002 → 003 を順に実行
- Table Editor で 9 テーブルすべて確認済み

### ユーザー目線で変わったこと

- 本番で応援・保存・追跡・FB・開発ログ・watch 通知が DB 保存可能になった（画面確認はこれから）

### 注意事項

- 本番 URL は forge-flame-gamma.vercel.app
- 確認手順: docs/supabase-post-migration-checklist.md

---

## 2026-06-12 本番 migration 手順・運用ルール整備

### 今回やったこと

- Supabase Dashboard 向け migration 002/003 適用手順（非エンジニア向け）
- migration 適用後の本番確認チェックリスト（成功/失敗の見え方）
- Run 停止時の **GPT判断用メモ** 運用ルール（AGENTS.md / Cursor Rules / handoff）
- Supabase プラン・課金確認ガイド（オーナー向け）

### ユーザー目線で変わったこと

- なし（ドキュメント・運用のみ）。migration 適用後に devlog・通知・エンゲージメントが本番で動く。

### 注意事項

- migration 002/003 は **オーナーが Dashboard で実行**（Cursor は認証なしのため自動適用しない）

---

## 2026-06-12 開発ログ Supabase 化 + watch 通知

### 今回やったこと

- migration 003：`project_devlogs` / `user_notifications` テーブル追加
- 開発ログを localStorage から Supabase に移行
- devlog 投稿後、`project_watches` を参照して watch ユーザーへ通知を bulk insert
- devlog 通知は Supabase、応援/FB 等の通知は従来どおり localStorage（暫定）

### ユーザー目線で変わったこと

- 開発者が投稿した開発ログが、**他の端末・他のユーザー**からも詳細ページで見える
- **更新を追っている作品**に開発ログが追加されると、**通知一覧**に表示される（別端末でも、ページを開けば反映）
- 組み込みデモ18作品は、従来どおりサンプル履歴表示（DB にログがなければ）

### 開発者目線で変わったこと

- devlog 通知は DB trigger ではなくアプリ側 bulk insert（MVP 向けシンプル構成）
- `/notifications` 表示時に DB 通知を再取得

### 注意事項

- **migration 002 + 003** を本番 Supabase に適用すること
- Realtime / プッシュ通知は未実装（通知ページを開くと反映）

### 未実装事項

- 応援・FB 通知の Supabase 化
- projects extras カラム（プレイ時間・観点）

### 主な変更ファイル

- `supabase/migrations/003_project_devlogs_and_notifications.sql`
- `lib/supabase/project-devlogs.ts`
- `lib/supabase/user-notifications-db.ts`
- `components/games-provider.tsx`

---

## 2026-06-12 開発運用ドキュメント整備

### 今回やったこと

- Forge 原典・判断基準を `docs/forge-principles.md` に集約
- 体験・仕様の変更履歴用 `docs/forge-changelog.md` を新設
- ChatGPT / Cursor 連携用の現在地メモ `docs/forge-handoff.md` を新設
- Cursor 向け開発ルールを `AGENTS.md` に追記

### ユーザー目線で変わったこと

- **アプリの見た目・操作は変わらない**（ドキュメントと運用のみ）

### 開発者目線で変わったこと

- 仕様の原典がリポジトリ内に固定され、チャットに散らばりにくくなった
- 作業完了時に ChatGPT へ貼るサマリ形式が決まった

### 注意事項

- 原典の意味は変更していない（整理・構造化のみ）

### 未実装事項

- 変更なし

### 主な変更ファイル

- `docs/forge-principles.md`（新規）
- `docs/forge-changelog.md`（新規）
- `docs/forge-handoff.md`（新規）
- `AGENTS.md`

---

## 2026-06-12 ログイン必須アクションの整理

### 今回やったこと

- プレイ・外部リンク・応援・あとで見る・更新追跡・フィードバックをログイン必須に
- 未ログインでも詳細ページは閲覧可能
- 未ログイン時はボタンを残し「ログインして〜」表示、`/login` へ遷移
- 応援・ブックマーク・ウォッチ・プレイ・フィードバックを Supabase に保存

### ユーザー目線で変わったこと

- ゲームを**探す・読む**のはログインなしで可能
- **遊ぶ・応援する・保存する**にはログインが必要
- ログイン前でも「ログインすると何ができるか」がボタンから分かる
- 応援は1回押すと「応援中」になり、何度も数字が増えない

### 開発者目線で変わったこと

- エンゲージメント用 Supabase テーブル追加（migration `002_user_engagement.sql`）
- localStorage 依存の応援・ブックマーク等を Supabase へ移行

### 注意事項

- Supabase に migration 002 を適用しないと、応援等が保存されない
- ログイン後は `/` に戻るシンプル仕様（redirect パラメータなし）
- 通知・開発ログ・フォロー等はまだ localStorage 暫定

### 未実装事項

- ログイン後の元ページへ戻る redirect
- 通知・devlog・フォローの Supabase 移行

### 主な変更ファイル

- `components/games-provider.tsx`
- `components/game-detail-sidebar.tsx`
- `components/game-external-links.tsx`
- `components/game-support.tsx`
- `hooks/use-require-auth.ts`
- `supabase/migrations/002_user_engagement.sql`

---

## 2026-06-11 原典に沿った詳細・発見・フィードバック強化

### 今回やったこと

- 詳細ページに概要（フェーズ、プレイ時間、タグ、テスト受付等）を整理表示
- 構造化フィードバック（良かった点 / 気になった点 / バグ / 再プレイ意向）
- プレイ後にフィードバックフォームを表示する導線
- 開発履歴・コミュニティの声セクション
- 更新を追う / あとで見る UI
- トップの発見フィルタ（ジャンル、フェーズ、プレイ時間等）
- 投稿フォームの入力内容が詳細に反映されるよう整理

### ユーザー目線で変わったこと

- 詳細ページで「今遊ぶ理由」が判断しやすくなった
- プレイしてから感想を書く流れになった（いきなり評価を求めない）
- 一覧で完成前ゲームを絞り込みやすくなった

### 開発者目線で変わったこと

- 想定プレイ時間・観点メモ等は一部 localStorage（extras）で暫定保存

### 注意事項

- 応援の連打増加仕様はこの後のログイン整理で改修

### 未実装事項

- extras の Supabase 永続化

### 主な変更ファイル

- `components/game-detail-page-client.tsx`
- `components/game-detail-overview.tsx`
- `components/game-feedback.tsx`
- `components/home-page.tsx`
- `components/submit-page.tsx`

---

## 2026-06-10 投稿フォーム MVP 整理

### 今回やったこと

- 投稿フォームをテスター募集と MVP に合わせて簡素化
- アクセス方法（ブラウザ / ダウンロード / 外部サイト）を明確化
- 重複フィールドの整理

### ユーザー目線で変わったこと

- 作品投稿が短く分かりやすくなった
- どう遊べるゲームか（配布方法）が投稿時に選べる

### 開発者目線で変わったこと

- テスター募集チェックの冗長 UI を削除

### 注意事項

- なし

### 未実装事項

- なし

### 主な変更ファイル

- `components/submit-page.tsx`

---

## 2026-06-10 ログイン後の遷移簡素化

### 今回やったこと

- ログイン成功後は常にトップ `/` へ遷移
- redirect クエリによる複雑な戻り先処理を廃止

### ユーザー目線で変わったこと

- ログイン後の動きが予測しやすくなった（必ずトップ）

### 開発者目線で変わったこと

- redirect 周りの不具合リスクを下げた

### 注意事項

- 保護ページからログインした場合も一旦トップに戻る

### 未実装事項

- ログイン後に元の操作へ戻る UX

### 主な変更ファイル

- ログイン関連コンポーネント・middleware

---

## 2026-06-09 ホーム発見 UX・ビジュアル刷新

### 今回やったこと

- ヒーローコピー：「次にハマるゲームは、完成前に見つかる。」
- 大型ヒーローショーケース（Steam 風の注目作品）
- 重複していた「今注目」セクションを削除
- タブ：新着 / テストプレイ受付中 / 急上昇
- ユーザー向け文言：テスター → テストプレイ
- デモ用 SVG サムネイル（ジャンルが伝わるイラスト風）

### ユーザー目線で変わったこと

- トップが「完成前ゲームのショーケース」らしくなった
- 「テストプレイ受付中」が一般ユーザーにも分かりやすくなった

### 開発者目線で変わったこと

- 内部データ名（lookingForTesters 等）は維持、表示のみマッピング

### 注意事項

- なし

### 未実装事項

- AI サムネ生成（Coming Soon 表示のみ）

### 主な変更ファイル

- `components/home-page.tsx`
- `components/hero-game-showcase.tsx`
- `public/demo-thumbnails/*.svg`

---

## 2026-06-08 Supabase 認証・作品永続化

### 今回やったこと

- Supabase Auth によるログイン / サインアップ
- 投稿作品・開発者プロフィールを Supabase に保存
- 保護ルート（投稿・マイ作品等）の middleware

### ユーザー目線で変わったこと

- アカウントを作ると作品投稿が端末をまたいで残る
- ログインしないと投稿・マイ作品に入れない

### 開発者目線で変わったこと

- mock + localStorage 中心からハイブリッド構成へ

### 注意事項

- Supabase 環境変数未設定時は認証・保存が動かない

### 未実装事項

- エンゲージメント全般の Supabase 化（後日対応）

### 主な変更ファイル

- `lib/supabase/*`
- `components/auth-provider.tsx`
- `supabase/migrations/001_projects_and_developer_profiles.sql`

---

## 2026-06-07 MVP 基盤（初期）

### 今回やったこと

- ダーク × オレンジの Forge ランディング / 一覧 / 詳細
- 日本語 UI
- 応援ボタン、投稿、マイ作品、検索・タグ・ソート
- プレイ URL・外部リンク
- クリエイターページ・フォロー（localStorage）
- フィードバック（当初はコメント形式）

### ユーザー目線で変わったこと

- 開発中ゲームを探して詳細を見て、外部でプレイできる MVP が成立

### 開発者目線で変わったこと

- ほぼ localStorage + React state のプロトタイプ

### 注意事項

- 以降、原典に沿って localStorage 依存を段階的に削減

### 未実装事項

- バックエンド永続化、構造化フィードバック、ログイン方針（すべて後続で対応）

### 主な変更ファイル

- 初期 app / components 一式
