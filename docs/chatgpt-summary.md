■ 現在の状態
- P0 Phase A〜B 実装完了。build 成功
- Phase C migration 015 は GO 待ち（SQL 草案のみ）

■ 今回実装したこと
- Phase A: /studio/projects/[id] → /projects/[id]/studio リダイレクト
- Phase A: studioProjectHref・通知 mock リンクを正本 URL に統一
- Phase B: lib/top-priorities.ts（ルールベース上位3）
- Phase B: StudioTopPrioritiesPanel を旧 studio ヘッダー直下に配置

■ 今回変更した画面
- 画面: 作品 Studio（/projects/[id]/studio）
- 画面位置: ヘッダー直下に「次に直すこと」カード（最大3件）
- 変更前: 育成サイクルのみ。優先課題の明示なし
- 変更後: バグ/気になる点/回答傾向からルールベースで最大3件表示
- 確認: ログイン済みオーナーで /projects/{id}/studio を開く
- /studio/projects/{id} は正本へリダイレクトされること

■ 変更ファイル
- app/studio/projects/[id]/page.tsx（リダイレクト）
- lib/studio-projects-v0-mock-data.ts
- lib/studio-notifications-v0-mock-data.ts
- lib/top-priorities.ts（新規）
- components/studio-top-priorities-panel.tsx（新規）
- components/project-studio-page.tsx
- docs/forge-p0-migration-015-draft.sql（Phase C 草案・未適用）
- docs/forge-p0-improvement-loop-plan.md

■ 確認 URL（preview push 後）
- /projects/{作品id}/studio — 正本（次に直すことカード）
- /studio/projects/{作品id} — リダイレクト先確認
- /studio/projects — 一覧（カードリンクは正本へ）

■ Phase C（未着手・GO 待ち）
- docs/forge-p0-migration-015-draft.sql
- RPC get_owner_version_play_stats + Studio 再プレイ人数表示
- 適用前に GPT判断用メモ推奨

■ 上位3のルール（P0）
- 優先: バグ報告 → 気になる点 → 否定的な初声集計 → 未読フォールバック
- AI なし

■ 今すぐ私がやるべきこと
- preview で /projects/{id}/studio をオーナーアカウントで確認
- Phase C migration 015 の GO 判断

■ Runしてよいか
- preview push: 可（migration なし）
- migration 015: 別途 GO 後のみ
