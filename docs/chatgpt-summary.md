■ 現在の状態
- commit 42179f3 — main push + preview deploy 済み
- preview READY — https://forge-etb0gsaz1-soshirow-alts-projects.vercel.app（dpl_4crzKWLk2Ez3Vonnt7D7LFZNEDNR）
- verify 18/18 PASS、patch 済み
- prod deploy — **禁止**
- PLAYER_VISIBLE=false 維持

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- Veteran をプレイヤー兼開発者にした P0 と、ForgeGameCard 統一 P1 が main/preview に反映

■ 今回実施したこと
- git commit + push（P0/P1 一式）
- npx vercel deploy（preview のみ、--prod なし）
- ドキュメント更新（次スコープ: 開発者タブ）

■ オーナー追加判断
- 開発者タブ ProjectListCard → ForgeGameCard 思想 — **次スコープ GO**
- 理由: P0 で Veteran を開発者にもしたのに /mypage?tab=developer だけ旧 UI だと Walkthrough 体験が割れる
- 開発者バッジ例: 公開中 / 正式版 / Reopened / Voiceあり / Devlogあり / プレイあり（プレイヤー関係性バッジとは別）
- GeneratedThumbnailPoster — Walkthrough で許容確認。実サムネ URL は後回し

■ prod GO 条件（オーナー指定）
- Veteran walkthrough 完了
- プレイヤータブ主要 UI 確認
- 開発者タブ確認
- 正式版 grid 確認
- 大きな UX 破綻なし
→ 満たした後に prod 判断

■ 次アクション（オーナー Walkthrough）
1. Veteran ログイン（veteran@forge-future-demo.local）
2. /mypage プレイヤータブ — サムネ付きカード各セクション
3. /mypage?tab=developer — 7 作品（旧 UI 感が強ければ Cursor に ProjectListCard 統合を即指示）
4. #official-release — 折りたたみ grid
5. スクリーンショット → UI 全面レビュー継続

■ 今回変更した画面（P0/P1 コミット内容）
- /mypage — 遊んだゲーム / 作ったゲーム
- #play-history / #supported / #watching / #updates / #official-release — ForgeGameCard + grid
- 開発者タブ — **未変更**（次スコープ）

■ build / verify（コミット前確認済み）
- npm run build — PASS
- verify:future-demo:staging — 18/18 PASS
- patch:veteran-developer — Veteran owned 7 / released 5 / reopened 1

■ 注意事項
- prod deploy 禁止
- /notifications 未修正
- preview URL は deploy 完了後に handoff 更新

■ 今すぐ私がやるべきこと
- preview で Veteran Walkthrough（docs/future-demo-walkthrough.md §5）
- 開発者タブ旧 UI 感 → GO 済みなら Cursor に統合実装指示

■ Cursorだけで完了できること
- ForgeDeveloperProjectCard（ForgeGameCard 派生）+ mypage-developer-tab 置換
- walkthrough フィードバック反映

■ 次に検討すべきこと
- 開発者タブ統合実装（Walkthrough 後即）
- prod deploy GO

■ ChatGPTに相談したい論点
- 開発者タブバッジの最小セット（5 種で足りるか）
