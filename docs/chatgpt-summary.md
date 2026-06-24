■ 現在の状態
- ブランチ preview/landing-01。実 Studio UX 大改修を commit + push 済（本番 deploy は未）
- Preview: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- オーナー承認済み: ①イベント駆動サイクル ②正式版宣言の履歴は折りたたみ ③RUN
- 次: オーナーが Preview で /projects/{自分の作品id}/studio を実機レビュー
- 保留: S-22 mock 6→5タブ、S-20 polish、Studio ルート整理第2波

■ 今回実装したこと
- game-growth-cycle.tsx 全面再構成 — 5列ステッパー廃止。「今やること」ヒーロー + 大きな主CTA + 副CTA + インライン studio アクション（旧「その他のやること」統合）
- CompactCycleProgress — 5ドット進捗。「反応を待つ」完了時は ↺ 新回答で再開の一文のみ（ループアニメなし）
- lib/project-growth-state.ts — getStudioActionHeadline / getStudioCycleBanner 追加（ヒーロー文言・サイクルバナー）
- developer-voice-insights — 回答0件は null（空ボックス非表示）
- nurture-deep-feedback-section — 当版の詳しい感想0件は null
- project-release-studio-panel — 見出し「正式版として宣言する」。過去の宣言は折りたたみ（デフォルト閉）
- project-studio-page — ProjectNurtureActions 削除、ヘッダー簡素化（mono URL・いま:行削除）
- studio-top-priorities-panel — 「次に直すこと」下の説明文削除

■ なぜこの設計
- オーナー指摘: 5段ステッパーは「反応を待つ」で行き止まりに見える。初見では何をすればよいか不明
- 原典の改善ループは「イベントでサイクルが進む」もの。常時ループ演出は誤解を招く
- 空の集計カードは意味がなくノイズ。データがあるときだけ「プレイヤーの声」を出す
- 正式版は「宣言する」行為が主。履歴は補助なので折りたたみ

■ 他案不採用
- ステッパーを残してハイライトだけ変える — 行き止まり感は残るため不採用
- 正式版履歴を常時表示 — オーナー「折りたたみ」指示のため不採用
- phaseGuidance 小文字説明を残す — Player 側と揃えて削除

■ スコープ In / Out
- In: 実 Studio /projects/{id}/studio の UI・文言・空状態・宣言パネル
- Out: mock /studio/* の S-22 タブ数変更、Supabase migration、本番 prod deploy

■ 今回変更した画面
- 実 Studio /projects/{id}/studio — 画面上部
  - 変更前: 5列ステッパー、phaseGuidance 説明、下部「その他のやること」、正式版の履歴常時、空の「プレイヤーの回答」ボックス
  - 変更後: オレンジ枠ヒーロー「今やること」+ 主ボタン1本、5ドット進捗、インラインリンク、声なし時は共有CTA、宣言は折りたたみ履歴
  - 開発者視点: 開いた瞬間に次アクションが1つ分かる。待機中はサイクル完了と再開条件が明示
  - 確認: Preview にログイン → マイページ → 作品 → Studio。新回答あり/なし、宣言済み/未宣言を各1回

■ ユーザー目線の変化
- 開発者が Studio を開くと「今やること」が大きく1つ見える（回答を読む / 修正する / 記録する 等）
- 反応待ちは行き止まりではなく「この版のサイクル完了」。新回答で自動的に次サイクル開始の説明
- まだ声がない作品は空カードではなく「作品ページを共有する」CTA
- 正式版はボタンが主役。過去の宣言は必要なときだけ展開

■ 注意事項
- mock /studio は今回触っていない（実データ Studio のみ）
- 修正メモは引き続き端末内 localStorage
- Preview デプロイ反映まで数分かかる場合あり

■ 今すぐ私がやるべきこと
- Preview で自分の作品の Studio を開き、ヒーローCTA・サイクル文言・宣言折りたたみを実機確認
- 違和感があれば画面位置つきでフィードバック（次の Cursor タスク化）

■ Cursorだけで完了できること
- S-22 mock 5タブ化（オーナー GO 後）
- Studio ルート整理第2波（レビューメモ反映）
- 実 Studio の細部 polish（文言・余白）

■ 次に検討すべきこと
- オーナー実機レビュー結果を踏まえた微調整
- mock Studio と実 Studio の見た目統一（S-20）

■ ChatGPTに相談したい論点
- ヒーローCTA と「次に直すこと」パネルの役割分担が重複していないか（実機レビュー後）
