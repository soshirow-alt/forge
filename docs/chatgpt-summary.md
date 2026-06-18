■ 現在の状態
- ブランチ preview/landing-01、最新 commit 90141d9（P-04 発見ホーム /home）push 済
- Vercel Preview 更新待ち → https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/home
- 本番 / は既存 HomePage（ForgeHeader）のまま未変更
- /landing LP 未変更
- DB / migration 変更なし（mock データのみ）
- v0 写経 UI 一覧: /login /register /mypage（6タブ）/search /home

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- 今回は「発見」フェーズの P-04 発見ホーム。プレイヤーがログイン後・サイドバー「ホーム」から作品を横断的に見つける入口

■ 今回実装したこと
- 新規ルート /home — P-04 発見ホーム（v0 モック04参考、Player Shell 内）
- ヒーローカルーセル3枚（注目の開発中ゲーム、左右矢印・ドットインジケータ、自動切替なし）
- セクション「最近更新された作品」— 横スクロール5カード + 「すべて見る」stub
- セクション「今週人気の作品」— ランキング1–5バッジ付き5カード横スクロール
- セクション「新着作品」— 横スクロール5カード
- セクション「ジャンルから探す」— ピル8種、各 /search?q= ジャンル名 へリンク
- カード共通要素: サムネ（GameThumbnail）、タイトル、版ラベル+更新日、声数/見届け人数 stats
- lib/home-v0-mock-data.ts — 全セクション用 mock（heroSlides / recentlyUpdated / popular / new / genrePills）
- PlayerShell 更新: サイドバー「ホーム」→ /home、ロゴ → /home、activeNav=home で紫ハイライト
- /search パンくず「ホーム」リンク → /home に更新（/mypage から独立した発見入口）

■ 今回変更した画面
- P-04 発見ホーム /home（新規）
  - 画面位置: Player Shell 左サイドバー「ホーム」active。ヘッダー検索・通知・Studio は mypage/search と同一
  - メイン: 上からヒーロー → 最近更新 → 人気 → 新着 → ジャンルピル（縦スクロール）
  - 変更前: サイドバー「ホーム」は / へ向いていたが /home 未実装。本番 / は ForgeHeader 旧 UI
  - プレイヤー視点: ログイン後の発見ダッシュボード。カルーセルで注目作品、横スクロールで一覧、ジャンルから検索へ
  - 開発者視点: mock のみ。カードクリック・詳しく見るは未接続（P-06 待ち）
  - 確認手順: Preview /home を開く → カルーセル矢印/ドット → 各横スクロール → ジャンルピル → /search?q= で遷移
- 触っていない: / （既存発見）、/landing、/mypage 各タブ、/search 本体ロジック

■ ユーザー目線の変化
- サイドバー「ホーム」を押すと v0 テイストの発見ダッシュボードが見える（preview のみ）
- 作品を探す・マイページと同じ Player Shell で体験が揃う
- 本番 URL / を開いたユーザーにはまだ変化なし（意図的）

■ なぜこの設計
- / を直接差し替えず /home に置く — 本番 GO 前に preview で v0 全体を並行検証するため
- mock データ — DB 接続前に UI 写経・オーナー目視を優先。原典「実装都合で仕様変更しない」に沿い v0 レイアウトを忠実に
- 横スクロール + ランキングバッジ — v0 P-04 モックの情報密度（更新/人気/新着の3軸）を維持

■ 他案不採用
- / を即 v0 home に差し替え — オーナー未 GO、既存発見 UX 破壊リスク
- 縦リスト（mypage 保存作品型）— v0 発見ホームは横スクロールセクションが正本
- Supabase から live 取得 — 写経フェーズでは scope 外

■ In / Out
- In: /home UI、PlayerShell ナビ更新、search パンくず、mock データ、docs
- Out: 本番 / 差し替え、ゲーム詳細 P-06、カルーセル自動再生、サイドバー残 stub（人気ランキング等の独立ルート）、DB 接続

■ リスク
- プレビューと本番 / の二重発見入口 — オーナーが /home と / を混同しうる。本番 GO まで /home は preview 専用と docs で明示
- カード CTA 未接続 — クリックしても詳細に行けない。P-06 まで stub 想定

■ 変更ファイル
- app/home/page.tsx（新規）
- components/discovery-home-page.tsx（新規）
- lib/home-v0-mock-data.ts（新規）
- components/player-shell.tsx
- components/works-search-page.tsx
- docs/forge-changelog.md / docs/forge-handoff.md

■ Preview URL
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/home
- 関連: /search /mypage /login

■ 今すぐ私がやるべきこと
- Vercel Preview 反映後 /home を目視（カルーセル・横スクロール・ジャンル→search）
- OK なら次テーマ（P-06 ゲーム詳細写経 or / 統合 GO）を ChatGPT と相談

■ Cursorだけで完了できること
- P-06 ゲーム詳細 v0 mock
- サイドバー stub ルート（人気ランキング / 新着作品 等）の個別写経
- /home カード → 詳細 stub リンク

■ 注意事項
- v0 発見ホームは /home のみ。本番 / 差し替えは別 GO
- mock のみ。ランキング算法・実データ連携なし
- middleware: /home は保護対象外（preview 目視用）

■ 次に検討すべきこと
- / と /home 統合タイミング（本番 GO）
- P-06 ゲーム詳細写経 → ホームカードから遷移
- サイドバー「人気ランキング」「新着作品」独立ページ or /home アンカー

■ ChatGPTに相談したい論点
- preview 写経が揃った段階で / を /home に差し替える GO 条件（mypage/search/home/detail の最低セット）
