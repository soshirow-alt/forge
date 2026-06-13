■ 現在の状態
本番 URL: https://forge-flame-gamma.vercel.app
最新 commit: 1c02136（main push 済み）
DB migration: 001〜004 適用済み。005 は未適用（本番 deploy も 005 適用待ち）
直近のオーナー判断: 「新版公開→再プレイ→新FB」ループ接続を最優先。extras DB 化は次候補。通知 type は devlog と別に version_published。In/Out スコープは前回合意どおり。
フェーズ: 004 版ベース FB 成立。今回でループ最後の「再プレイ→新FB」接続を実装済み。本番反映は 005→deploy の順待ち。

■ Forge原典コアループ（判断の基準）
投稿→発見→プレイ→FB→改善(devlog)→再プレイ→新FB
今回は devlog 版 bump 後の「再プレイ→新FB」が弱かったギャップを埋める。プレイヤーに新版公開を知らせ、詳細で再プレイと新 FB を促す。

■ 今回のテーマ
「新版公開 → 再プレイ → 新FB」ループ接続。コード実装完了。npm run build 成功。commit/push 済み（1c02136）。本番 migration 005 + deploy は未実施。

■ 設計判断（確認事項への回答）

user_notifications で対応可能か: 可能。003 で確立した通知基盤を拡張するだけ。

migration 必要か: 必要（005）。003 時点の type CHECK が devlog のみ。INSERT RLS も devlog のみ。005 で version_published 追加、published_version 列、RLS 更新。

新通知 type: version_published を追加。版 bump 時は version_published のみ（devlog 通知と二重送信しない）。版 bump なし devlog は従来どおり devlog 通知。

追跡中ユーザー判定: project_watches（002）。フロントは isWatching(gameId)。通知送信は fetchWatcherUserIds（オーナーが watch 一覧を read 可、003 RLS）。

バナー表示条件: ログイン済み + watch 中 + 現行 playable_version 向け FB 未投稿 + 過去に別 version_key 向け FB あり。初回プレイヤー（FB 未投稿）は「新版」バナーを出さない。

通知重複対策: 1 回の devlog 投稿 = watch ユーザー每人 1 行 insert。版 bump 時は devlog 通知を送らない。0.2→0.3 と連続 bump 時は版ごとに新通知（意図どおり）。

既存 FB 編集仕様: 変更なし。同版は UPDATE。新版は現行版向け FB が無いので新規 INSERT。バナーは「旧版 FB あり + 現行版 FB なし」で表示。

実装難易度: 中（低〜中）。新 page なし。005 + 通知 insert 分岐 + バナー 1 コンポーネント + 通知一覧リンク。

リスク: 005 前に deploy すると版 bump 時の通知 insert が CHECK/RLS 違反で失敗（devlog 投稿自体は成功するが watch 通知が届かない）。mock 作品は Supabase 通知対象外。

■ なぜこの設計にしたか

Forge 原典ループの最後「再プレイ→新FB」が未接続だった。004 で版 bump と FB version_key は技術成立。watch もある。しかしプレイヤーは新版公開を知らないため再プレイに至らない。これが最大ギャップだった。

version_published を devlog と別 type にした理由: オーナー判断「新しいプレイ可能版公開はコアループ直結で概念的に別」。将来、通知一覧のフィルタや UX 整理が容易。版 bump 時に devlog + version の二重通知はノイズになるため、版 bump 時は version_published のみ送る。

バナー条件に「旧版 FB あり」を入れた理由: 初回プレイヤーに「新版が公開されました」と誤表示しないため。FB の version_key で「自分は旧版に FB 済み、現行版は未 FB」と判定でき、追加 migration 不要。

通知から作品詳細へ #new-playable-version-banner アンカーで誘導: 通知タップ後すぐバナーが視界に入る。スクロール位置の迷いを減らす。

■ 他案を採用しなかった理由

devlog 通知のメッセージだけ変更: type 分離できず、将来「版公開」と「開発ログ更新」を UI で区別できない。
版 bump 時に devlog + version 二重通知: 同一操作で通知 2 件はノイズ。オーナー意図（概念的別扱い）とも整合しない。
localStorage に新版フラグ: 端末間非共有。Forge は DB 中心の原典。
plays テーブルに版記録: migration 増。FB version_key と playable_version で足りる。
Push / Realtime: スコープ Out。今回は既存の通知ページ fetch で十分。

■ In / Out

In: 版 bump 時の watch 向け通知（version_published）、通知から作品詳細への導線、作品詳細の新版公開バナー、追跡中ユーザー向け再プレイ導線、「新しい版が公開されたので再度 FB できます」の文言。

Out: ホームタブ再設計、作品 dashboard 新設、extras DB 化、AI 要約、Realtime、Push 通知、旧版 FB 履歴 UI（オーナー指定どおり）。

