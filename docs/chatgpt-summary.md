■ 現在の状態
- preview/landing-01。最新 commit 3b7f82f push 済み
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- npm run build 成功。Vercel 反映待ち数分
- 本番 prod deploy — 保留

■ Forge原典コアループ
- プレイヤー: 発見 → プレイ → 声を届ける → 変化を見る → 再プレイ
- 開発者: 投稿 → 声を受け取る → 改善する → 開発ログ公開 → 再プレイ獲得

■ Preview に載っている実装（まとめ）

【Player v0 主要画面】
- /home — ホーム P-04
- /games/[id] — ゲーム詳細 P-06（概要・開発ログ・みんなの声・版の履歴）
- /search / /search/creators — 作品・開発者検索
- /rankings/influence — 月間影響度 P-17
- /mypage 一式 — マイページ P-16
- /notifications / /settings — 通知・設定
- /login / /register — 認証
- FB モーダル P-19（ゲーム詳細から）

【Forge Studio S-20〜S-27】
- /studio — Studio ホーム（作品5件・最近の動き・ランキング抜粋等）
- /studio/projects — プロジェクト一覧（グリッド/リスト・フィルタ・12件 mock）
- /studio/projects/[id] — プロジェクト詳細（6タブ mock ※正本は5タブへ変更予定）
- /studio/rankings — 開発者月間ランキング S-23（今月もっとも作品を育てた開発者）
- /studio/profile — Studio マイページ S-24
- /studio/notifications — Studio 通知 S-25
- /studio/settings — Studio 設定 S-26（Player /settings と共通フォーム）
- /studio/guide — はじめてガイド S-27（/studio/getting-started はリダイレクト）

【共通】
- StudioShell — Player v0 同型ダークテーマ・紫アクセント・Sidebar 正本
- トップバー「Playerへ戻る」で Player 側へ切替

■ 今回 push したもの（3b7f82f）
- 残っていた設計 docs 一括（forge-screen-inventory、ui-mocks 02〜23、roadmap、product-decisions 等）
- AGENTS.md / forge-principles 等の更新分

■ 直近 commit 履歴（Studio 関連）
- 3b7f82f — 設計 docs 一括
- 11ab822 — S-22 正本（P-06 編集モード・正式版タブ廃止）
- 996c632 — S-23 開発者月間ランキング
- 5e222d5 — S-21 プロジェクト一覧リデザイン
- 2b0e40f — Studio S-20〜S-27 v0 初回

■ 正本と preview の差分（要 GO）
- S-22 /studio/projects/[id] — preview は旧6タブ（正式版あり）。正本は5タブ・P-06 ヘッダー寄せ・T03 ダッシュボード化

■ 今すぐ私がやるべきこと
- Preview URL を開き、下記を目視確認
  - /studio — ホーム
  - /studio/projects — 一覧
  - /studio/projects/（任意 id）— 詳細6タブ
  - /studio/rankings — 開発者ランキング
  - /games/（任意 id）— Player 詳細との世界観比較

■ Cursorだけで完了できること
- S-22 正本どおりの v0 実装（GO 後）

■ Runしてよいか
- preview push: 完了（3b7f82f）
- prod: 保留
