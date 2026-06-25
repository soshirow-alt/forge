■ 現在の状態
- ブランチ preview/landing-01。Preview RUN 完了（aadb74e push 済み）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- 前回 push からの一括コミット: Studio マイページ再構成・ゲーム詳細同型化・ホーム/プロフィール/版→ver 等

■ 今回実装したこと（RUN 同梱）
- 上記セッションのローカル変更をすべて commit + push
- build 通過済み（push 前確認）

■ オーナー判断待ち — 実装ブロッカーなし
- 以下は Preview 目視後の GO/調整候補。RUN を止める理由にはしていない
  1. プレイヤー側も devlog+ver を1タブに統合するか（今は Studio のみ）
  2. マイページ3タブ目に「活動履歴」を足すか（現状2タブで十分という Cursor 見解）
  3. 開発ジャンルラベル「開発ジャンル（3つまで）」で確定か短縮するか（文言のみ）
  4. 概要の公開状態・外部URL編集をどこに置くか（改善ループ vs 概要タブ）
  5. 設計ドキュメントの「版」表記を UI の ver に揃えるか（docs のみ、機能影響なし）

■ オーナー判断待ち — なし（機能 GO 済みで push したもの）
- マイページ＝プロジェクト一覧、サイドバー構成、プロフィール同型+開発ジャンル3つ、Studio 詳細3タブ、ver統合、ホーム文言、Forge Tips 削除、所在地削除、版→ver — すべてオーナー指示どおり実装済み

■ 今回変更した画面（Preview 確認推奨）
- /studio — 参考作品見出し、開発ヒント2カード、あなたの作品（マイページと重複なし）
- /studio/mypage — プロジェクト一覧・実績タブ。一覧上部に「あなたの作品」なし
- /studio/profile — プレイヤー同型マイプロフィール、開発ジャンル3つ上限
- /studio/projects/{id} — 概要/みんなのFB/verの履歴（プレイヤー同型+編集）
- /mypage/profile — 所在地なし
- 全画面 — UI 文言「版」→「ver」

■ 今すぐ私がやるべきこと
- Preview デプロイ完了後、上記 URL を実機でざっと確認
- 気になる点があれば次タスクで指示（ブロッカーなし）

■ Cursorだけで完了できること
- 上記「判断候補」いずれか GO 後の追従実装

■ ChatGPTに相談したい論点
- Preview 目視後、プレイヤー devlog+ver 統合をやるかどうかだけ
