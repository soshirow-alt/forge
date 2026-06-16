■ 現在の状態
- プレイ履歴・更新通知 UI 方向修正 — commit / push / staging deploy 実施（本メッセージ時点）
- 将来像デモ F1 — staging verify 13/13 PASS
- Witness + Tier — 014 本番適用済み
- PLAYER_VISIBLE=false 維持
- 次 — Veteran walkthrough → UI 全面レビュー継続

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- 今回はプレイヤー画面の関係性可視化と「自分に起きた変化」文言。回数・開発者行動を排除

■ 今回実装したこと
- プレイ履歴 折りたたみ — 回数集計廃止、関係性バッジ（見届け人 / 声 / 更新 / 複数版 / プレイ済み）
- プレイ履歴 展開 — 古→新タイムライン、プレイヤー視点ラベル（版 X をプレイ、正式版になりました 等）
- マイページ更新 — Devlog タイトル廃止、「版 X が公開されました」等のプレイヤー視点見出し
- lib/player-play-timeline.ts / lib/player-update-display.ts — 表示ロジック分離
- hooks/use-player-play-history.ts — witness grants 連携
- 追加修正 — 空状態「まだ関わりの記録がありません」廃止。プレイのみでも ▶️ プレイ済み を必ず表示

■ オーナー判断（確定）
- 方向修正は妥当 — GO で commit + push + staging deploy
- /notifications は今回触らない（DB message・過去整合・migration 影響のため別タスク）
- 最低バッジ ▶️ プレイ済み — プレイ履歴に載る時点で関係性が存在するため空文言は矛盾

■ なぜこの設計
- Forge の価値は回数ではなくプレイヤーと作品の関係性
- プレイヤー画面では開発者行動ではなく自分に起きた変化を見せる
- プレイのみでもバッジが空だと折りたたみが意味を失う

■ 他案不採用
- 空状態文言維持 — プレイ履歴セクションに出ている時点で既にプレイ済みであり事実と矛盾
- /notifications 同時修正 — スコープ膨張。マイページ優先

■ In / Out
- In: マイページ プレイ履歴・更新通知の UI 文言とバッジ、witness 連携、最低バッジ
- Out: /notifications ページ、DB 保存 message 書き換え、本番 prod deploy（今回は staging のみ）

■ リスク
- 低 — UI 表示のみ。DB migration なし。PLAYER_VISIBLE 変更なし
- devlog に publishedVersion がない更新は「更新を見た」バッジ・タイムラインに載らない（既存データ制約）

■ 今回変更した画面
- /mypage#play-history — 折りたたみ: 関係性バッジ（最低 ▶️ プレイ済み）。展開: 時系列履歴
- /mypage#updates — 見出し: プレイヤー視点（Devlog タイトル非表示）
- 確認: Veteran で /mypage → バッジ・展開タイムライン・更新見出し

■ デモ世界 / 元の世界戦について
- 今回の修正はフロントエンド表示ロジックのみ。Supabase データに依存するが future-demo 専用ではない
- hide:future-demo:staging で元の世界戦に戻しても、プレイ履歴・更新通知の UI は同じコードパスで適用される
- 変わるのは表示される作品データのみ（どの project にプレイ/grant/voice があるか）

■ ユーザー目線の変化
- 数字で評価されず、関わり方が一目で分かる
- プレイだけでも「プレイ済み」と関係性が見える
- 更新一覧で開発ログ名ではなく「何が変わったか」が主語

■ 注意事項
- /notifications の DB message は開発者視点のまま（別タスク）

■ 今すぐ私がやるべきこと
- staging 反映後 Veteran walkthrough（docs/future-demo-walkthrough.md §5）
- UI 全面レビュー継続

■ Cursorだけで完了できること
- player-play-history-design.md 設計 doc 同期
- /notifications プレイヤー視点化（別タスクとして）

■ 次に検討すべきこと
- Veteran 実機 Walkthrough
- UI 全面レビュー（6 観点）
- /notifications 文言整理

■ ChatGPTに相談したい論点
- 該当なし（オーナー GO 済み）
