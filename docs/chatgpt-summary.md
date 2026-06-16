■ 現在の状態
- main 6c8e992 — プレイ履歴 Phase1 + matcher + Phase3 反映済み
- PLAYER_VISIBLE=false 維持
- 運用方針更新 — Cursor 一気通貫（2026-06-16 オーナー確定）

■ 今回実施したこと
- docs/forge-triage-operations.md §10 — 一気通貫運用の正本
- docs/gpt-run-decision-memo.md — 停止条件 9 項目に更新（push 一律停止を廃止）
- AGENTS.md / .cursor/rules/forge.mdc / chatgpt-summary-format.md — 同期
- forge-handoff / forge-changelog 更新

■ 一気通貫運用（要点）
- 原則フロー: 設計 → 実装 → build → staging 確認 → main 反映準備
- 毎工程の承認待ち不要 — 機能タスク単位で完走
- 開発速度優先。安全性は停止 9 条件で維持

■ 必ず停止（9 条件）
- 課金発生
- 新規 API 契約
- 本番公開
- PLAYER_VISIBLE=true
- DB 破壊変更
- 既存データ移行
- Forge 原典変更
- ロードマップ優先順位変更
- 不可逆な作業

■ 自動で進めてよいもの
- migration 作成、設計 doc、実装、build、staging 確認、テストデータ、main 反映準備（commit/push）、handoff 更新

■ サマリ報告ルール（変更）
- ■ 今すぐ私がやるべきこと — オーナーしかできないことだけ
- Cursor が実行できる内容はオーナー欄に書かない

■ ユーザー目線の変化
- なし（運用ルールのみ）

■ 今回変更した画面
- 該当なし

■ 注意事項
- Supabase Dashboard SQL 適用は引き続きオーナー操作が必要なことが多い（Cursor は SQL 正本まで）
- 本番公開・PLAYER_VISIBLE ON は従来どおり必ず停止

■ 今すぐ私がやるべきこと
- 該当なし（本タスクは doc 更新のみ）

■ 次に検討すべきこと
- 次機能タスク（Phase 1b / updateWatchCount B 定義 / matcher env）を一気通貫で着手

■ In / Out
- In: 運用正本 §10、停止リスト刷新、エージェントルール同期
- Out: 原典変更、ロードマップ順位変更、本番公開

■ ChatGPTに相談したい論点
- 該当なし
