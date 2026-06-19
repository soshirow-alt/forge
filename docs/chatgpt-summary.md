■ 現在の状態
- preview/landing-01 3件一括実装 → push 予定
- P-06 4タブ完成済。今回 P-05/P-09/ログイン導線を追加

■ 一気に3件やった理由と注意
- 可能: いずれも preview mock / 原典整合の範囲
- 注意1: マイページ「残タブ」は既に6タブ実装済みだった → 不足分の P-09 プロフィール hub を追加
- 注意2: プレイ/FB は未ログインだと /login へ飛ぶ（原典どおり）。デモはログイン後に確認
- 注意3: Player Shell を横断変更（サイドバー sub-nav・ヘッダー検索）

■ 今回実装したこと
- P-05 components/works-search-page.tsx + lib/search-v0-mock-data.ts
  - キーワード/ジャンル絞り込み → URL ?q= & ?genre=
  - 見届け数・声数表示（❤️削除）
- P-09 app/mypage/profile + components/profile-self-v0-page.tsx + lib/profile-v0-mock-data.ts
  - プロフィール header / stats 4 / 概要カード / 最近の活動
- components/player-shell.tsx — マイページ sub-nav、ヘッダー検索 submit、プロフィール → /mypage/profile
- components/game-detail-v0-page.tsx — useRequireAuth、ログインしてプレイ/声を届ける
- components/mypage-page.tsx — activeMypageLink 連動

■ ユーザー目線の変化
- 検索: 条件を変えて結果件数が変わる（mock 8件内）
- プロフィール: 自分用 hub が /mypage/profile で見られる
- 未ログイン: プレイ/FB/見届け等 → ログイン画面（return 付き）

■ 今回変更した画面
- P-05 /search?q=ファンタジー — 絞り込みパネル・結果リスト
- P-09 /mypage/profile — プロフィール本体
- P-06 /games/[id] — CTA ログイン導線
- Player Shell — 検索/マイページ画面で sidebar マイページ sub-nav 展開

■ Preview URL
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/search?q=ファンタジー
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/mypage/profile
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/games/seikat-no-tabiji（未ログインでプレイ→login）

■ 今すぐ私がやるべきこと
- 上記3 URL 目視確認
- 未ログイン→ログイン→詳細に戻る→プレイ stub まで

■ Cursorだけで完了できること
- 次テーマ（開発者プロフィール P-07 等）

■ 次に検討すべきこと
- P-07 開発者プロフィール v0
- マイページ IA（tabs vs sidebar routes）本番方針

■ ChatGPTに相談したい論点
- 09 プロフィール vs 11/12/16 活動タイムラインの MECE（mock #36）
