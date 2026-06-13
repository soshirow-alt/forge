■ 現在の状態
migration 004 実装完了・build 成功・commit/push 済み（本番 migration / deploy は未実施）。本番 commit は push 後の HEAD。projects 1件（消えるかな？ phase=プロトタイプ→004で試作版に更新予定、status=テスター募集中）。

■ migration 004 の内容（実装済み）
projects.playable_version（default 0.1）。project_feedback.version_key + updated_at + UNIQUE(user_id,project_id,version_key)。project_devlogs.published_version。RLS：自分のFB UPDATE 可。phase プロトタイプ→試作版 UPDATE 同梱。status は触らない。

■ アプリ側（実装済み）
FB：現行 playable_version に対し投稿 or 同版編集。devlog：「新しいプレイ可能版として公開」チェック + 自由入力版名 → playable_version 更新 + published_version 保存。開発者 FB 一覧に versionKey 表示。開発の歩みは published_version があればそのラベル表示。

■ やらない（今回）
旧版 FB のプレイヤー向け履歴表示、AI要約、開発者返信、status 整理。

■ 本番適用順（必須）
1. 事前 SELECT（FB 重複確認）2. Supabase Dashboard で 004 SQL 実行 3. 確認 SELECT 4. Vercel 本番 deploy。コード deploy を migration より先にすると本番が壊れる可能性あり。

■ 事前確認 SQL（オーナーが Dashboard で実行）
SELECT user_id, project_id, COUNT(*) FROM public.project_feedback GROUP BY 1, 2 HAVING COUNT(*) > 1;
→ 0行ならそのまま 004 可。行ありなら dedupe で古い行削除（004 内蔵）だが内容確認推奨。

■ 004 SQL の場所
supabase/migrations/004_feedback_versions_and_phase_cleanup.sql
手順：docs/supabase-dashboard-migration-guide.md §004

■ Cursor vs オーナー
Cursor：コード・SQL ファイル・push まで完了。オーナー：Dashboard で事前 SELECT → 004 Run → 確認 SELECT → deploy 承認（GPT判断用メモ後）。

■ 次のステップ
1. 本レスポンス末尾の GPT判断用メモを ChatGPT に貼る 2. 承認後 Dashboard で 004 3. 確認後 deploy 指示 4. 画面確認（FB 投稿・編集、devlog 版公開、my-projects FB 一覧）

■ Cursor連携メモ
GPT には返答末尾 text ブロックの Copy を使用。
