■ 現在の状態
- preview/landing-01 プレイヤー v0（01–18）mock 一通り完成 → push 済予定
- Studio 20–25 はスコープ外
- 整理 doc: docs/preview-v0-gaps.md

■ 今回実装したこと
- P-05-2 /search/creators — 開発者検索 v0
- P-07 /creators/[id] — 開発者プロフィール v0（旧 UI 差し替え）
- P-17 /settings — プレイヤー設定 v0（Studio 17 とは別 mock）
- P-18 /rankings/influence — 月間影響度ランキング v0
- Player Shell — 開発者を探す・月間影響度・設定リンク、sidebar sub-nav 拡張

■ プレイヤー v0 完成（01–18）
- 01 LP / 02 login / 03 register / 04 home / 05 search / 05-2 creators
- 06 detail（4タブ+FB modals）/ 07 creator / 08 FB modals
- 09 profile / 10–15 mypage tabs / 16 notifications / 17 settings / 18 ranking

■ Preview 内連携
- v0 同士はリンクで遷移可能（home ↔ search ↔ detail ↔ creator ↔ mypage ↔ settings ↔ ranking）
- 旧 UI: / トップ、/bookmarks、Studio 系

■ 動かないボタン（要確認）
- Studio / はじめてガイド / ヘルプ
- 検索: グリッド・ソート・2ページ目以降・プレイ環境 FF
- 詳細: 見届け/フォロー/あとで（login 後も toggle 未実装）、プレイ=stub
- 開発者: フォロー未連動
- 設定: メール/パス変更 stub、トグル保存なし
- ランキング: 月切替・もっと見る stub

■ 実装前に整理すべき論点
- / vs /home 入口
- Sidebar 正本（04/05/05-2/18 差分 #19）
- マイページ tabs vs sidebar URL
- 17 プレイヤー vs Studio 設定 URL
- 09 活動 vs 11/12/16 MECE
- mock→Supabase 切替タイミング
- prod deploy GO 条件

■ Preview URL
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/home
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/search/creators
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/creators/sora-games
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/settings
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/rankings/influence

■ 今すぐ私がやるべきこと
- 上記 URL で v0 画面間をクリック遷移して確認
- docs/preview-v0-gaps.md を ChatGPT と共有

■ 次に検討すべきこと
- Studio 20–25 v0 または mock→Supabase 接続

■ ChatGPTに相談したい論点
- プレイヤー v0 完成後の prod 反映順序
- Sidebar / マイページ IA 正本（#19）
