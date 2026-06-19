■ 現在の状態
- ブランチ: preview/landing-01（preview のみ。本番未反映）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- 直前 commit: 0b8eb85（サイドバー簡素化）。本バッチは push 直後に新 commit になる
- プレイヤー v0 画面 01–18 は mock 完成。Studio 20–25 はスコープ外
- build 成功（npm run build）

■ 今回実装したこと
- preview 限定 `/` → `/home` リダイレクト（middleware + lib/preview-v0.ts）
  - 判定: VERCEL_GIT_COMMIT_REF=preview/landing-01 / hostname に preview-landing-01 / NEXT_PUBLIC_FORGE_PREVIEW_V0=true
- はじめてガイド: Player Shell サイドバー下部 stub → Link `/landing`
- 開発者を探す導線（サイドバー復活なし）
  - /home ジャンルセクション下
  - /search 結果ヘッダー + 絞り込みサイドバー
- P-05 作品検索: ソート 3種（おすすめ順 / 見届けが多い順 / 声が多い順）を URL ?sort= 連動
- P-05 ページネーション: ?page= 連動、5件/ページ、前後・ページ番号リンク
- lib/search-v0-mock-data: sortSearchResults / paginateSearchResults / SearchSortId 追加
- P-06 ゲーム詳細: 見届ける / フォロー / あとで遊ぶ — 未ログイン→/login?return=、ログイン後 mock toggle
- P-07 開発者プロフィール: フォロー — 同上 toggle + login gate
- P-05-2 開発者検索: フォローボタン — カード内 button、login gate + followingIds state
- docs/preview-v0-gaps.md / forge-changelog.md 更新

■ 今回変更した画面
- P-04 発見ホーム /home
  - 画面位置: メイン下部「ジャンルから探す」セクション直下
  - 変更前: 開発者検索への導線なし
  - 変更後: 「開発者を探す →」リンク → /search/creators
  - 確認: preview で /home 最下部、リンククリックで開発者検索へ

- P-05 作品検索 /search
  - 画面位置: 結果ヘッダー（件数表示下）、ソートボタン行、ページネーション、右サイドバー絞り込み下
  - 変更前: ソート・ページネーション stub、開発者導線なし
  - 変更後: ソート3ボタン・?page= ページ送り・開発者リンク
  - 確認: ?sort=witness で並び替え、?page=2 で2ページ目、サイドバー「開発者を探す →」

- Player Shell 全画面（サイドバー）
  - 画面位置: 左サイドバー最下部「はじめてガイド」
  - 変更前: stub ボタン（遷移なし）
  - 変更後: /landing へリンク
  - 確認: クリックで LP v0 表示

- P-06 ゲーム詳細 /games/[id]
  - 画面位置: ヒーロー下アクション行 + 右サイドバー開発者カード
  - 変更前: 見届け/フォロー/あとでは表示固定
  - 変更後: 未ログイン→login、ログイン後ラベル切替（保存済み等）
  - 確認: ログアウトで login へ、ログイン後トグル

- P-07 開発者プロフィール /creators/[id]
  - 画面位置: プロフィールヘッダー内フォローボタン
  - 変更前: 静的表示
  - 変更後: login gate + フォロー中 toggle
  - 確認: 未ログイン→login?return=/creators/{id}

- P-05-2 開発者検索 /search/creators
  - 画面位置: 各開発者カード右フォローボタン
  - 変更前: span 表示のみ（クリック不可）
  - 変更後: button + login gate + toggle
  - 確認: フォロークリックで login または状態切替

- 入口 / （preview のみ）
  - 変更前: 旧 UI トップ
  - 変更後: /home へ 302
  - 確認: preview URL の / を開く

■ ユーザー目線の変化
- preview でトップ `/` を開いても v0 発見ホームに直行
- 作品検索から開発者検索へ自然に移れる（サイドバーは増やさない方針維持）
- はじめてガイドから LP に戻れる
- ログイン後、見届け・フォロー・あとでを押して状態が変わる（mock。永続化なし）

■ なぜこの設計
- サイドバー項目は #19 裁定どおり簡素化維持。開発者検索は文脈に合う画面からリンク
- `/` リダイレクトは preview ブランチ限定。本番 LP/旧 UI を触らない
- toggle は local state のみ。Supabase 接続前の v0 体験確認用

■ 他案不採用
- サイドバーに「開発者を探す」復活 — 項目増加・#19 と矛盾のため不採用
- prod でも `/` を /home に — 本番仕様未確定のため preview のみ
- toggle を localStorage 永続 — 原典どおり共有データは Supabase 前提。preview は session state のみ

■ In / Out
- In: preview UX 導線・sort/page stub 実装・login gate toggles・middleware redirect
- Out: Supabase 保存、本番 deploy、Studio 20–25、ランキング本実装

■ リスク
- ローカル dev では NEXT_PUBLIC_FORGE_PREVIEW_V0=true 以外 `/` リダイレクトしない
- mock toggle はリロードで初期値に戻る
- 開発者検索カードは Link 内 button — フォローは preventDefault で親遷移防止

■ オーナー確認手順
1. preview URL で `/` → /home になるか
2. /home・/search から「開発者を探す →」で /search/creators
3. /search でソート切替・2ページ目
4. サイドバー「はじめてガイド」→ /landing
5. ログアウトで /games/hero-1 の見届け→login、ログイン後 toggle
6. /creators/dev-1 と /search/creators のフォロー同様

■ 今すぐ私がやるべきこと
- preview URL で上記 6 点を目視確認
- 問題なければ Player v0 mock フェーズ完了として次テーマ（Studio / prod GO）を ChatGPT と整理

■ Cursorだけで完了できること
- 残 stub（P-18 月切替、設定保存、マイページ各タブ filter 等）の優先付け
- mock → Supabase 切替の設計草案
- chatgpt-handoff 全量更新（大テーマ完了時）

■ 次に検討すべきこと
- prod 反映時 `/` を /home にするか（論点 #1 preview-v0-gaps）
- PLAYER_VISIBLE / 本番 GO 条件
- Studio 20–25 着手順

■ ChatGPTに相談したい論点
- Player v0 mock 完了後、次は Studio preview か prod 入口統合か
- toggle mock 完了を「プレイヤー preview 完了」とみなしてよいか
