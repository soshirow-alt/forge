■ 現在の状態
- 正式版 Phase 1 — main 41608b6 反映済み、build PASS
- migration 013 — **staging 未適用**（service role で確認）
- PLAYER_VISIBLE=false 維持

■ 今回実施したこと（staging 確認）
- service role で 013 適用状態を確認 → project_release_events 不存在
- Supabase Dashboard へブラウザ遷移 → **ログイン画面で停止**（Cursor から DDL 実行不可）
- scripts/official-release-staging-verify.ts 追加
- npm run verify:official-release:staging / :flow 追加

■ 013 適用結果
- 状態: **未適用**
- 確認方法: verify スクリプト + `Could not find the table 'public.project_release_events'`
- 適用方法: Dashboard SQL Editor に `supabase/migrations/013_project_release_events.sql` を Run
- プロジェクト: bpnisgzxuwdxelhnduuf（.env.local と同じ）

■ Released / Reopened / 再 Released（DB）
- 013 未適用のため **未実行**
- 013 適用後: `npm run verify:official-release:staging:flow` で自動検証
  - released → release_status=released
  - release_reopened → release_status=release_reopened
  - 再 released → release_status=released
  - events 3 行以上 + 見届け人候補ユーザー出力

■ DB行の状態
- 現時点: project_release_events テーブルなし
- projects.release_status 列なし
- 012 project_play_sessions — 適用済み（プレイ履歴 staging 目視済み）

■ Studio UI / マイページ UI
- 013 未適用のため Released 宣言は DB エラー
- UI コードは main 反映済み — **013 適用後に目視**

■ build結果
- npm run build — PASS（Phase 1 実装時確認済み、今回変更は verify スクリプトのみ）

■ 初回 Released 前プレイ — 「正式版到達を見届けた」
- ロジック: lib/project-release-state.ts wasActiveBeforeFirstRelease
- プレイ履歴サマリ: firstPlayedAt <= firstReleasedAt で表示
- 013 + flow 実行後、verify スクリプトが witness 候補ユーザーをログ出力
- UI 目視は 013 適用後

■ 今すぐ私がやるべきこと
1. Supabase Dashboard ログイン → SQL Editor → 013 Run（1 回）
2. ターミナル: npm run verify:official-release:staging:flow
3. Studio / マイページ 目視（手順 docs/official-release-phase1-verification.md）
4. 013 適用 + 目視 GO 後 — 見届け人 Phase 設計レビューへ

■ 次に検討すべきこと
- 見届け人 Phase — 初回 Released 前の参加者。条件（1回プレイのみ vs 声/複数版/watch）は設計レビュー

■ In / Out
- In: 013 状態確認、verify スクリプト、Dashboard 手順
- Out: 013 Dashboard 適用、UI 目視、見届け人実装

■ ChatGPTに相談したい論点
- 見届け人最低条件 — 1回プレイのみでよいか / 声 or 複数版必須か

■ オーナーが確認する手順（013 適用後 5 分）
1. npm run verify:official-release:staging → PASS
2. npm run verify:official-release:staging:flow → PASS + witness ログ
3. Studio Released → Reopened → 再 Released 目視
4. プレイヤー /mypage #official-release と #play-history 目視
