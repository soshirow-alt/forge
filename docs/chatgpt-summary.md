■ 現在の状態
- ブランチ: preview/landing-01
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- 直前 commit: 9eba05a。本修正 push 直後

■ 今回実装したこと
- トップバー「ログアウト」— 条件を hydrated && user から user のみに変更
  - ログイン済みなら hydration 完了前でも表示
- 未ログイン時 — トップバーに「ログイン」リンク追加（Studio の左）
- auth-provider — mount 時 getSession() でセッション取得 + setHydrated(true)

■ 今回変更した画面
- Player Shell トップバー（全 v0 画面）
  - 画面位置: 通知・プロフィールの右、Studio の左
  - 変更前: ログイン時のみ hydrated && user でログアウト。未ログイン時は何もなし
  - 変更後: ログイン中→ログアウト / 未ログイン→ログイン
  - 確認:
    1. 未ログイン /home — 「ログイン」表示
    2. ログイン後 — 「ログアウト」表示、クリックで /login
    3. ログアウト後 — 再び「ログイン」

■ ユーザー目線の変化
- トップバー右側に常に認証アクションがある（ログイン or ログアウト）
- ログイン済みなのにログアウトが出ない、が解消

■ なぜこの設計
- 前実装は hydrated && user の二重条件。SSR initialUser ありでも hydrated=false の間非表示
- 発見は公開だが原典どおり login ボタンは隠さない

■ 他案不採用
- ログアウトを未ログイン時も常時表示 — ラベルと動作が矛盾

■ In / Out
- In: player-shell.tsx, auth-provider.tsx
- Out: ユーザー名表示、Studio 導線

■ リスク
- getSession と onAuthStateChange の二重更新 — 同一値なら問題なし

■ オーナー確認手順
- 未ログイン /home → ログイン表示
- ログイン → ログアウト表示 → ログアウト動作

■ 今すぐ私がやるべきこと
- deploy 後上記確認

■ Cursorだけで完了できること
- 特になし

■ 次に検討すべきこと
- トップバーにユーザー名表示するか

■ ChatGPTに相談したい論点
- 特になし
