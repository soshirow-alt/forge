■ 現在の状態
- ブランチ preview/landing-01。HEAD 3a11c50 push 済み（Vercel Preview デプロイ待ち/反映中）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- 未 push の実装なし。今回の RUN は残ドキュメント + デプロイトリガーのみ

■ 今回確認・実施したこと
- git status: 実装はすべて origin/preview/landing-01 に反映済みだった
- 未 commit だった docs（RUN マーカー）を commit 3a11c50 で push → Preview 再デプロイ

■ Preview に含まれるバッチ（fe5a805〜3a11c50）
- マイコミュニティ / 参加コミュニティ / フォロワータブ（fe5a805）
- マイページ絞り込み4ピル（すべて・公開中・下書き・正式版）+ /submit 公開中・下書き（81066c8）
- コミュニティ参加申請・参加者タブ・許可拒否・通知 mock（a93b81d）

■ Preview 実機確認手順（オーナー向け）
1. /studio/mypage — フォロワータブ、4ピル絞り込み
2. /studio/community?tab=members — LunaWorks 申請の許可/拒否
3. /creators/lunaworks — コミュニティ参加申請ボタン
4. /mypage/community — 参加コミュニティ・参加者タブ
5. /submit — 公開中/下書き選択
6. /notifications と /studio/notifications — 申請・承認後の通知

■ ユーザー目線の変化
- 上記バッチが Preview 環境で一括確認可能になる

■ 注意事項
- コミュニティ申請状態は v0 localStorage。別ブラウザ/シークレットでは初期状態
- 本番 deploy・DB 変更なし

■ 今すぐ私がやるべきこと
- Vercel Preview デプロイ完了後、上記6点を実機でざっと確認

■ Cursorだけで完了できること
- デプロイ完了後の build ログ確認（必要なら）

■ 次に検討すべきこと
- Preview 確認後の polish 指摘取り込み

■ ChatGPTに相談したい論点
- 特になし（RUN 完了待ち）
