Forge ChatGPT 用サマリ — IA 一括実装（#6b / 育成ハブ / #3）

■ 現在の状態
- 本番: https://forge-flame-gamma.vercel.app（commit 17b4243 / deploy dpl_HPschPwXLzsNwG1xeYfQq6VmbJr4 — Ready）
- Phase2 #5: クローズ
- Phase2 #6 旧案（Banner/embed/sticky）: 不採用・削除済み
- Phase2 #6b / IA 一括: **本番 deploy 済み**（2026-06-16）。オーナー本番確認待ち
- DB migration: なし（response_kind / short_text 維持）

■ Forge原典コアループ（判断の基準）
- プレイヤー: 発見 → プレイ → 声を届ける → 変化を見る → 再プレイ
- 開発者: 投稿 → 育成 → 声を見る → 改善 → 再公開
- 今回はループに沿って IA を整理。レビューサイト化・アンケート化・入口乱立を避けた

■ 今回実装したこと（deploy 完了）
- commit 17b4243 → main push → Vercel production Ready
- deploy URL: https://forge-flame-gamma.vercel.app
- deployment ID: dpl_HPschPwXLzsNwG1xeYfQq6VmbJr4
- build ID: bld_43wi4uizb
1. #3 質問テンプレートと回答形式の分離（lib/version-prompt-form.ts + version-prompt-editor.tsx）
   - 回答形式: はい/いいえ / 3段階 / 選択式 / 自由記述（replay_intent は形式一覧に出さない）
   - テンプレート: もう一度遊びたい？ / チュートリアル / 難易度 / カスタム
   - 「もう一度遊びたい？」はテンプレートのみ。形式は 3択（replay_intent）として内部維持
2. 「自由記述（短文）」→ 表示「自由記述」。voice-prompt-card に 200文字以内補足
3. #6b プレイ後オーバーレイ（post-play-voice-overlay.tsx + game-detail-page-client.tsx）
   - 削除: PostPlayFeedbackBanner / PostPlayVoiceStickyCta
   - 入口: プレイ直後オーバーレイ + 後から sidebar「声を届ける」のみ
   - sessionStorage で × / あとで dismiss。1問回答で初声完了
4. 詳細ページ開発者導線（game-detail-sidebar.tsx）
   - プレイヤー CTA ブロックと開発者ブロック分離
   - 作品を育てる（primary）/ 開発マイページへ / 編集する（secondary）
5. Phase3 育成ハブ（my-projects-page.tsx + project-nurture-actions.tsx + project-growth-card.tsx）
   - 開発マイページ → 作品一覧 → やること一覧（5リンク）
6. ヘッダ nav「開発ダッシュボード」→「開発マイページ」

■ 今回変更した画面
- 作品詳細 /games/{id}
  - 画面位置: main 列から Banner・常時 embed 初声・sticky bar を撤去。右 sidebar はプレイ CTA 群と開発者ブロックを上下分離
  - 変更前: プレイ後に main 上部 Banner + フォーム + sidebar 返事 CTA が重複
  - 変更後: プレイ直後は画面下部オーバーレイ（開発者から質問があります / 先頭問い / 声を届ける / あとで）。main は Overview→説明→みんなの声→開発の歩み。初声完了後のみ main に「声を届けました」+ 深い FB 折りたたみ
  - プレイヤー: 操作強制なし。閉じても sidebar から再開可
  - 開発者（自分作品）: 編集 primary 廃止。sidebar 下部に育成導線のみ
  - 確認: 未ログイン→詳細閲覧 OK / ログイン→プレイ→オーバーレイ / ×→sidebar から回答 / 1問送信→完了表示
- 開発マイページ /my-projects
  - 画面位置: タイトル下コピー + 各 ProjectGrowthCard 内に「やること一覧」
  - 変更前: 作品一覧 + FB 寄り UI
  - 変更後: 育成ハブ copy + 5 アクション（声を見る / 問い設定 / devlog / 編集 / プレイヤー向けページ）
  - 確認: ?focus={id} で該当作品へスクロール + やることリンク先
