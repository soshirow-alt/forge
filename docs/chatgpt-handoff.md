■ ChatGPT 新チャット引継ぎ — 全量スナップショット
更新日: 2026-07-06（主要導線パフォーマンス改善 本番反映完了）
用途: 新 GPT スレッドの最初に1回だけ貼る。日常タスクは返答本文 + `docs/forge-changelog.md`（GPT 用厚いメモは廃止済み）。
正本: `docs/forge-handoff.md`（Cursor 向け）/ 本ファイル（GPT 向け）

================================================================
■ 現在の状態（2026-07-06）
================================================================

本番 deploy: **完了**
最新 commit: **e980842b9938265e9e178954f5d95f553c33a6dc**
ブランチ: **origin/main = origin/preview/landing-01**（同期済み）
deploy ID: **dpl_ARS8yDJzg9gD4iQbhpKoSDEiLYnD**

URL:
- 本番: https://forge-flame-gamma.vercel.app
- Preview: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- Supabase: bpnisgzxuwdxelhnduuf（Preview / 本番共通）

Cursor 推奨 1 位（パフォーマンス本番反映後）:
1. サイドバー遷移パフォーマンス（Shell 共通 layout / prefetch / 初期 fetch 分解 / catalog 改善）
2. X Auth フォロー（unlink UI / `/players/[handle]` X 表示 / 開発者初回導線は別 TODO）
3. 公開FBカード本番運用確認
4. 改善ループ Studio 実機レビュー（`/projects/{id}/studio`）

================================================================
■ 主要導線パフォーマンス改善 本番反映完了（2026-07-06）
================================================================

正本: docs/forge-changelog.md（2026-07-06 エントリ）

状態:
- パフォーマンス改善 **本番反映済み**（Preview 確認 → main merge → Production deploy）
- 同期 commit: **e980842**（origin/main = origin/preview/landing-01）
- deploy ID: **dpl_ARS8yDJzg9gD4iQbhpKoSDEiLYnD**
- コア機能: 46d40f3 までの一連（122cb6b で本番記録、e980842 は changelog deploy ID 追記）

実装済み（今後の前提）:

1. **作品詳細 1件直取得**
   - fetchPublicProjectById / useGameDetailProject
   - catalog 全件待ちを廃止し、作品詳細を単体 fetch

2. **タブ即時切替**
   - useInstantQueryTab + history.replaceState
   - router.replace による Next navigation を回避
   - /games/[id] の概要 / 開発ログ / みんなのFB

3. **横展開**
   - /mypage / /studio/mypage に instant tab + 遅延マウント

4. **みんなのFB タブ スクロール戻り修正**
   - preserve-scroll + タブパネル min-h
   - タブ切替で上部へ戻る問題を解消

5. **ログインフォーム入力消失防止**
   - auth-login-action から revalidatePath 削除
   - controlled input + 「ログイン中…」表示

6. **GamesProvider fetch 遅延**
   - グローバル devlog / release events / support counts を setTimeout(0) で後追い

7. **基盤**
   - skeleton 化、[forge:perf] 計測、ForgeTabPanel keep-alive

本番確認（オーナー実機）:
- 作品詳細タブが Preview 同様に速いこと
- みんなのFBタブで上部へ戻らないこと
- /mypage / /studio/mypage タブが速いこと
- メールログイン時に入力欄が遷移前に消えないこと
- Xログイン導線が壊れていないこと

残課題:
- **サイドバー遷移がまだ 1〜2秒**（/home /search /mypage /community 等）
- 原因候補: Shell ページごと再 mount / Next navigation / 遷移先初期 fetch / GamesProvider 一括取得 / auth・profile・getUser waterfall / prefetch 不足

次フェーズ候補:
1. PlayerShell / StudioShell 共通 layout 化
2. サイドバーリンクの prefetch
3. 遷移先初期 fetch の分解
4. /home /search の catalog 取得改善

未移行（router.replace 監査）:
- creator-profile / developer-profile / studio-project-detail 等

================================================================
■ X Auth 本番 GO 完了（2026-07-06）
================================================================

正本: docs/x-auth-setup-runbook.md

実装:
- /login・/register → Xでログイン（signInWithOAuth / flow=x_login）
- /settings → Xで連携（linkIdentity / flow=x_link / Manual linking ON）
- redirectTo: ${origin}/auth/callback（query なし）。flow/next は cookie
- user_x_profiles + upsert_own_x_profile RPC（042/043 適用済み）
- 公開 @handle: 設定 / 公開FB / 作品作者 / creators

