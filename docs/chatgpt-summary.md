■ 現在の状態
- ブランチ preview/landing-01。Preview URL で UI 確認前提
- 優先1「発見→プレイ→フィードバックの1本デモ」を実装済み（コミット・push 予定）
- 正本デモゲームは星灯の旅路（slug: seikat-no-tabiji）
- Preview ではログインなしでプレイ stub から初声 FB まで通せる（本番マージ時は要無効化）
- ホーム hero-1 / 検索カードは gameDetailIdAliases で詳細に解決済み

■ 今回実装したこと
- lib/preview-demo-loop.ts 新設（DEMO_GAME_ID、demoGameDetailHref、Preview ログイン省略判定）
- lib/login-return-url.ts: return に ?play=1 / ?feedback=1 を許可。gameDetailReturnPath にオプション追加
- components/game-detail-v0-page.tsx: Preview では requireAuth をバイパスしてプレイ・FB 開始
- ?play=1 でマウント時に play stub 自動開始（ログイン済み or Preview）
- ?feedback=1 でフル FB フォーム自動開始
- 初声送信時は選択肢ラベルを session voice 本文に反映
- components/feedback-v0-modals.tsx: Play stub 文言を体験向けに整理（stub 表記削除）
- components/discovery-home-page.tsx: 体験デモストリップ + ヒーロー hero-1 に「プレイしてフィードバック」CTA
- docs/forge-changelog.md / preview-v0-gaps.md 更新

■ 今回変更した画面
- 画面名: 発見ホーム / URL: /home / 位置: PlayerShell メイン上部
  - 変更前: ヒーローのみ
  - 変更後: Preview 時のみ紫の体験デモバナー「デモをはじめる」、hero-1 に第2 CTA
  - プレイヤー視点: 1クリックでデモループに入れる
  - 確認: Preview を開く → バナー or ヒーロー CTA → 詳細で play stub が開く

- 画面名: ゲーム詳細（星灯の旅路） / URL: /games/seikat-no-tabiji?play=1
  - 変更前: 未ログインは「ログインしてプレイ」→ login のみ。return 後は手動で再クリック
  - 変更後: Preview 未ログインでも「プレイする」→ stub → 初声 → 送信 → みんなのフィードバックタブに自分の投稿
  - 開発者視点: sessionStorage 追加分が voices 一覧先頭に出る（Supabase 未保存）
  - 確認: プレイをはじめる → この回答を送信 → success → voices タブに新規1件

■ ユーザー目線の変化
- 初見デモ担当が /home からログインなしで「Forge のコアループ」を30秒で見せられる
- ログインありフローでも ?play=1 return でプレイ再開が自動化された
- stub 文言が開発用から体験用に読みやすくなった

■ なぜこの設計
- 原典: 発見は公開、プレイ以降はログイン必須。Preview は UI レビューと外部デモのため一時的に例外
- デモ正本を1ゲームに固定し、散在する mock ID は既存 alias で詳細に集約（新規データ増やさない）
- return URL は ?play=1 のみ許可しオープンリダイレクトは防ぐ

■ 他案不採用
- 全ゲームでログイン省略: デモの意味が薄れ本番挙動と乖離しすぎるため Preview 全体フラグのみ
- localStorage に FB 永続化: 原典違反。sessionStorage の既存 voices 追加分を継続
- ホーム以外に専用 /demo ルートのみ: 発見→詳細の自然な導線を優先し /home バナーを採用

■ In / Out
- In: Preview デモループ、return クエリ、ホーム CTA、stub 文言、docs
- Out: Supabase FB 保存、recordPlay on mock、本番でのログイン省略、他画面の死んだ UI

■ 注意事項
- Preview デプロイでのみ canPreviewDemoWithoutLogin が true（VERCEL_GIT_COMMIT_REF または env）
- 本番マージ前に Preview ログイン省略を必ず外す（preview-v0-gaps に明記）
- FB は session のみ。リロード後も同一タブ内では voices に残るがアカウント横断共有ではない

■ 今すぐ私がやるべきこと
- Preview デプロイ完了後、/home → デモをはじめる → 初声送信まで実機確認
- ログインユーザーで ?play=1 return（login クリック→戻る→自動 stub）も1回確認
- 問題なければこのデモ URL を営業・開発者説明の正本にする

■ Cursorだけで完了できること
- /search グリッド切替など残 dead UI
- フル FB フォーム送信文の動的化
- mypage FB 履歴と session voice の連携（スコープ要判断）

■ 次に検討すべきこと
- 外部向けデモ用の短い説明コピー（バナー文言）
- mock → Supabase 切替タイミングと初声率計測
- 本番 merge 時の認証・middleware 復元チェックリスト

■ ChatGPTに相談したい論点
- Preview ログイン省略を「デモ専用1 URL のみ」に狭めるべきか、現状の Preview 全体でよいか
- 営業デモでログイン必須に戻すタイミング（見込み客向け vs 社内 UI 確認）
