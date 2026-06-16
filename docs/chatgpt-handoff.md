■ ChatGPT 新チャット引継ぎ — 全量スナップショット
更新日: 2026-06-13
用途: 新 GPT スレッドの最初に1回だけ貼る。以降は docs/chatgpt-summary.md（差分）を毎タスク貼る。
素材用途: ChatGPT 側で「新チャット用の最終プロンプト」を組み立てるための全量テキスト。

================================================================
■ Forge原典・コンセプト
================================================================

Forge 一言:
完成前のゲームとプレイヤーを繋ぐプラットフォーム。

Steam との違い:
Steam = 完成したら来てね
Forge = 完成してなくていいよ（開発中ゲームの発見と成長）

Forge は何ではないか:
テスター募集サイトではない（テスト参加は手段の一つ）
ゲーム紹介・送客サイトではない（プレイと反応が Forge 上に残ることが重要）
完成品ストアではない（Steam の前段階）

Forge は「ゲームが成長する場所」。

開発者への価値:
作ったゲームを見つけてもらえる / 遊んでもらえる / 感想（改善材料）が返ってくる

プレイヤーへの価値:
まだ世に出ていないゲームを遊べる / 無料（MVP前提）/ 成長を見られる / 未来のヒット作を先に発掘

Forge原典コアループ（最重要・すべての判断基準）:
投稿 → 発見 → プレイ → フィードバック → 改善(devlog) → 再プレイ → 新FB

新機能・UI・DB設計はすべて「このループを強化するか」で判断する。

ブランド:
まだ誰も知らないゲームを、一緒に面白くする。
トーン: ダーク基調 × オレンジアクセント。Steam × Product Hunt × インディーショーケース。

MVP で作らないもの:
ランキング、バッジ、投げ銭、課金、販売、採用率ゲーミフィケーション、Forge SDK実装（説明UIのみ可）、新しい収益化機能

原典ファイル: docs/forge-principles.md（意味の変更はオーナーのみ）

================================================================
■ オーナーの役割 / ChatGPTの役割 / Cursorの役割
================================================================

オーナー（非エンジニア）:
Forge のプロダクトオーナー。原典の意味を決める最終判断者。
ユーザー価値・Forge コンセプトを最優先。技術詳細より「何が起きるか」を重視。
Run（push / deploy / migration 等）の最終 GO/NO-GO は ChatGPT と相談して決める。
Cursor 返答末尾の GPT用メモ（text ブロック）を Copy して ChatGPT に貼るのが主経路。
画面スクショは Run 判断時以外はなるべく避けたい。

ChatGPT:
実装者ではなく壁打ち役・**プロダクトレビュー**役（コードレビューではない）。
敬語。オーナーを「お前」と呼ばない。
判断優先順位: Forge原典 → ユーザー価値 → 開発者価値 → MVP成立 → 技術的綺麗さ
Forge 原典に照らして議論する。思いつきで機能追加を提案しない。
MVP を雑に削りすぎない。収益化より「無料でも使いたくなる価値」を優先。
Cursor への指示は完成版1本で出す（断片的に出さない）。追記形式・複数レス前提は禁止。
オーナー判断が必須な論点では Cursor 指示を出さず、判断材料を整理する。
専門用語は噛み砕く（RLS、migration、CHECK 制約など）。

--- トリガー運用（恒久・正本 docs/forge-triage-operations.md）---

CURSOR キーワード:
オーナーが「CURSOR」とだけ送った → 直前会話を踏まえ Cursor へそのまま貼れる完成文1本を出力。説明だけで終わらない。

Run スクショ:
Run/Deploy/Migration/Run確認画面のスクショ → Run判断依頼。[A]Run推奨 [B]事前確認 [C]追加確認 [D]Run禁止。Forge価値・ユーザー影響・復旧難易度も考慮。

サマリレビュー:
chatgpt-summary / chatgpt-handoff / GPT判断用メモ が貼られた → 要約ではなくレビュー。現在地・リスク・次アクション・原典整合を確認。

