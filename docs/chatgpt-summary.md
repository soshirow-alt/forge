■ 現在の状態
- ブランチ: preview/landing-01
- P-02 / P-03 / P-16-T01 / P-16-T02 の v0 写経 UI を Forge に実装済（ローカル build 成功）
- prod deploy / `/` / LP は未変更
- DB・Supabase スキーマ変更なし
- Preview Deploy は未 push（push 後に Vercel preview が更新される）

■ 今回実装したこと
- /login — v0 Auth Shell 2カラム（左フォーム + 右ヒーロー4価値 + ヘッダーナビ + フッター法務）
- /register — 新規ルート追加。v0 新規登録フォーム（ユーザー名・PW確認・規約同意・SNS UI）
- /mypage — Player Shell（左サイドバー + 上部検索/通知/Studio）+ 横タブ6種
- 見届け中タブ — v0 モックデータ4作品 + クイックフィルター + ジャンル絞り込み + 説明ボックス
- 保存作品タブ — v0 モックデータ5作品 + 保存中バッジ
- プレイ履歴 / FB履歴 / 実績 / フォロー中開発者 — 空状態プレースホルダ
- ?tab=saved 等 URL パラメータ — 初回レンダーから searchParams で同期（v0 の直 URL バグを Forge 側で修正）
- OAuth（Google/Discord/GitHub）— UI のみ。押下時「準備中です」メッセージ
- メール/パスワード — 既存 signIn/signUp を維持（本格 OAuth なし）
- /login?mode=signup — /register へ自動リダイレクト
- middleware — /mypage を保護対象から除外（UI プレビュー用。未ログインでも mock UI 閲覧可）

■ 今回変更した画面
- P-02 ログイン /login
  - 画面位置: 全画面 Auth Shell。左=フォーム、右=ヒーロー（lg以上）
  - 変更前: 単列中央・オレンジグラデ CTA・SNS なし
  - 変更後: v0 2カラム・紫グラデ CTA・SNS 3ボタン（stub）・パスワード表示切替
  - 確認: /login を開く。右パネル・SNS「準備中」・新規登録リンク→/register
- P-03 新規登録 /register（新規ルート）
  - 画面位置: ログインと同型 Auth Shell。左=elevated カード内フォーム
  - 変更前: /login?mode=signup のみ
  - 変更後: 独立 /register。規約チェック・PW確認・SNS stub
  - 確認: /register を開く。ログインリンク→/login
- P-16 マイページ /mypage
  - 画面位置: Player Shell。左サイドバー + 上部バー + メイン横タブ
  - 変更前: ForgeHeader + 遊んだ/作った 2タブ + 要ログイン
  - 変更後: v0 Player Shell + 6横タブ + mock データ + 未ログイン閲覧可
  - 確認: /mypage（見届け中）、/mypage?tab=saved（保存作品）、他タブは空状態
- 触っていない: / （発見ホーム）、/landing（LP preview）

■ 変更ファイル一覧
- 新規: components/auth-layout.tsx — Auth Shell 共有（ヘッダー/フッター/ヒーロー/OAuth）
- 新規: components/register-page.tsx — 新規登録 UI
- 新規: components/player-shell.tsx — Player Shell + タブ/空状態部品
- 新規: lib/mypage-v0-mock-data.ts — 見届け中・保存作品 mock
- 新規: app/register/page.tsx — /register ルート
- 変更: components/login-page.tsx — v0 写経
- 変更: components/mypage-page.tsx — v0 写経（旧 player/developer タブは置換）
- 変更: lib/supabase/middleware.ts — /mypage 保護解除（UI preview）

■ ユーザー目線の変化
- ログイン/登録が v0 デザインに近づき、LP 〜 認証の見た目が揃い始める
- マイページが Player Shell + 見届け中/保存作品の v0 イメージで確認できる（データは mock）
- 未ログインでも /mypage で UI 確認可能（preview 確認向け）

■ 注意事項
- production deploy 禁止 — preview ブランチ push のみ
- /mypage の mock は UI 確認用。本番 GO 時は Supabase 連携・認証保護を戻す判断が必要
- 旧 mypage ?tab=developer（作ったゲーム）は今回の v0 写経では非表示（P-16 v0 6タブに置換）
- OAuth・パスワード忘れ・Studio/ヘルプリンクは stub または未リンク

■ 今すぐ私がやるべきこと
- preview/landing-01 へ commit + push → Vercel Preview で目視確認
- 確認 URL: /login /register /mypage /mypage?tab=saved
- OK なら ChatGPT と Phase2 UX 継続。NG なら差分指示

■ Cursorだけで完了できること
- push 後の preview URL 共有
- v0 との細部調整（色・余白・コピー）
- 本番 GO 時: mock→Supabase 接続、middleware 保護復帰

■ 次に検討すべきこと
- 残り4タブの v0 実装タイミング
- /mypage 本番時の認証・データ接続 GO
- SNS OAuth の MVP in/out

■ ChatGPTに相談したい論点
- preview push GO のタイミング（下記 GPT判断用メモ参照）
- mypage 未ログイン閲覧は preview 限定でよいか、本番前に必ず middleware 復帰するか

■ Cursorの推奨案
- preview/landing-01 への push のみ Run（prod 禁止遵守）
- 目視 OK 後に本番反映は別 GO

■ 推奨理由
- UI 確認が目的。build 成功済。DB/原典/prod 未触
- preview ブランチは gpt-run-decision-memo 上、push 停止対象外だがオーナーが prod 禁止を明示したため判断メモを添付

■ 懸念点
- /mypage 保護解除は preview 向け。main マージ前に middleware 方針を決める必要あり
- 旧 developer タブ利用者（少数）への影響 — preview ブランチのみ

■ Preview URL（push 後）
- ベース: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- /login
- /register
- /mypage
- /mypage?tab=saved
