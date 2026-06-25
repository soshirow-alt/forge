■ 現在の状態
- ブランチ preview/landing-01。commit d3a3540 push 済み。Vercel Preview 再デプロイ待ち
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- DB migration 変更なし。コミュニティ v0 は localStorage + mock データ

■ Forge原典コアループ（判断の基準）
- 発見→プレイ→初声→次に直すこと→次版の学習ループ
- 今回 push 分は開発者ホームの伸び可視化とコミュニティ交流 UI。ループの「見届け・継続接触」層

■ 今回実装・Preview RUN したこと
- commit d3a3540 を origin/preview/landing-01 へ push
- マイコミュニティ /studio/community — GPT mock（A-1〜A-4）準拠 UI
- Studio ホーム /studio — 「今週の伸び」3列（見届け人/フィードバック/フォロワー 前週比%）、もっと見る 3→10
- 開発ヒント文言 — 「一瞬で伝わる」→「が伝わる」微修正
- docs: changelog 74/75、handoff 更新

■ 今回変更した画面
- 開発者マイコミュニティ /studio/community
  - 画面位置: StudioShell サイドバー「マイコミュニティ」
  - 変更: コミュニティ情報カード、フォロワーへ連絡（折りたたみ compose）、Devlog リッチ引用、参加申請メッセージ・空状態
  - 確認: Preview 反映後、掲示板/参加者タブを開く

- Studio ホーム /studio
  - 画面位置: メイン「今週の伸び」セクション（3カラム）
  - 変更前: 見届け人系メトリクスが重複気味
  - 変更後: 作品2列（見届け人伸び・フィードバック伸び）+ 開発者1列（フォロワー伸び）。各列「もっと見る」で 10 件展開
  - 確認: /studio を開き3列の指標ラベルと前週比%表示

- プレイヤー参加コミュニティ /mypage/community
  - Devlog リッチカードは開発者投稿閲覧時に反映（compose は従来どおり）

■ ユーザー目線の変化
- 開発者: コミュニティ画面が mock に近い操作感。ホームで「何が伸びているか」が指標別に分かる
- プレイヤー: コミュニティ投稿の Devlog 引用が見やすい

■ なぜこの設計
- オーナー指示「確認観点のない未 Preview 分を一括 RUN」。build 済みのローカル差分をまとめて push
- ランキング列は重複メトリクスを避け成長率で差別化（前回ローカル実装分を同梱）

■ 他案不採用
- 分割 commit（コミュニティとランキング別）— デプロイ回数削減のため一括

■ In / Out
- In: 上記9ファイル + docs RUN マーカー
- Out: Supabase 永続化、コミュニティ設定画面、本番 prod deploy

■ リスク
- localStorage 既存データで参加申請 mock が旧表示のままのブラウザあり（クリアで初期化）
- 参加者数 128 は mock 固定表示

■ 注意事項
- npm run build 成功後に push
- 本番・PLAYER_VISIBLE・DB 変更なし

■ 今すぐ私がやるべきこと
- Vercel Preview 反映後、/studio と /studio/community を実機確認
- 必要ならコミュニティ mock との見た目差分をフィードバック

■ Cursorだけで完了できること
- Preview 反映後の微調整（参加者数の実数連動など）
- docs/ui-mocks/26-community.md 起票

■ 次に検討すべきこと
- コミュニティ設定画面スコープ
- 作品検索グリッドのサムネ 4:3 統一（別タスク）

■ ChatGPTに相談したい論点
- 参加者数 mock 固定 128 を v0 で維持するか実数連動にするか