UX レビュー:
「分かりにくい」「なんか違う」「使いづらい」「何をすればいいか分からない」「気持ち悪い」等 → UXレビュー依頼。他ユーザーも同様の違和感を持ちうるか検討。

Run 判断（メモ/スクショ）:
Cursor が GPT判断用メモを出したら、それを Run 判断として扱う。

Cursor:
実装・build・docs 更新・GPT用メモ出力を担当。
docs/forge-principles.md の意味を勝手に変えない。
作業完了時: forge-changelog / chatgpt-summary 更新 + 返答末尾 text ブロック必須。
migration / push main / prod deploy 等で Run 前に止まったら GPT判断用メモを出力。
形式標準: docs/chatgpt-summary-format.md（恒久。オーナーが変更指示するまで従う）。

================================================================
■ オーナーの意思決定傾向
================================================================

非エンジニア。技術詳細よりユーザー価値・Forge 価値を重視。
専門用語は噛み砕きが必要。
Run 判断は ChatGPT に任せたい（Cursor は GPT判断用メモを出して止まる）。
Cursor のサマリは薄くしない方針（厚いメモ恒久運用）。
画面スクショは Run 時以外なるべく避けたい。
実装都合で仕様を曲げない。
P1 copy 改善は保留可。体験の穴（機能ギャップ）を優先。
extras DB 化は重要だが、コアループ接続より後でもよいと判断したことがある。
ホーム「テストプレイ受付中」タブは短期維持・中長期は統合寄り。
作品 dashboard 新規 page は現時点不要。
名称は「開発ダッシュボード」（/my-projects）。

================================================================
■ 運用ルール
================================================================

--- Cursor サマリ運用（恒久）---

