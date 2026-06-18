■ 現在の状態
- preview/landing-01、P-18 通知一覧 v0 mock 実装完了（tsc OK）
- push 実施予定（RUN）

■ 今回実装したこと
- components/notifications-v0-page.tsx — モック16参考
  - H1 通知一覧 + サブコピー
  - 種別タブ7（すべて / 未読 / FB / 共感 / 更新 / フォロー / システム）
  - すべて既読 + フィルタ btn（stub）
  - 未読4 + 既読5 セクション、行 UI（ドット・アイコン・本文・時刻・サムネ）
  - フッター「30日間保存」
- lib/notifications-v0-mock-data.ts — mock 9件
- app/notifications/page.tsx — v0 差し替え（旧 ForgeHeader 版は notifications-page.tsx 残存）
- player-shell.tsx — サイドバー「通知一覧」+ 🔔 Link /notifications、badge prop

■ 今回変更した画面
- P-18 通知一覧 /notifications
  - Player Shell 内。activeNav=notifications
  - 確認: /notifications — タブ切替・既読操作・行クリック遷移
- Player Shell 全ページ — 🔔 が /notifications へ（badge 4 デフォルト）

■ Preview URL
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/notifications

■ 今すぐ私がやるべきこと
- Preview 目視（未読/既読・種別タブ・サムネ）

■ 次に検討すべきこと
- P-06 開発ログ / 版の履歴タブ mock
- 旧 Supabase 通知との統合
- プレイ/FB ログイン必須

■ In / Out
- In: P-18 UI mock、Shell ナビ接続
- Out: 実通知 DB、30日削除、開発者返信の原典整合（mock に含むが preview のみ）
