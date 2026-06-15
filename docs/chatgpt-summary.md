Forge ChatGPT 用サマリ — Phase2 #5 カスタム選択肢 UI 実装完了

■ 現在の状態
本番: https://forge-flame-gamma.vercel.app（71b2712 = Phase1）
Phase2 #5: コード実装済・deploy 待ち（オーナー GO 後 push + Vercel prod）
Phase1: クローズ
次: #5 本番確認 OK → #3 設計レビュー

■ 今回実装したこと（#5 のみ）
1. lib/version-prompt-form.ts
   - choiceCount + choiceOptions[]、validatePromptDrafts、buildChoiceOptionsFromLabels
   - draftFromVersionPrompt: 既存 choice 問いを options → 個別フィールド復元
   - choiceLabels は読み込み互換のみ
2. components/choice-prompt-fields.tsx（新規）
   - 選択肢数 2/3/4 select、個別 input max 40 字
   - 数を減らすと下の欄が減る説明、保存失敗時インライン赤枠
3. components/developer-choice-preview.tsx（新規）
   - 「プレイヤーにこう見える」非操作プレビュー
4. components/version-prompt-editor.tsx
   - textarea 廃止 → 上記コンポーネント、showValidation prop
5. components/project-edit-page.tsx / submit-page.tsx
   - validatePromptDrafts で保存前停止、エラー表示、submit 投稿中状態

■ 今回変更した画面
画面1: /submit、/projects/{id}/edit — プレイヤーへの問い
位置: 回答形式=カスタム選択肢時
変更前: textarea 改行入力
変更後: 選択肢数 + 個別 input + プレイヤープレビュー
確認: choice 3 個設定→保存→詳細初声 3 ボタン / 1 個のみで保存阻止

■ 含めていないこと
#3 テンプレート分離 / 自由記述 rename / #6 初声導線 / my-projects / AI / 変化を見る

■ migration
なし（DB options jsonb 不変）

■ 変更ファイル一覧
- lib/version-prompt-form.ts
- components/choice-prompt-fields.tsx（新規）
- components/developer-choice-preview.tsx（新規）
- components/version-prompt-editor.tsx
- components/project-edit-page.tsx
- components/submit-page.tsx
- docs/forge-changelog.md
- docs/phase2-5-choice-ui-design.md（設計正本）

■ build / lint
- npm run build: 成功
- 変更ファイル lint: 新規エラーなし

■ 既存 choice 問いの互換
- edit ロード: project_version_prompts.options[].label → choiceCount + choiceOptions
- レガシー choiceLabels 文字列: parseChoiceLabels で復元（読み込みのみ）
- 保存: 従来どおり options jsonb + slugify id。immutable / 集計不変

■ 本番確認手順（deploy 後）
1. edit: 既存 choice 問いを開く → 個別フィールドに復元されている
2. edit: choice 3 個（例 武器A/B/C）→ 更新 → 詳細初声に 3 ボタン
3. edit: 選択肢 1 個のみ → 保存阻止 + 「2個以上」メッセージ + 赤枠
4. submit: 新規投稿 + custom 問い choice 2 個以上 → 保存成功
5. 開発者プレビュー: 2 個以上入力で「プレイヤーにこう見える」表示
6. 選択肢数 4→3: 4 番目欄が消える（ダイアログなし）

■ submit / edit 確認
- edit: validate → saveError + showPromptValidation + isSaving
- submit: validate を投稿前に実行、promptSaveError + submitting

■ 残リスク
- deploy 前は本番未反映
- submit で game 作成後に prompt 保存失敗すると作品だけ残る（従来同様。validate は事前）
- 重複ラベルは保存可（別 option id）。意図どおり MVP
- 40 字超は input maxLength + validate 二重

■ 今すぐ私がやるべきこと
1. #5 deploy GO → push + Vercel prod
2. 上記本番確認
3. OK なら #3 設計レビューへ

■ Cursorだけで完了できること
#5 deploy / #3 設計・実装（GO 後）

■ Phase2 次ステップ
#3 テンプレート/回答形式分離 + 「自由記述」rename → #6 初声導線