■ 今回実装したこと

supabase/migrations/005_version_published_notifications.sql: published_version 列、type CHECK 拡張、RLS INSERT ポリシー更新
lib/notifications.ts: version_published type、ラベル、createVersionPublishedMessage
lib/supabase/user-notifications-db.ts: insertVersionPublishedNotifications、行マッピング
lib/supabase/user-engagement.ts: fetchUserLatestFeedbackVersionKey
components/games-provider.tsx: addDevlog で版 bump 時 version 通知、getNewPlayableVersionBannerState
components/new-playable-version-banner.tsx: 新版バナー UI
components/game-detail-page-client.tsx: 概要下にバナー配置
components/notifications-page.tsx: version_published は #new-playable-version-banner へリンク
docs/version-published-loop-design.md、forge-changelog、supabase-dashboard-migration-guide §005

■ ユーザー目線の変化

プレイヤー（watch 中）: 開発者が新版を公開すると通知に「新しいプレイ可能版」が届く。タップで作品詳細のオレンジバナー。再プレイを促され、新しい版向けに FB を再度書ける。

開発者: 版 bump devlog 投稿時、watch ユーザーへ自動で version_published 通知。追加操作なし。

■ 本番手順（必須順）

1. Supabase Dashboard で 005 SQL を Run（docs/supabase-dashboard-migration-guide.md §005 参照）
2. 確認: user_notifications に published_version 列がある。type に version_published を insert できる
3. Vercel 本番 deploy（main は push 済み。005 適用後に deploy または redeploy）
4. オーナー 5 分確認（下記）

■ オーナーが確認する手順（5分・2アカウント推奨）

前提: 005 適用 + deploy 済み

アカウント B（プレイヤー）: 対象作品を「更新を追う」→ プレイ → 現行版（例 0.1）向け FB を投稿
アカウント A（開発者・オーナー）: devlog 投稿 + 「新しいプレイ可能版として公開」ON → 版 0.2 などに bump
アカウント B: 通知一覧に「新しいプレイ可能版」→ タップ → 作品詳細にオレンジ色バナー表示
B: 再プレイ → FB フォームが空（新版向け）→ 投稿 → バナーが消える

1 アカウントのみの場合: A で版 bump まで確認。B 側の通知・バナーは後日 2 アカウントで確認可。

■ Cursor推奨案
[B] 事前確認推奨 — Dashboard で 005 適用 → 列・CHECK 確認 → deploy GO

■ 推奨理由
005 は小さな ALTER + RLS 更新のみ。004 と同パターンでリスク低い。
deploy を 005 より先にすると、版 bump 時の watch 通知 insert が失敗し、今回のテーマ（ループ接続）が本番で機能しない。
devlog 投稿自体は成功するため、開発者は気づきにくい。005 と deploy を同一メンテ窓で行うのが安全。

■ 懸念点
005 未適用のまま Vercel が auto-deploy すると版 bump 通知だけ壊れる（他機能は動く）。
バナーは「旧版 FB あり」が条件のため、watch だけして FB 未投稿のユーザーには出ない（意図どおり）。
Realtime なしのため、通知はページを開いたタイミングで fetch（スコープ Out）。

■ 注意事項
005 適用前の deploy は避ける。004 と同様、DB 先行。
project_id は text のまま（001 方針継続）。
mock / 未 submit 作品は Supabase 通知対象外。

■ 今すぐ私（オーナー）がやるべきこと
1. 本レスポンス末尾の GPT 判断用メモを ChatGPT に貼る
2. ChatGPT と GO 確認後、Supabase Dashboard で 005 を Run
3. 「005 適用した。deploy GO」と Cursor に返信
4. deploy 後、5 分確認フローを実施

■ Cursorだけで完了できること
005 適用・deploy GO 後の本番 deploy 確認
deploy 後の build/動作確認（指示があれば）

■ 次候補（今回やらない）
extras DB 化（focus_notes 等の永続化）。ホームタブ統合。旧版 FB のプレイヤー向け表示。

■ 技術メモ（ChatGPT/Cursor用）
project_id: text（001）
適用済み migration: 001〜004
今回追加: 005_version_published_notifications.sql
通知 type: devlog | version_published
版 bump 通知: games-provider addDevlog 内、publishPlayableVersion 時に insertVersionPublishedNotifications
バナー判定: getNewPlayableVersionBannerState（watch + 旧版 FB あり + 現行版 FB なし）
関連 doc: docs/version-published-loop-design.md, docs/supabase-dashboard-migration-guide.md

■ Cursor連携
GPT には本ファイルまたはレスポンス末尾 ```text ブロックの Copy を使用
粒度標準: docs/chatgpt-summary-format.md
