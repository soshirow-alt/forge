■ 現在の状態
- ブランチ preview/landing-01。改善ループ Studio 全面再構成 + ホーム/一覧整理を Preview に push 済み（オーナー RUN 指示）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- v0 案は方向ズレのため Cursor 直実装。GameGrowthCycle ヒーローは studio-improvement-loop に置換

■ 今回実装したこと（RUN 済み）
- `/projects/{id}/studio` 新UI — studio-improvement-loop.tsx
  - 5段ステッパー（FBを集める → 決める → 修正 → 記録・公開 → 次のFBを待つ）
  - 現在の工程カード（今やること / この工程の現状 / ヒント）
  - 下段2カラム — 次に直すこと（上位3）+ プレイヤーのFBを読む（かんたんFB / 詳しいFB / 集計タブ）
  - FBゼロ時は下段非表示（ループ前と矛盾しない）
- UI用語 — 「初声」廃止。かんたんFB / 詳しいFB に統一（オーナー指示）
- ヘッダー — かんたんFB・詳しいFB 件数、戻る先は Studio ホーム
- 正式版 — ステッパー横に置かない（下部 ProjectReleaseStudioPanel は維持）
- ホーム/一覧（前回分同梱）— カードはワッペンのみ、一覧はニュートラル枠

■ Forge原典コアループ（判断の基準）
- 版ごとの学習ループ。開発者 Studio は1作品の作業画面。一覧/ホームは入口と通知のみ

■ なぜこの設計
- v0 モックは数字矛盾・工程と内容の不一致・正式版の誤配置あり。骨格は採用し Cursor で実データ整合
- 「初声」は Forge 内部用語。開発者UIはかんたんFB/詳しいFBで誰でも分かる表現に

■ 他案不採用
- v0 写経そのまま — オーナー判断で方向ズレ
- GameGrowthCycle 微修正継続 — 全面置換

■ スコープ In / Out
- In: studio-improvement-loop, improvement-loop-steps, project-studio-page, 用語更新, ホーム/一覧整理
- Out: game-growth-cycle 削除（未使用だがファイル残置可）、本番 deploy、プレイ数 KPI

■ 今回変更した画面
- 改善ループ Studio /projects/{id}/studio — 全面再構成
  - 変更前: 単一ヒーロー + GameGrowthCycle + 上位3が上
  - 変更後: 5段ステッパー + 工程カード + 2カラム（上位3 / FB閲覧）
  - 画面位置: Studio シェル内、作品を開いた先の正本作業画面
- Studio ホーム /studio — 実作品カード directory 化（ワッペンのみ）
- Studio 一覧 /studio/projects — 実作品セクション ニュートラル枠

■ ユーザー目線の変化
- 今どの工程にいるかがステッパーで一目
- FBの種類（かんたん/詳しい）が分かる言葉で統一
- ループ前は「集める」に集中、FBが来てから上位3と閲覧が出る

■ 注意事項
- Vercel Preview デプロイ完了まで数分かかる場合あり
- game-growth-cycle.tsx は現在未参照（後で削除可）

■ 今すぐ私がやるべきこと
- Preview で /projects/{id}/studio を実機確認（ループ前の作品と FBありの作品）
- 用語・ステッパー・タブの違和感があればフィードバック

■ Cursorだけで完了できること
- フィードバック反映の polish
- 未使用 game-growth-cycle の整理

■ 次に検討すべきこと
- かんたんFB/詳しいFB の説明ツールチップ
- S-22 mock 5タブ（GO 後）

■ ChatGPTに相談したい論点
- かんたんFB/詳しいFB のラベルで十分伝わるか
- 工程2「次に直すことを決める」を独立ステップとして見せる価値
