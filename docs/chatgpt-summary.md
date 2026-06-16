■ 現在の状態
- 正式版 Phase 1 実装完了 — npm run build PASS
- migration 013 — SQL 正本済み、Dashboard 適用はオーナー（staging）
- プレイ履歴 Phase 1 — main 反映済み
- PLAYER_VISIBLE=false 維持
- 優先順位更新: 正式版 → 見届け人 → 伴走者 → 育成者 → Phase1b

■ 今回実装したこと
- supabase/migrations/013_project_release_events.sql
- projects.release_status — in_development / released / release_reopened
- project_release_events — append-only（released / release_reopened）
- lib/project-release-state.ts — 状態判定・バリデーション・見届け人土台 wasActiveBeforeFirstRelease
- lib/supabase/project-release-events-db.ts
- components/project-release-studio-panel.tsx — Studio Released / Reopened
- components/official-release-section.tsx — マイページ #official-release
- lib/player-play-timeline.ts — release イベント + 「正式版到達を見届けた」サマリ
- games-provider — declareProjectReleased / declareProjectReleaseReopened
- docs/official-release-phase1-verification.md

■ DB設計（レビュー用）
- 正本: project_release_events（immutable 積み上げ）
- 現在状態: projects.release_status（イベント INSERT 時に同期）
- event_type: released | release_reopened
- semver 不使用。Forge 品質審査なし
- Released 条件: devlog 1+ / playable_version あり / 開発者明示
- DELETE/UPDATE なし — Reopened 後も初回 Released 行は残る

■ Studio UI（レビュー用）
- /projects/[id]/studio #official-release
- 現在状態バッジ: 開発中 / 正式版 / 正式版再調整中
- Released ボタン — 正式版として宣言
- Release Reopened ボタン — 正式版再調整（released 中のみ）
- イベント履歴リスト（日時 + メモ）
- ヘッダーにも release_status 表示

■ プレイヤー側体験（レビュー用）
- /mypage #official-release — プレイした作品のうち一度でも Released されたもの
- 初回 Released 日、現在状態、イベント件数
- /mypage #play-history — release 行が時系列に混在
- 初回 Released 前にプレイ済みならサマリ「正式版到達を見届けた」
- 見届け人バッジ付与は今回 Out（データ構造のみ）

■ Release Reopened 挙動
- released → release_reopened イベント INSERT + status 更新
- マイページ一覧からは消えない（hasEverReachedOfficialRelease）
- 再 Released で released イベント追加 — 履歴 3 行例: released → reopened → released
- 見届け人は将来「初回 released 前の参加者」— Reopened でも剥奪しない設計

■ プレイ履歴との接続
- buildPlayHistoryTimelineEvents に releaseEvents
- getFirstReleasedEvent + firstPlayedAt 比較で reachedOfficialRelease
- 将来見届け人: wasActiveBeforeFirstRelease(firstPlayedAt, firstReleasedAt)

■ build結果
- npm run build — PASS（2026-06-16）

■ staging確認
- 手順: docs/official-release-phase1-verification.md
- 013 Dashboard 適用 → Studio Released/Reopened → マイページ目視
- Cursor は Dashboard SQL 実行不可 — オーナー適用後に目視

■ 今回変更した画面
- Studio 正式版パネル — /projects/[id]/studio #official-release
- マイページ 正式版に到達した作品 — /mypage #official-release（プレイ履歴の下）
- マイページ プレイ履歴 — release 行 + サマリ行追加

■ ユーザー目線の変化
- 開発者: Forge 最大マイルストーン「正式版」を自分で宣言できる
- プレイヤー: 育てた（プレイした）作品が正式版に到達した事実をマイページで辿れる
- 「俺が育てたゲームが正式版になった」土台 — バッジは次フェーズ

■ In / Out
- In: 013、Studio、マイページ基盤、プレイ履歴 release 連携、build PASS
- Out: 見届け人付与、バッジ、PLAYER_VISIBLE、通知強化、ランキング、Phase1b

■ 今すぐ私がやるべきこと
- Supabase Dashboard で 013 適用（staging）
- Studio で Released → Reopened → 再 Released 目視
- 別アカウントでプレイ後、/mypage #official-release と #play-history 目視

■ 次に検討すべきこと
- staging 目視 GO 後 main 反映（コードは push 待ち）
- 見届け人 Phase — release_events + play_sessions + voice 合成

■ ChatGPTに相談したい論点
- 正式版到達後の作品詳細バッジ表示タイミング（Phase1b vs 見届け人と同時）

■ なぜこの設計にしたか
- イベント積み上げは Reopened 後も「見届けた事実」を消さない原典方針と一致
- release_status 列は UI 高速化の denormalize（events が正本）
- マイページは played ∩ ever_released — watch のみユーザーは対象外（プレイ履歴方針と一致）

■ 他案を採用しなかった理由
- semver 1.0 自動 Released — オーナー確定 NG
- 履歴 DELETE で Reopened — 育成履歴消滅 NG

■ リスク
- 013 未適用時: graceful empty（Studio パネルは読み込みのみ / 宣言不可）
- 本番 DB が staging と別なら本番でも 013 必要

■ オーナーが確認する手順
1. 013 SQL 実行
2. devlog あり作品で Released
3. project_release_events 行確認
4. Release Reopened → status 正式版再調整中
5. プレイヤー /mypage で正式版到達作品表示
