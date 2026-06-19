【Forge Player v0 — これを全文1回貼れば全部伝わる】
以下が preview/landing-01 のプレイヤー v0（01–18）実装正本です。
ui-mocks 01–18 は設計意図。preview 実装との差分・stub セクションを優先して読んでください。
スクショ不要。この1ファイルだけで議論開始できます。

■ 現在の状態
- ブランチ: preview/landing-01（preview のみ。本番 prod 未反映）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- スコープ: プレイヤー v0 画面 01–18 mock UI 完成。Studio 20–25 未着手
- データ: lib/*-v0-mock-data.ts が中心。Supabase 永続化なし（auth のみ接続可）
- PLAYER_VISIBLE: 本番は旧 UI。preview で v0 検証中
- 更新: 2026-06-19

■ Forge原典（判断の基準）
- コアループ: 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- 作らない: ランキング競争・投げ銭・販売・SDK 実装（説明 UI 除く）
- ログイン: 発見は公開。プレイ以降は login 必須。ボタン隠さず /login。return クエリのみ
- 共有データを localStorage に保存しない（preview toggle は session state のみ）

■ preview 環境・入口
- preview のみ / → /home（middleware + lib/preview-v0.ts）
- /login?mode=signup → /register（LP 新規登録は /register 直行）
- 旧 UI に落ちる例: /（本番）, /bookmarks, /submit, /my-projects, /demo, Studio 系

■ 3 種類のシェル

【A. LP — P-01 /landing】
独自 header/footer。Player Shell なし。

【B. Auth — P-02 /login, P-03 /register】
AuthPageShell: 左フォーム + 右 Hero。OAuth は stub メッセージ。

【C. Player Shell — P-04〜18】
左サイドバー sticky + トップバー + メイン。

サイドバー正本:
  ホーム
  作品を探す
  開発者を探す
  ランキング
  ── マイページ
  ── 設定
  ── はじめてガイド（stub・クリックしても遷移なし）

トップバー:
  検索 → /search submit
  通知 🔔 → /notifications（サイドバーに通知項目なし）
  プロフィール 👤 → /mypage/profile
  ログイン（未ログイン） or ログアウト（ログイン中）→ /login
  Studio（stub）

■ URL マップ 01–18（preview 正本）

01 LP                 /landing
02 ログイン           /login
03 新規登録           /register
04 発見ホーム         /home
05 作品検索           /search (?q= &sort= &page=)
05-2 開発者検索       /search/creators (?q=)
06 ゲーム詳細         /games/[id] (?tab=overview|devlog|voices|versions)
07 開発者プロフィール /creators/[id]
08 FB送信             P-06 モーダル（独立 URL なし）
09 プロフィール       /mypage/profile
10 見届け中           /mypage
11 FB履歴             /mypage?tab=feedback
12 プレイ履歴         /mypage?tab=play-history
13 実績               /mypage?tab=achievements
14 保存作品           /mypage?tab=saved（モック14「あとで遊ぶ」相当）
15 フォロー中開発者   /mypage?tab=following
16 通知               /notifications
17 設定               /settings
18 月間影響度         /rankings/influence

■ 主要遷移
/landing → /login | /register → /home
/ (preview) → /home
/home ↔ /search ↔ /search/creators ↔ /rankings/influence
/home → /games/[id] ↔ /creators/[id]
/games/[id] → FB モーダル
/mypage/* ↔ /mypage/profile ↔ /settings

■ P-01 /landing
- ヒーロー / ゲームカルーセル / CTA
- ログイン→/login / 新規登録→/register
- prod 未触

■ P-02 /login
- Supabase email/password。return クエリ対応
- ログイン済み自動 redirect
- OAuth stub

■ P-03 /register
- username / email / password / 規約同意
- 即セッション or /auth/verify-email

■ P-04 /home
- ヒーローカルーセル（スライド・詳しく見る→/games/[id]）
- 最近更新 / 今週人気（ランク）/ 新着 — 横スクロール、すべて見る→/search
- 削除済: ジャンルから探す（作品を探すと重複）
- stub: 細かいフィルタ

■ P-05 /search
- 動く: ?q= ?sort=recommended|witness|voices ?page=（5件/ページ）ジャンル checkbox
- stub: グリッド切替
- 開発者リンクなし（サイドバー正本）

■ P-05-2 /search/creators
- 動く: ?q= 検索 / 新規開発者のみ filter / フォロー login gate + mock toggle
- stub: ソート

■ P-06 /games/[id]
- タブ: 概要 / 開発ログ / みんなの声 / 版の履歴
- プレイ → login → PlayStubV0Modal
- 見届ける / フォロー / あとで → login gate + toggle（mock）
- 声を届ける → FeedbackFormV0Modal
- 開発ログ 8件 mock（ID エイリアス）。版履歴タイムライン mock
- stub: 実ゲーム URL / FB Supabase 保存なし

■ P-07 /creators/[id]
- パンくず / プロフィール / フォロー login gate + toggle
- タブ: 概要 / 開発ログ / 実績 / フォロワー
- stub: 完成品詳細リンク

■ P-08 FB モーダル（P-06 上）
PlayStub → FirstVoice → FeedbackForm → Success

■ P-09 /mypage/profile
- 入口: トップバー 👤 のみ（内側タブ外）
- プロフィールカード / Lv / stats 4 / 自己紹介・ジャンル・タグ・実績 / 最近の活動
- Link → ?tab=achievements / ?tab=feedback
- stub: プロフィールを編集

■ マイページ共通（P-10〜15）
- サイドバー「マイページ」点灯。h1「マイページ」なし
- 内側横タブ 6 つ（サイドバー sub-nav ではない）:
  見届け中 / 保存作品 / プレイ履歴 / FB履歴 / 実績 / フォロー中開発者
- タブ切替: ?tab= 連動（動く）
- Sort / フィルタ / ページネーション: 多く stub

■ P-10 /mypage 見届け中
左: h1「見届け中の作品」+ 作品カード（変化・更新日・詳しく見る・今すぐ遊ぶ）
右: クイックフィルタ / ジャンルピル / 説明ボックス（stub 多）

■ P-14 相当 /mypage?tab=saved 保存作品
- モック「あとで遊ぶ」→ preview「保存作品」
- カード + SavedBadge。詳細 Link なし

■ P-12 /mypage?tab=play-history
- フィルタタブ / 履歴カード（クリア済み・FB送信済・メモあり・プレイ時間）
- 右: プレイサマリー / フィルタ / 応援中作者
- stub: ページネーション / 更新内容を見る

■ P-11 /mypage?tab=feedback
- FB エントリ（自由記述 / 選択式）/ 共感 / 改善反映バッジ
- 右: フィルタ / 統計 / 共感説明

■ P-13 /mypage?tab=achievements
- 獲得 N/M / 達成率 % / 最近獲得 / 全実績 grid
- 原典論点: 活動サマリー vs 達成率表示

■ P-15 /mypage?tab=following
- 開発者リスト + 代表作品（開発中/完成品あり）
- 右: フォロー数 / 最近フォロー / 開発者を探す（Link なし→サイドバー正本）
- stub: プロフィールへ / さらに読み込む

■ P-16 /notifications
- 種別フィルタ 7 / 未読・既読 / mock 9件
- 既読 mark は local state

■ P-17 /settings
- アカウント変更 stub / 通知・プライバシートグル（UI のみ・保存なし）

■ P-18 /rankings/influence
- TOP3 / 4–10位 / 先月 TOP3
- stub: 月切替 / もっと見る

■ 認証・login gate
- useRequireAuth + /login?return=
- 対象: P-06 プレイ/FB/見届け/フォロー/あとで / P-05-2,P-07 フォロー
- auth-provider: getSession + onAuthStateChange

■ 横断 stub（動かないもの）
- はじめてガイド / Studio / 各 SortDropdown
- フィルタ pills（search 除く多く）/ ページネーション 2 ページ目以降（search 除く）
- OAuth / 設定永続化 / プロフィール編集 / 実プレイ URL
- toggle — リロードで reset

■ preview vs ui-mocks 横断差分
- サイドバー: モックは画面ごと sub-nav 差 → preview は Player Shell 1 本 + マイページ内横タブ
- 14 名称: あとで遊ぶ → 保存作品
- /home ジャンル削除 / 開発者導線はサイドバーのみ
- /mypage h1 削除
- はじめてガイド /landing 削除（ログアウト感）→ stub
- 09 /mypage/profile 独立

■ 最近の UX 変更（2026-06-19 累積）
- サイドバー簡素化 + sticky + マイページ内タブ化
- / リダイレクト / 開発者を探すサイドバー追加 / ホームジャンル削除
- ログアウトトップバー / はじめてガイド stub
- 新規登録 /register 直行
- 検索 sort/page / login toggle 系

■ 未決論点（ChatGPT と整理）
- #19 サイドバー prod 正本
- #3 マイページ tabs vs 独立 URL
- prod / → /home か
- mock → Supabase いつ
- PLAYER_VISIBLE GO 条件
- Studio 20–25 着手順
- #36 09 最近の活動 vs 11/12/16 MECE
- #49–50 12 クリア済み・プレイ時間
- #76 /settings vs /mypage/settings

■ 確認手順（URL のみ）

入口: /landing→/register / /login / preview /→/home
発見: /home / /search?q=ファンタジー&sort=witness&page=2 / サイドバー開発者を探す
詳細: /games/hero-1 タブ4 / 未ログインプレイ→login / ログイン後 toggle
開発者: /creators/dev-1 フォロー
マイページ: /mypage / ?tab=saved|play-history|feedback|achievements|following / /mypage/profile
その他: /notifications / /settings / /rankings/influence / トップバー login|logout

■ Out of scope
Studio 20–25 / 旧 UI / 本番 deploy / ランキング本実装 / 投げ銭・販売・SDK

■ 実装コード（Cursor 参照用）
components: landing-page, login-page, register-page, discovery-home-page, works-search-page, developer-search-v0-page, game-detail-v0-page, game-*-v0-tab, feedback-v0-modals, developer-profile-v0-page, mypage-page, mypage-v0-extra-tabs, profile-self-v0-page, notifications-v0-page, player-settings-v0-page, influence-ranking-v0-page, player-shell
lib: *-v0-mock-data.ts 群
