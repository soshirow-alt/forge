■ 現在の状態
- ブランチ: preview/landing-01（preview のみ。本番未反映）
- Preview URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- 直前 commit: 05e88ba。本修正は push 直後に新 commit
- 新規登録二重切替 — 原因特定・修正済み

■ 今回実装したこと
- 原因: LP の「新規登録」が `/login?mode=signup` 経由。login 画面表示後 useEffect で `/register` に replace → 画面が2回切り替わって見える
- LP ヘッダー・ヒーロー CTA のリンクを `/register` に直接変更（3箇所）
- middleware: `/login?mode=signup` → `/register` サーバー redirect（return クエリは引き継ぎ）
- login-page.tsx: client-side router.replace 削除（middleware に一本化）

■ 今回変更した画面
- P-01 LP /landing
  - 画面位置: ヘッダー右上「新規登録」、ヒーロー内 secondary CTA（2箇所）
  - 変更前: href=/login?mode=signup → 一度ログイン画面 → 登録画面
  - 変更後: href=/register → 登録画面に直行
  - 確認: LP から新規登録クリック — ログイン画面を挟まない

- P-02 ログイン /login?mode=signup（旧 URL）
  - 変更前: ログイン UI 一瞬表示 → client replace
  - 変更後: middleware で即 /register（フラッシュなし）
  - 確認: 旧 URL 直打ちでも登録画面のみ

- P-03 新規登録 /register
  - 変更なし（遷移経路のみ改善）

■ ユーザー目線の変化
- 新規登録ボタンを押すと登録フォームが1回で表示される
- ログイン画面が一瞬映る違和感が消える

■ なぜこの設計
- P-03 は独立ルート化済み。signup 経由 login は legacy 互換のみ
- サーバー redirect は HTML 返却前に処理 → client replace よりフラッシュ少ない
- LP は直接 /register が原典の「redirect 複雑化しない」にも合う

■ 他案不採用
- login-page の replace だけ残す — サーバー HTML が先に届くためフラッシュ残る
- register を login タブ内に統合 — 既に P-03 分離済み

■ In / Out
- In: landing links、middleware redirect、login useEffect 削除
- Out: register の return パラメータ処理（将来必要なら別タスク）

■ リスク
- ブックマーク `/login?mode=signup` は /register へ 302（意図どおり）
- docs/ui-mocks の旧 URL 記載は未更新（参照用ドキュメントのみ）

■ オーナー確認手順
1. /landing → 新規登録 — 1回で /register
2. /login?mode=signup 直打ち — ログイン UI なしで /register
3. /register ヘッダー「ログイン」— 通常どおり

■ 今すぐ私がやるべきこと
- deploy 後 LP から新規登録を目視

■ Cursorだけで完了できること
- ui-mocks 01-landing.md の URL 表を /register に更新

■ 次に検討すべきこと
- register でも return クエリ対応が必要か

■ ChatGPTに相談したい論点
- 特になし（バグ修正）
