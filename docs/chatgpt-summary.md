■ 現在の状態
- オーナー GO 済み: 案1〜3 すべて実施（コード変更なし・ドキュメントのみ）
- 新規 docs/forge-business-hypothesis.md（事業仮説 v2 正本）
- docs/forge-principles.md コアループ改訂（学習ループ＝コア、見届け人・再プレイ＝増幅）
- docs/forge-p0-improvement-loop-plan.md §1.5 事業 North Star 追記
- AGENTS.md / .cursor/rules/forge.mdc 二正本表現に同期
- P0 Phase A/B 実装済み。Phase C migration 015 は引き続き GO 待ち
- 本番 prod deploy 保留。PLAYER_VISIBLE=false

■ Forge原典コアループ（判断の基準）
- 投稿→発見→プレイ→フィードバック→改善→再プレイ から、学習ループ中心へ更新
- コア: 発見→プレイ→初声→次に直すこと→次版
- 増幅: 変化を見る、再プレイ、見届け人、影響力可視化
- 事業の問い: どうマネタイズか → 何を売るか → どう Good レビューを引き出すか

■ 今回実装したこと（ドキュメント）
1. forge-business-hypothesis.md 新規作成
   - 学習ループ本命、無料期間＝因果証明、A/B/C 層、3層価値構造
   - レビュアー / Good / スーパーレビュアー分離
   - Good 生成の最低条件4つ（導線・問い・承認・影響力可視化）
   - 経済インセンティブは増幅・後回し
   - North Star M1〜M4、棄却仮説一覧
2. forge-principles.md 改訂（オーナー GO）
   - タイトル: プロダクト原典（憲法表現を緩和）
   - コアループ図・プレイヤーサイクル表・コア/増幅/非コア
   - 見届け人独立小節、§5 開発者が問いを決める・Good 評価主体
   - §6 学習ループが最初の価値
3. forge-p0-improvement-loop-plan.md
   - 目的行を学習ループ表現に
   - §1.5 事業 North Star、M1/M3 主要・H2 副次
   - KPI 表に M1/M2 列、015 は North Star 非必須の注記
4. forge-handoff.md / forge-changelog.md / AGENTS.md / forge.mdc 同期

■ ユーザー目線の変化
- ドキュメント上の「Forge とは何か」がテスター代替・見届け人必須から学習ループ＋Good レビュー生成に統一
- 実装判断: 再プレイ・見届け人だけの機能は後回し可、初声と次に直すことを優先
- プレイヤー動機: 発掘が入口、Good レビューには承認・影響力可視化が土台（金銭はまだ）

■ 注意事項
- コード・UI 文言の一括変更はしていない（見届け人ラベル等は別タスク）
- chatgpt-handoff.md 全量更新は未実施（事業仮説は大テーマだがオーナーが引継ぎ指示なし。handoff は差分更新のみ）
- 原典改訂は GO 済みで反映済み。以降 Cursor は学習ループ基準で判断

■ 今すぐ私がやるべきこと
- docs/forge-business-hypothesis.md を一読し、Good レビュー4条件が現行プロダクトとズレないか確認
- P0 検証時 M1（プレイ→初声率）を手動でもよいので記録開始
- 新 GPT スレッドなら forge-handoff.md 全量貼りを検討（事業定義が大きく変わったため）

■ Cursorだけで完了できること
- Good レビュー4条件と現行 UI のギャップ洗い出し（影響力可視化は未実装の可能性大）
- M1 計測の staging 手順書
- Phase C 015 GO 判断用メモ（H2 副次化を明記したうえで）

■ 次に検討すべきこと
- 影響力可視化（読まれた・採用・改善に繋がった）の P1 スコープ
- 開発者 FB 評価（M2）の実装タイミング
- chatgpt-handoff.md 全量更新のタイミング

■ ChatGPTに相談したい論点
- M1 目標 20% 仮置きの妥当性（A層パイロット人数）
- 承認・影響力可視化だけで Good レビューが足りるか、いつ経済層を足すか
