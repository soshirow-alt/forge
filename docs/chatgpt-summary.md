■ 現在の状態
- ブランチ: preview/landing-01（preview のみ。本番未反映）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- 直前 commit: eafe4ca。本修正は push 直後に新 commit

■ 今回実装したこと
- /home から「ジャンルから探す」セクション全体を削除（RPG 等ピル + 開発者リンク含む）
- /home・/search から「開発者を探す →」リンクを削除（経路の二重化解消）
- Player Shell サイドバー — 「作品を探す」の直下に「開発者を探す」追加（/search/creators、軽いインデント）
- developer-search / developer-profile の activeNav を creator-search に変更

■ 今回変更した画面
- P-04 発見ホーム /home
  - 画面位置: ページ最下部にあった「ジャンルから探す」ブロック
  - 変更前: ジャンルピル8個 + 開発者を探すリンク
  - 変更後: 新着作品セクションで終了。ジャンル探索はサイドバー「作品を探す」経由
  - 確認: /home 最下部にジャンル・開発者リンクがない

- P-05 作品検索 /search
  - 画面位置: 結果ヘッダー下、絞り込みサイドバー下
  - 変更前: 開発者を探す → リンク2箇所
  - 変更後: リンクなし
  - 確認: /search に開発者リンクがない

- Player Shell サイドバー（全 v0 画面）
  - 変更前: ホーム / 作品を探す / ランキング
  - 変更後: ホーム / 作品を探す / 開発者を探す（1段インデント）/ ランキング
  - 確認: 開発者を探すクリック → /search/creators、サイドバー点灯

- P-05-2 開発者検索 /search/creators
  - activeNav: search → creator-search（サイドバー「開発者を探す」が active）

■ ユーザー目線の変化
- ホームは発見フィードに集中。ジャンル絞り込みは「作品を探す」へ一本化
- 開発者検索もサイドバーからのみ — 迷わない

■ なぜこの設計
- オーナー指摘: ホームのジャンルとサイドバー「作品を探す」が重複
- 開発者探索も同様にサイドバー正本へ集約（#19 系 IA 整理）

■ 他案不採用
- ホームにジャンルだけ残す — 作品を探すと役割重複のため不採用
- /search に開発者リンク残す — サイドバー追加後も二重経路のため削除

■ In / Out
- In: discovery-home, works-search, player-shell, developer pages activeNav
- Out: homeGenrePills の UI 利用（mock データは lib に残存可）

■ リスク
- なし（ナビ整理のみ）

■ オーナー確認手順
1. /home — ジャンルセクションなし
2. サイドバー 作品を探す → /search、開発者を探す → /search/creators
3. /search に開発者リンクなし

■ 今すぐ私がやるべきこと
- deploy 後目視

■ Cursorだけで完了できること
- ui-mocks/04-home.md のジャンルセクション記載更新

■ 次に検討すべきこと
- サイドバー正本を chatgpt-handoff に反映（大テーマ完了時）

■ ChatGPTに相談したい論点
- サイドバー4項目（+マイページ）で #19 裁定確定か