遷移（確定）:
- /login X、return なし → /home
- /register X → /home（新規・既存とも。文言は「Xでログイン」）
- /settings X連携成功 → /settings?x=linked
- return 明示時のみホワイトリスト内 return 先

本番 env:
- NEXT_PUBLIC_X_AUTH_ENABLED=true（必須。false だと本番で X 非表示）
- X Client Secret は Supabase Dashboard のみ（Vercel 不可）

X Developer:
- App 表示名: Forge game
- Callback: https://bpnisgzxuwdxelhnduuf.supabase.co/auth/v1/callback
- Auto recharge: OFF / $5 クレジット購入済み

本番 smoke PASS（2026-07-06）:
- /login・/register「Xでログイン」
- /login → X → /home
- /settings @Forge_game_0601 連携済み（forge.operation@gmail.com。再連携 smoke 不要）
- メールログイン / ゲスト参加 / /games/[id] / 旧ログイン UI 非表示

ロールバック（問題時）:
1. NEXT_PUBLIC_X_AUTH_ENABLED=false + Redeploy
2. Supabase X Provider OFF / Vercel 直前デプロイ Rollback

未実装:
- ユーザー向け X unlink UI
- /players/[handle] の X 表示

================================================================
■ 同梱本番デプロイ（6192348 以降）
================================================================

- 041 公開FBカード Phase 2 UI（migration 適用済み）
- ゲスト深掘りFB Phase 1
- 声 aggregate バケット修正
- X Auth コード一式（migration は事前適用済み）
- 主要導線パフォーマンス改善（e980842 時点で本番反映済み）

================================================================
■ DB / Supabase（2026-07-06）
================================================================

適用済み migration: 001–043（本番）
新規（今回テーマ関連）:
- 041 public_feedback_cards（feedback_reports, get_public_feedback_cards 等）
- 042 user_x_profiles
- 043 RPC grants fixup（anon REVOKE 等）

deploy 時に migration 再 Run 不要。
パフォーマンス改善は **DB / migration 変更なし**（アプリ層のみ）。

================================================================
■ 本番・Preview 運用
================================================================

正本: docs/forge-triage-operations.md §8

フロー:
preview/landing-01 実装 → Preview 確認 → main --ff-only merge → push → preview 同期

禁止:
- Preview 未確認の main 反映（オーナー明示省略以外）
- main のみ進めて preview を放置
- Site URL を Preview に変更（メール認証等に影響）

================================================================
■ Forge 原典・判断（要約）
================================================================

コアループ: 発見 → プレイ → 初声 → 次に直すこと → 次版
原典: docs/forge-principles.md
事業仮説: docs/forge-business-hypothesis.md
out-of-scope: docs/out-of-scope.md

判断優先: 原典 → ユーザー価値 → 開発者価値 → 技術
作らない: 投げ銭 / 販売 / SDK 実装（説明 UI 除く）

ログイン方針:
- 発見は公開。プレイ以降はログイン必須。ボタン隠さず /login へ
- 共有本番データを localStorage に保存しない（下書き・UI 状態のみ）

================================================================
■ トリガー運用（要約）
================================================================

正本: docs/forge-triage-operations.md

| トリガー | 意味 |
|----------|------|
| CURSOR | ChatGPT が Cursor 貼付用完成文 1 本 |
| Run スクショ | [A]〜[D] Run 判断 |
| handoff 貼付 | 要約ではなくレビュー |
| UX 違和感 | プロダクトレビュー依頼 |

Cursor 完了時: docs/forge-changelog.md 更新。handoff は節目のみ（今回更新済み）。

================================================================
■ オーナー判断が必要な操作（§10.2）
================================================================

課金 / 新 API 契約 / 本番公開方針変更 / PLAYER_VISIBLE=true /
破壊的 DB / データ移行 / 原典変更 / ロードマップ順位変更 / 不可逆 ops

設計→実装→build→staging→main 準備は Cursor 一気通貫可（上記以外）。

================================================================
■ 参考ドキュメント
================================================================

| ファイル | 用途 |
|----------|------|
| docs/forge-handoff.md | Cursor 現在地（今回更新） |
| docs/forge-changelog.md | 体験・仕様の変更履歴 |
| docs/x-auth-setup-runbook.md | X OAuth 設定・E2E |
| docs/public-feedback-041-apply-runbook.md | 041 適用手順 |
| docs/forge-principles.md | プロダクト原典 |
| AGENTS.md / docs/forge-triage-operations.md | 開発・deploy ルール |

画面マップ・2026-06 以前の詳細スナップショットは docs/forge-screen-inventory.md 等を参照。
（本ファイルは 2026-07-06 時点の全量スナップショットに刷新。）