形式標準: docs/chatgpt-summary-format.md（オーナーが変更指示するまで永久に従う）
実体ファイル: docs/chatgpt-summary.md（毎タスク上書き）
返答末尾: 同一内容の ```text ブロック（Copy ボタンが主経路）
薄いサマリ禁止。ロードマップ系 60行以上、実装完了 40行以上目安。
必須セクション（設計判断時）: なぜこの設計 / 他案不採用 / In Out / リスク / オーナー確認手順 — 削らない。
UI 変更時追加必須: ■ 今回変更した画面（画面名・URL・画面位置・変更前後・プレイヤー/開発者視点・確認手順）

--- chatgpt-summary と chatgpt-handoff の違い ---

chatgpt-summary.md:
毎タスク上書き。差分中心。「今回何をしたか」「設計判断」「画面変更」。
日常の ChatGPT 連携はこれ + 返答末尾 text ブロック。

chatgpt-handoff.md:
引継ぎトリガー時のみ全量更新。新 GPT スレッド初回に1回貼る。
「今どこを作っているか」全体像・画面マップ・ロードマップ・判断履歴を含む。

handoff 更新トリガー:
大テーマ完了 / migration 完了 / ロードマップ順位変更 / オーナー引継ぎ指示
更新しない: 小修正、copy のみ、build 確認のみ

新スレッド貼付順: handoff（1回）→ 以降 summary（差分）のみ

--- Run 判断ルール ---

Cursor が Run 確認前に止まる操作:
git push（特に main）、main 反映、Supabase migration / DB 変更 / 削除、本番 deploy / env 変更、課金が発生しうる操作

停止時: docs/gpt-run-decision-memo.md 形式の GPT判断用メモを出力（スクショ不要）
オーナー → ChatGPT に貼る → [A] Run推奨 / [B] 事前確認 / [C] 追加確認 / [D] Run禁止 を判断 → Cursor に指示

ChatGPT 側の Run 判定傾向（オーナー合意）:
docs だけなら基本 OK
push / deploy は多くの場合 OK
migration / DB / RLS / 課金 / 認証 / 環境変数は慎重（多くは [B] 事前確認）
Run スクショ・Deploy/Migration スクショが貼られたら Run 判断として扱う（[A]〜[D]）

--- チャット移行運用 ---

ChatGPT 新スレッド: chatgpt-handoff.md を最優先コンテキスト（1回）→ 以降 summary のみ
Cursor 新 Agent（New Agent / Ctrl+N）: 最初の1メッセージで handoff 参照 + 現在地1〜3行。以降通常タスク。
古いチャット削除不要。重くなったら新 Agent へ。

--- 通常サマリと引継ぎサマリ ---

通常 = chatgpt-summary（差分、毎回）
引継ぎ = chatgpt-handoff（全量、トリガー時のみ）
forge-handoff.md は別物（Markdown、リポジトリ内 Cursor 向け現在地。GPT 貼付用ではない）

--- 画面変更セクションの運用 ---

UI を変更したタスクでは ■ 今回変更した画面 を必須。
対象は今回変更した画面のみ（全画面説明は handoff 側）。
画面位置を必ず書く（例: 概要セクション直下、ヘッダー右上、通知一覧の各カード）。
UI 変更なし（migration のみ等）: 「該当なし（バックエンドのみ）」

--- オーナー判断が必要な場合 ---

原典の意味を変えるとき
DB 設計 / 認証 / 通知 type / 権限 / 保存先（LS vs Supabase）の方針変更
migration / prod deploy / 課金操作
ロードマップ優先順位の大幅変更
In/Out スコープの拡大

ChatGPT: オーナー判断必須なら Cursor 指示を出さず止める。
Cursor: 設計論点では Cursorの推奨案 / 推奨理由 / 懸念点 を厚いサマリに含める。

================================================================
■ 現在の本番状態
================================================================

本番 URL: https://forge-flame-gamma.vercel.app
Vercel プロジェクト名: forge（forge-app ではない）
Supabase Project Ref: bpnisgzxuwdxelhnduuf

最新 commit（product コード）: 46954dc 付近
Connect replay loop with version_published notifications（1c02136 + summary 46954dc）
docs 運用整備（format / handoff / 恒久ルール）は同セッションで追加済み（commit 状態は要確認）

deploy 状態:
2026-06-13 本番 deploy 完了（vercel deploy --prod、READY）
本番 URL: https://forge-flame-gamma.vercel.app
migration 005 適用済み（Dashboard 確認 text,text）

Supabase migration 状態:
001 適用済み: projects, developer_profiles
002 適用済み: project_supports, project_watches, project_bookmarks, project_plays, project_feedback
003 適用済み: project_devlogs, user_notifications（devlog 通知）
004 適用済み: playable_version, version_key, published_version, phase 整理
005 適用済み: version_published 通知 type, published_version 列（Dashboard 確認 text,text）

本番データ状態:
実作品（Supabase 投稿）: おおむね 1 件（「消えるかな？」等、オーナー確認ベース）
mock 作品: 18 件程度（lib/mock-games.ts）。discovery を占める。
mock 作品は Supabase 通知対象外（submitted 作品のみ通知送信）。
ハイブリッド構成: mock + Supabase submitted を games-provider がマージ表示。

mock 作品との関係:
発見・一覧・詳細は mock + 実投稿の両方表示。
エンゲージメント（応援/追跡/FB/プレイ）は Supabase（002）— mock ID も text project_id で格納可。
devlog / devlog・version 通知は submitted（Supabase）作品のみ。
デモ環境: /demo で LS ベースのデモデータ作成可。

================================================================
■ DB / Supabase 状態
================================================================

適用済み migration: 001, 002, 003, 004, 005

主要テーブル:
developer_profiles — 開発者公開プロフィール
projects — 作品（playable_version 含む、004）
project_supports — 応援（1人1回 UNIQUE）
project_watches — 更新を追う
project_bookmarks — あとで見る
project_plays — プレイ記録
project_feedback — 構造化 FB（version_key, updated_at、004）
project_devlogs — 開発ログ（published_version、003/004）
user_notifications — 通知（devlog / version_published 予定、005）

project_id は text（UUID と mock slug 混在、FK なし — 001 方針）

版関連フィールド:
projects.playable_version — 現行プレイ可能版（自由入力、初期 0.1）
project_feedback.version_key — FB が属する版
project_devlogs.published_version — devlog 投稿時に版 bump した場合の版名
user_notifications.published_version — version_published 通知用（005 後）

localStorage 残件（本番共有不可・端末依存）:
game extras（focus_notes, estimated_play_time 等）— lib/game-extra-storage.ts
テスター応募数（applicant counts）
クリエイターフォロー / フォロワー数
一部通知（devlog 以外の type、NOTIFICATIONS_STORAGE_KEY）— devlog/version は Supabase
デモ用キー（forge-demo-project-ids 等）

課金状態（Cursor からは直接見えない）:
オーナーが Supabase Dashboard → Billing で確認。
一般的に Free プランで MVP 初期は十分。Pro は手動アップグレード。
migration 002〜005 は空テーブル追加/列追加中心で課金リスク低。
詳細: docs/supabase-owner-operations.md

================================================================
■ 実装済み機能一覧
================================================================

投稿: /submit。Supabase projects + developer_profiles に保存。公開/非公開、フェーズ4択、テスター募集設定。
発見: / トップ。タブ（新着/テストプレイ受付中/急上昇）、フィルタ、ソート、ショーケース。
プレイ: 作品詳細サイドバー「プレイする」。ログイン必須。外部 URL へ。project_plays に記録。
ログイン: /login。Supabase Auth。returnUrl は /games/{id} のみ（プレイ/外部リンク導線）。
応援: 1人1回。投げ銭ではない。project_supports（Supabase）。
更新を追う: project_watches（Supabase）。watch 中ユーザーへ devlog/version 通知。
あとで見る: project_bookmarks（Supabase）。/bookmarks 一覧。
フィードバック: 構造化（良かった点/気になる点/バグ/フォーカス/再プレイ意向）。プレイ後表示。
開発ログ: project_devlogs。版 bump オプション付き。開発の歩みに表示。
通知: user_notifications（devlog, version_published 予定）+ LS 混在（非 devlog type）。
マイページ: /mypage。応援した作品・追跡中・あとで見る・自分の投稿一覧。
開発ダッシュボード: /my-projects。作品一覧、FB inbox、応援数、テスター応募数、クイックアクション。
フェーズ整理: 試作版 / プレイ可能版 / 通しプレイ版 / 公開準備中（4名称統一済み）。
returnUrl: lib/login-return-url.ts。プレイ/外部リンクからログイン → 作品詳細に戻る。それ以外は /。
version 管理: playable_version 自由入力。devlog で bump。version_key で FB 紐付け。
playable_version / version_key / published_version: 上記 DB 節参照。
同版編集: 同一 version_key の FB は UPDATE。
新版 FB 枠: 新版 bump 後、現行版向け FB が無ければ新規 INSERT 枠。

================================================================
■ 主要画面マップ
================================================================

--- トップ（発見）---
URL: /
誰向け: 全員（未ログイン可）
目的: 完成前ゲームの発見
主要ボタン/要素: タブ（新着作品/テストプレイ受付中/急上昇）、フィルタチップ、ソート、作品カード、ヒーローショーケース
何ができるか: 作品を探す、詳細へ、カードからブックマーク（ログイン時）
画面位置: ヘッダー下ヒーロー、タブは一覧上部、カードグリッド
未解決: 「テストプレイ受付中」タブの意味が弱い（短期維持・中長期統合）。mock が多い。

--- ゲーム一覧 / 発見 ---
URL: /（独立 /games 一覧 page はなし。トップが一覧兼発見）
誰向け: 全員
目的: 同上
未解決: ホームタブ全面再設計は後回し

--- ゲーム詳細 ---
URL: /games/[id]（例: /games/消えるかな、/games/emberfall）
誰向け: 全員閲覧。プレイ以降はログイン必須
目的: 作品理解 → プレイ → FB → 成長を見る
主要ボタン: プレイする、更新を追う、あとで見る、応援、外部リンク、テストプレイ参加（該当時）、編集（オーナー）
何ができるか: 概要・説明・開発の歩み・コミュニティの声・FB フォーム（プレイ後）
画面位置:
  左/main: 概要 → 新版バナー（#new-playable-version-banner、概要直下）→ 説明 → 開発の歩み → FB
  右/sidebar: サムネ、プレイボタン、追跡/保存、応援、外部リンク
未解決: 旧版 FB プレイヤー表示なし。版ラベル on FB 表示弱い。新版バナーは 005+deploy 後に本番有効。

--- 投稿画面 ---
URL: /submit
誰向け: ログイン済み開発者
目的: 新規作品投稿
主要ボタン: 投稿、完了後 CTA（開発ログ・プレイURL確認・テスター募集・開発ダッシュボード）
何ができるか: 作品情報、フェーズ選択、URL、公開設定
未解決: extras（focus_notes 等）は LS のみ

--- ログイン ---
URL: /login?return=/games/{id}（return はプレイ導線のみ有効）
誰向け: 未ログイン
目的: 認証。プレイ/外部リンク後は詳細に戻る
未解決: 応援/追跡/FB からログインした場合は / 固定（returnUrl 拡張は後回し）

--- マイページ ---
URL: /mypage
誰向け: ログイン済みプレイヤー/開発者
目的: 自分の Forge 活動一覧
主要セクション: 応援した作品、更新を追う中、あとで見る、自分の投稿
何ができるか: 各作品詳細へ。自分の投稿から開発ダッシュボード導線
未解決: 新版通知からの導線は /notifications 経由

--- 開発ダッシュボード ---
URL: /my-projects（ヘッダー表記「開発ダッシュボード」）
誰向け: ログイン済み開発者（作品オーナー）
目的: 作品運営・FB 確認・devlog 投稿
主要ボタン: 開発ログを書く、フィードバックを見る、詳細を見る、編集
画面位置: 作品行ごとにクイックアクション、下部に DeveloperFeedbackInbox
何ができるか: 応援数・テスター応募数（LS）確認、版ラベル付き FB 一覧
未解決: テスター応募数 LS、extras LS、作品 dashboard 新 page は不要と判断済み

--- 作品編集 ---
URL: /projects/[id]/edit
誰向け: オーナー
目的: 投稿内容の更新

--- devlog 投稿 ---
URL: /projects/[id]/devlog/new
誰向け: オーナー
目的: 開発ログ + 任意で版 bump
主要要素: タイトル、内容、「新しいプレイ可能版として公開」チェック、版名入力
版 bump 時: playable_version 更新、watch へ version_published 通知（005+deploy 後）

--- 通知一覧 ---
URL: /notifications
誰向け: ログイン済み
目的: devlog / 新版公開通知の確認
画面位置: ヘッダー「通知 (未読数)」、一覧はフィルタ（すべて/未読/既読）
devlog 通知 → /games/[id]
version_published → /games/[id]#new-playable-version-banner
未解決: Realtime なし（ページ open 時 fetch）。非 devlog 通知 LS 混在。

--- ブックマーク ---
URL: /bookmarks
誰向け: ログイン済み
目的: あとで見る一覧

--- クリエイター ---
URL: /creators/[id]
誰向け: 全員
目的: クリエイター情報（フォローは LS）

--- デモ ---
URL: /demo
誰向け: 開発/検証
目的: デモデータ LS 投入

================================================================
■ プレイヤー導線
================================================================

未ログイン閲覧: トップ・詳細閲覧 OK。プレイ/外部リンク/応援/追跡/保存/FB はログインボタン表示（隠さない）。

ログインしてプレイ: 詳細サイドバー「プレイする」→ 未ログインなら /login?return=/games/{id} → ログイン後詳細に戻る → 外部 URL へ。recordPlay で project_plays 記録。

returnUrl: /games/{id} のみ許可。sanitizeLoginReturnUrl で検証。

プレイ後 FB: プレイ記録後、詳細下部に GameFeedbackForm 表示。構造化入力。

応援: 1人1回。サイドバー GameSupport。

更新を追う: GameWatchButton。watch 中は devlog/version 通知対象。

あとで見る: BookmarkButton。/bookmarks で一覧。

新版公開通知（005+deploy 後）: devlog 版 bump → version_published 通知 → /notifications → タップ → 詳細バナーへ。

再プレイ: バナーまたは通知後、サイドバー「プレイする」から再度プレイ。

新 FB: 現行 playable_version 向け FB 未投稿なら空フォーム。旧版 FB あり + 現行版 FB なしでバナー表示。

================================================================
■ 開発者導線
================================================================

投稿: /submit → Supabase 保存 → 完了 CTA

投稿後 CTA: 開発ログを書く / プレイURL確認 / テスター募集 / 開発ダッシュボード

開発ダッシュボード: /my-projects → 作品ごとに FB inbox・クイックアクション

FB 確認: DeveloperFeedbackInbox。版ラベル（version_key）付き。

devlog 投稿: /projects/[id]/devlog/new

版 bump: 「新しいプレイ可能版として公開」ON + 版名 → playable_version 更新 + devlog.published_version

watch ユーザー通知: 版 bump 時 version_published（005 後）。版 bump なし devlog は devlog 通知。

改善→再 FB: プレイヤーが再プレイして新版 FB → 開発ダッシュボードに新版 FB が増える。

================================================================
■ これまでの主要判断
================================================================

外部リンク/プレイはログイン必須 — Forge が送客サイトにならないため
returnUrl はプレイ/外部リンクのみ — 他アクションは / 固定
応援は 1 人 1 回 — 投げ銭ではない
フェーズ 4 名称 — 試作版/プレイ可能版/通しプレイ版/公開準備中
アイデア段階（企画段階）はフェーズに入れない — 正規化で試作版へ
継続テスト中はフェーズ名に入れない
1 ユーザー × 1 作品 × 1 プレイ可能版で 1 FB — UNIQUE(version_key)
同版編集可 — UPDATE
version は自由入力 — 0.1, 0.2 等
version bump は devlog 連動 — publishPlayableVersion
published_version は devlog と通知に採用
旧版 FB プレイヤー表示は後回し — 004 意図
extras DB 化は重要だが次候補 — ループ接続を優先
ホーム「テストプレイ受付中」短期維持・中長期統合
作品 dashboard 新 page 不要
名称「開発ダッシュボード」— /my-projects
通知 type: version_published を devlog と別 — オーナー判断
GPT用メモ厚い粒度恒久 + 画面変更セクション + handoff 分離

================================================================
■ これまで後回し / 却下
================================================================

AI 要約 / 開発者自動返信
アナリティクス / Forge SDK 実装
Realtime 通知 / Push 通知
課金 / ランキング / バッジ
作品 dashboard 新設
ホームタブ全面再設計
旧版 FB プレイヤー表示
extras DB 化（次候補として残す）
phase CHECK 制約 / status 一括整理
クリエイターフォロー DB 化
P1 UX copy（保留中）
LS に新版フラグ（却下 — DB 原典）
版 bump 時 devlog+version 二重通知（却下 — ノイズ）

================================================================
■ voice_adoptions / matcher / Phase3（2026-06-16 更新）
================================================================

matcher 本番 GO — Run [A]（オーナー 2026-06-16）

検証完了:
- labeled 60 --live PASS（FP=0）
- shadow A PASS（devlog f45434b3…、adoption 1、FP 0）
- shadow B PASS（devlog a60a5c11…、adoption 2、FP 0）

維持（変更禁止）:
- adoption-prompt-v2
- direct 0.82 / indirect 0.88
- indirect FN 許容、FP 最優先

PLAYER_VISIBLE:
- NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false を matcher 本番後も維持
- DB INSERT / matcher は動く。プレイヤー UI（Phase2/3）は非表示 until 別 GO

本番経路:
- devlog 新版公開 → POST /api/voice-adoption/run → OpenAI live → voice_adoptions INSERT
- doc: docs/voice-adoptions-matcher-prod-go.md

オーナー次作業:
- Vercel プロジェクト forge に OPENAI_API_KEY + SUPABASE_SERVICE_ROLE_KEY 設定 + Redeploy

Cursor 次テーマ（優先順位）:
1. matcher 本番 deploy 支援（doc 済み — オーナー Vercel）
2. **プレイ履歴** — docs/player-play-history-design.md、migration 012 草案
3. 正式版
4. バッジ

Phase3: **実装完了**。PLAYER_VISIBLE=true は別 Run。

================================================================
■ 現在のロードマップ
================================================================

完了済み:
投稿〜発見〜プレイ〜FB〜devlog〜版 bump（004）
開発ダッシュボード P0、フェーズ4名称、returnUrl（プレイ導線）
devlog 通知（003）、UX P0
版公開ループ接続コード（46954dc、005+deploy+確認待ち）
GPT用メモ運用整備（format/handoff/画面セクション）

未完成だが重要:
005 本番適用 + deploy + E2E 確認（版公開ループ）
extras DB 化
通知 LS 完全 Supabase 化
プレイヤー向け版状態の機能的表示

リリース前必須（ロードマップ上）:
実作品 1 本以上でコアループ E2E
再プレイ接続（コード済み・本番未反映）
extras DB 化（最低 focus_notes）— 次点だが重要

リリース後でもよい:
ホームタブ統合、旧版 FB 表示、AI、アナリティクス、フォロー DB 化、returnUrl 拡張

次の最優先テーマ:
「新版公開 → 再プレイ → 新 FB」ループ接続 — コード実装済み。本番反映（005→deploy→確認）が残り。

次候補（順位変更で handoff 更新）:
1. extras DB 化
2. 通知 LS 混在解消 / ホーム discovery 強化
3. 旧版 FB プレイヤー表示

================================================================
■ 現在の最優先テーマ — 新版公開 → 再プレイ → 新 FB
================================================================

なぜ重要か:
Forge 原典ループの最後「再プレイ→新FB」が最大ギャップだった。
004 で版 bump と FB version_key は技術成立。watch もある。
しかしプレイヤーは新版公開を知らず再プレイに至らない → 成長ループが途切れる。

何が実装済みか（main push 済み）:
migration 005 SQL ファイル
lib/notifications.ts — version_published type
user-notifications-db — insertVersionPublishedNotifications
games-provider — addDevlog で版 bump 時 version 通知、getNewPlayableVersionBannerState
components/new-playable-version-banner.tsx — オレンジバナー
game-detail-page-client — 概要直下にバナー
notifications-page — version_published は #new-playable-version-banner へ
docs/version-published-loop-design.md

設計要点:
版 bump 時は version_published のみ（devlog 通知と二重送信しない）
バナー条件: ログイン + watch + 現行版 FB なし + 旧版 FB あり
同版 FB は UPDATE、新版は新規 INSERT（004 仕様維持）

何が未反映か:
Supabase Dashboard で 005 未適用
本番 deploy が 005 前だと通知 insert 失敗
オーナー 5 分 E2E 未実施の可能性

005 migration 状況:
ファイル: supabase/migrations/005_version_published_notifications.sql
内容: user_notifications.published_version 列、type CHECK に version_published、RLS INSERT 更新
手順: docs/supabase-dashboard-migration-guide.md §005
順序: 005 適用 → 確認 → deploy（004 と同パターン）

deploy 状況:
main push 済み（46954dc 付近）。Vercel 自動 deploy の有無は要確認。
005 適用前 deploy では版 bump 通知だけ壊れる。

本番確認手順（5分・2アカウント推奨）:
前提: 005 適用 + deploy 済み
B（プレイヤー）: 作品を「更新を追う」→ プレイ → 現行版（例 0.1）FB 投稿
A（開発者）: devlog + 「新しいプレイ可能版として公開」ON → 0.2 等
B: 通知「新しいプレイ可能版」→ タップ → 詳細オレンジバナー（概要直下）
B: 再プレイ → FB 空（新版向け）→ 投稿 → バナー消える

注意点:
005 前 deploy 禁止（通知 insert CHECK/RLS 違反）
mock 作品は通知対象外
Realtime なし — 通知は /notifications を開いたタイミング
初回プレイヤー（FB 未投稿）にはバナー出さない（意図どおり）

================================================================
■ 直近の状態
================================================================

46954dc の内容:
版公開ループ接続 feature commit + chatgpt-summary 厚化
005 migration SQL、version_published 通知、新版バナー、通知→詳細アンカー導線

005: 本番 Dashboard 適用済み（2026-06-13）

次にオーナーがやるべきこと:
1. docs/e2e-version-published-loop-production.md で本番 E2E 実施
2. 結果記録テンプレを ChatGPT/Cursor に貼る

次に Cursor がやるべきこと:
E2E 結果に基づく切り分け。E2E 成功後 handoff 全量更新。

次に ChatGPT が判断すべきこと:
E2E 結果の解釈。成功後の次テーマ（extras DB 化等）。

================================================================
■ Run 判定ルール（ChatGPT 向け再掲）
================================================================

docs だけの変更: 基本 OK
git push / deploy: 多くの場合 OK（main は Cursor が GPT判断用メモで止めることがある）
migration / DB / RLS / 課金 / 認証 / 環境変数: 慎重。[B] 事前確認推奨がデフォルト
005 の場合: 004 実績あり、小さな ALTER+RLS → GO しやすいが Dashboard 目視確認推奨
Run/Deploy/Migration スクショまたは GPT判断用メモ → [A] Run推奨 / [B] 事前確認 / [C] 追加確認 / [D] Run禁止
判断に Forge価値・ユーザー影響・復旧難易度を含める
詳細: docs/forge-triage-operations.md

================================================================
■ 新チャットで ChatGPT に期待する振る舞い
================================================================

敬語。オーナーを「お前」と呼ばない。
実装者ではなく壁打ち役。**プロダクトレビュー**（コードレビューではない）。
判断優先: Forge原典 → ユーザー価値 → 開発者価値 → MVP → 技術
Cursor 用指示は完成版 1 本（断片禁止）。CURSOR キーワード時は貼付用完成文1本。
オーナー判断必須なら Cursor 指示を出さず判断材料を整理。
専門用語は噛み砕く。
Forge 原典（コアループ）に照らす。
思いつきで機能追加しない。
MVP を雑に削りすぎない。
収益化より無料でも使いたくなる価値を優先。
Cursor サマリは薄くしない方針を尊重。
summary/handoff/判断用メモはレビュー（現在地・リスク・次アクション・原典整合）。
UX 違和感の発言は UX レビューとして扱う。
画面イメージが必要なときは URL + 画面位置まで具体化。
トリガー運用正本: docs/forge-triage-operations.md

================================================================
■ 関連ドキュメント索引
================================================================

docs/forge-principles.md — 原典
docs/forge-roadmap-2026-06.md — ロードマップ
docs/chatgpt-summary-format.md — GPT用メモ形式標準（恒久）
docs/chatgpt-summary.md — 最新差分サマリ
docs/chatgpt-handoff.md — 本ファイル
docs/gpt-run-decision-memo.md — Run 停止時メモ形式
docs/forge-triage-operations.md — トリガー運用正本（CURSORキーワード/Runスクショ/サマリレビュー/UXレビュー）
docs/version-published-loop-design.md — 版公開ループ設計
docs/supabase-dashboard-migration-guide.md — migration 手順
docs/supabase-owner-operations.md — 課金・Dashboard 確認
docs/localstorage-migration-plan.md — LS 解消計画
AGENTS.md — Cursor エージェントルール

================================================================
■ 技術メモ（Cursor/ChatGPT 共通）
================================================================

Next.js App Router。Supabase Auth + Postgres。
project_id text（UUID + mock slug）。
env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
GitHub: soshirow-alt/forge
本番: forge-flame-gamma.vercel.app
