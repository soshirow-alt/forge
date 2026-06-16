■ 現在の状態
- Witness + Tier — 完了、014 本番適用済み
- 将来像デモ — 設計 v2（世界中心）提示済み、実装未開始
- PLAYER_VISIBLE=false 維持
- UI 全面レビュー — デモ世界完成後

■ 今回実施したこと
- 設計方向をペルソナ中心から「成功した Forge 世界」中心へ改訂
- docs/future-demo-environment-design.md v2 を全面更新
- オーナーログイン 2 アカウント + 固定パスワード案を設計に明記
- 世界規模・Seeder・Verify・Walkthrough を再設計
- 実装は開始していない

■ 設計 v2 の要点
- 目的: Forge が普及した未来を、世界の住人として体験（ペルソナ差分検証ではない）
- 主役: Demo Veteran — 12 witness grants、Gold、プレイ/Voice/履歴が厚い
- 对比: Demo New User — 空状態のみ
- 世界: 25 作品（下限 20）、6 開発者 NPC、12 Released、3 Reopened、Devlog 90、Voice 180
- NPC プレイヤー 12 人 — 活気用（オーナーはログインしない）
- auth 合計 20 人 — オーナーが使うのは 2 人だけ

■ 固定ログイン情報（案 — 実装時正本化）
- Demo Veteran: veteran@forge-future-demo.local / ForgeDemo!Veteran2026
- Demo New User: new@forge-future-demo.local / ForgeDemo!New2026
- docs/future-demo-walkthrough.md に掲載 + seed 時ターミナル出力
- 毎回同じ — オーナーが実機で何度でもログイン可能

■ 必要作品数・ユーザー数
- 作品: 推奨 25、verify 下限 20（[future-demo] 接頭辞）
- 開発者 NPC: 6（各 4–5 作品）
- プレイヤー NPC: 12（世界の Voice/Play ノイズ）
- オーナーログイン: 2（Veteran + New User）
- auth 合計: 20

■ Seeder 構成
- scripts/future-demo-lib.ts — 定数、credential、テンプレ、marker
- scripts/future-demo-seed.ts — S0–S8 フェーズ（users → projects → devlogs → engagement → release → verify）
- scripts/future-demo-verify.ts — 世界密度 + Veteran Gold + New User 空断言
- npm: seed:future-demo:staging / verify:future-demo:staging
- staging のみ、service role、witness-sandbox 同型

■ Verify 方針
- ペルソナ表ではなく下限断言: 作品≥20、Devlog≥60、Voice≥100、Released≥10、Reopened≥2
- 世界 grants≥30、Veteran grants≥10、Veteran tier=Gold、New User grants=0
- FAIL 時は不足項目を stdout 明示

■ Walkthrough（実装後）
- 固定 credential 表
- Veteran ツアー: 発見→詳細→#play-history→#official-release→Devlog→Reopened
- New User 5 分对比
- UI レビュー 6 観点チェックリスト
- mock 18 は非表示にしない — [future-demo] を主に見る旨を記載

■ 実装コスト見積
- フル: 8–9.5 日（25 作品・Veteran 12 grants）
- MVP: 6 日（18 作品・8 Released・Veteran 10 grants）

■ Cursorの推奨案
- 世界データ bulk seed + オーナーは Veteran 1 アカウントで歩く
- 2 ログイン + 固定パスワードで実機確認問題を解消
- NPC で活気、Veteran で価値最大化状態

■ 推奨理由
- UI レビューは密度と narrative が必要 — ペルソナ 8 人より世界 25 作品が効く
- オーナー体験が「観察用アカウント巡回」から「住人として歩く」に近づく

■ 懸念点
- grants append-only — fresh seed 制約
- seed 工数増 — テンプレート化で吸収
- mock 18 混在 — walkthrough で明示

■ 他案不採用
- v1 の 8 ペルソナログイン — オーナー目的とずれる
- UI フィクスチャ — 本番 UX 変更に近い

■ In / Out
- In: v2 設計、2 ログイン、25 作品世界、Seeder/Verify/Walkthrough 案
- Out: 実装、8 ペルソナ、本番 UX、ランキング、通知、PLAYER_VISIBLE

■ 今回変更した画面
- 該当なし（設計のみ）

■ 今すぐ私がやるべきこと
1. design doc §17 — 25 vs 18 MVP、固定パスワード GO
2. F0 GO 返答

■ Cursorだけで完了できること
- F0 GO 後 Seeder + walkthrough 実装

■ 次に検討すべきこと
- F0 GO → F1 開始
- デモ完成 → UI 全面レビュー

■ ChatGPTに相談したい論点
- 25 作品フル vs MVP 18 のどちらから着手するか

■ オーナー確認手順
1. future-demo-environment-design.md v2 全文
2. Veteran / New User credential 案
3. §17 5 項目 → F0 GO
