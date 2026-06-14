Forge ChatGPT 用サマリ — immutable GO / 本番適用フェーズへ

■ 現在の状態
本番 URL: https://forge-flame-gamma.vercel.app
immutable 修正 + E2E 2観点整理: オーナー GO
コード: 開発者問い UI + 初声 + みんなの声 + immutable save/集計 実装済み
build: 成功済み
次: Dashboard 006→007 連続適用 → §8/§8f → deploy → AI集約 → 変化を見る

■ Forge原典コアループ（判断の基準）
発見→プレイ→声を届ける→変化を見る→再プレイ
今回フェーズ: voice/prompt 履歴整合は GO — 本番 migration + E2E の段階

■ オーナー GO（確定）
immutable 設計（006 不変 + 007 RPC / 回答済み immutable / archived+回答あり集計表示）
E2E 2観点: (1) 回答済み active 問い削除 (2) 回答済み問い文言変更 — edit UI と整合

■ 今回反映（ドキュメント）
§8 見出しを「006 + 007」に統一し、006 のみ適用禁止を明記

■ 今すぐ私がやるべきこと
1. Supabase Dashboard: 006 Run → 直後に 007 Run（連続必須）
2. docs/supabase-post-migration-checklist.md §8 / §8f E2E
   - 観点1: 回答済み active 問いを edit から削除 → 集計残る
   - 観点2: 文言変更 → 旧 archived + 新 insert → 旧集計残る
3. 問題なければ Vercel deploy（forge プロジェクト）
4. 次 Cursor テーマ: AI集約 → 変化を見る

■ 注意事項
007 未適用のまま 006 だけ → archived 問いの集計が消える（本番で immutable が効かない）
観点1と2は同一問いで連続不可（2の後は旧問いが edit に出ない）— 順序 or 別作品
006+007 本番確認完了後: chatgpt-handoff.md 全量更新トリガー該当

■ Cursorだけで完了できること
deploy 後: AI集約（DeveloperVoiceInsights / ルール→将来 LLM）
変化を見る UI（devlog × 版別声の傾向）
growth hub と voice_responses の段階統合

■ 次に検討すべきこと
AI集約の入力（版別集計のみ・個別非公開維持）
変化を見る: プレイヤーが「声が育ちに繋がった」を devlog/新版で確認する UI

■ オーナー確認手順（migration 後・5分）
Table Editor: project_version_prompts / project_voice_responses 存在
§8f 観点1 or 2 どちらか1本 + みんなの声に旧問い集計が残ること
