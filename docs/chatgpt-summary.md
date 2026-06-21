■ 現在の状態
- preview/landing-01。体験デモ機能はオーナー指示で削除済み
- ランキング月切替・もっと見る、設定変更、プロフィール編集を配線（push 予定）
- 次フェーズ（未着手）: Studio 本番ルート整理

■ 今回実装したこと
- 体験デモ削除: lib/preview-demo-loop.ts、hooks/use-preview-v0.ts 削除
- discovery-home-page: デモバナー・プレイしてFB CTA 削除
- game-detail-v0-page: Preview ログイン省略・?play=1/?feedback=1 自動開始を削除。requireAuth に戻す
- login-return-url: ?play= 等のクエリ許可を廃止
- influence-ranking-v0-page + mock: 月 ◀▶（?month=）、もっと見る（4位以下）
- forge-settings-form: メール/パスワード「変更」モーダル
- profile-self-v0-page: 「プロフィールを編集」モーダル
- components/v0-simple-modal.tsx 新設（設定・プロフィール共通）

■ 今回変更した画面
- /home — 体験デモバナー・第2 CTA なし（ヒーローは詳しく見るのみ）
- /games/[id] — URL に ?play=1 してもモーダル自動開始しない。未ログインは login へ
- /rankings/influence — ◀▶ で 2025年5月/4月/3月。表下もっと見るで15位まで
- /settings — アカウントの変更 → モーダル保存 → 一覧の表示更新
- /mypage/profile — プロフィールを編集 → 表示名等更新

■ ユーザー目線の変化
- 勝手にプレイモーダルが開かなくなった
- ランキング・設定・プロフィールでボタンが動く

■ 注意事項
- 設定/プロフィール/ランキングは mock のクライアント state のみ
- 体験デモは将来ちゃんと作り込む前提で一旦全撤去

■ 今すぐ私がやるべきこと
- Preview で上記5画面を確認
- 問題なければ次は Studio 本番ルート整理を Cursor に依頼

■ Cursorだけで完了できること
- Studio 本番ルート整理（次タスク）

■ 次に検討すべきこと
- 体験デモ再実装のタイミングと仕様（ログイン必須・自動開始なし等）

■ ChatGPTに相談したい論点
- なし（オーナー指示どおり実施）
