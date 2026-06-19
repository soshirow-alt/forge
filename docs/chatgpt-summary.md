■ 現在の状態
- preview/landing-01 Player Shell サイドバー簡素化 push 済予定

■ 今回実装したこと
- components/player-shell.tsx
  - Sidebar: ホーム / 作品を探す / ランキング ── マイページ ── 設定 / はじめてガイド
  - 開発者を探す・通知・マイページ sub-nav を sidebar から削除
  - aside sticky top-0 h-screen — スクロールしても固定
- components/mypage-page.tsx — 「マイページ」見出し + 内タブ（見届け中〜フォロー中開発者）

■ 今回変更した画面
- Player Shell 全 v0 画面 — 左サイドバー構成変更
- /mypage — 見出し + 6内タブ（sidebar にはマイページ1行のみ）

■ ユーザー目線の変化
- サイドバーがすっきり。マイページは押すと内タブで切替
- 通知はヘッダー 🔔 のみ

■ Preview URL
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/mypage
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/home

■ 注意事項
- /search/creators は sidebar から外した（URL 直打ち可）
- /mypage/profile はヘッダー 👤 から

■ 今すぐ私がやるべきこと
- Preview で sidebar 固定 + マイページ内タブを目視確認

■ ChatGPTに相談したい論点
- 開発者を探すの導線（検索内リンク vs sidebar 復活）
