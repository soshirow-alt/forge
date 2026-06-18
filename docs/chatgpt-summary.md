■ 現在の状態
- preview/landing-01、P-06「みんなの声」タブ v0 mock 実装完了（tsc OK）
- push 実施予定（RUN）
- 添付は Studio P-23 参考 → プレイヤー向け P-06 タブに適応（開発者専用 CTA 除外）

■ Forge原典コアループ（判断の基準）
- 発見 → 詳細 → プレイ → 声 → 変化 → 再プレイ
- 今回は詳細上で「他者の声・集計」を見せ、FB 送信（P-19）への動機を補強

■ 今回実装したこと
- components/game-voices-v0-tab.tsx（新規）
  - 月次 stats 4枚（届いた声 / 共感 / 質問回答 / 自由記述）
  - サブタブ: 届いた声（5件 mock）/ 質問別集計 / 自由記述集約（stub）
  - フィルタ: すべて・自由記述・質問への回答
  - 声カード: 種別バッジ・本文・タグ・共感トグル（mock）
  - 右カラム: 今月の要約・質問別棒グラフ・声を届ける CTA
- lib/game-voices-v0-mock-data.ts — mock データ
- game-detail-v0-page.tsx — voices タブ差し替え、voices 時は右サイド（開発者/関連）非表示

■ 今回変更した画面
- P-06 /games/[id] — 「みんなの声」タブ
  - 画面位置: 詳細タブ4種の3番目。Player Shell 内、Hero/CTA の下
  - 変更前: stub 1行
  - 変更後: stats + リスト + 右要約（添付モック準拠・プレイヤー向け）
  - 確認: /games/seikat-no-tabiji → みんなの声タブ → フィルタ・共感・声を届ける
  - 触っていない: Player Shell、他3タブ（概要は既存、devlog/版は stub）

■ ユーザー目線の変化
- FB 送信後・詳細上でコミュニティの声と傾向が見える
- 共感ボタンでインタラクション mock（DB 未連携）

■ なぜこの設計
- Studio P-23 モックをプレイヤー P-06 に適応 — 「開発に役立った」は開発者専用のため除外
- voices タブ時に右サイド入替 — 要約・集計をモックどおり右に、二重サイドバー回避
- mock のみ — 旧 EveryonesVoiceSection / Supabase 集計は別 GO

■ 他案不採用
- Studio Shell で P-23 独立 URL — 今回スコープは P-06 タブ
- 開発者 stats（開発に役立った 27件）をプレイヤーに表示 — 原典上 NG

■ In / Out
- In: みんなの声タブ UI、mock、P-19 CTA 接続
- Out: 自由記述集約タブ中身、DB、Studio P-23 独立画面

■ Preview URL（push 後）
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/games/seikat-no-tabiji（みんなの声タブ）

■ 今すぐ私がやるべきこと
- Preview 目視（stats・リスト・右要約・声を届ける）

■ 次に検討すべきこと
- P-18 通知 + Shell 🔔
- P-06 開発ログ / 版の履歴タブ mock

■ ChatGPTに相談したい論点
- P-06 みんなの声 vs Studio P-23 の情報開示境界（プレイヤーに見せる集計の上限）
