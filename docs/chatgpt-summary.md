■ 現在の状態
- preview/landing-01 push 済（版の履歴タブ）
- P-06 4タブすべて mock 完成
- 運用変更: preview v0 作業は毎回 push まで実施（RUN 待ち不要）

■ 今回実装したこと
- lib/game-versions-v0-mock-data.ts — 星灯 5版 / 炉心 3版
- components/game-versions-v0-tab.tsx — stats / 最新版 / タイムライン / プレイ stub
- components/game-detail-v0-page.tsx — versions タブ接続、TabStub 削除
- .cursor/rules/forge.mdc — preview push 運用を恒久ルール化

■ ユーザー目線の変化
- 版の履歴タブで過去版を一覧・任意版からプレイ stub へ

■ 今回変更した画面
- P-06 /games/[id]?tab=versions
  - stats → 最新版カード → 過去版タイムライン
  - 「この版でプレイ」→ play stub

■ Preview URL
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/games/seikat-no-tabiji?tab=versions

■ 注意事項
- mock のみ。prod deploy なし
- 今後 preview/landing-01 の v0 実装は push まで自動

■ 今すぐ私がやるべきこと
- 上記 URL で版の履歴タブ目視確認

■ Cursorだけで完了できること
- P-05 作品検索 v0 または P-09 マイページ残タブ

■ 次に検討すべきこと
- P-05 作品検索 v0
- プレイ/FB ログイン導線

■ ChatGPTに相談したい論点
- 特になし
