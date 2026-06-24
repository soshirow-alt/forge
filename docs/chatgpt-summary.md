■ 現在の状態
- ブランチ preview/landing-01。Studio ヒーロー視覚整理 + ホーム/一覧整理を Preview に push 済み（オーナー RUN 指示）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- 前回 push: 実 Studio UX 大改修（88d89ae）。今回 push: ヒーロー3モード + ホーム/一覧整理
- 本番 prod deploy — 保留。DB migration 変更なし

■ 今回実装したこと（RUN 済み）
- getStudioVisualMode で pre_cycle / in_cycle / cycle_complete を分岐
  - pre_cycle: 3段ビジュアル（投稿✓ プレイ● 回答·）+「ループ前」バッジ。5段ステッパー非表示
  - cycle_complete: 完了リング + 点滅「新回答で再開」。5段の ✓ 羅列を廃止
  - in_cycle: 従来の5ドット（現在地のみ強調）
- 「作品ページを共有する」廃止 — 主CTA: プレイヤー向けページを見る。副: ページURLをコピー
- ヒーロー内ボタン — 主CTAのみ常時。質問編集・作品情報編集は「作品の設定」折りたたみ
- 空の声セクション — ループ前はヒーローと重複するため非表示
- ホーム — サンプルカルーセル・Forgeで起きていること 削除
- 一覧 — フェーズピル、実作品は新着FB/公開待ちワッペンのみ

■ Forge原典コアループ（判断の基準）
- 版ごとの学習ループ（発見→プレイ→初声→次に直すこと→次版）
- 今回は開発者 Studio の「今どのフェーズか」を視覚で正しく伝える改善。初回待ちで完了に見える混乱を解消

■ なぜこの設計
- Forge で開発者が能動的にやることは実質4つ（読む/直す/記録・公開/待つ）。初回はループ前で別フェーズ
- 5段 UI を常時出すとプロセスと無関係なボタンが同列に見え混乱する
- 「共有」は製品機能ではなく URL 配布の口語 — UI に嘘のボタンを置かない

■ 他案不採用
- 5段を残して wait だけ別色 — 依然として ✓ が多く完了に見える
- ボタンを物理的に削るだけ — プロセスとの対応が伝わらないため折りたたみ + モード分岐

■ スコープ In / Out
- In: game-growth-cycle, project-growth-state, studio-home/projects/shell, project-list-card, mock-data
- Out: 本番 deploy、SNS シェア API、目標 FB インセンティブ

■ 今回変更した画面
- 実 Studio /projects/{id}/studio — ヒーロー領域（画面上部・改善ループカード）
  - ループ前: 3段図 + URLコピー + 設定は折りたたみ
  - ループ完了: 完了アイコン + 待機
  - 改善中: 5ドット + 現在地
  - 変更前: no_feedback でも5段ステッパーが ✓ だらけで「終わった」印象
- Studio ホーム /studio — サンプルカルーセル・Forgeで起きていること 削除
- Studio 一覧 /studio/projects — フェーズピル、ワッペンのみの実作品行

■ ユーザー目線の変化
- 初回は「まだループが始まっていない」と視覚的に分かる
- 共有したいときは URL コピーで何をすればよいか明確
- ヒーローが主役、設定系は必要時だけ開く
- ホームが実作品中心になり、一覧はフェーズで絞れる

■ 注意事項
- Vercel Preview デプロイ完了まで数分かかる場合あり
- ループ前/中/完了の見え方は作品の FB・devlog 状態で変わる。複数作品で確認推奨

■ 今すぐ私がやるべきこと
- Preview でループ前の作品 Studio を実機確認（3段図・URLコピー・設定折りたたみ）
- in_cycle / cycle_complete の作品があればヒーロー切替も確認
- /studio ホーム・/studio/projects 一覧の整理後 UI を実機で見る
- 違和感があればフィードバック

■ Cursorだけで完了できること
- フィードバック反映の修正
- in_cycle 時のステップとボタン対応のさらなる視覚化（検討）

■ 次に検討すべきこと
- in_cycle 時もステップとボタンの対応をさらに視覚化するか
- UX-FB-TARGET（目標 FB ボーナス）
- S-22 mock 5タブ / S-20 polish（GO 後）

■ ChatGPTに相談したい論点
- ループ前/中/完了の3モード表現で十分か
- 実機レビュー後の polish 優先度
