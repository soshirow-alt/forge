■ 現在の状態
- ブランチ: preview/landing-01（preview のみ。本番未反映）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- 直前 commit: dd0d162。本修正は push 直後に新 commit

■ 今回実装したこと
- Player Shell トップバーに「ログアウト」ボタン追加（hydrated && user のときのみ）
  - クリック → auth logout → /login へ遷移 + router.refresh()
- はじめてガイド — /landing リンクを削除、遷移なしの stub ボタンに変更
  - 旧挙動: /landing へ遷移 → LP は未ログイン向け UI のため「ログアウトしたように見える」問題

■ 今回変更した画面
- Player Shell 全 v0 画面（/home, /search, /mypage 等）共通
  - サイドバー下部「はじめてガイド」
    - 変更前: Link href=/landing
    - 変更後: button（クリックしても遷移なし）
  - トップバー（検索・通知・プロフィールの右）
    - 変更前: ログアウト手段なし
    - 変更後: ログイン中のみ「ログアウト」テキストボタン
  - 確認手順:
    1. ログイン状態で /home — トップバーにログアウト表示
    2. ログアウトクリック — /login へ、再ログイン可能
    3. はじめてガイド — クリックしても画面遷移しない

■ ユーザー目線の変化
- ガイドを押して LP に飛ばされず、プレイヤー体験のまま
- ログアウトはトップバーから明示的にできる

■ なぜこの設計
- /landing は LP（未ログイン入口）。ログイン中ユーザーがガイド経由で LP に行くのは IA 的におかしい
- ログアウトは forge-header と同様 auth-provider.logout を使用
- ログアウト後 /login — 原典どおりプレイ以降は login 入口

■ 他案不採用
- はじめてガイドを /landing のまま — オーナー指摘どおり不採用
- ログアウト後 /home — 公開発見は可能だが、ログアウト明示性のため /login

■ In / Out
- In: player-shell.tsx の logout + guide stub
- Out: はじめてガイド本文画面、未ログイン時のトップバー login リンク

■ リスク
- 未ログイン時トップバーに login リンクはまだなし（別タスク可）
- はじめてガイド stub は見た目だけ — 将来コンテンツ URL 確定後に接続

■ オーナー確認手順
- ログイン → トップバー ログアウト → /login
- はじめてガイド — 遷移なし

■ 今すぐ私がやるべきこと
- deploy 後上記2点目視

■ Cursorだけで完了できること
- 未ログイン時トップバーにログインリンク追加
- はじめてガイド用プレースホルダーページ

■ 次に検討すべきこと
- はじめてガイドの正本 URL・コンテンツ

■ ChatGPTに相談したい論点
- ガイドは LP 再表示か専用 /guide か
