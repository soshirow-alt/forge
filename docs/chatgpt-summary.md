■ 現在の状態
- preview/landing-01、P-19 フィードバック v0 モーダル実装完了（tsc OK）
- push 実施予定（本タスク）
- P-06 オーナー OK 済。P-19 は P-06 上のモーダル群（Player Shell 未変更）

■ Forge原典コアループ（判断の基準）
- 発見 → 詳細 → プレイ → 声 → 変化 → 再プレイ
- 今回は「プレイ → 声を届ける」の preview 体験を v0 モーダルで試作

■ 今回実装したこと
- components/feedback-v0-modals.tsx（新規）
  - PlayStubV0Modal — プレイ開始 stub
  - FirstVoiceV0Modal — 初声（1問・5択 + クイック送信 / 詳しく / あとで）
  - FeedbackFormV0Modal — 深いFB（Q1–Q2 必須5択+理由、Q3–Q4 任意テキスト、右文脈サイド）
  - FeedbackSuccessV0Modal — 送信完了 → FB履歴リンク
- lib/feedback-v0-mock-data.ts — 質問定義（モック08準拠）
- game-detail-v0-page.tsx — フロー接続
  - 「プレイする」→ play-stub → first-voice → success or full-form
  - 「声を届ける（フィードバック）」→ full-form 直接
  - body scroll lock（モーダル表示中）

■ 今回変更した画面
- P-06 ゲーム詳細 /games/[id] + P-19 モーダル（オーバーレイ）
  - 画面位置: Player Shell 内詳細の上に z-50 モーダル。サイドバー・トップバーはそのまま
  - 変更前: CTA・プレイはすべて stub（クリック無反応）
  - 変更後: プレイ→初声→深いFB→成功の4段階 mock フロー
  - 確認手順: /games/seikat-no-tabiji → プレイする → stub → 初声 → 送信 or もっと詳しく → 成功
  - 別導線: 概要タブ「声を届ける」→ フルフォーム直接

■ ユーザー目線の変化
- preview 上で「プレイしたあとに声を届ける」体験が一通り試せる
- 送信後は /mypage?tab=feedback へ誘導（mock 送信、DB 未連携）

■ なぜこの設計
- 全画面08ではなくモーダル — 遷移図点線・P-06 上に載せる試作。Shell を変えない
- 初声と深いFBを分離 — 原典「プレイ直後は短い返答優先、深い材料は任意」
- mock 送信 — 写経フェーズ。旧 GameVoiceSection 統合は別 GO

■ 他案不採用
- /games/[id]/feedback 独立 URL — 今回は P-06 上モーダルに集中
- 旧 PostPlayVoiceOverlay 流用 — v0 紫テイストで新規
- Supabase submitVoiceResponses 接続 — preview mock スコープ外

■ In / Out
- In: 4モーダル、質問 mock、P-06 フロー接続
- Out: 実プレイ URL、認証ゲート、DB 保存、Devlog タブ、旧 voice 統合

■ リスク
- 未ログインでもモーダル開く — 本番 GO 時は login 必須に要変更
- 送信は UI のみ — 成功画面は mock

■ Preview URL
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/games/seikat-no-tabiji

■ 今すぐ私がやるべきこと
- Preview でプレイ→初声→深いFB フロー目視
- OK なら P-06「みんなの声」タブ mock or P-18 通知 GO

■ Cursorだけで完了できること
- ログイン必須ガード（/login へ）
- 旧 voice API との統合
- Devlog / みんなの声タブ mock

■ 次に検討すべきこと
- mock 送信 → Supabase 連携タイミング
- 初声のみで閉じた場合の見届け UX

■ ChatGPTに相談したい論点
- 初声送信後に深いFBを促すタイミング（即 vs あとで）
