Forge ChatGPT 用サマリ — studio voice 中心化 実装完了

■ 現在の状態
- 本番: commit 431cd4f（https://forge-flame-gamma.vercel.app）— voice 中心化はローカル実装済み・未 commit / 未 deploy
- DB migration: 今回なし（006 voice テーブル既存。008 other_notes はオーナー完了扱い）
- オーナー判断: studio / project-growth-state を voice 中心へ GO（2026-06-15）
- 原典整合: 初声=project_voice_responses / 詳しい感想=project_feedback（任意）/ studio 主役=プレイヤーの回答

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- 今回は開発者側「回答を見る → 改善」の入口を voice（初声）に揃え、structured feedback を副材料に降格

■ 今回実装したこと
1. lib/project-growth-state.ts
   - buildProjectGrowthSnapshot の入力を ProjectVoiceNurtureSignal に変更
   - no_feedback: 現行版 voice 0件（詳しい感想があっても voice なしなら回答待ち）
   - feedback_pending: isVoicePendingDevlog（voice 最新 created_at > devlog date）
   - totalVoiceResponseCount: 現行版の project_voice_responses 件数
   - latestFeedbackId 削除（読了は playableVersion 単位）
   - filterDeepFeedbackForVersion 追加（詳しい感想フィルタ用）

2. lib/supabase/voice-engagement.ts
   - fetchOwnerVoiceNurtureSignal / fetchVoiceNurtureSignalsForProjects
   - fetchOwnerVoiceResponseDetails（studio 折りたたみ個別行用）

3. lib/project-voice-nurture.ts（新規）
   - ProjectVoiceNurtureSignal 型、resolveVoiceSignalForGame

4. 読了 localStorage
   - project_voice_reads:{projectId}:{playableVersion}
   - voiceReadStore / useNurtureVoiceRead（旧 feedbackId キーは非使用）

5. studio UI 分離（game-growth-cycle.tsx）
   - 主セクション: プレイヤーの回答（DeveloperVoiceInsights + 件数）
   - 副セクション: NurtureDeepFeedbackSection（詳しい感想・任意）
   - read パネル: voice 読了 + 折りたたみ個別行 + 詳しい感想
   - 公開詳細には個別 voice 行を出さない（変更なし）

6. my-projects / ProjectListCard
   - voice signals で growth 再計算・ソート
   - カードに「回答 N件」表示

7. games-provider
   - getOwnedProjectVoiceSignals / getOwnerVoiceResponseDetails

■ 今回変更した画面
- 作品育成 /projects/{id}/studio
  - 画面位置: ヘッダー下 GameGrowthCycle 全体
  - 変更前: structured feedback が read パネル主。voice 0件でも詳しい感想があれば反応あり扱いにならず、逆に voice 100件でも feedback 0で「反応なし」
  - 変更後: 「プレイヤーの回答」セクションが主（集計・解釈）。其下に「詳しい感想（任意）」。ヘッダーに回答件数
  - 開発者視点: 初声100/詳しい感想0 → 「回答100件」と pending CTA
  - 確認: ログイン → my-projects → この作品を育てる → 回答件数・集計・read パネル

- 開発マイページ /my-projects
  - 画面位置: 作品一覧 ProjectListCard
  - 変更前: growth が project_feedback のみ参照
  - 変更後: voice 件数・次アクション（回答を見る/回答を待つ）が voice ベース
  - 確認: voice がある作品で「回答 N件」「新しい回答」バッジ

■ ユーザー目線の変化
- 開発者: Forge原典どおり「プレイヤーの回答」が studio の主役。詳しい感想は追加材料
- 開発者: 初声だけ届いた状態でも育成サイクルが回り始める（反応なし表示の解消）
- プレイヤー: 変更なし（公開詳細に個別回答は出さない）

■ なぜこの設計にしたか
- 原典: プレイヤー主導線=初声（voice）、詳しい感想=任意
- 旧実装は project_feedback を growth/read の主データにしており、100 voice / 0 structured で「反応なし」になる矛盾があった
- 読了を version 単位にしたのは、voice は版ごとに届くため。DB 化前の localStorage でも意味が通る

■ 他案を採用しなかった理由
- voice と project_feedback を1テーブルに統合: 今回 Out（migration 不要方針）
- 初声を project_feedback に寄せる: 原典と逆
- 読了を feedback UUID のまま: voice 版単位と整合しない
- 個別 voice 行を studio 主表示: 原典上 集計・解釈優先。折りたたみ副次に

■ In / Out
In:
- project-growth-state voice 化
- studio 主/副 UI 分離
- 読了 localStorage を projectId+playableVersion
- pending = voice 新着 > devlog
- my-projects 整合

Out（オーナー指定）:
- DB migration / テーブル統合
- nurture_reads Supabase 化
- 通知 DB 化 / RLS 変更
- 個別回答の公開 / AI 集約

■ 注意事項
- 旧 project_feedback_reads キーの読了は引き継がれない（新キー project_voice_reads）
- improvement メモも playableVersion キーに変更（サイクル単位）
- 未 commit。deploy 前にオーナー確認推奨

■ build / lint
- npm run build: 成功（Next.js 16.2.9 TypeScript OK）
- npm run lint: リポジトリ既存の react-hooks/set-state-in-effect 等で exit 1。今回追加ファイルに新規致命エラーなし

■ migration 有無
- なし

■ 今すぐ私（オーナー）がやるべきこと
1. ローカル or preview で /projects/{id}/studio を開き、voice あり / なし / 詳しい感想のみ の3パターン確認
2. 問題なければ commit + push を指示（本番 deploy）
3. 本番で同一3パターン再確認

■ Cursorだけで完了できること
- commit / push（オーナー指示後）
- nurture 読了 Supabase 化（009）
- 通知 DB 化
- studio UX 微調整（copy / 折りたたみ初期状態）

■ 残リスク
- 旧読了 localStorage 非移行 → 同一版で「新しい回答あり」が再表示されうる
- voice と devlog の日時比較は created_at vs devlog.date — タイムゾーン・精度差で edge case の可能性
- my-projects は voice signals のみ待機（feedback 読込不要に変更）— studio 側は両方待機
- lint ルールと既存 useEffect setState パターンの共存（build は通る）

■ 次に検討すべきこと
- nurture 読了 Supabase 化（009）
- 開発者向け「新しい回答」通知の DB 化
- voice 到着時の studio 深リンク / 通知連携

■ ChatGPTに相談したい論点
- 読了を version 単位にした場合、新版公開後の「未読」UX が十分か
- 詳しい感想 0 件時に studio 副セクションを折りたたみ初期 closed にするべきか

■ 変更ファイル一覧
- lib/project-growth-state.ts
- lib/project-voice-nurture.ts（新規）
- lib/supabase/voice-engagement.ts
- lib/feedback-voice-summary.ts
- lib/nurture-persistence/local-storage-keys.ts
- lib/nurture-persistence/voice-read-local.ts（新規）
- lib/nurture-voice-read-store.ts（新規）
- hooks/use-nurture-feedback-read.ts
- hooks/use-owned-project-voice-signals.ts（新規）
- components/games-provider.tsx
- components/game-growth-cycle.tsx
- components/project-studio-page.tsx
- components/my-projects-page.tsx
- components/project-list-card.tsx
- components/developer-voice-insights.tsx
- components/nurture-deep-feedback-section.tsx（新規）
- components/owner-voice-response-list.tsx（新規）
- components/nurture-feedback-voice-summary.tsx（re-export）
- docs/forge-changelog.md
- docs/forge-handoff.md
- docs/chatgpt-summary.md
