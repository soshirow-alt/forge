■ 現在の状態
- 将来像デモ世界 F1 — 実装完了、staging seed + verify PASS
- Witness + Tier — 完了、014 本番適用済み
- PLAYER_VISIBLE=false 維持
- 次 — Veteran 実機 Walkthrough → UI 全面レビュー

■ 今回実装したこと
- scripts/future-demo-lib.ts — 定数、credential、Seeder ヘルパー、hide/show
- scripts/future-demo-seed.ts — 25 作品・20 auth・engagement・release・reopen
- scripts/future-demo-verify.ts — 世界密度 + Veteran Gold 断言
- docs/future-demo-walkthrough.md — 固定 credential、世界戦切替手順
- npm: seed / verify / hide / show future-demo:staging

■ staging seed 結果（verify 13/13 PASS）
- 作品 25、Devlog 82、Voice 162、Released 12、Reopened 3
- 世界 witness grants 54、Veteran grants 12、tier Gold
- Veteran sessions 46、voices 38
- New User grants 0、sessions 0
- worldId: world-1781624452091

■ 固定 credential（毎回同じ）
- Demo Veteran: veteran@forge-future-demo.local / ForgeDemo!Veteran2026
- Demo New User: new@forge-future-demo.local / ForgeDemo!New2026
- 正本: docs/future-demo-walkthrough.md
- seed 完了時ターミナルにも出力

■ seed 手順
1. staging .env.local 確認（NEXT_PUBLIC_SUPABASE_URL + SERVICE_ROLE_KEY）
2. npm run seed:future-demo:staging
3. npm run verify:future-demo:staging
- 初回のみ --fresh 可。grants 後は --fresh 不可
- 再 seed 不要時は hide/show で世界戦切替

■ 世界戦切替（元の世界 ↔ デモ世界）
- 元の世界戦に戻す: npm run hide:future-demo:staging（全 [future-demo] を private）
- デモ世界戦に戻す: npm run show:future-demo:staging（public）
- grants は DB に残る — 削除しない（014 append-only）
- オーナーが「元の世界戦に戻して」→ hide、「デモ世界に戻して」→ show

■ 世界構成サマリ
- 25 作品（[future-demo] 接頭辞）、6 開発者 NPC、12 プレイヤー NPC
- 12 Released、3 Reopened
- Demo Veteran — Gold、12 見届け人、厚いプレイ履歴
- mock 18 も発見に並ぶ — レビューは [future-demo] を主に見る

■ Walkthrough
- docs/future-demo-walkthrough.md
- Veteran: / → 作品詳細 → #play-history → #official-release → Devlog
- New User: 空状態对比（5 分）

■ 今回変更した画面
- 該当なし（Seeder のみ、本番 UX 変更なし）

■ ユーザー目線の変化
- staging で Demo Veteran ログインすれば「成功した Forge 世界」を実機で歩ける
- 発見・履歴・見届け人 Gold が密度を持って確認可能

■ 注意事項
- staging のみ — 本番 DB 禁止
- hide 中は [future-demo] が発見から消える（private）
- PLAYER_VISIBLE=false — Adoption UI 非表示

■ 今すぐ私がやるべきこと
1. npm run dev + staging env で Veteran ログイン
2. docs/future-demo-walkthrough.md のツアー実施
3. UI 全面レビュー GO 判断

■ Cursorだけで完了できること
- UI レビュー指摘の copy/レイアウト修正（別フェーズ）
- hide/show 運用サポート

■ 次に検討すべきこと
- UI 全面レビュー
- 伴走者 / 育成者

■ In / Out
- In: F1 Seeder、verify PASS、walkthrough、credential、hide/show
- Out: 本番 UX、本番 seed、PLAYER_VISIBLE

■ オーナー確認手順
1. npm run verify:future-demo:staging — 13/13
2. veteran@ で /login → Walkthrough
3. hide → 元の世界感確認 → show で復帰
