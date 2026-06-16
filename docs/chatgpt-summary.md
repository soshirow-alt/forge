■ 現在の状態
- Witness W1–W4 + Tier T1/T2 — 完了、main 反映済み
- migration 014 — staging + 本番適用済み（オーナー確認）
- PLAYER_VISIBLE=false 維持
- 最優先テーマ — 将来像デモ環境（設計案作成済み、実装未開始）
- UI 全面レビュー — デモ環境完成後に実施

■ 今回実施したこと
- 将来像デモ環境の設計案を docs/future-demo-environment-design.md に作成
- 8 ペルソナ（Player A–D / Developer A–D）のデータ要件を定義
- 3 体験（プレイヤーサイクル / 見届け人 / 開発者ループ）を既存画面にマップ
- Seeder 方式・コスト見積・In/Out を整理
- 実装は開始していない（設計 GO 待ち）

■ デモ環境設計案（要約）
- 目的: Forge が育った未来を staging で再現し、UI レビューの精度を上げる
- 方式: staging Supabase + service-role CLI Seeder + 固定 8 auth ユーザー
- 作品: Demo 専用 5–6 本（[future-demo] 接頭辞）
- 画面: 既存 URL のみ（/mypage, /games/[id], Studio 等）— 本番 UX 変更なし
- 切替: ログイン切替（impersonation UI は作らない）
- 正本: docs/future-demo-environment-design.md

■ 必要データ一覧
- auth.users ×8 — ペルソナ固定
- developer_profiles — 開発者 4 人
- projects ×5–6 — 公開作品
- project_devlogs — Dev B/D 多数、published_version 付き
- project_version_prompts + project_voice_responses — Voice 体験
- project_plays + project_play_sessions — プレイ履歴・multi_version
- project_watches — watch 条件（必要時）
- project_release_events — Dev C released + release_reopened
- project_witness_grants — 014 trigger 任せ（Player B=1, C=3）
- voice_adoptions — 任意・最小（PLAYER_VISIBLE=false のため UI 非表示）
- 付与しない: 通知増殖、ランキング、Adoption プレイヤー表示

■ どの既存機能を使うか
- 使う: 発見、作品詳細、Voice、#play-history タイムライン、#official-release + tier、Studio Release、Devlog
- 使わない: mock 18 を正本にしない、witness 人数・作品詳細 witness、通知追加、Adoption 表示
- witness-sandbox と同型の Seeder パターンを流用

■ Seeder / ユーザー / プロジェクト
- Seeder: はい — scripts/future-demo-seed.ts（witness-sandbox-lib 流用）
- Demo 専用ユーザー: はい — 8 人（player-a@forge-future-demo.local 等）
- Demo 専用プロジェクト: はい — 5–6 本、オーナーは Developer A–D に割当
- 環境: staging のみ（本番 DB seed は Out）
- npm 案: seed:future-demo:staging / verify:future-demo:staging

■ ペルソナと再現内容
- Player A — 新規: 履歴空、見届け人なし
- Player B — 見届け人 tier 0: 1 作品 grant
- Player C — Silver: 3 作品 grant
- Player D — 熱心: 多数 play/voice/devlog タイムライン
- Developer A — 投稿直後: 1 作品、Devlog 最小
- Developer B — 複数 Devlog: Voice→反映の改善履歴（体験1）
- Developer C — 正式版: released + release_reopened（体験2）
- Developer D — 長期: Voice/Devlog/witness 多数（人数 UI なし）（体験3）

■ 再現する 3 体験
- 体験1: 発見→プレイ→声→Devlog→再プレイ — Player D × Dev B「星灯の旅路」
- 体験2: 複数版→見届け人→正式版→履歴 — Player B/C × Dev C/D Released 作品
- 体験3: Voice 集まる→Devlog→プレイヤーが戻る — Dev D × Player D

■ 実装コスト見積もり
- F0 設計 GO + walkthrough: 0.5 日
- F1 users + projects 骨格: 1–1.5 日
- F2 engagement seed: 1.5–2 日
- F3 release + grants + verify: 1 日
- F4 walkthrough + 目視: 0.5–1 日
- 合計: 4.5–6 日（MVP 短縮 3 日 — 体験2 優先）

■ Cursorの推奨案
- staging CLI Seeder + 8 固定ユーザー + [future-demo] 作品
- witness-sandbox パターン拡張、/demo 拡張は不採用
- UI 変更ゼロ、データだけで将来像を作る

■ 推奨理由
- 既存 hook が DB を読むため、実データ密度が UI レビュー精度に直結
- 本番 UX・機能追加なしで原典整合
- 014 grants append-only 等の制約を witness 実績パターンで吸収

■ 懸念点
- grants 後 cleanup 困難 — prefix + --fresh 運用
- mock 18 混在 — walkthrough でデモ作品を明示
- seed 順序ミス — verify スクリプトで grant 件数断言

■ 他案不採用
- /demo 拡張のみ — マルチペルソナ不可
- mock + LS 合成 — witness/release 非連動
- UI フィクスチャ層 — 新機能相当
- 本番 seed — リスク大

■ In / Out
- In: 設計 doc、staging seeder 案、8 ペルソナ、3 体験、既存画面
- Out: 実装、本番 UX 変更、ランキング、通知、Adoption 表示、PLAYER_VISIBLE

■ 今回変更した画面
- 該当なし（設計のみ、UI 変更なし）

■ ユーザー目線の変化
- 該当なし（未実装）

■ 注意事項
- 実装 GO 前にオーナーが doc §15 を確認
- UI 全面レビューはデモ目視後

■ 今すぐ私がやるべきこと
1. docs/future-demo-environment-design.md を読んで F0 GO
2. MVP 範囲（6 作品フル vs 4 作品短縮）を決める
3. mock 18 — レビュー時混在許容か非表示か

■ Cursorだけで完了できること
- F0 GO 後 — Seeder + verify + walkthrough 実装（staging）
- chatgpt-handoff 全量更新（実装完了時）

■ 次に検討すべきこと
- 設計 GO → F1 実装開始
- デモ完成 → UI 全面レビュー

■ ChatGPTに相談したい論点
- 6 作品 vs MVP 4 作品のどちらから着手するか
- mock 18 をデモレビュー時にどう扱うか

■ オーナー確認手順
1. future-demo-environment-design.md 全文
2. ペルソナ表・3 体験・コスト見積
3. §15 判断 5 項目 → F0 GO 返答
