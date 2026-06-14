Forge ChatGPT 用サマリ — P1-2.7 localStorage 設計ルール遵守

■ 現在の状態
P1-2.7 実装済み。build 前回 exit 0
今回: オーナー 5 点ルールに沿った persistence 層整理

■ オーナー遵守 5 点（すべて反映）
1. UI から localStorage 直接参照なし — GameGrowthCycle は hook のみ
2. read / 改善メモ — 専用 store + hook に集約
3. 依存方向 UI → hook → store → persistence → localStorage
4. key 命名 — project_feedback_reads / project_improvement_notes（将来テーブル対応）
5. docs 明記 — 暫定 localStorage → 将来 DB 化予定

■ レイヤ構成
UI: components/game-growth-cycle.tsx
hook: use-nurture-feedback-read / use-nurture-improvement-note
store: nurture-feedback-read-store / nurture-improvement-note-store
persistence: lib/nurture-persistence/*-local.ts
keys: lib/nurture-persistence/local-storage-keys.ts

■ localStorage key（DB 移行前提）
project_feedback_reads:{projectId}:{feedbackId}
project_improvement_notes:{projectId}:{feedbackId}

■ ドキュメント
docs/p1-2-7-feedback-read-state.md — 5 点ルール + 依存方向 + 後続 DB 化

■ 後続
FB読了 DB 化 / 改善メモ DB 化 / P1-2.7 deploy + UX レビュー

■ 残リスク
暫定のため端末跨ぎ不可。key 変更で既存 read 状態リセット（許容）

■ Cursor連携
GPT には下記 text ブロックを Copy
