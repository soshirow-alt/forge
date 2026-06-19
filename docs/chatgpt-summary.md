■ 現在の状態
- ブランチ preview/landing-01。ローカルに S-23 開発者月間ランキング刷新が未コミット
- npm run build 成功（/studio/rankings ルート含む）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app（push 後に反映）
- DB migration 変更なし。v0 mock データのみ

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- Studio ランキングは「作品を育てた開発者」を称えることで、開発者の改善サイクルを後押しする。量産指標（投稿数等）を主軸にしないのは原典の「育てる」思想に合わせるため

■ 今回実装したこと
- S-23 /studio/rankings を「今月もっとも作品を育てた開発者」画面に作り直し
- components/studio-rankings-page.tsx — StudioShell activeNav=ranking、パンくず・タイトル・リード・月選択、TOP3カード、4位以下テーブル、右カラム2枚
- lib/studio-rankings-v0-mock-data.ts — 開発者ランキング用 mock を S-20 ホーム抜粋（studioRankingSnippets）と分離
- docs/forge-changelog.md — 39 Studio 開発者月間ランキング エントリ追加

■ 今回変更した画面
- 画面ID: S-23 Studio ランキング
- URL: /studio/rankings
- 画面位置: Studio Shell 内メイン。左サイドバー「ランキング」が選択状態（ホーム / プロジェクト一覧 / ランキング ── マイページ / 通知 ── 設定 / はじめてガイド）
- 変更前: 作品・プレイヤー寄りのランキング文言・構成だった可能性（Player P-17 流用に近い表現）
- 変更後:
  - タイトル「今月もっとも作品を育てた開発者」
  - リード「プレイヤーの声と応援によって、作品を大きく前進させた開発者を称えます。」
  - TOP3: 順位・開発者アイコン・名前・handle・称号ラベル・影響度スコア・先月比・代表作品
  - 4位以下テーブル: 順位 / 開発者 / 代表作品 / 影響度スコア / 先月比 / 見届け人増 / 作品フォロー増 / 開発者フォロー増 / 声の増加
  - 右: ランキングの指標カード + 先月TOP3 + 過去のランキングボタン（v0 未遷移）
- プレイヤー視点: Player P-17 月間影響度（貢献したプレイヤー称賛）とは別画面・別文言
- 開発者視点: 自分が今月どれだけ作品を育てたかが分かる指標と順位を確認できる
- 確認手順: preview で /studio/rankings を開く → サイドバー「ランキング」ハイライト → TOP3・テーブル・右カラム文言を目視

■ ユーザー目線の変化
- Studio ランキングが「開発者が作品を育てた結果」の月間称賛画面として明確化
- 投稿数・更新数・正式版数ではなく、見届け人・フォロー・声の増加が主指標として見える
- Player 側の影響度ランキングと混同しにくいタイトル・リードに変更

■ ランキング指標の扱い
- 対象: 開発者単位（作品ランキングでも Player ランキングでもない）
- 主指標（月間増加）: 見届け人 / 作品フォロー / 開発者フォロー / 声
- UI 上の要素比重（参考表示）: 見届け人40% / 作品フォロー25% / 開発者フォロー15% / 声20%
- スコア思想: 絶対数と成長率の両方（目安 絶対数7 : 成長率3）— 右カラム注記のみ。計算式は前面に出さない
- 評価しないもの: 投稿数・更新数・正式版公開数・売上・人気投票
- v0: mock 数値。本番は Supabase 集計が将来課題

■ 変更ファイル一覧
- components/studio-rankings-page.tsx（本体 UI）
- lib/studio-rankings-v0-mock-data.ts（開発者 mock + S-20 抜粋分離）
- docs/forge-changelog.md
- docs/chatgpt-summary.md（本ファイル）
- 既存ルート app/studio/rankings/page.tsx は変更なし（コンポーネント委譲のみ）

■ 注意事項
- 月選択・もっと見る・過去のランキングは v0 で UI のみ（集計 API 未接続）
- S-20 ホームのランキング抜粋（studioRankingSnippets）は作品向けのまま。S-23 全文とは別データ
- 白テーマ・新デザイン言語は使っていない。Player v0 ダーク・紫アクセント・Studio Shell 既存パターン準拠

■ 今すぐ私がやるべきこと
- preview /studio/rankings を目視確認（TOP3・テーブル列・右カラム文言）
- push 承認後、Preview URL で再確認

■ Cursorだけで完了できること
- preview/landing-01 への commit + push（UI のみ、migration なし）
- 月選択の前後月 mock 切替、過去ランキング画面の v0 スタブ（別タスク）

■ 次に検討すべきこと
- 本番集計ロジック（絶対数7:成長率3 の実装仕様）
- S-20 ホームと S-23 の導線・データ整合
- 過去月ランキング一覧画面の要否

■ ChatGPTに相談したい論点
- 特になし（仕様はオーナー指示どおり実装済み）

■ Runしてよいか
- preview ブランチへの commit + push: 可（UI/mock のみ、本番 prod・migration・DB 変更なし）
- 本番 prod deploy: 保留（従来どおり）
- 結論: preview push は [A] Run推奨。prod は [D] Run禁止
