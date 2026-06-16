■ 現在の状態
- 見届け人 tier — 設計 GO（Silver/Gold 確定）、T1/T2 実装完了
- W1–W4 — main 反映済み（771dfe6）、docs 964a452
- tier コード — main 反映済み（759b0dd）、Vercel deploy success（2026-06-16T14:58–14:59Z）
- migration 014 — staging 適用済み、本番 Dashboard 適用 GO（適用はオーナー Run）
- PLAYER_VISIBLE=false 維持
- UI 全面レビュー — 将来像デモ環境確認後（ChatGPT 推奨）

■ main反映結果
- commit: 759b0dd — Add lightweight witness tier on mypage official-release section
- range: 964a452..759b0dd on main
- Vercel — both forge / forge-app success（2026-06-16T14:58–14:59Z）

■ 今回実装したこと
- ChatGPT レビュー反映 — tier 名称 Silver/Gold 採用、軽量実装方針
- lib/witness-tier.ts — 閾値 1/3/10、resolveWitnessTier()、summary 文言
- /mypage#official-release — grant ≥1 時、見出し下に tier バッジ + summary 一行
- scripts/witness-tier-verify.ts — npm run verify:witness:tier PASS
- docs/witness-phase-t1-tier.md — 設計確定 + 実装正本
- docs/witness-tier-design-review.md — GO 確定に更新
- docs/witness-phase-w2-migration.md — 014 本番 GO 追記

■ 確定 tier
- Tier 0（1 作品）: 見届け人 — 正式版まで見届けた作品があります
- Tier 1（3 作品）: 見届け人 Silver — 複数の作品の正式版を見届けてきました
- Tier 2（10 作品）: 見届け人 Gold — 多くの作品の育ちに関わってきました
- 判定: project_witness_grants 行数（distinct project）、追加 migration なし
- 名称: 当面 Silver/Gold、将来 UI レビューで差し替え可

■ 今回変更した画面
- 画面: マイページ — 正式版到達セクション
- URL: /mypage#official-release
- 画面位置: セクション見出し「正式版に到達した作品」の直下（grant 保持時のみ）
- 変更前: 見出し + 補足文 → 見届け人カード一覧
- 変更後: 見出し + 補足文 + teal tier バッジ（見届け人/Silver/Gold）+ summary 一行 → カード一覧
- プレイヤー視点: 作品単位の見届け人に加え、横断的な称号が静かに分かる
- 開発者視点: 他人比較・ランキング・人数表示なし（Out 維持）
- 確認手順: staging grant ユーザーでログイン → #official-release → tier バッジ表示
- 本番: 014 適用 + grant 後に同手順

■ ユーザー目線の変化
- grant 1 件以上のユーザーはマイページだけで tier 称号と説明文を見られる
- 件数そのものは強調しない（summary は達成感より伴走の記録トーン）
- 作品詳細・他人プロフィールには出ない

■ 014 本番適用（GO）
- オーナー Dashboard で supabase/migrations/014_project_witness_grants.sql を Run
- 手順: docs/supabase-dashboard-migration-guide.md、詳細 docs/witness-phase-w2-migration.md
- 適用前 Released 済み作品は遡及付与なし（バックフィルなし）
- 適用後: grant 保持ユーザーで本番 /mypage#official-release 目視（W4 カード + tier）

■ 注意事項
- tier T3（プロフィール）— Out
- 通知・ランキング・見届け人数・作品詳細 — Out
- PLAYER_VISIBLE=true — 別 Run
- adoption 表示 ON — Out

■ 今すぐ私がやるべきこと
1. 014 本番 — Supabase Dashboard SQL（GO 済み）
2. grant 保持アカウントで本番 /mypage#official-release 目視（tier + 見届け人カード）

■ Cursorだけで完了できること
- 014 適用後の verify スクリプト実行（staging / 本番 env）
- UI 全面レビュー準備（将来像デモ環境後）

■ 次に検討すべきこと
- UI 全面レビュー — 将来像デモ環境確認後
- tier T3 — プロフィール一行（将来）
- 伴走者 / 育成者 — ロードマップ次テーマ

■ In / Out
- In: tier T1/T2、Silver/Gold 確定、014 本番 GO ドキュメント、軽量 UI
- Out: プロフィール tier、通知、ランキング、PLAYER_VISIBLE、014 Dashboard 実行自体

■ ChatGPTに相談したい論点
- 特になし（tier 名称 GO 済み）
- UI 全面レビュー時 — tier 文言・バッジ視覚の再調整

■ オーナーが確認する手順
1. npm run verify:witness:tier — PASS 確認
2. staging ログイン — /mypage#official-release で tier バッジ
3. Dashboard — 014 本番 SQL Run
4. 本番目視 — grant ユーザーで tier + 見届け人カード
