Forge ChatGPT 用サマリ — Phase2 #6 初声導線 実装

■ 現在の状態
- 本番: https://forge-flame-gamma.vercel.app（前回 6d5e0d2 — 今回 deploy 前）
- DB: migration 006+007+008 適用済
- Phase2 #5: クローズ
- Phase2 #6: 実装完了・build OK・deploy / 本番確認待ち
- 次: #6 本番 OK → #3 設計レビュー

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- #6 はプレイ後「声を届ける」摩擦低減
- プレイ前初声 NG / 1 問 OK / 深い FB 任意 / 応援≠初声 / モーダル NG

■ 今回実装したこと
1. main 列条件付き reorder
- not_played: 現状（placeholder 最下部）
- played_pending: Overview → Banner → GameVoiceSection → 説明 → みんなの声 → devlog
- voice_complete: Success 上寄せ、Banner 非表示、深い FB 任意維持

2. PostPlayFeedbackBanner 強化
- 先頭問い 1 行 preview
- CTA「返事を届ける」統一 + 「1つ答えるだけでOK」
- anchor scroll 維持

3. sidebar 3 状態
- not_played: プレイする
- played_pending: desktop のみ gradient「返事を届ける」+ 問い preview + 再プレイ
- voice_complete: 返事を届けました ✓ + 再プレイ + 深い FB scroll

4. canEdit interim
- primary CTA から「編集する」分離
- 「開発者メニュー」: /my-projects「作品を育てる」+ 編集 secondary

5. VoicePromptCard 未選択アフォーダンス
- 「ひとつ選んでください」/ cursor:pointer / hover / min-h-40 / focus-visible
- 選択後見た目維持

6. mobile sticky bottom bar
- played_pending + フォーム viewport 外 → 下部固定「返事を届ける」（scroll only）
- lg 未満のみ / プレイ前非表示

■ 今回変更した画面
- ゲーム詳細 /games/{id}
- 画面位置: main 列 Overview 直下（Banner + 初声フォーム reorder）、右 sidebar CTA ブロック、モバイル下部 sticky bar
- 変更前: 初声フォーム最下部、sidebar 常に「感想を届ける」、編集が CTA 同列
- 変更後: プレイ後フォーム上寄せ、状態別 sidebar、開発者メニュー分離、選択肢押せそう感 up
- プレイヤー: プレイ直後に返事しやすい / 開発者: 自分作品でも育成導線が分離
- 確認: 別アカウントでプレイ → Banner 直下フォーム / choice hover / 1 問送信 / mobile bottom bar

■ 変更ファイル
- lib/player-voice-flow-state.ts（新規）
- lib/game-feedback-ui.ts
- components/game-detail-page-client.tsx
- components/game-detail-sidebar.tsx
- components/post-play-feedback-banner.tsx
- components/post-play-voice-sticky-cta.tsx（新規）
- components/game-voice-section.tsx
- components/voice-prompt-card.tsx
- docs/phase2-6-voice-flow-design.md / forge-changelog / forge-handoff

■ 状態管理
- PlayerVoiceFlowState: not_played / played_pending / voice_complete
- derivePlayerVoiceFlowState(isLoggedIn, played, voiceComplete)
- GameVoiceSection が load/submit 後 onFlowStateChange で親へ lift
- 親が Banner / Sidebar / reorder / sticky bar に配信

■ build / lint
- npm run build: 成功（Next.js 16.2.9 / TypeScript OK）
- eslint: 変更ファイル問題なし

■ 本番確認手順（オーナー）
1. deploy 後 /games/{id} を別アカウントで開く
2. 未プレイ: フォーム非表示、プレイ CTA のみ
3. プレイ後: Banner + 先頭問い + 直下フォーム
4. choice: 「ひとつ選んでください」、hover、選択、送信
5. 成功後: sidebar「返事を届けました ✓」、Banner 消える
6. mobile: スクロールで bottom bar 表示 → scroll
7. オーナー自分作品: 開発者メニュー分離

■ 残リスク
- voiceComplete lift 前の一瞬 played_pending レイアウト（loading 中は許容）
- mobile bottom bar IntersectionObserver の edge case（極端な viewport）
- canEdit interim は Phase3 本格ハブで置換予定

■ 含めない（今回）
#3 / 自由記述 rename / my-projects 本格 / AI / 変化を見る

■ 今すぐ私がやるべきこと
- deploy 承認 → 本番確認（上記手順）

■ Cursorだけで完了できること
- push / deploy（承認後）
- #3 設計レビュー（#6 OK 後）

■ ChatGPTに相談したい論点
- #6 本番確認結果次第で #3 設計 GO タイミング
