Forge ChatGPT 用サマリ — サイドバーぶれ修正 / 所有者プレビュー / 用語バッチ

■ 現在の状態
- 本番: https://forge-flame-gamma.vercel.app（commit 952985d / deploy dpl_8nPRYPEWPKsvkSAMYzCtMUq94Tie — Ready）
- サイドバーぶれ修正 / 所有者プレビュー / 用語バッチ: 本番 deploy 済み（2026-06-16）
- migration: なし

■ 今回実装したこと
1. サイドバーぶれ修正（本番バグ）
   - loading 中は onFlowStateChange を親へ送らない
   - voiceCompleteKnownRef で true を sticky（子の初期 false で上書きしない）
   - voiceFlowState は voiceDataReady 前も ref ベースで安定
   - hidden loader 削除、overlay 1 本化（complete 時のみ main に GameVoiceSection）
2. 所有者プレビューモード（案A）
   - isOwnerPreview = isProjectOwner
   - 初声オーバーレイ・プレイヤー voice UI 非表示
   - sidebar: プレビューバッジ + 育成導線（届いた回答を見る / 質問設定 / devlog / 編集 / テストプレイ任意）
   - main ヘッダに「開発者プレビュー」表示
3. 用語高優先バッチ
   - プレイヤー CTA: 質問に答える / 回答する / 回答を送信しました ✓
   - 集計: プレイヤーの回答
   - 深い FB: 詳しい感想を書く（任意）
   - プレイ前: ログインしてプレイ
   - 開発ダッシュボード → 開発マイページ（submit, mypage）
   - トップ: 声を届け
   - 新版 banner: フィードバック欄 → sidebar から回答

■ 今回変更した画面
- /games/{id} プレイヤー: sidebar CTA 文言変更、ぶれ解消
- /games/{id} 所有者: プレビューモード sidebar、初声 UI なし
- 集計セクション: みんなの声 → プレイヤーの回答
- submit / mypage: 開発マイページ表記

■ ユーザー目線の変化
- プレイヤー: ボタンで「何をするか」が分かる。sidebar が揺れない
- 開発者: 自分作品詳細はプレビュー + 次の行動が一覧化。自分で回答しない

■ build
- npm run build: 成功
- lint: 既存 errors 残存（今回 diff 起因ではない）

■ 今すぐ私がやるべきこと
- 本番 7 観点の確認（オーナー実施）
- GO なら次テーマ（変化を見る UI 等）判断

■ 本番確認手順
1. 別アカウントで作品詳細: プレイ→質問に答える→sidebar 文言が静止
2. 初声完了済み再訪: sidebar「回答を送信しました ✓」がぶれない
3. 自分作品: プレビューバッジ、初声オーバーレイなし、育成リンク
4. 集計見出し「プレイヤーの回答」
5. submit/mypage「開発マイページ」

■ 残リスク
- voice_complete 時 overlay→main で GameVoiceSection 1 回 remount（sticky で sidebar は安定想定）
- 所有者テストプレイ後も初声 UI は出さない（意図どおり）
- game-growth-cycle の FB を読む等は未変更（中優先）

■ ChatGPTに相談したい論点
- 本番 GO 後: /projects/{id}/studio 中長期のタイミング
