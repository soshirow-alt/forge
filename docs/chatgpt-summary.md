Forge ChatGPT 用サマリ — UX Phase1 実装（問いプレビュー / 自由記述 / other_notes）

■ 現在の状態
本番 URL: https://forge-flame-gamma.vercel.app（commit 6576b21 = P0 deploy 済）
UX Phase1: コード実装済み・本番 deploy / migration 008 適用はオーナー作業待ち
P0 保存不具合: オーナー本番確認 OK → クローズ
DB: 006+007 適用済み。008 はリポジトリに SQL あり（Dashboard 適用待ち）
npm run build: 成功（2026-06-15 ローカル）

■ Forge原典コアループ（判断の基準）
プレイヤー: 発見→プレイ→声を届ける→変化を見る→再プレイ
Phase1 は「作りやすさ・届けやすさ」の改善。初声/2層/非公開/集計思想は不変

■ 今回実装したこと（UX Phase1 — 3点）
1. デフォルト問いプレビュー
   - 新規: components/default-version-prompt-preview.tsx
   - VersionPromptEditor で mode=none 時に「もう一度遊びたい？」+ 3 選択肢をプレビュー表示
   - /submit と /projects/{id}/edit の両方（VersionPromptEditor 共有）
2. 「1行入力」→「自由記述（短文）」
   - lib/version-prompt-form.ts: 開発者向けラベル・hint 変更（response_kind=short_text は DB 値据え置き）
   - components/voice-prompt-card.tsx: プレイヤー UI を input → textarea 3行、placeholder「短く自由に入力」
   - maxLength 200 は維持
3. 「もっと詳しく伝えたい」自由記述欄
   - migration 008: project_feedback.other_notes (text, nullable)
   - components/game-deep-feedback-form.tsx: 「その他・自由に伝えたいこと」欄追加
   - lib/game-feedback-storage.ts / user-engagement.ts / feedback-display.ts: 保存・開発者表示対応
   - 初声ではなく深い改善材料（任意）側のみ

■ 今回変更した画面
画面1: 作品投稿 /submit、作品編集 /projects/{id}/edit
位置: 「プレイヤーへの問い」セクション、「デフォルト問いを使う」選択時
変更前: ラジオのみで中身不明
変更後: 問い文 + 3 選択肢のプレビュー（オレンジ枠）
確認: デフォルト選択 → プレビュー表示 / カスタム選択 → プレビュー非表示

画面2: 作品詳細 /games/{id} — 初声「vX.X への返事」
位置: 開発者が short_text 問いを設定した場合の回答欄
変更前: 1行 input、「1行で入力」
変更後: textarea 3行、「短く自由に入力」
確認: 開発者が自由記述（短文）問いを設定 → プレイヤー側 textarea

画面3: 作品詳細 — 「もっと詳しく伝えたい」（GameDeepFeedbackForm）
位置: 良かった点/気になった点/バグの下
変更前: 3 項目のみ
変更後: 「その他・自由に伝えたいこと」textarea 追加
確認: 008 適用後に入力→保存→my-projects FB 表示に「その他」行

■ 今回やらなかったこと（Phase2以降）
- 質問テンプレートと回答形式の大規模分離（#3）
- カスタム選択肢 UI 個別ボックス化（#5）
- プレイ後初声導線の大幅変更（#6）
- my-projects 育成ハブ本格改善（#1）
- AI 集約 / 変化を見る UI

■ migration 008
ファイル: supabase/migrations/008_feedback_other_notes.sql
内容: ALTER TABLE project_feedback ADD COLUMN other_notes text
RLS 変更なし（既存 owner-only SELECT 継続）
チェックリスト: docs/supabase-post-migration-checklist.md §9 追加

■ 変更ファイル一覧
- components/default-version-prompt-preview.tsx（新規）
- components/version-prompt-editor.tsx
- components/voice-prompt-card.tsx
- components/game-deep-feedback-form.tsx
- lib/version-prompt-form.ts
- lib/game-feedback-storage.ts
- lib/supabase/user-engagement.ts
- lib/supabase/schema.ts
- lib/feedback-display.ts
- supabase/migrations/008_feedback_other_notes.sql（新規）
- docs/forge-changelog.md
- docs/supabase-post-migration-checklist.md §9

■ build / lint
- npm run build: 成功
- npm run lint: 既存 repo 全体エラー 22 件（Phase1 変更ファイルに新規 lint なし）

■ 残リスク
- 008 未適用のまま other_notes 保存 → Supabase エラー（深いFB フォームに赤枠エラー表示を追加済み）
- 008 適用前に Phase1 コードだけ deploy すると other_notes 欄は表示されるが保存時エラー表示
- short_text の DB 値 short_text は不変（集計 RPC 影響なし）

■ 本番確認手順（deploy + 008 適用後）
A. migration 008
1. Supabase Dashboard SQL Editor → 008 SQL Run
2. Table Editor → project_feedback に other_notes 列

B. デフォルト問いプレビュー
1. /projects/{id}/edit → 「デフォルト問いを使う」
2. 「もう一度遊びたい？」+ 3 選択肢プレビューが見える

C. 自由記述（短文）
1. edit で問い 1 件・回答形式「自由記述（短文）」→ 保存
2. 別アカウントで詳細 → 初声 textarea（3行）で回答

D. other_notes
1. プレイ後「もっと詳しく伝えたい」→ その他欄に入力 → 送信
2. 開発者 my-projects / FB 受信箱に「その他・自由に伝えたいこと」表示

■ 次に進むべき Phase2 案（オーナー優先順位準拠）
P2-1: #3 質問テンプレートと回答形式の分離（VersionPromptEditor 再設計）
P2-2: #5 カスタム選択肢 UI — 選択肢数 + 個別入力フィールド
P2-3: #6 プレイ後初声導線 — 右サイド / プレイ後 CTA / アンカー / 初声完了状態（プレイ前 FB は不可）
P3: #1 my-projects 育成ハブ IA 本格改善

■ 今すぐ私がやるべきこと
1. Phase1 コード deploy（Vercel prod）の GO
2. migration 008 Dashboard 適用
3. 上記本番確認 A〜D

■ Cursorだけで完了できること
- Phase1 deploy（GO 後）
- 深いFB 保存エラー UX（008 未適用時の表示）
- Phase2 各項目の実装

■ deploy 可否
コード deploy: 可（008 なしでもプレビュー・用語・textarea は動作）
other_notes 保存: 008 適用必須

■ ChatGPTに相談したい論点
Phase1 deploy と 008 適用を同時に行うか（推奨: 同時）
Phase2 の着手順 — #6 導線 vs #5 選択肢 UI どちらを先にするか
