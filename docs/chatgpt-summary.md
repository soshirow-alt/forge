■ 現在の状態
- preview/landing-01。デモ URL（seikat-no-tabiji?play=1）はオーナー確認済みで通過
- ホームの「デモをはじめる」は hostname 判定修正済み（793933a）— デプロイ後に再確認推奨
- 次タスクとして Player 死んだ UI の一部を配線済み（push 予定）

■ 今回実装したこと
- components/works-search-page.tsx: リスト / グリッド切替。?view=grid で URL 保持。ページネーション・ソート・ジャンルと共存
- components/game-voices-v0-tab.tsx: FB 一覧は初回5件。「もっと見る」でフィルタ後の全件表示。件数表示を実数に修正
- docs/preview-v0-gaps.md / forge-changelog.md 更新

■ 今回変更した画面
- 作品検索 /search / ソート行右のリスト・グリッドアイコン
  - 変更前: 見た目のみ。グリッド押してもリストのまま
  - 変更後: グリッドでカード3列レイアウト。URL に view=grid
  - 確認: /search → グリッドアイコン → カード表示 → 作品クリックで詳細

- ゲーム詳細 みんなのフィードバックタブ /games/seikat-no-tabiji?tab=voices
  - 変更前: 全件一度に表示、「もっと見る」死んでいた。件数表示が不正確
  - 変更後: 5件 + もっと見る → 残り表示。N件中 M件を表示
  - 確認: デモ送信後 voices タブ → もっと見るで自分の投稿含む全件

■ ユーザー目線の変化
- 検索結果の見え方を好みで切り替え可能
- FB タブが一覧サイトらしく段階表示になる

■ 注意事項
- グリッドは mock 8作品の見た目変更のみ。データ源は同一
- FB は mock + session。もっと見るはクライアント展開のみ

■ 今すぐ私がやるべきこと
- Preview で /search のグリッド切替と voices もっと見るを確認
- /home のデモバナーが出るか再確認（793933a デプロイ後）

■ Cursorだけで完了できること
- ランキング月 ◀▶ / もっと見る
- 設定「変更」stub
- マイページ FB 履歴と session voice 連携

■ 次に検討すべきこと
- デモ導線をホームバナー以外（検索1位カードに ?play=1）に足すか
- 残 dead UI の優先順位（ランキング vs 設定 vs Studio）

■ ChatGPTに相談したい論点
- Preview 残タスクは「死んだ UI 潰し」続き vs Studio 本番ルート整理、どちらを先にするか
