Forge ChatGPT 用サマリ — P0 作品編集「更新する」保存不具合修正

■ 現在の状態
本番 URL: https://forge-flame-gamma.vercel.app（deploy 906b84d）
DB: migration 006+007 適用済み（オーナー確認済み）
P0 不具合: 作品編集で問い設定後「更新する」が無反応 — 原因特定・修正済み（ローカル build OK、本番 deploy 待ち）
UX 改善 7 論点: 整理済み。P0 修正後 Phase1（#2 #4 #7）着手はオーナー GO 待ち
npm run build: 成功（2026-06-15）
npm run lint: 既存 eslint エラー 22 件（本修正ファイルに新規 lint なし）

■ 今回実装したこと（P0）
1. 根本原因
   - 作品詳細を誰かが閲覧すると fetchVersionPrompts → ensure_platform_default_prompt が DB に source=platform_default, sort_order=0 の行を作成
   - 開発者が /projects/{id}/edit で「自分で問いを設定」→ saveDeveloperVersionPrompts が developer 問いを sort_order=0 で INSERT
   - unique index project_version_prompts_sort_idx（archived_at IS NULL 時の project_id+version_key+sort_order）が衝突
   - handleSubmit に try/catch がなく Promise reject が無視され、画面上は「ボタンが効いていない」ように見える
2. 修正（lib/supabase/voice-engagement.ts）
   - 開発者問いを 1 件以上保存する直前に、同一版の active platform_default 行を archived_at で履歴化してから INSERT/UPDATE
   - 開発者カスタム問いがデフォルト問いを置き換える原典意図とも整合
3. 修正（components/project-edit-page.tsx）
   - isSaving / saveError 状態を追加
   - try/catch/finally で updateProjectDetails → saveDeveloperVersionPrompts → router.push をラップ
   - カスタムモードで sanitize が空（選択肢不足等）のときユーザー向けメッセージ
   - ボタン disabled + 「保存中...」表示、role=alert のエラー枠

■ 調査チェックリスト結果（オーナー依頼 10 項目）
1. disabled — 修正前は disabled なし。修正後は保存中のみ disabled
2. submit 発火 — 発火していた（HTML5 ブロックではない）
3. updateProjectDetails — 呼ばれていた（プロジェクト情報は更新されていた可能性）
4. saveDeveloperVersionPrompts — 呼ばれていたが unique 違反等で throw → 遷移しない
5. validation — choice 2 未満は sanitize で除外（今回エラー表示を追加）
6. immutable — 今回の主因ではない（初回 INSERT 段階で失敗）
7. Supabase — duplicate key / unique constraint 相当のエラー
8. Network/console — 未捕捉の Promise rejection（UI 無反応）
9. ローカル再現 — コード解析で再現条件確定（詳細閲覧後に編集で問い保存）
10. env/RLS — RLS ではなく DB 制約。migration 追加不要

■ 今回変更した画面
画面: 作品編集 /projects/{id}/edit
位置: フォーム最下部「更新する」ボタン直上
変更前: 保存失敗時無反応。成功時のみ詳細へ遷移
変更後: 保存中ラベル、失敗時赤枠エラー、成功時は従来どおり詳細へ
プレイヤー視点: 開発者が問いを設定できない状態が解消
開発者視点: 保存の成功/失敗が分かる
確認手順: 下記「本番確認手順」参照

■ ユーザー目線の変化
- 作品編集でプレイヤーへの問いを設定して「更新する」→ 保存され作品詳細へ戻れる
- 失敗しても「何も起きない」ではなく理由が画面に出る

■ 注意事項
- 本修正はコード deploy のみ。Supabase migration 追加不要
- 906b84d 本番にはまだ未反映。push + Vercel prod deploy 後に再確認
- 既存 lint エラー（react-hooks/set-state-in-effect 等）は別件・本 P0 では触らない

■ なぜこの設計
- platform_default は「開発者未設定時のフォールバック」。開発者がカスタム問いを保存した時点で DB 上のデフォルト行は不要 → archive が正
- 物理削除は immutable 方針と集計履歴の観点から避ける
- 他案: sort_order を developer 用に 1 から振る — 衝突回避になるがデフォルト行が残りプレイヤー側で二重問いのリスク
- 他案不採用: unique index 変更 — migration 要・影響大

■ In / Out
In: save 前 archive platform_default、編集画面エラー UX
Out: P1 UX（プレビュー/用語/深いFB欄）、P2/P3 論点、submit 画面の同等エラー UX（必要なら次タスク）

■ リスク
- 低: archive 後 ensure_platform_default が再度行を作るが、developer 問いがある限り fetchVersionPrompts は developer 優先で問題なし
- 開発者が「デフォルト問いを使う」に戻した場合: developer 行は archive、platform_default は ensure で再作成（既存挙動）

■ 今すぐ私がやるべきこと
1. 本修正を main に merge / deploy（Vercel prod）
2. 本番確認手順を実行（下記）
3. P0 OK なら Phase1（#2 #4 #7）の GO/NG を返す

■ Cursorだけで完了できること
- deploy 後の docs 更新
- Phase1 UX 実装（オーナー GO 後）
- submit 画面への同等 save エラー UX（任意）

■ 次に検討すべきこと（UX Phase1 案 — オーナー優先順位準拠）
P1: #2 デフォルト問いプレビュー / #4 「1行入力」→「自由記述（短文）」/ #7 深いFB自由記述欄（migration 要検討）
P2: #3 テンプレートと回答形式分離 / #5 カスタム選択肢UI（個別フィールド）/ #6 プレイ後初声導線
P3: #1 my-projects 育成ハブ本格改善

■ 本番確認手順（deploy 後）
1. ログイン（開発者）→ 既存作品の詳細 /games/{id} を一度開く（platform_default 行が存在しうる状態）
2. /projects/{id}/edit → 「自分で問いを設定」→ 問い 1 件（はい/いいえで可）入力
3. 「更新する」→ 「保存中...」→ 作品詳細へ遷移すること
4. 詳細下部「vX.X への返事」に設定した問いが表示されること
5. Supabase Table Editor: project_version_prompts に source=developer の active 行。platform_default は archived_at 付き
6. 意図的にカスタム選択肢 1 個だけ → 保存 → 赤枠エラー（無反応ではない）

■ deploy 可否
コードのみ・migration 不要 → deploy 可（オーナー Run 判断で push + Vercel prod）

■ ChatGPTに相談したい論点
P0 本番確認 OK 後、Phase1 を #2+#4+#7 の 3 点セットで GO してよいか
#7 自由記述欄の DB 列名（other_notes 等）を Phase1 で入れるか Phase2 まで待つか
