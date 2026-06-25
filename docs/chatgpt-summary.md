■ 現在の状態
- ブランチ preview/landing-01。ローカル未 push。build 通過済み

■ 今回実装したこと
- Studio ゲーム詳細 `/studio/projects/[id]` をプレイヤー `/games/[id]` と同型に再構成
  - タブ: 概要 / みんなのフィードバック / verの履歴（6タブ→3タブ）
  - 概要・FB・ver履歴はプレイヤーと同じ v0 コンポーネントを共有
  - Studio 差分: 概要は編集可（保存ボタン）、FBタブに「フィードバックする」CTAなし、verタブに正式ver操作を統合
- 新規共有コンポーネント
  - `GameDetailOverviewV0Tab` — プレイヤー/Studio 共用（editable  prop）
  - `GameVerHistoryV0Tab` — 開発ログ + ver履歴 + 正式ver（studioMode）
- ヒーロー — ギャラリー・タグ・stats をプレイヤー詳細に近づけ、「Studioで改善ループ」「プレイヤー視点で見る」リンク追加
- 旧タブ URL（voices-raw, devlog, release 等）は parse で新タブへマップ

■ Forge原典コアループ（判断の基準）
- 開発者もプレイヤーと同じ作品像を見ながら編集する。UI が違いすぎると「別物」に感じて学習ループが途切れる

■ なぜこの設計
- オーナー FB — 共有タブは同じ中身。違いは編集可否と Studio 向け表示だけ
- Devlog / ver / 正式ver 分割は開発者にとって冗長。1つの「verの履歴」に時系列でまとめる
- 旧 Studio 独自タブ（生FB一覧・集計FB別タブ）はプレイヤーの「みんなのフィードバック」と役割重複

■ 他案不採用
- Studio だけ別 UI を維持 — オーナー指示でプレイヤー同型へ
- プレイヤー側も devlog+ver 統合 — 今回は Studio のみ（プレイヤーは従来4タブ維持）

■ スコープ In / Out
- In: studio-project-detail-page, game-detail-overview-v0-tab, game-ver-history-v0-tab, studio-shell tabs, game-voices-v0-tab（onSendVoice 任意化）
- Out: 実データ編集 API、プレイヤー側タブ統合、本番 deploy

■ 今回変更した画面
- Studio プロジェクト詳細 /studio/projects/{id}
  - 変更前: 6タブ・独自レイアウト・独自FB/devlog/ver/正式ver UI
  - 変更後: 3タブ・プレイヤー同型ヒーロー+タブ中身。verタブに開発ログ+履歴+正式ver
  - 確認: 各タブがプレイヤー `/games/{id}` と見た目一致（概要は編集フィールド）
- プレイヤー作品詳細 /games/{id}
  - 概要タブのみ共有コンポーネント化（見た目は同じ）

■ ユーザー目線の変化
- Studio で作品を見たとき「プレイヤーが見ているのと同じページ」+ 編集できると分かる
- ver 関連情報が1タブに集約され迷わない

■ 注意事項
- 未 commit / 未 push
- mock プロジェクト id と game detail id のマッピングは resolveGameDetailId 依存

■ 今すぐ私がやるべきこと
- `/studio/projects/hoshino-kioku` と `/games/seikat-no-tabiji` を並べてタブ比較
- RUN 指示で push

■ Cursorだけで完了できること
- プレイヤー側も devlog+ver 統合（GO あれば）
- commit + push（RUN 時）

■ 次に検討すべきこと
- Studio 概要の「公開状態・外部URL」等メタ編集をどこに置くか（改善ループ Studio か概要タブか）
- 生FB管理（未確認/採用候補）は改善ループ `/projects/{id}/studio` 専用のままか

■ ChatGPTに相談したい論点
- プレイヤーも devlog+ver を1タブに揃えるべきか（今は Studio のみ統合）