- 問い設定 /submit および /projects/{id}/edit#version-prompts
  - テンプレート select と回答形式 select（カスタム時のみ）を分離
  - 確認: もう一度遊びたい？選択で形式は読取表示、カスタムで自由記述選択→200文字ヒント

■ ユーザー目線の変化
- プレイヤー: 「どこで声を届けるか」がオーバーレイ→sidebar の 2 点に収束。main を読みやすく
- 開発者: 自分作品の詳細はプレイヤー視点。次の行動は開発マイページのやること一覧から選べる
- 問い設定: テンプレートと形式の混同（もう一度遊びたい？が形式に見える）を解消

■ なぜこの設計か
- 本番 #6 確認で「入口追加 = ノイズ」と判断。IA を先に整えてから微修正する方針に合わせた
- オーバーレイは aria-modal=false・背景操作可。原典「modal で阻まない」と整合
- replay_intent を形式一覧から外し、テンプレート経由のみにすることで #3 の意味的分離を UI に反映

■ 他案不採用
- #6 現行（Banner + embed + sticky）の微修正: 入口数が減らない
- main 1 ブロック常時 embed: オーナー IA 判断と不一致
- 開発者「編集する」をプレイ CTA 横に維持: プレイヤー向け詳細の責務と混在

■ In / Out
- In: #6b オーバーレイ / sidebar 単一入口 / 育成ハブ / #3 UI 分離 / 自由記述 rename / 開発者詳細分離
- Out: AI 集約 / 変化を見る UI / devlog↔声リンク / SDK / 高度分析 / migration

■ 注意事項
- 本番 deploy 済み。オーナーが 11 観点をまとめて確認中
- オーバーレイ dismiss は sessionStorage（タブ単位）。再プレイで overlay 再表示
- lint: 既存 62 errors（react-hooks/set-state-in-effect 等）。今回 diff 起因ではない

■ 今すぐ私がやるべきこと
- 本番 11 観点の確認（オーナー実施）
- GO なら Phase2 #6b クローズ扱い。残リスクは必要なら追加修正

■ Cursorだけで完了できること
- commit / push（オーナー GO 後）
- 用語残存 sweep（game-feedback 深い FB レガシー等）
- 専用 /projects/{id}/studio URL（将来）

■ 本番確認手順（オーナー）
1. /games/{公開作品} 未ログイン: プレイ CTA のみ、オーバーレイなし
2. ログイン→プレイ: 下部オーバーレイ（先頭問い / 声を届ける / あとで / ×）
3. × または あとで: main に初声フォームなし。sidebar「声を届ける」でフォーム
4. 1 問だけ回答→送信: 初声完了。sidebar「声を届けました ✓」。main に完了 + 深い FB 任意
5. 自分作品の詳細: sidebar 開発者ブロック（作品を育てる / 開発マイページ / 編集 secondary）。プレイ CTA 横に編集なし
6. /my-projects: 開発マイページ + やること一覧 5 リンク
7. /projects/{id}/edit#version-prompts: テンプレート/形式分離、自由記述ラベル

■ 残リスク
- 初回 load で hidden GameVoiceSection が二重 mount する瞬間（pending 時）。体感問題なければ許容
- voice_complete ユーザーが再訪時、オーバーレイは出ない想定 — 要確認
- ヘッダ以外に「開発ダッシュボード」文言が submit/mypage に残存

■ まだ残る IA 課題
- 変化を見る（プレイヤーサイクル 4 段目）UI 未実装
- 作品専用 studio URL（現状 my-projects?focus=）
- devlog と声の明示リンク
- AI 集約・高度分析
- /mypage と /my-projects の役割説明（プレイヤー vs 開発者）を onboarding レベルで強化

■ ChatGPTに相談したい論点
- 本番確認後の次 1 位: 変化を見る UI vs devlog 強化
- オーバーレイ dismiss を sessionStorage のままにするか localStorage/サーバー記録にするか
