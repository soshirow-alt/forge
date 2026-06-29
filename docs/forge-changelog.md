# Forge Changelog（体験・仕様の変更履歴）

コードの commit 履歴ではなく、**ユーザー体験**と**サービス仕様**がどう変わったかを記録する。

---

---

## 2026-06-28 — 作品情報モーダルの整理・Studio から対応環境・リンクを分離

- **作品情報モーダル** — タイトル直後に **作品紹介**（自由記述）。ジャンル・特徴タグは **＋** で開く折りたたみ
- **作品の特徴カード** — 編集フォームから廃止（**特徴タグ**に統一）。保存時に旧 `overview_features` はクリア
- **Studio** — **配布・リンク** ボタン1つ（対応環境＋関連リンクを専用モーダルに集約。「作品情報を編集」と「問いを設定」の間）

---

- **ジャンル** — `/projects/{id}/edit`（作品情報モーダル）を **選択式** に（`/submit` と同じ `FORGE_GENRE_OPTIONS`）
- **見出し** — 「作品紹介・見どころ」→ **作品紹介**（見どころカードはその下のサブセクションのまま）
- **タグ欄** — 旧 `AVAILABLE_TAGS`（ジャンルと特徴の混在）を廃止。**特徴タグ**（`FORGE_FEATURE_TAG_OPTIONS`）のみに統一（`/submit` と同型）
- **検索** — `/search` の特徴タグ絞り込みは `projects.tags` の特徴タグを参照（ジャンルは `genre` 列＋検索時フォールバック）

---

## 2026-06-28 — Studio 編集 UX・特徴選択式・公開/非公開表記

- **Studio** — 「作品紹介・見どころを編集」と「作品情報を編集」を **作品情報を編集** に統一。右隣に **問いを設定**（いずれもモーダル）
- **作品情報** — フォーム内の版問いブロックを削除（問いは Studio の専用ボタンのみ）
- **特徴カード** — 見出しを **選択式**（探索 / 戦闘 / … / その他）。その他は見出し 20 字・説明 120 字まで自由記述
- **公開設定** — ラジオ表記を **公開 / 非公開** に統一（「公開中」「下書き」を廃止）
- **旧 URL** — `/projects/{id}/edit` は Studio の作品情報モーダルへリダイレクト

---

## 2026-06-28 — 作品説明と作品紹介を統一・版問いをモーダル化

- **統一** — 開発者は **作品紹介**（長文）だけ入力。一覧・カード・ヒーロー用の短い `description` は先頭から自動生成（最大 160 字付近）
- **編集** — `/projects/{id}/edit` の「説明」欄を廃止。作品紹介・見どころは **「更新する」1 回**で保存（別ボタン廃止）
- **投稿** — `/submit` も「作品紹介」1 欄に統一
- **版問い** — `/submit`・`/projects/{id}/edit` で **「問いを設定」ボタン → モーダル**。フォーム本体からは外し、任意設定であることを明示

---

- **追加** — `docs/forge-triage-operations.md` **§8**（Preview push → 確認 → 本番 → Preview fast-forward）。`AGENTS.md`・`.cursor/rules/forge.mdc` に要約
- **方針** — `origin/main` と `origin/preview/landing-01` を常に同一 commit に保つ（本番だけ先に進めない）

---

## 2026-06-28 — 配布形式 ? アイコンの視認性を微調整

- **変更** — アクセス方法フォームの **?** をわずかに大きく・明るく（枠・文字・背景のコントラストのみ）。目立ちすぎない程度

---

## 2026-06-28 — 配布形式 3 択に ? ツールチップ

- **追加** — `/submit` の「テスターのアクセス方法」と `/projects/{id}/edit` の「配布形式」で、**ブラウザプレイ / ダウンロード / 外部サイト** 各ラベル横に **?** アイコン
- **操作** — マウスホバー（または ? にフォーカス）で、それぞれいつ選ぶかの説明を表示。既存ラベル・補助文は変更なし

---

## 2026-06-28 — 「外部リンク」の表記を用途別に分離

- **配布形式 / テスターのアクセス方法** — 第3選択肢を **外部サイト** に統一（Steam 等へ誘導してプレイする形）。内部タグ `配布:外部リンク` は互換のため変更なし
- **Steam / Discord / SNS 欄** — 見出しを **関連リンク** に変更（`/submit`・`/projects/{id}/edit`・`/games/{id}` サイドバー）
- **説明文** — プレイ URL・配布形式と関連リンクが別物であることをフォーム上で明示

---

## 2026-06-28 — 外部リンク入力をグループ化・追加式 UI に

- **変更** — `/submit` と `/projects/{id}/edit` の外部リンクを **3 グループ**（ストア・配布先 / コミュニティ・広報 / 開発情報）に整理
- **変更** — 7 件すべてを最初から表示せず、グループ内の **＋ ボタン** で必要なリンク種別だけ入力欄を開く。× で削除
- **既存 URL** — 編集画面では保存済みリンクは自動で入力欄を表示
- **自動入力** — Discord / X / YouTube / 公式サイトは開発者プロフィール（X・Web）または **他作品で最後に使った URL** を空欄に初期入力（Steam / itch / GitHub は作品ごと）

---

## 2026-06-28 — 開発者プロフィールに Discord / YouTube を追加

- **追加** — `developer_profiles.discord_url` / `youtube_url`（**migration 032**）。初回登録フォームでも入力可
- **表示** — `/creators/{id}` に Discord・YouTube リンクを表示（X・公式サイトと並列）。プロフィール未設定時は **過去作品の URL をフォールバック表示**
- **同期** — 作品投稿・編集で Discord / YouTube / X / 公式を保存したら、開発者プロフィールにも自動反映（次回以降の prefill と公開プロフィール用）
- **作品詳細** — 従来どおり作品に保存した外部リンクは `/games/{id}` サイドバーにも表示
- **オーナー** — Supabase Dashboard で `032_developer_profile_social_links.sql` を適用

---

## 2026-06-28 — 月間影響度ランキングを本番で開放

- **変更** — `/rankings/influence` の Coming Soon を解除。本番は **Supabase RPC `get_monthly_player_influence_ranking`**（019、030 で privacy 除外）の実データを表示
- **空状態** — 当月にスコア > 0 のプレイヤーがいない月は「データはまだありません」を表示（mock 順位表にフォールバックしない）
- **月選択** — 本番は 2026-01 以降の UTC 月次カタログ。デフォルトは当月
- **先月 TOP3** — 前月の RPC 結果から表示（なければ空）
- **プレイヤーリンク** — 公開プロフィール UI 未実装のため本番では名前のみ（Preview は従来どおり `/players/` リンク可）
- **読み込み** — 取得完了まで mock 順位を表示しない（一瞬 mock が見える問題を修正）
- **前提** — migration **019** 適用済み。**030** で「ランキングに表示」OFF のユーザーは集計から除外
- **未開放** — Studio 月間開発ランキング（`/studio/rankings`）・Studio ホーム「今週の伸び」は Coming Soon のまま

---

## 2026-06-28 — 公開開発者プロフィールからフォロワータブを削除

- **削除** — `/creators/{id}` の「フォロワー」タブ（Coming Soon の一覧。RLS 上フォロワー行は非公開のため初期版では実装しない）
- **変更** — フォロワー**数**のみプロフィールヘッダー（@handle の横）に表示
- **残す** — Studio `/studio/mypage?tab=followers` の本人向けフォロワー一覧（028）

---

## 2026-06-28 — 設定から voice 通知 OFF・タブ単位の公開設定を削除

- **削除** — Studio 通知「届いたフィードバック」の ON/OFF（フィードバック通知は常に届く）
- **削除** — Studio 公開設定の「活動履歴を公開」「フォロワー一覧を公開」（タブ単位の非公開は意味が薄いため）
- **残す** — 「開発者プロフィールを公開」のみ（/creators/ 全体の公開・非公開）
- **migration 031** — voice 通知トリガーから設定参照を除去（030 適用済み環境向け）
- **オーナー** — Dashboard で `031_voice_notifications_always_on.sql` を適用

---

## 2026-06-28 — 設定画面の通知・プライバシー・公開設定を Supabase 保存

- **変更** — `/settings`・`/studio/settings` の通知 / プライバシー / Studio 公開設定トグルを **Supabase `user_settings` に保存**（mock local state 廃止）
- **反映** — Player「更新を追っている作品」OFF → devlog / 新版 / 確認依頼通知を送らない。ランキング OFF → 月間影響度ランキングから除外（UI は Coming Soon）
- **反映** — Studio「開発者プロフィールを公開」OFF → 他人から `/creators/` は 404
- **migration 030** — `user_settings` テーブル + 通知フィルタ RPC + ランキング連携
- **未反映（保存のみ）** — プレイヤープロフィール公開 / 活動表示、developer-follow / community / witness 等の通知種別

---

## 2026-06-28 — 設定画面のアカウント退会を最下部へ

- **変更** — `/settings`・`/studio/settings` でアカウント退会を **通知・プライバシーの下** に移動。赤枠カードをやめ、他セクションと同じ見た目＋テキストリンクに

---

## 2026-06-28 — アカウント設定（パスワード・メール・退会）

- **追加** — `/settings` と `/studio/settings` に **実アカウント管理**
  - **パスワード変更** — 現在のパスワード確認 → 更新 → 自動ログアウト → `/login` で再ログイン
  - **メール変更** — 現在のパスワード確認 → 新アドレスへ確認メール → リンクで完了
  - **アカウント退会（匿名化）** — 「退会する」入力＋パスワード確認。プロフィール名を「退会済みユーザー」に置換、個人向けデータ（ブックマーク・通知・フォロー等）削除。**フィードバック・初声など作品に残った記録は匿名のまま保持**
- **migration 029** — `anonymize_own_account_data` RPC + `account_anonymizations` テーブル
- **API** — `POST /api/account/anonymize`（Service Role で Auth ユーザーを無効化）
- **オーナー** — Supabase Dashboard で `029_account_anonymization.sql` を適用。**`SUPABASE_SERVICE_ROLE_KEY` が Vercel 本番 env に無いと退会の最終段階が失敗**
- **外部ログイン** — Google/Discord/GitHub のみのアカウントはパスワード・メール変更不可（退会は確認フレーズのみ）

---

## 2026-06-28 — ログインのパスワードマネージャー自動入力

- **原因** — ログインフォームに `name` が無く React の controlled input がブラウザの autofill を上書きしていた。Studio 導線は `/login?return=/studio` など URL がばらついていた（return は post-login では未使用）
- **修正** — `name` / `autoComplete="username"` / フォーム `autoComplete="on"`、初回描画の readOnly 解除。Studio 未ログイン導線は `/login` に統一
- **確認** — 本番 URL（`forge-flame-gamma.vercel.app`）で保存した資格情報が `/login` で自動入力されること（Preview URL とは別エントリ）

---

## 2026-06-28 — Preview 確認済み変更の本番反映

- **反映** — Studio 作品一覧・削除、本番モード mock エンゲージメント非表示、マイページプレイ履歴タブ分離、Studio フォロワー一覧（migration 028 要適用）
- **オーナー** — 本番 Supabase に **028** 未適用なら Dashboard で適用。フォロワータブが migration 未適用バナーになる

---

## 2026-06-28 — Studio フォロワー一覧（実データ）

- **追加** — `/studio/mypage?tab=followers` に **実フォロワー一覧**（フォロー日・表示名。開発者プロフィールがあるフォロワーは `/creators/` へリンク）
- **migration 028** — `list_developer_followers_for_owner` RPC（**ログイン中の開発者本人のみ** が自分のフォロワー行を取得）
- **オーナー** — Supabase Dashboard で `028_developer_followers_list_for_owner.sql` を適用（027 と同様）

---

## 2026-06-28 — マイページ「更新追跡中」からプレイ履歴を分離

- **変更** — **更新追跡中**タブは「前回プレイ後の更新」「更新を追っている作品」「あとで遊ぶ」のみ。**プレイ履歴**は **プレイ履歴**タブ専用
- **確認** — `/mypage`（更新追跡中）にプレイ履歴ブロックが出ない / `/mypage?tab=play-history` で表示

---

## 2026-06-28 — マイページ「あとで遊ぶ」に mock 作品が残る問題

- **原因** — Preview 時に Supabase `project_bookmarks` へ保存した mock ID（例: `rift-runner`）を、本番同等モードでも mock カタログから表示していた
- **修正** — 本番同等モードではエンゲージメント（保存・更新追跡・プレイ）の解決を **実データのみ** に限定
- **データ** — DB 上の bookmark 行は残るが UI には出ない（不要なら Dashboard SQL で削除可）

---

## 2026-06-28 — 作品削除が witness 付与済みで失敗する問題

- **原因** — `project_witness_grants` の append-only トリガーが `ON DELETE CASCADE` もブロック。RLS に owner 向け DELETE ポリシーが無かった
- **migration 027** — `supabase/migrations/027_project_owner_delete_cascade.sql`（UPDATE のみ append-only、owner の CASCADE DELETE を許可）
- **UI** — 削除失敗時に migration 未適用を示すメッセージを表示
- **オーナー** — Supabase Dashboard SQL で 027 適用後、witness-sandbox 含む作品削除を再確認

---

## 2026-06-28 — production-mode 監査と再発防止

- **追加** — `docs/production-mode-audit.md`：`shouldHideV0MockContent()` 分岐の高/中/低リスク一覧、禁止ルール、リリース前チェックリスト（6 URL）
- **追加** — `npm run verify:production-mode-guards`（`isPreviewV0Deployment` 漏出・Preview 機能ガードの静的検知）
- **是正** — `/studio/mypage`：Preview でも **実作品がある場合は本番と同じ DirectoryPanel**（mock グリッドとの丸ごと差し替えを縮小）
- **方針** — Coming Soon 配線より先に監査・ガード。Preview だけで main/prod GO しない

---

## 2026-06-28 — Studio プロジェクト一覧を実データグリッドに復元

- **修正** — `/studio/mypage` 本番同等モードで誤って出ていた「あなたの作品」枠を削除（`/studio` ホームのみに集約）
- **復元** — プロジェクト一覧タブに **実データのグリッド/リスト**（検索・公開状態ピル・並び替え・新着ワッペン）。mock 非表示時の空白を解消
- **削除** — 各作品カードに **削除** を表示（確認モーダル付き）。Preview 限定ガードを撤廃し本番 hostname でもオーナー削除可
- **確認** — `/studio/mypage` → グリッドカード表示・カード下 **削除** / `/studio` → 「あなたの作品」は最大3件のみ

---

## 2026-06-28 — Studio 作品一覧に削除を復活（Preview のみ）

- **追加** — `/studio`・`/studio/mypage` の「あなたの作品」カード右端に **削除**（Preview / ローカル preview ブランチのみ。本番 hostname では非表示）
- **確認** — 削除タップ → モーダルで作品名確認 → **削除する** で Supabase から作品削除
- **本番** — `forge-flame-gamma.vercel.app` ではまだ削除ボタンなし（別 GO で本番解禁可）

---

## 2026-06-26 — ログイン等の Enter 送信を復旧

- **修正** — 認証フォーム（ログイン・登録・パスワード再設定）で Enter キーが `requestSubmit()` されるよう統一
- **確認** — `/login` でメール・パスワード入力後 Enter → ログイン実行

---

## 2026-06-26 — 運営へのご意見を Resend でメール通知

- **API** — `POST /api/platform-feedback`（DB 保存 + Resend 通知）
- **届き先** — `forge.operation@gmail.com`（`PLATFORM_FEEDBACK_NOTIFY_EMAIL` で上書き可）
- **env** — `RESEND_API_KEY`（必須）、`RESEND_FROM_EMAIL`（任意）、`PLATFORM_FEEDBACK_NOTIFY_EMAIL`（任意）
- **挙動** — DB 保存は成功・メール失敗時もユーザーには受付完了を表示（運営は Dashboard でも確認可）
- **オーナー** — Resend で API キー発行 → Vercel Production / Preview に設定。初回は `onboarding@resend.dev` 利用時に受信先メールを Resend で検証

---

## 2026-06-26 — 運営へのご意見モーダル表示修正

- **原因** — サイドバー内で `position: fixed` していたため、オーバーレイとパネルが正しく重ならず半透明に見えていた
- **修正** — `V0SimpleModal` を `document.body` に portal、`z-[100]` + 不透明パネル（`bg-zinc-950`）
- **確認** — `/home` サイドバー「送る」→ モーダルが画面中央で読める

---

## 2026-06-26 — 運営連絡先メール差し替え

- **変更** — 利用規約・プライバシーポリシーの問い合わせ先を `forge.operation@gmail.com` に統一（`lib/legal-routes.ts`）
- **確認** — `/terms` 第15条・`/privacy` お問い合わせ窓口

---

## 2026-06-26 — サイドバー「運営へのご意見」

- **追加** — Player / Studio サイドバー下部にご意見ボックス。種類（不具合・ご要望・サービスへのご意見・その他）+ 本文（10〜2000字）
- **送信** — ログイン必須。Supabase `platform_feedback` に保存（migration **026** — Dashboard 手動適用）
- **運営確認** — Supabase Dashboard（アプリ内 admin UI なし）
- **確認** — `/home` または `/studio` でサイドバー下部 → 送る → モーダル送信

---

## 2026-06-26 — LP ヒーロー背景を「明るい未来」寄りに差し替え

- **背景** — `public/images/landing/hero-bg.png`（`landing-hero-bg.png` も同期）を夜の城・ランタンから、夜明けの道→光の街へ進むイラストに更新
- **利用箇所** — LP `/`、Auth レイアウト左ペイン（変更なし・パス同一）
- **確認** — `/` と `/login` で左テキスト可読性、右側の朝日が過剰に眩しくないか

---

## 2026-06-26 — 本番デプロイ開始（silent verification）

- **main 反映** — `preview/landing-01`（`8110ccf`）を `main` に fast-forward merge & push。Vercel Production ビルド開始
- **本番 URL** — https://forge-flame-gamma.vercel.app（外部告知なし・オーナー検証用）
- **次（未実装・記録）** — 問題報告 / Forge FB 用フォームをサイドバーに追加（マネタイズ示唆の収集も想定）

---

## 2026-06-28 — 本番GO前 P1 修正（catalog / 通知バッジ / settings 保護）

- **catalogReady** — `dataReady` を Supabase 作品 fetch 完了まで false に。`/search` 初回の誤「0件」を防止
- **/search** — 本番モードで catalog 未準備時は「読み込み中…」表示
- **PlayerShell** — 通知バッジ固定値 4 を廃止。未ログイン 0 / ログイン時は未読件数
- **/settings** — 本番モードで middleware ログイン必須（mock 設定 UI の露出防止）
- **QA** — `npm run start` + production mode で hydration 警告なし（dev overlay 由来だった）

---

- **ノイズ除去** — ルート `.tmp-*` 作業ファイル削除、`eslint.config.mjs` に `.tmp-*` ignore 追加
- **分類結果** — 73 errors → **A: 1件** → **修正済**、**B: 72件**（deploy 後許容）、**C: 38 warnings**
- **A修正** — `/notifications` の early return 後 `useMemo` をインライン filter に変更（rules-of-hooks 解消）
- **build** — 影響なし（`npm run build` PASS 維持）
- **次** — main 向け PR → Supabase redirect / Vercel env 確認 → merge / deploy GO

---

## 2026-06-28 — はじめてガイドに Studio 導線の説明

- **追加** — プレイヤー `/guide` に「開発者の方へ」セクション。右上 **Studio** ボタンのキャプチャ付きで遷移方法を説明
- **確認** — `/guide` → プレイヤーの流れの下、よくある質問の上

---

## 2026-06-28 — ログイン画面の Auth ヘッダー整理 + パスワード再設定

- **ヘッダー** — ログイン/登録画面右上の「発見する」「Studio」「ヘルプ」を削除。Forge ロゴ + 新規登録/ログインのみ
- **パスワード再設定** — 「パスワードをお忘れの方」→ `/login/forgot-password`。メールリンク → `/auth/reset-password`
- **確認** — `/login` のリンク・ヘッダー、`/login/forgot-password` でメール送信 UI

---

## 2026-06-28 — OAuth を Coming soon に固定

- **変更** — `/login`・`/register` の Google / Discord / GitHub ボタンを廃止し **Coming soon** 表示。メール登録・ログインのみ
- **理由** — Supabase 側プロバイダー未設定のまま押せるとエラーになる。初期版では OAuth 設定を後回し
- **確認** — ログイン画面に押せない Coming soon、メールログインは従来どおり

---

## 2026-06-28 — OAuth ボタンを Supabase 設定完了まで非表示

- **原因** — Supabase で Google / Discord / GitHub が未有効のままボタンを押すと、Supabase 側 JSON エラー（`provider is not enabled`）に遷移していた
- **変更** — `NEXT_PUBLIC_FORGE_OAUTH_ENABLED=true` のときのみ OAuth ボタン表示。未設定時は「準備中」文言 + メールログインのみ
- **オーナー作業** — `docs/supabase-owner-operations.md` §OAuth を参照（Providers 有効化 → env → 再デプロイ）

---

## 2026-06-27 — LP の v0 モック非表示（本番同等）

- **変更** — 本番同等モードの `/` で **星灯の旅路** 等の mock 作品カードと **v0.4.0 お知らせ** を非表示。実公開作品があれば最大5件を Supabase から表示
- **preview 専用** — `FORGE_PRODUCTION_MODE` 未設定時のみ LP mock を表示（ガワ確認用）
- **確認** — Preview（本番同等 ON）で `/` → mock 作品・偽お知らせが出ないこと

---

## 2026-06-27 — `/` を常に LP 入口に（preview 含む）

- **変更** — 未ログインで `/` を開いたとき **常にランディング**（preview 専用の `/`→`/home` middleware を廃止）。ログイン済みのみ `/home` へ
- **導線** — LP の「ゲームを探す」→ `/home`（未ログインのまま発見へ）。`/landing` は `/` へリダイレクト
- **確認** — Preview URL をログアウト状態で開く → LP。ログイン済みなら `/home`

---

## 2026-06-27 — Studio 通知設定「届いたフィードバック」表記

- **変更** — Studio 通知トグル **プレイヤーの声** → **届いたフィードバック**（「声」はユーザーに伝わらないため）
- **確認** — `/settings`・`/studio/settings` の Studio 向け通知

---

## 2026-06-27 — 本番同等モードの `/` を LP 出し分けに

- **変更** — `NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true` 時、`/` は未ログインなら **ランディング**、ログイン済みなら **`/home` へリダイレクト**。preview 専用の `/`→`/home` 強制は本番同等モードでは無効（REL-0-02）
- **LP 導線** — 「ゲームを探す」等を `/home`・`/search` へ。Studio CTA は `/login` へ
- **プレイヤー発見は公開のまま** — 原典どおり `/home`・`/search`・作品詳細の閲覧はログイン不要。Studio のみログイン必須（開発者ワークスペース）
- **確認** — Preview（本番同等フラグ ON）で `/` が LP、`/home` は未ログインでも閲覧可、Studio はログイン必須

---

## 2026-06-27 — はじめてガイドのプレイヤー流れ修正

- **変更** — メインの 4 ステップを学習ループに合わせて **更新を追う** で締める。**保存** は流れから外し、FAQ「保存作品とは？」で別軸として説明
- **確認** — `/guide` の「プレイヤーの流れ」が 4 ステップ、最後が「更新を追う」

---

## 2026-06-27 — 設定の通知トグル整理（MECE・表現更新）

- **Player** — 「開発ログの公開」と「フォロー中の開発者」の重複感を解消。**更新を追っている作品**（watch 対象の開発ログ・新版・確認依頼）と **フォロー中の開発者**（新作公開のみ）に分離。**参加コミュニティ**（申請結果・お知らせ）を追加
- **共感** — 通知設定から削除（共感 UI はあるが、通知配信は未接続）
- **Studio** — 「新しいフィードバック」「Devlog の反応」の重複を **届いたフィードバック** に統合。**正式ver関連** を削除。**コミュニティ**（参加申請等）を追加
- **確認** — `/settings`・`/studio/settings` の通知セクション

---

## 2026-06-27 — パンくず導線の廃止

- **変更** — 作品検索・作品詳細・開発者プロフィール・ランキング等にあった `ホーム › …` パンくずを全画面で削除
- **理由** — 表示の有無がバラバラで、経路も誤ることがあった。サイドバー・H1 で十分
- **確認** — `/search`・`/games/[id]`・`/creators/[id]`・ランキング画面にパンくずが出ないこと

---

## 2026-06-27 — 「見届ける」と「見届け人」の UI 文言分離

- **作品詳細** — ボタン「見届ける」→ **「更新を追う」** / ON 時 **「更新を追跡中」**。初回 ON 時に見届け人称号との違いを1回だけ説明
- **マイページ** — タブ **「更新追跡中」**、一覧 **「更新を追っている作品」**。バッジも「更新追跡中」
- **人数表示** — 作品詳細・検索等の集計ラベルを **「見届け人」** に統一（grant 人数）。watch ボタンとは別概念
- **称号** — 「見届け人」はそのまま（正式版到達時の付与）
- **正本** — `lib/watch-ui-labels.ts`

---

## 2026-06-27 — 設定・プロフィール画面の表記統一

- **設定** — Player / Studio とも画面タイトルは **「設定」** のみ（Studio 側の「Studio 設定」を廃止）。説明文どおり同一設定を両方から開ける見え方に
- **サイドバー** — 「Playerプロフィール」「Studioプロフィール」に変更（旧: プレイヤー・プロフィール / 開発者・プロフィール）
- **プロフィール画面** — 見出しも同表記（旧: 小見出し +「マイプロフィール」）

---

## 2026-06-27 — 本番モード v0 モック漏れ（開発者を探すほか）

- **症状** — `/search/creators`（開発者を探す）に Sora Games 等の存在しない開発者が128人表示
- **原因** — `developer-search-v0-page` が `developerSearchResults` モックを無条件表示（他画面と同型の漏れ）
- **修正** — 本番モードでは公開作品を持つ実開発者のみ一覧。フォロー・フォロワー数は Supabase 連携
- **同時修正** — `/players/[handle]` 公開プロフィールは本番で 404（モックプレイヤー非表示）
- **横断確認（本番で OK）** — ホーム/作品検索（merge ゲート済み）、通知（DB のみ）、マイページ FB/実績（Coming Soon）、影響度ランキング（Coming Soon）、Studio ホーム/ランキング/フォロワー（ゲート済み）
- **未接続（意図的 Coming Soon / 低優先）** — 設定画面の通知トグル UI、Studio 実績、プレイヤー公開プロフィール実データ

---

## 2026-06-27 — 参加コミュニティ画面でナビが効かなくなる不具合

- **症状** — サイドバー「参加コミュニティ」（`/mypage/community`）を開くと、他画面へ遷移できなくなる
- **原因** — 本番モードで `useCommunityBoard` に毎レンダー新しい `[]` を渡し、Supabase 取得 effect が無限ループ → UI がフリーズ
- **修正** — 安定した空配列定数を使用。membership 取得は try/finally で必ず `loaded` を true に
- **確認** — `/mypage/community` 表示後、ホーム・通知等のサイドバー遷移が通常どおり動くこと

---

## 2026-06-27 — プレイヤー・マイプロフィールの v0 モック非表示

- **症状** — `/mypage/profile` に「しゃねこ」・送ったFB 87 等、未入力のモックプロフィールが表示
- **修正** — 本番モードではログイン名・見届け中/フォロー実数のみ。自己紹介・実績・最近の活動のモックは非表示
- **注記** — プロフィール編集の永続化は未実装（セッション内のみ）。FB/共感件数は集計接続まで 0

---

## 2026-06-27 — 実作品の開発ログが v0 モックにフォールバックしていた不具合

- **症状** — 開発ログ未投稿の実作品でも「チュートリアル短縮…」等（星灯の旅路モック）が 8 件表示
- **原因** — `useGameDevlogsV0` が Supabase 実データが空のとき `getDevlogsForGame()` のモックへフォールバック
- **修正** — 実作品（UUID）は実 devlog のみ表示。0 件なら空状態。概要の「最終更新」も未投稿時は `—`
- **確認** — 実作品 `/games/[uuid]?tab=devlog` でモック文言が出ないこと

---

## 2026-06-27 — Studio 本番モードで v0 モックを非表示

- **原因** — `NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true` でも Studio ホーム・ランキング等が `studio-*-v0-mock-data` を無条件表示していた
- **Studio ホーム** — 「今週の伸び」（霧の駅・星灯の旅路等）と「最近の動き」を非表示。ランキング枠は準備中パネル
- **Studio ランキング** — 月間開発ランキング全体を準備中パネルに（`app/studio/rankings/page.tsx` でサーバー側ゲート + `force-dynamic`）
- **Studio 通知** — モック通知リストを非表示（空状態）
- **Studio マイページ** — 実績・フォロワータブのモックを準備中パネルに
- **Studio プロフィール** — ログインユーザー名・実作品数のみ表示（しゃねこ等のモックプロフィール非表示）
- **Studio シェル** — 通知バッジのデフォルト `3`（モック）を `0` に

---

## 2026-06-27 — モーダル配置・初声 UI の v0 統一（全体確認）

- **実作品**（`PostPlayVoiceOverlay`）— 画面下段のオレンジボトムシート → v0 同型の **中央モーダル**（backdrop・紫 CTA・× 閉じる）
- **v0 モーダル共通** — `feedback-v0-modals` の `ModalShell`・`V0SimpleModal` もモバイルで下段 (`items-end`) だったのを **常に中央** に統一
- **オーバーレイ内フォーム** — `GameVoiceSection` の `embedded` 時の送信ボタン・完了文言を紫 v0 トーンに（モーダル内だけ）
- **確認済みで問題なし** — 通報・コミュニティ申請・Gacha・ModifyGame・PlayLaunch 等の他ダイアログはもともと中央配置
- **未使用** — `game-detail-page-client.tsx`（旧詳細）はルート未接続のまま（`/games/[id]` は `GameDetailV0Page`）
- **別テーマ** — ページ内 CTA のオレンジグラデ（ホーム・Studio・サイドバー等）は v0 全面移行の別作業

---

## 2026-06-27 — future-demo 作品を非公開化（オーナー依頼）

- `npm run hide:future-demo:staging` — 本番 Supabase の `[future-demo]` 32 件を `visibility: private` に変更
- 発見ホーム（本番モード Preview 含む）から遠雷の譜・琥珀の回廊等が消える
- 復元: `npm run show:future-demo:staging`

---

## 2026-06-27 — 登録済みメールの新規登録エラー表示

- Supabase は登録済みメールでも error を返さず `identities: []` で成功扱いすることがある → `/auth/verify-email` へ誤遷移していた
- `signUp` で `identities` 空を検知し **「このメールアドレスは既に登録されています。」** + ログインリンクを表示

---

## 2026-06-27 — community_memberships RLS 無限再帰 fixup（025）

- **症状** — Supabase Logs: `infinite recursion detected in policy for relation "community_memberships"` / GET `community_memberships` が 500
- **原因** — migration 018 の approved 同士 SELECT ポリシーが `community_memberships` を RLS 下で再参照
- **fix** — `025_community_memberships_rls_fixup.sql`（`is_approved_community_member(text, uuid)` SECURITY DEFINER + ポリシー差し替え）
- **オーナー** — Supabase Dashboard SQL で 025 を本番適用（018 再 RUN 不要）
- **確認メール未着** — 本件とは別経路（Auth ログの signup を確認）。ただしコミュニティ系 500 はログイン後 E2E を止める

---

## 2026-06-27 — 確認メール待ち / welcome を v0 Auth Shell に統一

- `/auth/verify-email`・`/auth/welcome` — 旧オレンジ単体画面から `/register` 同型の **2 カラム Auth Shell**（紫グラデ・ヘッダー/フッター）へ
- welcome の CTA を `/home` に（発見ホーム）
- 確認メール再送のレート制限エラーを日本語表示
- `docs/supabase-owner-operations.md` — Preview callback URL とメール未着チェックリスト追記

---

## 2026-06-27 — ログイン/新規登録 OAuth 配線

- `/login`・`/register` の Google / Discord / GitHub ボタンを Supabase OAuth に接続（従来は stub で反応なし）
- コールバック: 既存 `/auth/callback` → ログイン後は return 先、新規登録は `/auth/welcome`
- 新規登録の SNS は規約同意チェック必須。未設定プロバイダーはボタン直下にエラー表示
- **オーナー作業**: Supabase Dashboard で各プロバイダー有効化 + Redirect URL に Preview/本番の `/auth/callback` を登録

---

## 2026-06-27 REL-2-07 — 通報導線（最低限）

- migration **024** — `content_reports`（理由コード + 補足 + 対象種別）
- 本番: `/games/[id]`（実作品）・コミュニティ投稿・`/creators/[id]` に「通報」→ ログイン後モーダル送信
- 運営者確認は Supabase Dashboard（アプリ内 admin UI なし）
- 設計: `docs/rel-2-07-content-reports-design.md`

---

## 2026-06-27 — Phase 2 migration 本番 Dashboard 適用確認（オーナー）

- **015〜020** — 本番 DB 確認 SQL すべて `ok: true`
- **021・022** — 適用済
- **023** + RLS fixup — 適用済
- **024** — 適用済（通報。E2E 未実施）
- **Phase 2 コード Issue（2-01〜2-07）** — 配線済。次は Preview E2E 一括

---

## 2026-06-27 REL-2-06 — コミュニティ Supabase 配線

- migration **018 + 020** 前提 — `developer_communities` / `community_memberships` / `community_posts` / `community_replies` を本番正本
- 本番: localStorage コミュニティ join / 開設 store 無効。mock 掲示板フォールバック禁止
- `/studio/community` — DB から自分の community ensure・pending/approved 一覧・スレッド/返信
- `/mypage/community` — 承認済み参加一覧 + 掲示板
- `/creators/[id]`（実プロフィール）— コミュニティ参加申請 UI
- Studio オンボーディング承諾 — 本番は `ensureDeveloperCommunity` のみ
- 設計: `docs/rel-2-06-community-supabase-design.md`

---

## 2026-06-27 REL-2-05 — 開発者フォロー Supabase 配線

- migration **023** + RLS fixup 適用済 — `developer_follows` 正本
- 本番: `/creators/[id]`・`/games/[id]`（実作品）でフォロー / 解除トグル。フォロワー数は count RPC
- `/mypage`「フォロー中」タブ — ログイン中ユーザーのフォロー開発者一覧（公開作品数付き）
- 自分自身・作品オーナー preview ではフォロー UI 非表示。フォロワー一覧タブは件数のみ（一覧は Coming Soon）
- Preview mock の localStorage フォローは本番モードでは無効

---

## 2026-06-27 REL-2-05 — 開発者フォロー（設計確定）

- migration **023** — `developer_follows` + count RPC
- 正本: `developer_user_id`（開発者 user UUID）。RLS: 本人の follow 行のみ SELECT。フォロワー数は RPC
- 設計 GO 済み — Dashboard 適用 GO は SQL レビュー後

---

## 2026-06-27 REL-2-05 — 開発者フォロー（設計草案）

- migration **023** `developer_follows`（021・022 使用済みのため 024 不要）
- 正本キー: `developer_user_id` = 開発者の `auth.users.id`
- 設計: `docs/rel-2-05-developer-follows-design.md`
- REL-2-06 / 2-07 とは分離

---

## 2026-06-27 REL-2-01 — 外部リンク Supabase 配線

- migration **021** 適用後 — `x_url` / `youtube_url` を DB 正本化
- 表示順: Steam → itch → Discord → X → 公式 → YouTube → GitHub（`lib/game-links.ts` 単一正本）
- submit / edit / `/games/[id]` v0 で保存・表示一貫。未設定は非表示
- 作品 X と開発者 `x_account` はフォールバックしない

---

## 2026-06-27 REL-2-01 — 外部リンク（設計草案）

- migration **021** SQL 草案（`x_url`, `youtube_url`）
- 設計詳細: `docs/rel-2-01-external-links-design.md`
- 表示順: Steam → itch → Discord → X → 公式 → YouTube → GitHub
- v0 作品詳細への外部リンク UI 追加を実装タスクに含める

---

## 2026-06-27 REL-2-02 — 作品概要・見どころ Supabase 配線

- migration **022** 適用後 — `overview_introduction` / `overview_features` を DB 正本化
- **読み取り**: `/games/[id]` 実作品は DB のみ（本番・実 UUID で localStorage overlay 無効）。紹介は introduction → description フォールバック
- **書き込み**: `/projects/[id]/edit#overview`（正本）。Studio から編集リンク
- 特徴カード: 片方のみ入力時は保存拒否（「タイトルと説明の両方を入れてください」）
- submit フォームには概要欄を追加しない（edit のみ）

---

## 2026-06-27 REL-2-02 — 作品概要・見どころ（設計確定）

- migration **022** SQL 草案 + `docs/rel-2-02-project-overview-design.md`
- オーナー確定: 紹介フォールバック（introduction → description）、概要は edit のみ、空カード保存ルール、localStorage 二重正本禁止
- **migration 022 Dashboard 適用 GO**（2026-06-27）— アプリ実装は適用確認後

---

## 2026-06-27 REL-2-04 追補 — FB統計ラベル

- 実作品詳細の FB 指標は **distinct user_id（人数）** — UI ラベル **「FBした人」**（「フィードバック N件」ではない）
- 見届けは **「見届け人」**（grant 人数）
- **REL-PRE-01** — production GO 前の lint 棚卸しを `docs/official-release-wiring-plan.md` に登録

---

## 2026-06-27 REL-2-03 / 2-04 — 開発者ページ実データ化・作品詳細統計

- **REL-2-03** — `/creators/[id]` を `developer_profiles` + 公開作品に接続。X・website 表示。本番で未登録 ID は 404
- **REL-2-04** — 実作品詳細の見届け・FB 件数を Supabase 集計（0 は非表示）。Devlog 更新は最新 devlog から相対表示

---

## 2026-06-27 REL-0-02 — 本番で preview 専用挙動を無効化（追補）

- **production-mode** — git ref だけでは preview 判定しない。本番 hostname / `VERCEL_ENV=production` は常に production
- **middleware** — 本番モードで `/studio` `/mypage` `/notifications` を未ログイン拒否（`/login?return=` 付き）
- **StudioDirectAccessGuard** — 本番で Studio 直打ち → 未ログインは `/login` へ（クライアント二重ガード）
- **検証** — `npm run verify:production-auth-guards`

---

## 2026-06-27 REL-1-02〜1-08 — 本番で嘘 UI を整理（Phase 1）

- **Studio** — 本番モードの `/studio/mypage` 作品一覧を実 owned projects に差し替え。mock `/studio/projects/[id]` は 404
- **作品詳細（実作品）** — 見届け・FB 数の「0」表示を非表示。タグ由来のダミー「特徴」なし。関連作品が空ならセクション非表示
- **開発者フォロー** — 本番モードでフォローボタン・localStorage トグルを出さない
- **マイページ** — FB履歴・実績・フォロー中タブは本番で Coming Soon（見届け・保存・プレイ履歴は実データのまま）
- **通知** — 本番 `/notifications` は Supabase のみ（localStorage 偽通知をマージしない）

---

## 2026-06-27 REL-0-02〜0-07 — 本番モードで mock を隠す（Phase 0 完了）

- **発見** — 本番モードで `/home`・`/search` の mock 作品を混ぜない。実作品 0 件は空状態メッセージ
- **作品詳細** — 本番モードで非 UUID / 未登録 ID は「作品が見つかりません」。みんなの FB タブは「追って機能追加予定」
- **月間影響度ランキング** — 本番モードでナビ項目は残し中身のみ Coming Soon
- **採用 UI** — 本番モードでは `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=true` 明示時のみ表示
- 検証: `NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true` で本番挙動をローカル再現

---

## 2026-06-27 REL-0-00 — 本番モード判定ヘルパー

- `lib/production-mode.ts` — `preview` / `local` / `production` の3態。`isProductionReleaseMode()` / `shouldHideV0MockContent()` を正本に
- `lib/preview-v0.ts` — 上記へ委譲。Studio ログインバイパスは本番モードでのみ無効
- ローカル・preview 検証用: `NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true` で本番挙動を強制

---

- `/privacy` — プライバシーポリシー全文（2026-06-27 制定版）を掲載
- 利用規約と合わせ、登録同意の法務導線が完成

---

## 2026-06-27 利用規約 — 本文掲載と導線（REL-0-01）

- `/terms` — 利用規約全文（2026-06-27 制定版）を掲載
- `/privacy` — プライバシーポリシー全文（2026-06-27 制定版）を掲載
- 登録画面・LP・auth フッターからリンク

---

- **みんなの FB タブ** — 初期版は中身を非表示（タブは残し「追って機能追加予定」）。実集計・AI 集約まで個別 FB / mock は出さない
- **月間影響度ランキング** — 同様に項目は残し中身を非表示。mock 順位は本番に出さない
- **用語** — 画面・ドキュメントを徐々に「声」から **FB** へ
- **外部リンク優先度** — 必須寄り: Steam / itch / Discord / **X** / 公式。あるとよい: YouTube / GitHub（X より下）
- **実装計画** — `docs/official-release-wiring-plan.md`（Phase 0〜1 を Issue 粒度、RUN 順序付き）
- **補正** — REL-0-00（本番モード判定）を最優先。REL-0-01 は導線のみ Cursor RUN可・条文はオーナー別タスク
- **RUN 判断** — Phase 0〜1 コード [A] 条件付き / migration 015〜020 [C] / prod・main・PLAYER_VISIBLE [D]
- **migration レビュー** — `docs/migration-015-020-pre-apply-review.md`

---

## 2026-06-26 コミュニティ — 確認依頼を開発ログ引用に統合

- `/studio/community` スレッド作成 — 引用タブを **引用しない / 開発ログ** の2つに戻し、**確認依頼** タブを廃止
- 開発ログに確認依頼が付いている場合は、引用カード内に「見てほしいこと」を内包表示（選択肢に「確認依頼付き」ラベル）
- 旧投稿で確認依頼のみ引用されている場合は従来どおり単体カードで表示（後方互換）

---

## 2026-06-26 ホーム・検索 — サムネ未設定の実作品に個別プレースホルダー

- `/home`・`/search` — 実投稿作品で `thumbnail_url` が空のとき、全件同じ `/images/landing/game-1.png` になるのを修正
- サムネ未設定時は作品 ID・タイトルから **自動生成ポスター**（既存 `GeneratedThumbnailPoster`）を表示

---

## 2026-06-26 参加者プロフィール — マイプロフィール相当の公開画面に

- `/players/[handle]` — 名前・bio だけのスタブを廃止し、**プレイヤー・プロフィール**（統計・ジャンル・実績・最近の活動）を表示
- コミュニティ参加者一覧から遷移時 — `?return=` で **コミュニティへ戻る** 導線を付与

---

## 2026-06-26 コミュニティ設定 — ボタンを有効化

- `/studio/community` — **コミュニティ設定**ボタンでモーダルを開き、コミュニティ名・説明を編集・保存（localStorage + Supabase `developer_communities`）

---

## 2026-06-26 コミュニティ — スレッドにタイトル入力を追加

- `/studio/community` スレッド作成 — **タイトル**（自由入力・80字）を追加。引用の有無に関わらず必須
- 掲示板のスレッドカードにタイトルを見出し表示
- **migration 020** — `community_posts.title` 列（未適用時は本文のみ保存のフォールバック）

---

## 2026-06-26 コミュニティ — 確認依頼引用の空状態を明確化

- `/studio/community` スレッド作成 — **確認依頼**タブに説明文を追加（「今回見てほしいこと」の引用である旨）
- 引用できる確認依頼が0件のとき、空のドロップダウンを出さず、作成手順と **作品一覧** への導線を表示
- Supabase 未接続の preview では mock の確認依頼サンプルを選択肢に表示

---

## 2026-06-26 作品詳細 — 自分の作品では開発者フォローを非表示

- **`/games/[id]`** — ログイン中のオーナーがプレイヤー向けページを見たとき、**開発者をフォロー**ボタンを非表示
- オーナーには **プレイヤー向けページのプレビュー** バナーと **作品を更新する** 導線（Studio）を表示

---

## 2026-06-26 プロフィール — Lv バッジを非表示

- **`/mypage/profile`**・**`/studio/profile`** — 仕様未確定の **Lv** バッジ（モックのみ）を非表示

---

## 2026-06-26 プレイヤー作品詳細 — 開発ログタブに統合（A）

- **`/games/[id]`** — **verの履歴**タブを削除。**開発ログ**1タブに統合（Studio `/studio/projects/[id]` と同方針）
- 開発ログ内のタイムラインで ver 更新・開発メモを一覧（フィルタ: すべて / verの更新 / 開発メモ）
- 旧 URL `?tab=versions` は `?tab=devlog` へエイリアス

---

## 2026-06-26 プロフィール — プレイヤーと開発者を見出しで区別

- **`/mypage/profile`** — 見出しを **プレイヤー・プロフィール** に。補足「プレイヤーとして公開される自己紹介です。」
- **`/studio/profile`** — 見出しを **開発者・プロフィール** に。補足「開発者として公開される自己紹介です。」
- サイドナビのサブ項目も **プレイヤー・プロフィール** / **開発者・プロフィール** に統一

---

## 2026-06-26 開発者プロフィール — 概要から最近の開発ログを削除

- `/creators/[id]` 概要タブ — **最近の開発ログ**セクションを削除（隣タブ「開発ログ」と重複のため）

---

## 2026-06-26 Studio 文言 —「改善ループ」をユーザー向け表現に

- Studio ホーム・作品 Studio・トップバー — 内部用語「改善ループ Studio」を廃止。**Studio** / **作品 Studio** / 平易な説明文に統一

---

## 2026-06-26 プレイヤーマイページから作品管理を分離

- **`/mypage`** — **作品管理**タブを削除（P-16 正本: プレイヤー活動のみ）
- **`/my-projects`**・旧 `?tab=developer` — **`/studio/mypage`** へ誘導（`?focus=` は該当 Studio へ）
- 見届け中の空状態 — **Studioで作品を管理** → `/studio/mypage`

---

## 2026-06-26 リリース前本物ループ配線（B改）

- **`/games/[id]`** — 実プロジェクト（UUID）で v0 見た目を維持しつつ、**初声（Supabase）・見届け・保存・変化確認**を本物ロジックに接続。モック slug は従来どおりプレビュー動作
- **`/mypage`** — **見届け中**タブに更新・プレイ履歴・見届け/保存の実データ。**作品管理**は Studio（`/studio/mypage`）に分離
- **`/notifications`** — Supabase `user_notifications` を表示（devlog / 新ver / 確認依頼 + コミュニティ localStorage 追加分）。mock サンプル通知は廃止
- **`/home`・`/search`** — 公開済み実作品を先頭にマージ表示（新着・最近更新・人気）。実作品がなければ従来 mock で補完
- **開発ログタブ** — 実プロジェクトは `games-provider` の devlog を v0 UI に表示
- **オーナー**: migration `015`〜`019` 適用後、投稿作品が `/home` に出ること → 詳細でプレイ・初声 → Studio で確認 → devlog+確認依頼 → 通知・マイページ・変化チェックの往復を確認

---

## 2026-06-26 コミュニティ確認依頼引用 + 参加者ターゲティング + 影響度ランキング実データ

- **migration 018** — `developer_communities` / `community_memberships` / `community_posts`（確認依頼引用 `confirmation_quote` 含む）/ `community_replies`。確認通知 RPC に **コミュニティ参加者** セグメント追加
- **migration 019** — `get_monthly_player_influence_ranking` RPC（§9 の5指標・最低条件）
- `/studio/community` — スレッド作成で **Devlog** または **確認依頼** を引用。投稿・返信は Supabase 永続化（未適用時は mock 継続）
- `/projects/{id}/devlog/new` — 対象者に **コミュニティ参加者** を追加
- `/rankings/influence` — 実データがあれば RPC 集計を表示（なければ従来 mock）。指標: 開発者評価35% / 改善連動25% / 確認貢献20% / 継続見届け10% / 低声作品10%
- **オーナー**: `018`・`019` を Dashboard 適用後、確認依頼付き devlog → コミュニティ引用・対象者通知・ランキングを確認

---

## 2026-06-26 確認依頼ループ — 課題紐付け・対象者・通知

- **migration 017** — `confirmation_requests` に課題紐付け・対象者選択、`user_notifications` に `confirmation_request` 型と RPC `get_confirmation_notify_recipients`
- `/projects/{id}/devlog/new` — 確認依頼パネルに **対応した課題**（Studio上位3から最大3件）、**誰に届けるか**、**通知する/履歴だけ** を追加
- 確認依頼ありの公開時 — 対象者へ **確認依頼** 通知（未選択時は前verプレイ済み＋見届け中）。通知オフ時は履歴・マイページ・ゲーム詳細のみ
- `/games/[id]` 変化チェック — 紐付けた課題名を表示
- `/notifications`・`/mypage` — `confirmation_request` 通知を表示し、変化チェックへ誘導
- **オーナー**: `015`・`016`・`017` を Dashboard 適用後、devlog+確認依頼+課題紐付けで投稿 → 対象プレイヤーの通知・マイページ・ゲーム詳細を確認

---

## 2026-06-26 開発に役立った評価 + マイページ確認依頼表示

- **migration 016** — `developer_feedback_helpful_marks`（開発者のみ・非公開トグル）
- `/projects/{id}/studio` — かんたんFB・詳しいFB各行に **開発に役立った** ボタン。ヘッダーに件数表示
- `/mypage` — **前回プレイ後の更新** にプレイ済み作品を含め、確認依頼付き devlog は **確認依頼** バッジ・専用文言・変化チェックへの導線
- **オーナー**: `016` を Dashboard 適用後、devlog+確認依頼投稿 → マイページとゲーム詳細を確認

---

## 2026-06-26 確認依頼 — DB永続化 + ゲーム詳細の変化チェック接続

- **migration 015** — `confirmation_requests` テーブル（devlog に 1:1、任意3フィールド）
- `/projects/{id}/devlog/new` — 確認依頼入力を公開時に Supabase へ保存（未入力・migration未適用時は従来どおり devlog のみ）
- `/games/[id]` — プレイ済みプレイヤー向け **変化チェック** カードを実データ接続（確認依頼あり/なしの2パターン）。mock プレビュー `?returning=` は v0 詳細で継続
- **オーナー**: `supabase/migrations/015_confirmation_requests.sql` を Dashboard で適用後、devlog 投稿 → ゲーム詳細でカード表示を確認

---

## 2026-06-26 ランキング画面 — UI統一 + プレイヤー影響度定義改訂

- **開発者** `/studio/rankings` — 画面名を **月間開発ランキング** に変更。TOP3は左から1・2・3。初回テーブル7件・最大50位・ヘルプ・過去月アーカイブ
- **プレイヤー** `/rankings/influence` — 評価定義を改訂（共感除外、5指標・比重35/25/20/10/10）。TOP3に内訳件数、行クリックでプロフィール、集計期間・過去月・ヘルプを開発者側と揃え
- 正本: `docs/forge-ui-product-decisions.md` §9 / §9b / §10

---

## 2026-06-26 Studio ホーム — 開発ヒント「すべて見る」を削除

- `/studio` 開発ヒントセクション右上の **すべて見る →** を削除（各カードの「詳しく見る →」は維持）

---

## 2026-06-26 Studio ホーム — 今週の伸び「すべて見る」を削除

- `/studio` 今週の伸びセクション右上の **すべて見る →** を削除（下部の「もっと見る」「月間ランキングを見る」は維持）

---

## 2026-06-26 マイプロフィール — よく使うタグを廃止

- P-27 `/mypage/profile` から **よく使うタグ** セクションを削除（オーナー判断: 不要）
- プレイヤー自己表現は自己紹介・好きなジャンル・実績バッジに集約。作品特徴タグ・FB クイックタグとは別物だったがスコープ外

---

## 2026-06-26 Preview — 画面表示のみだった機能の実装（mock 永続化）

- **作品の特徴** — Studio プロジェクト概要で最大4件を編集・保存（localStorage）。Player ゲーム詳細 `/games/[id]` に反映
- **概要の保存** — 作品紹介文も同ストアに保存（toast のみだった mock 保存を廃止）
- **プレイヤー概要** — 旧「開発者が聞きたいこと」「回答してほしい項目」を非表示（版プレイヤー問いに一本化）
- **Studio ホーム** — 開発ヒント「詳しく見る」→ `/studio/guide#hint-*`、最近の動き行を作品へリンク、今週の伸びにランキング導線・行リンク
- **Studio ランキング** — 月切替（`?month=`）、過去ランキング一覧、開発者プロフィールへのリンク。列名を開発者フォロー増に整理
- **はじめてガイド** — 開発ヒント詳細セクション（アンカー付き）
- **マイページ** — 見届け中「とは？」、FB履歴「共感とは？」の折りたたみ説明
- **月間影響度ランキング** — ヘルプアイコンで説明パネル表示

---

## 2026-06-26 開発ログ投稿 — 版プレイヤー問い（VersionPromptEditor）

- `/projects/{id}/devlog/new` — 投稿フォームに **版プレイヤー問い**（`VersionPromptEditor`）を追加。はい/いいえ・3段階・再プレイ意向・短文・カスタム選択肢など、作品編集・投稿と同じ UI
- 問いは **対象 ver** に紐づく。新 ver 公開チェック時は入力した ver、未チェック時は現在のプレイ可能 ver。投稿成功時に `project_version_prompts` へ保存
- `/studio/projects/[id]/devlog/new`（preview mock）— 同 UI を追加。問いは端末内 localStorage（`forge-v0-studio-version-prompts`）に ver ごと保存
- 開発ログ投稿から「開発者が聞きたいこと」「回答してほしい項目」の自由記述欄を削除（版問いに一本化）

---

## 2026-06-26 Studio mock プロジェクト — 開発ログ新規投稿

- `/studio/projects/[id]?tab=devlog` — 「開発ログを書く」ボタンを追加（mock 作品向け）
- `/studio/projects/[id]/devlog/new` — タイトル・本文・ver 公開チェック付きの投稿フォーム（preview mock、localStorage に追記）
- 投稿後は開発ログタブに戻り、先頭に「たった今」のエントリが表示される

---

## 2026-06-26 Preview — Studio 入場のログイン省略

- Preview デプロイ（`preview/landing-01`）では Player ヘッダーの **Studio** ボタン・`/studio` 直アクセスでログインを要求しない（mock UI 確認用）
- Studio ホーム「あなたの作品」も Preview では未ログイン時にログイン CTA を出さず、空状態を表示
- **追補** — オンボーディング導入で Studio ボタンが `attemptStudioEntry` 化し、認証 hydrate 前は無反応・本番では `/login` へ飛ぶ問題を修正。Preview では `Link` 直遷移に戻し、オンボーディングモーダルも出さない。`NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF` で Preview 判定を安定化

---

## 2026-06-26 コミュニティ画面クラッシュ修正

- `/studio/community`・`/mypage/community` — オンボーディング後に localStorage のコミュニティをレンダー中に直接読んでいたため SSR と不一致 → 画面クラッシュ。`useDeveloperCommunitiesV0` + `hydrated` 後のみ自分のコミュニティを反映するよう修正
- `getOwnCommunityForUser` — ユーザー名から ID を引く引数の渡し方を修正

---

## 2026-06-26 新規登録後 — Studio オンボーディング & 開発者プロフィール修正

- 新規登録後、Player ナビの **Studio** 押下時に「開発者ページを作成しますか？」モーダル（**はい** → Studio 遷移 + マイコミュニティ自動開設 / **いいえ** → 閉じるのみ・遷移なし。はいを選ぶまで毎回表示）
- `/studio` 直打ち時も同モーダル。いいえで Player ホームへ戻る
- 新規: `lib/developer-onboarding-v0-store.ts`, `lib/developer-community-v0-store.ts`, `components/developer-page-onboarding-modal.tsx`, `components/studio-entry-gate-provider.tsx`
- `/studio/community` — オンボーディング承諾後は自分のコミュニティ名・アバターを動的表示
- `/creators/[id]` — コミュニティ未開設の開発者には参加申請ボタンを非表示。Studio フォロワー一覧からの遷移はパンくず `Studio › フォロワー`、フォロワー ID のプロフィール名を正しく表示

---

## 2026-06-26 Studio マイページ — プロジェクトカードのフェーズワッペンを正本用語に

- `/studio/mypage`（プロジェクト一覧）— サムネ左上ワッペンを **試作版 / プレイ可能版 / 通しプレイ版 / 公開準備中 / 正式版** に更新（旧 `〇〇ver` 表記を廃止）
- `lib/development-phases.ts` — 正規4名称を `版`  suffix に統一。legacy `ver` は `normalizePhase` で表示変換

---

## 2026-06-26 ホーム — カルーセルサムネの余白修正

- `/home` — 最近更新・人気・新着カードのサムネを `object-cover` に戻し、`object-contain` による左右の灰色余白を解消

---

## 2026-06-26 ゲーム詳細 — 変化チェックカード（Step 2 preview mock）

- `/games/[id]`（P-06 v0）— 前回プレイ済み時のみ、ヒーロー下・タブ上に変化チェックを表示（初見には非表示）
- パターンA（確認依頼あり）: `/games/seikat-no-tabiji?returning=1`
- パターンB（確認依頼なし）: `/games/roshin-no-zanko?returning=1`
- 新規: `components/game-change-check-card.tsx`, `lib/change-check-preview-mock.ts`

---

## 2026-06-26 開発ログ公開 — 確認依頼の任意入力 UI（Step 1 mock）

- `/projects/[id]/devlog/new` — 折りたたみ「確認依頼を追加（任意）」セクション（今回変わったこと / 見てほしいこと / 所要時間）
- 各ラベル横にヒントワッペン（ホバーでツールチップ）。未入力でも投稿可能（永続化・通知連携は未実装）
- 新規: `components/devlog-confirmation-request-panel.tsx`, `components/input-hint-badge.tsx`, `lib/confirmation-request-draft.ts`

---

## 2026-06-26 確認依頼 / 変化チェック — 設計正本化

- 新規 `docs/change-check-confirmation-loop.md` — 再プレイ通知から「確認依頼・変化チェック」への設計整理（任意入力・変更内容起点・表示理由最大2・採用断定の慎重化）
- `docs/version-published-loop-design.md` / `docs/forge-p0-improvement-loop-plan.md` — 上位設計への参照を追加
- 実装は未着手（UI mock → DB はオーナー GO 後）

---

## 2026-06-26 マイコミュニティ — スレッド作成 UI 整理

- `/studio/community` — 宛先選択を削除（常にコミュニティ全員へ配信）
- Devlog 引用 — 4件超のときドロップダウン内をスクロール可能に変更

---

## 2026-06-26 参加コミュニティ — 閲覧制限・返信のみ・参加者プロフィール

- 未参加コミュニティ — 掲示板・参加者タブの中身を非表示。参加申請への導線のみ
- 参加済みプレイヤー — スレッド新規作成を廃止。開発者スレッドへの**返信**のみ
- 参加者一覧 — 行クリックで `/players/[handle]`（自分は `/mypage/profile`）へ遷移。開発者側の参加申請者も同様

---

## 2026-06-26 ホーム — ゲームカード4列表示

- `/home` — 最近更新・人気・新着の横スクロールを1行4件表示に変更（lg 以上）
- カード — テキスト余白を詰めてコンパクト化（サムネは `object-cover` で枠を埋める。`object-contain` は左右余白が目立つため撤回）

---

## 2026-06-26 Studio プロジェクト詳細 — 開発ログタブをプレイヤーと同型に

- `/studio/projects/[id]` — タブ「verの履歴」を「開発ログ」に改名し、概要の次（左から2番目）に配置
- 開発ログタブ内 — 「verの履歴」セクションを削除（開発ログと重複）。「開発ログ」「正式ver」は維持
- 旧 URL `?tab=versions` は `?tab=devlog` へエイリアス

---

## 2026-06-26 コミュニティ — Devlog 引用カードからゲーム詳細へ遷移

- 掲示板の Devlog 引用カードをタップ/クリックで `/games/{id}?tab=devlog` へ遷移（開発ログタブを表示）
- compose 中のプレビューはリンクなし（誤遷移防止）

---

## 2026-06-26 マイコミュニティ — 投稿ボタン文言変更

- `/studio/community` — 掲示板の「フォロワーへ連絡」を「スレッドを作成」に変更（折りたたみボタン・送信ボタン）

---

## 2026-06-26 マイプロフィール — 「（自分用）」表記を削除

- `/mypage/profile`・`/studio/profile` — 見出し上の「プロフィール（自分用）」を「プロフィール」に変更（プレイヤー・開発者共通）

---

## 2026-06-26 コミュニティ画面 — サイドバーからの遷移失敗を修正

- `/mypage/community`・`/studio/community` — 他画面からリンクで開くと「ページを読み込めませんでした」になる不具合を修正
- 原因 — `useSearchParams` 利用箇所にページレベルの `Suspense` がなく、クライアント遷移（RSC）が失敗していた（直接 URL 入力は通るがサイドバー遷移で落ちる）
- 対応 — `studio/mypage` と同様にページ + シェル全体を `Suspense` で包む構成に変更。参加申請 store の SSR スナップショットも固定化
- **追補** — 一瞬表示後にクラッシュする症状は `useSyncExternalStore` の `getSnapshot` が毎回新オブジェクトを返し無限再レンダーしていたため。参加申請 store に加え **開発者コミュニティ store**（`useDeveloperCommunitiesV0`）もクライアントスナップショットをキャッシュし更新時のみ参照を差し替えるよう修正

---

## 2026-06-25 75 Preview RUN — マイコミュニティ mock UI + Studio ホーム伸びランキング（d3a3540）

- preview/landing-01 へコミュニティ UI mock 準拠 + Studio ホーム「今週の伸び」ランキング + 開発ヒント文言修正を push。Vercel Preview 再デプロイ

---

## 2026-06-25 74 マイコミュニティ UI — GPT mock 準拠（Preview RUN d3a3540）

- `/studio/community` — 開発者マイコミュニティを GPT mock（A-1〜A-4）に寄せて再構成
- コミュニティヘッダーカード — アバター・名称・参加者数・コミュニティ設定（v0 準備中）
- 掲示板 — **フォロワーへ連絡**ボタンで compose 展開。宛先/Devlog 引用/1000字カウンタ/キャンセル
- Devlog 引用カード — サムネ・日付・いいね/コメント数付きリッチ表示
- 参加者タブ — 申請メッセージ表示、承認/拒否ボタン配色、申請ゼロ時の空状態
- mock データ — 星野ひかり申請、しゃねこコミュニティ 128人、v0.3 Devlog 引用

---

## 2026-06-25 73 プレイヤーホーム — ゲームカードサムネ比率修正（Preview ローカル）

- `/home` 横スクロール作品カード — サムネを `aspect-[4/3]` に変更（ForgeGameCard 等と同型）。固定高 h-32 廃止で見切れ軽減
- 1行あたり 4枚 → **3枚** に変更し、縦長化によるスクロール増を抑制

---

## 2026-06-25 72 Preview RUN — コミュニティ〜4ピル一括反映（3a11c50）

- preview/landing-01 へ fe5a805〜a93b81d の実装 + docs RUN マーカーを push。Vercel Preview 再デプロイ

---

## 2026-06-25 71 コミュニティ参加申請・承認フロー（Preview RUN）

- 開発者プロフィール `/creators/[id]` — **コミュニティの参加申請**ボタン（申請中 / 参加中 / 再申請）
- `/studio/community` — **掲示板 | 参加者**タブ。新規申請の許可・拒否
- `/mypage/community` — コミュニティ選択 + 参加者タブ（閲覧）
- 通知 — プレイヤー: 参加承認・拒否。開発者: 新規参加申請（Studio 通知）

---

## 2026-06-25 70 マイページ絞り込み4ピル・投稿時の公開状態（Preview RUN）

- `/studio/mypage` プロジェクト一覧 — 絞り込みを **すべて / 公開中 / 下書き / 正式版** の4ピルに集約（カードバッジの細かいフェーズは維持）
- `/submit` — **公開中 / 下書き** を投稿時に選択可能（正式版は投稿時不可。Studio で後から宣言）
- 作品編集 — 公開設定ラベルを「公開中 / 下書き」に統一

---

## 2026-06-25 69 マイコミュニティ・参加コミュニティ・フォロワー一覧（Preview RUN）

- `/studio/mypage` — タブに **フォロワー** を追加。開発者を探すと同型カードで一覧
- `/studio/community` — **マイコミュニティ**（フォロワーへの掲示板）。Devlog 引用 + 一斉連絡の compose UI
- Studio サイドバー — マイプロフィールの下に **マイコミュニティ** を追加
- `/mypage/community` — **参加コミュニティ**（フォロー中開発者の掲示板フィード）。テキスト投稿のみ（Devlog 引用なし）
- Player サイドバー — マイプロフィールの下に **参加コミュニティ** を追加
- 共有 — `DeveloperListCard`・`CommunityHubPage` で開発者/プレイヤー画面を共通化

---

## 2026-06-25 68 Studio ゲーム詳細 — プレイヤー同型タブ・ver統合（Preview RUN）

- `/studio/projects/[id]` — タブをプレイヤー詳細と同型に整理（概要 / みんなのフィードバック / verの履歴）
- 共有タブ — `GameDetailOverviewV0Tab`・`GameVoicesV0Tab` をプレイヤーと同じ中身で再利用。Studio は概要のみ編集可
- verの履歴 — 開発ログ + ver履歴 + 正式ver操作を1タブに統合（`GameVerHistoryV0Tab`）
- 旧タブ（フィードバックを見る / Devlog / バージョン / 正式ver 別タブ）廃止。URL はエイリアスでリダイレクト相当

---

## 2026-06-25 67 開発者マイページ再構成 — ナビ統一・プロフィール揃え（Preview RUN）

- Studio サイドバー — ホーム / ランキング / マイページ / マイプロフィール / 設定 / はじめてガイド（サンプル一覧を廃止）
- `/studio/mypage` — マイページ正本。タブ: **プロジェクト一覧**（旧 `/studio/projects`）・**実績**
- マイページ プロジェクト一覧タブ — 上部「あなたの作品」を削除（ホーム `/studio` と導線重複のため）
- `/studio/projects` — `/studio/mypage` へリダイレクト
- 開発者マイプロフィール — プレイヤーと同型レイアウト。差分: **開発ジャンル（3つまで）**（開発者を探す絞り込み用）、開発者向け stats

---

- `/studio` — セクション見出し「Forgeランキング抜粋」→「参考になるかもしれない作品」（中身・リンク先は従来どおり）
- `/studio` 開発ヒント — 「今週の Forge Tips」カードを削除（FBを集める文脈と矛盾するため）。残り2カード・2列レイアウト
- **UI 用語統一** — アプリ内ユーザー向け文言の「版」をすべて **ver** に置換（components / lib / hooks / scripts、66ファイル）

---

## 2026-06-25 65 開発者を探す — 昇降順・ガチャ・ジャンル絞り込み（Preview RUN）

- `/search/creators` — フォロワー数・作品数ソートで **多い順 / 少ない順** を切替（`order=asc`）
- **ガチャ** — 表示中の開発者から1人をランダム表示。約1.5秒の開封アニメーション
- **ジャンル絞り込み** — 作品検索と同型のチェックボックス UI。開発者 mock に登録ジャンルを追加
- 開発者カード — 登録ジャンルタグを表示

---

## 2026-06-25 64 改善ループ Studio 全面再構成（Preview RUN）

- `/projects/{id}/studio` — 5段ステッパー + 現在の工程 + 次に直すこと / FB閲覧の2カラム構成に刷新
- UI用語 — 「初声」廃止。**かんたんFB**（問いへの短い回答）/ **詳しいFB**（任意の構造化FB）に統一
- ループ前 — FBゼロ時は下段パネル非表示（空状態のみ）。URLコピー + プレイヤー向けページ
- 正式版リリース — ステッパー横から除外（下部パネルは従来どおり）
- ホーム/一覧 — 実作品カードはワッペンのみ。一覧のオレンジ枠をニュートラル化（前回分同梱）

---

- オーナー判断 — プロジェクト一覧に FBループ（GameGrowthCycle 型ヒーロー）を載せない。改善ループの入口はホーム
- 一覧（`/studio/projects`）— 実作品カードはワッペンのみ（新着回答・公開待ち）。オレンジの改善ループ枠は使わない
- ホーム（`/studio`）— オレンジ枠 + topGame CTA「作品 Studio を開く」が入口。カードもワッペンのみ（「いま:」行を廃止）
- 実 Studio ヒーロー（`/projects/{id}/studio`）— Cursor 反復は打ち切り。**v0 画面イメージ待ち**（`UX-STUDIO-HERO-V0`）

---

- 初回待ち（`no_feedback`）— 5段ステッパーを出さない。「投稿→プレイ→回答」の3段プレ表示（ループ前と明示）
- サイクル完了 — 全ステップ ✓ ではなく「完了リング」+ 待機表示
- 「作品ページを共有する」廃止 — 共有機能はない。プレイヤー向けページを見る + URLコピーに変更
- ヒーロー内ボタン — 主CTAのみ常時表示。編集系は「作品の設定」折りたたみ
- 空の声セクション — ループ前はヒーローと重複するため非表示
- `/studio` ホーム — 「サンプル作品」カルーセル削除（実作品と一覧が重複するため）
- `/studio` ホーム — 「Forgeで起きていること」削除（開発者向け価値が薄い）
- サンプルカード — 達成率プログレスバー削除（Forge に該当指標なし）
- `/studio/projects` — フェーズ絞り込みをピル UI + 正本開発フェーズ用語に更新（試作版〜公開準備中）
- `/studio/projects` — 並び替えを Studio インライン select に変更
- 実作品一覧（list variant）— 「いま:」「作品を更新する」を廃止。新着 FB / 公開待ちワッペンのみ
- 将来論点 — 目標 FB 数インセンティブを `docs/ux-improvement-backlog.md` UX-FB-TARGET に記録

---

## 2026-06-19 61 実 Studio UX 大改修（改善ループヒーロー）

- `/projects/{id}/studio` — 5段ステッパーを廃止し「今やること」ヒーロー + 主CTA + コンパクト進捗ドットに再構成
- サイクル表示 — イベント駆動（「反応を待つ」完了 → 新回答で再開）。無限ループ演出を廃止
- プレイヤーの声 — 空の集計ボックスを非表示。データなし時は共有CTAのみ
- 「その他のやること」ブロック廃止 — ヒーロー内インラインリンクに統合
- 「次に直すこと」— 見出し下の説明文を削除
- 正式版宣言 — 見出しを「正式版として宣言する」に。過去の宣言は折りたたみ（デフォルト非表示）
- ページヘッダー簡素化 — mono URL・重複メタ行を削除

---

## 2026-06-19 60 Player stub — P-07 / P-05-2 / 検索特徴タグ

- `/creators/[id]` — 完成品→ゲーム詳細リンク。開発ログ→`?tab=devlog`
- `/search/creators` — ソート `?sort=`（フォロワー/作品数）、新規 `?new=1`
- `/search` — 特徴タグ `?tag=` 絞り込み（forge-feature-tag-options 共用）

---

## 2026-06-19 59 投稿フォーム — ジャンル/特徴タグ分離・問い設定 UX

- ジャンルから特徴系（ストーリー重視・癒し系・インディー等）を除去 → `forge-feature-tag-options.ts` へ
- 特徴タグをジャンル直下に配置（問い設定より上）
- テンプレ問い: 質問文入力欄を非表示（カスタムのみ表示）
- テンプレ/構造化問い: 回答形式に「自由記述（任意）」を明示。プレイヤー初声 UI にひと言コメント欄追加

---

## 2026-06-19 58 Studio 本番ルート整理（Preview）

- **正本 Studio** — `/projects/{id}/studio`（改善ループ・次に直すこと・実データ）。入口を Studio ホーム上部「あなたの作品」に集約
- **mock Studio** — `/studio` 以下は UI プレビュー専用と明示（サンプルバナー・サイドバー「サンプル一覧」）
- `/studio/projects` — 上部に実作品一覧、下部に架空サンプル一覧（見出し・説明を分離）
- mock 作品詳細 — 紫バナー「サンプル作品（プレビュー）」を追加
- 未ログイン — Studio ホームにログイン導線。ログイン後は投稿作品から正本 Studio へ

---

## 2026-06-16 57 ランキング50位上限・ジャンル統一・プロフアイコン

- ランキング: スコア>0のみ、最大50位。「XX位まで表示中」削除
- lib/forge-genre-options.ts — 25ジャンル共通（検索・投稿・プロフ・マイページ）
- プロフ編集: アイコン50候補 + 画像アップロード

---

## 2026-06-16 56 体験デモ削除 + ランキング/設定/プロフィール配線

- **体験デモ削除** — ホームバナー・?play=1 自動開始・Preview ログイン省略を撤去（将来作り込み）
- `/rankings/influence` — 月 ◀▶（`?month=`）、もっと見る（4位以下）
- `/settings` — メール/パスワード「変更」モーダル（mock 更新）
- `/mypage/profile` — 「プロフィールを編集」モーダル（mock 更新）

---

## 2026-06-16 55 検索表示切替・FB一覧「もっと見る」

- `/search` リスト / グリッド切替を `?view=grid` で URL 連動
- ゲーム詳細「みんなのフィードバック」— 初回5件表示、「もっと見る」で残り展開

---

## 2026-06-16 54 発見→プレイ→フィードバック 体験デモ（Preview）

- `/home` に体験デモストリップとヒーロー「プレイしてフィードバック」CTA（Preview のみ）
- 正本デモゲーム: **星灯の旅路**（`/games/seikat-no-tabiji?play=1`）
- Preview ではログインなしでプレイ stub → 初声モーダル → 送信 → みんなのフィードバックタブに session 反映
- ログイン後は `?play=1` / `?feedback=1` で意図どおり再開（return URL 許可拡張）
- 本番マージ時: Preview 専用のログイン省略は無効化すること

---

- 見出しを「通知（プレイヤー）」に統一、タイトル下の説明文を削除
- スライダーアイコンに並び替えメニュー（新しい順／古い順）を配線

---

## 2026-06-16 52 サイドバーハイライト・プレイヤー通知の整理

- マイプロフィール表示時にホームが光る不具合を修正（pathname ベースのハイライト）
- マイプロフィール左のツリー装飾を border-l のみに簡素化
- プレイヤー通知の文言・見出しを Player 向けに明確化（Studio 通知との相互リンク）

---

## 2026-06-16 51 マイページ／プロフィール IA・通知アクセス

- サイドバー: マイページ配下にマイプロフィール（ツリー表示）。URL でハイライト分離
- ヘッダー 👤 → マイプロフィール直リンク
- 未ログインで /notifications が /login に飛ぶ不具合を修正（preview は mock 閲覧可）
- preview-v0-gaps に本番前の認証要修正を明記

---

## 2026-06-16 50 マイページ死んだボタン配線

- プレイ履歴: 更新内容・メニュー・ページネーション
- 見届け中: 今すぐ遊ぶ → ゲーム詳細
- FB履歴: 詳細リンク・ページネーション
- 実績: カテゴリ絞り込み・すべて見るスクロール
- フォロー中: フィルタ・プロフィール・さらに読み込む・開発者を探す

---

## 2026-06-16 49 作品検索（/search）絞り込み修正

- デフォルト「ファンタジー」キーワードを削除（未入力時は全件表示）
- ジャンル絞り込み: Fantasy↔ファンタジー等の表記ゆれを吸収
- ジャンルチェックは即時 URL 反映、件数は実際の絞り込み結果を表示

---

## 2026-06-16 48 Player/Studio UI 文言統一・ゲーム詳細・プレイ履歴

- ユーザー向け「声」系文言を **フィードバック** に統一（LP・認証・ガイド・Studio・通知・プロフィール等）
- ゲーム詳細：開発者フォロー表記、あとで遊ぶの配置、聞きたいこと統合、サムネギャラリー、版別FB要約
- プレイ履歴：サマリー3項目化、ジャンル絞り込みドロップダウン（ジャンル未設定対応）
- 版の履歴から「この版でプレイ」削除

---

## 2026-06-16 47 Preview v0 全面化（第1波）

- `/` → `/home`、旧ルート `/bookmarks` `/demo` `/my-projects` を v0 へリダイレクト
- マイページに **作品管理** タブ（実データ `MyPageDeveloperTab`）
- 開発者画面を **StudioShell** に統一（`/projects/.../studio`、編集、devlog）
- `/submit` を **PlayerShell** に
- `/games/[id]` — Supabase 作品 ID のとき実データ表示・実プレイ URL 対応
- 旧 `ForgeHeader` トップ（`home-page`）はルートから切り離し

---

- **新規** `docs/forge-business-hypothesis.md` — 事業・マネタイズ・North Star・Good レビュアー定義の正本
- **原典** — 学習ループをコア、見届け人・再プレイ・変化を見るを**増幅**に格下げ
- **P0 計画** — §1.5 事業 North Star（M1〜M4）、H2 再プレイを副次指標に明記
- **Good / スーパーレビュアー** — 別概念。主論点は Good レビュー生成（導線・問い・承認・影響力可視化）
- **経済インセンティブ** — 最低条件ではない。承認・影響力可視化を先に検証
- **AGENTS.md / forge.mdc** — プロダクト原典 + 事業仮説の二正本に同期

---

## 2026-06-15 45 P0 実データ Studio「次に直すこと」常時表示

- `/projects/{id}/studio` — 常に growth-state 正本（mock フォールバック廃止）
- ヘッダー直下「次に直すこと」— データ空でもカード表示（空状態コピー）
- ヘッダーに「改善ループ Studio · 実データ」と正本 URL を表示
- `/studio`・`/studio/projects` — 上部にオーナー実データリンク、「サンプル作品（プレビュー）」と mock を分離
- mock `/studio/projects/{slug}` は従来 v0 タブ UI（P0 カードなし・正式版タブは未変更）

---

## 2026-06-15 44 P0 Phase A 404 修正（mock / 実データ分岐）

- `/studio/projects/{mockId}` — v0 mock 詳細を表示（リダイレクトしない）
- `/studio/projects/{realId}` — `/projects/{id}/studio` へリダイレクト
- `/projects/{id}/studio` — 常に growth-state 正本 + 上位3課題（mock フォールバックなし）
- 一覧カード href: mock → `/studio/projects/{id}`、実データ → `/projects/{id}/studio`

---

- `/studio/projects/[id]` → `/projects/[id]/studio` リダイレクト
- 作品 Studio ヘッダー直下に「次に直すこと」カード（ルールベース最大3件）
- migration 015 は未適用（草案 `docs/forge-p0-migration-015-draft.sql`）

---

- `docs/forge-p0-improvement-loop-plan.md` — Studio 一本化・上位3課題・版公開・再プレイ人数
- 旧 studio + growth-state を正。新 Studio v0 詳細は P0 対象外

---

- 画面 inventory・UI mocks・ロードマップ・設計判断 docs を preview/landing-01 に push（3b7f82f）
- 実装は Studio S-20〜S-27 v0 + S-23 開発者ランキングが preview 上で閲覧可能

---

- `docs/forge-screen-definition.md` — Studio 詳細を **P-06 編集モード** として再定義
- 正式版タブ（旧 T06）廃止 → Devlog 種別（正式版公開 / Reopen）へ統合
- プレイ可能版公開は T05 のみ。タブ 6→5

---

- `/studio/rankings` — 「今月もっとも作品を育てた開発者」に刷新（TOP3・指標テーブル・右カラム）
- Player 月間影響度とは別設計。作品ランキングタブは廃止

---

- `/studio/projects` — グリッドカード・フェーズドロップダウン・並び替え・表示切替・件数表示・ページネーション・新規投稿カード
- mock 12件（開発中/フェーズ1-2/下書き/アーカイブ/正式版）

---

- S-20〜S-27 実装 — `/studio` ホーム、`/studio/projects`、`/studio/projects/[id]`（6タブ）、`/studio/rankings`、`/studio/profile`、`/studio/notifications`、`/studio/settings`、`/studio/guide`
- StudioShell — Sidebar 正本（通知追加、URL 統一）。Player v0 同一トーン
- 通知設定 — `/settings` と `/studio/settings` で共通 `ForgeSettingsForm`。Player 向け / Studio 向けを同一画面内で分别トグル
- S-20 — ランキング抜粋 § に差し替え（週次サマリー廃止）

---

## 2026-06-19 36 Studio 20–27 画面設計ドラフト（正本）

- `docs/forge-screen-definition.md` — Studio 節を S-20〜S-27 ドラフトで整理（Shell / 画面一覧 / URL / タブ / コンポーネント / Player 境界 / IA レビュー）
- 旧 P-20〜25 Studio 定義は置換予定として参照節へ
- 実装は未着手（情報設計のみ）

---

- `/studio` — S-20 Studio ホーム mock（あなたの作品 / 最近の動き / 今週サマリー / Forgeで起きていること / 開発のヒント）
- `StudioShell` — Player v0 と同一ダークテーマ・紫アクセント。Sidebar: ホーム / プロジェクト一覧 / ランキング / マイページ / 設定 / はじめてガイド
- トップバー — 検索・通知・プロフィール・Player 切替（Player Shell の Studio ボタン → `/studio`）
- stub — `/studio/projects`, `/studio/projects/[id]`, `/studio/settings`, `/studio/getting-started`

---

## 2026-06-19 34 GPT 貼付用1ファイル統合

- docs/chatgpt-v0-paste-all.md — 「全文1回貼れば全部伝わる」正本（01–18 + マイページ + stub + 差分 + 未決）
- chatgpt-player-v0-brief / chatgpt-mypage-brief — paste-all へ誘導

---

## 2026-06-19 33 Player v0 全量 ChatGPT ブリーフ作成

- docs/chatgpt-player-v0-brief.md — 01–18 preview 正本・シェル・遷移・stub・差分・確認手順（1回貼り用）
- chatgpt-mypage-brief.md — player-v0-brief への参照追記

---

## 2026-06-19 32 マイページ ChatGPT 全量ブリーフ作成

- docs/chatgpt-mypage-brief.md — preview 正本・09–15 差分・stub・未決論点・URL 確認手順（1回貼り用）

---

## 2026-06-19 31 トップバー認証表示修正（preview）

- ログアウト — user があるとき常時表示（hydrated 待ち不要）
- 未ログイン時 — トップバーに「ログイン」表示
- auth-provider — 起動時 getSession でセッション同期・hydrated 早期化

---

## 2026-06-19 30 サイドバー「開発者を探す」左揃え修正（preview）

- creator-search の ml-3 インデント削除 — 他ナビ項目と始点を揃える

---

## 2026-06-19 29 ホーム整理・サイドバーに開発者を探す（preview）

- /home — 「ジャンルから探す」セクション削除
- /home・/search — 「開発者を探す」リンク削除
- サイドバー — 「作品を探す」の下に「開発者を探す」追加（/search/creators）

---

## 2026-06-19 28 Player Shell ログアウト・はじめてガイド修正（preview）

- トップバーに「ログアウト」追加（ログイン時のみ）→ /login
- はじめてガイド — /landing リンク削除、stub（遷移なし）

---

## 2026-06-19 27 新規登録の二重画面切替修正（preview）

- LP・CTA の新規登録リンクを `/login?mode=signup` → `/register` に変更
- middleware で `/login?mode=signup` を `/register` へサーバー redirect（旧 URL 互換、ログイン画面フラッシュ防止）
- login-page の client-side replace 削除

---

## 2026-06-19 26 マイページ見出し削除（preview）

- `/mypage` 全タブ — 左上「マイページ」h1 を削除（サイドバー点灯で冗長）

---

## 2026-06-19 25 Preview UX fix batch（preview）

- `/` → `/home` リダイレクト（preview/landing-01 のみ。middleware + lib/preview-v0）
- はじめてガイド → `/landing` リンク
- 開発者を探す導線 — /home・/search から `/search/creators`（サイドバー復活なし）
- P-05 ソート（?sort=）・ページネーション（?page=、5件/ページ）
- P-06 / P-07 / P-05-2 フォロー・見届け・あとで — ログイン gate + mock toggle

---

## 2026-06-19 24 Player Shell サイドバー簡素化（preview）

- ホーム / 作品を探す / ランキング ── マイページ ── 設定 / はじめてガイド
- マイページ sub-nav はメイン内タブ（見届け中〜フォロー中開発者）
- サイドバー sticky 固定（スクロールしても常時表示）

---

## 2026-06-19 23 プレイヤー v0 残画面一括 + 連携整理（preview）

- P-05-2 開発者検索 `/search/creators`
- P-07 開発者プロフィール v0 `/creators/[id]`
- P-17 プレイヤー設定 `/settings`
- P-18 月間影響度 `/rankings/influence`
- Player Shell: 開発者を探す・ランキング・設定リンク
- `docs/preview-v0-gaps.md` — stub ボタン・論点整理

---

## 2026-06-19 22 P-05 検索強化 / P-09 プロフィール / ログイン導線（preview）

- P-05: 絞り込み・キーワード検索を URL 連動、❤️→見届け/声、ヘッダー検索 submit
- P-09: `/mypage/profile` プロフィール hub mock（stats・活動・実績プレビュー）
- Player Shell: マイページ sub-nav（検索・マイページ系画面）
- P-06: プレイ/FB/見届け/フォロー/あとで → 未ログイン時 `/login?return=/games/{id}`

---

## 2026-06-18 21 P-06「版の履歴」タブ v0 mock UI（preview）

- stats 3枚（現在の版 / 公開版数 / 初回公開）+ 最新版カード + タイムライン
- 各版「変更点を見る」「この版でプレイ」→ P-19 play stub
- 星灯 5版 / 炉心 3版 mock。ID エイリアス対応

---

## 2026-06-18 20 P-06「開発ログ」タブ — テストデータ拡充・UI調整（preview）

- どのゲーム URL でも開発ログ 8件（星灯の旅路正本）が表示されるよう修正
- 炉心の残光（roshin-no-zanko）は専用 3件
- ID エイリアス（hero-1 等）を resolveGameDetailId で統一
- タブ内の説明文・見出しブロックを削除（stats から開始）

---

## 2026-06-18 19 P-06「開発ログ」タブ v0 mock UI（参考モックなし）

- タイムライン + 最新更新カード + 版/メモフィルタ + 最新版でプレイ stub
- 星灯の旅路 8件 mock、その他ゲーム 2件

---

## 2026-06-18 18 P-18 通知一覧 `/notifications` v0 mock UI

- Player Shell + 種別タブ7 + 未読/既読セクション + mock 9件
- サイドバー「通知一覧」+ ヘッダー 🔔 → /notifications

---

## 2026-06-18 17 P-06「みんなの声」タブ v0 mock UI

- 月次 stats 4 / 届いた声リスト / フィルタ / 共感 / 右要約・集計
- プレイヤー向け（開発に役立った btn なし）。Studio 23 モックを P-06 用に適応
- 声を届ける → P-19 モーダル接続

---

## 2026-06-18 16 P-19 フィードバック v0 モーダル（P-06 上）

- プレイ stub → 初声モーダル → 深いFBフォーム → 送信成功
- 「声を届ける」CTA からフルフォーム直接
- mock のみ。Player Shell 未変更

---

## 2026-06-18 15 P-06 ゲーム詳細 `/games/[id]` v0 mock UI

- Player Shell 内ヒーロー + CTA + 4タブ（概要 mock / 他 stub）+ 右サイドバー
- home / search / mypage から詳細リンク接続
- 旧 `GameDetailPageClient` はコード残存、route は v0 差し替え（preview）

---

## 2026-06-18 14 P-04 発見ホーム `/home` mock UI

- Player Shell + ヒーローカルーセル + 最近更新/人気/新着 + ジャンルピル
- `/` 未変更。preview は `/home`

---

## 2026-06-18 13 P-05 作品検索 `/search` mock UI

- Player Shell + リスト8件 + 右絞り込みパネル。?q= 対応
- サイドバー「作品を探す」→ /search

---

## 2026-06-18 12 マイページ — FB履歴・実績・フォロー中開発者タブ mock UI

- `/mypage?tab=feedback` — モック11。FB 8件 + 右サイド
- `/mypage?tab=achievements` — モック13。12/48 進捗 + バッジグリッド
- `/mypage?tab=following` — モック15。開発者 6件 + 右サイド
- マイページ横タブ6種すべて mock 表示可能に

---

## 2026-06-18 11 マイページ — プレイ履歴タブ mock UI

- `/mypage?tab=play-history` — モック12 参考。リスト + 右サマリー。mock 4作品
- 見届け中/保存作品と同型レイアウト。フィルタ・ソートは UI のみ

---

## 2026-06-18 10 v0 写経 — login / register / mypage（preview）

- `/login` — v0 Auth Shell 2カラム（P-02）。OAuth UI のみ（stub）
- `/register` — 新規ルート（P-03）。`/login?mode=signup` → リダイレクト
- `/mypage` — Player Shell + 横タブ6種（P-16）。見届け中・保存作品は v0 mock。他4タブは空状態
- `?tab=saved` 等 — 初回レンダーから URL 同期
- middleware — `/mypage` 保護解除（UI preview 用）
- prod・`/`・LP 未触。DB 変更なし

---

## 2026-06-18 09 v0 Publish — マイページ「保存作品」タブ確認

- v0 `/mypage` — タブ「保存作品」クリックで P-16-T02 専用 UI（H1・5 作品カード・保存中バッジ）に切替
- 直 URL `?tab=saved` は初回表示が見届け中のまま（v0 モック制約）。Forge 実装時は初回からタブ同期を正しく行う
- コード変更なし（v0 参照確認のみ）

---

## 2026-06-18 08 画面設計正本 — forge-screen-definition.md 新規

- `docs/forge-screen-definition.md` — 画面・機能の唯一正本（目的・コアループ・遷移・v0/Cursor 基準）
- C-01〜07（Shell/Modal/Drawer）、P-01〜27、P-16 タブ、旧番号対照表
- inventory / SCREEN-NUMBER-MAP は参考扱いに格下げ

---

- オーナー共有: `docs/forge-roadmap-2026-06-canonical.md`（Phase0–8 工程モデル）
- 主戦場を **Phase2 UX 設計** に。画面番号順ではなくコアループ順
- 正式フロー: ChatGPT → UX → v0 → Cursor。UX 確定前に実装を進めない
- 01 LP — **オーナー OK**（v0 正本、overlay 終了）
- 次優先: プレイヤー初回体験（LP→発見→詳細→プレイ→声→変化→再プレイ）

---

- オーナー目視: LP 全体は好評。「場所」の「所」だけ次行に落ちる改行を修正
- `場所。` に whitespace-nowrap

---

- オーナー GO: preview push / 更新 — commit **5e31a52** が preview に反映済（再 push 不要）
- 確認 URL: https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing

---

- canvas / scaler / mock-layout / overlay-tool **削除**
- `components/landing-page.tsx` を v0 Publish 写経（responsive・自然スクロール・白 primary CTA）
- アセット: `public/images/landing/hero-bg.png`, `game-1`〜`5.png`
- `/landing/overlay` → 終了案内ページ
- 依存: `lucide-react` 追加
- prod / `/` 未触

---

- v0 正本 URL 確定: https://landing-page-recreation-psi.vercel.app/
- 現行 `/landing`（canvas+scaler）との**実測差分**を 5 評価軸で整理（実装は未着手）
- 主な差: max-w-1320 responsive / Hero 724px / H1 48px / CTA 2 枚大型 / ゲーム PNG+hover / お知らせ card 化

---

- overlay・座標一致・ピクセル一致作業を**中止**
- 新ベースライン: v0 案（landing-page-recreation-oQNL617pobI）。評価は Hero 迫力 / CTA 存在感 / 余白 / 発見体験 / LP 完成度
- 現状 LP（1024px 絶対配置 artboard）は**印象再現向きではない** — 実装前に再設計方針を整理（コード変更は次タスク）
- `docs/ui-mocks/01-landing.md` を v0 基準の記述に更新

---

## 2026-06-18 01 ランディング — Hero overlay 目視合わせ（preview・ローカル）

- **STOP 対応**: commit 21ffd13 のピクセルスキャン Hero 座標は**不採用・差し戻し**
- 合格基準: `/landing/overlay` 重ね表示で人が「ほぼ重なっている」と言えること（数値一致は不要）
- Hero のみ overlay を見ながら Y 調整（CTA **h=218 維持**）。作品カード・お知らせ・フッターは**未変更**
- 比較スクショ: `docs/overlay-screenshots/hero-before-overlay-clip.png` / `hero-after-overlay-full.png`
- **push 未実施** — オーナー overlay 目視後

---

## 2026-06-18 01 ランディング — Hero 座標 overlay 合わせ（preview）【不採用】

- fb505643 819 上で Hero 要素をピクセルスキャン
- ロゴ/リード/3価値/CTA/Hero 下端を更新 — CTA h 218→168、Hero 下端 322→326
- カード 118px 維持
- **オーナー STOP — 採用しない**

---

## 2026-06-18 01 ランディング — overlay 正本 fb505643（preview）

- **正本切替**: `landing-mock-reference.jpg` → fb505643 **1024×819**（55022e3e 496 は非正本）
- overlay 比較は正本 819 vs 実装を上端揃え
- 次フェーズ: Hero（ロゴ→H1→…）座標合わせ。カード 118px は現状維持

---

## 2026-06-18 01 ランディング — 作品カードサイズ復帰（preview）

- **方針転換**: 重なり回避のためカードを縮めた修正を撤回 — **モック基準のカード高に復帰**
- 作品カード: サムネ 64px + meta（pad 8×2 + body 38）= **118px 高** / 幅 172px
- お知らせ・フッター: カード下端 + gap から **下方向に配置**（カード圧縮禁止）
- 実装アートボード高 **558px**（モック JPEG 496px より長い — overlay で段階的に座標合わせ）
- `/landing/overlay` — 左右比較でモック 496 vs 実装 558 を並列表示

---

## 2026-06-18 01 ランディング — モック模写再実装（preview）

- 1920 基準を廃止 — モック原寸 **1024×496** + 絶対配置 + 全体 scale
- 背景: モック原画像。注目サムネ: グラデ近似（完全一致不可）
- `/landing/overlay` 追加 — 重ね合わせ確認

---

- **修正**: 1080px / Hero 548px 固定を廃止 — **実コンテンツ高**のみ scale 対象
- **scaler**: ResizeObserver でキャンバス `offsetHeight` 計測 → `scale = min(vw/1920, vh/実高)`
- **余白**: キャンバス内の空き箱なし。viewport 外側（下）に出る
- prod deploy 禁止 / `/` 差替禁止 — 維持

---

## 2026-06-16 正式リリース初期版方針 + 原典更新

- **方針転換**: 小さな MVP ではなく **正式リリース初期版**として必要機能を初期から盛り込む
- **in-scope 化**: **月間影響度ランキング** / 実績バッジ / 共感 / 開発者「開発に役立った」/ 影響度スコア
- **out-of-scope 更新**: 上記を解除。依然 out — 投げ銭・販売・SDK 実装・有料ランキング等
- **原典**: 応援→フォロー統合（概念の応援は残す、UI はフォロー・開発者単位）
- **実装**: モック GO 後。prod deploy 禁止継続

---

## 2026-06-16 01 ランディング — ガワ確認 OK（オーナー）

- **`/landing` 方針 OK** — 保持。**`/` 差し替え禁止**（Walkthrough 前）
- **正式将来**: 未ログイン `/` → 01 / ログイン済 `/` → 04 — **Phase1-B 以降に実装**
- モック vs 実装ズレ — `docs/ui-mocks/01-landing.md` §ズレ記録
- prod deploy 禁止継続 / preview OK
- 他画面 preview route — **01 確認後**に判断

---

- **URL**: `/landing`（本番 `/` は発見ホームのまま）
- **内容**: モック 01 レイアウト — ヒーロー / 3 価値 / 2 CTA / 注目 5 カード / お知らせ / フッター
- **背景**: `public/images/landing-hero-bg.png`（生成プレースホルダ）
- **Studioに入る**: 未実装のため非リンク（ガワのみ）
- **ゲームを探す / すべて見る**: 現行 `/` へ（発見ホーム）

---

- **Phase1 分割** — 1-A Studio Shell（20–25）**先行** / 1-B Player Shell（09–18）**後**。同時 NG。§19
- **22 次にやること** — **Task DB 不要**。声→役立った→AI→Devlog から生成。§18
- **Veteran Walkthrough** — **残す**。全モック完成後・**実装 GO 直前**（Phase1 前ではない）。導線4本。§20
- **21 入口** — Studio Level1 のみ。global 不要。§17
- pending **#98 #118** 解決

---

## 2026-06-16 オーナー判断反映（ChatGPT レビュー）

- **Studio Sidebar 正本** — 階層型（Level1: 20/21、Level2: 22–25）。同列 nav 不採用。`forge-ui-product-decisions.md` §17
- **21 / 22 責務分離** — 22=単一作品運営、21=全作品横断。KPI 重複禁止。§18
- **実装 GO 順** — Phase1 Shell → Phase2 Studio → Phase3 フォロー → Phase4 23 → Phase5 08 → Phase6 18 ランキング（最後）。§19
- **Studio 最終構造再確認** — 旧 Studio ホーム廃止、旧リリース/開発ログ管理→24 統合
- pending **#103 / #132 / #133 / #145** 解決。コード変更なし

---

## 2026-06-16 画面遷移図 v2（オーナー送付）

- **正本更新**: `docs/forge-screen-transition-diagram.md` — 2026-06 最終版 v2
- **新画像**: `assets/...94a920c0-7c06-4157-9620-1caa38f17186.png`（旧 e5287fc6 は参照のみ）
- **凡例刷新**: 青実線=メイン / 紫破線=マイページ / 緑実線=Studio 内 / 緑破線=横断参照
- **図下部**: 主要シナリオ 4 本（作品探索 / 開発者探索 / FB / 開発者改善ループ）+ 重要ルールまとめ
- inventory（2026-06 最終版）と同期。コード変更なし

---

## 2026-06-16 画面一覧最終版（オーナー確定）

- **正本更新**: `docs/forge-screen-inventory.md` — Studio 階層・番号再編
- **主な変更**:
  - 旧 20 Studio ホーム **廃止**
  - **20** = Studio 作品一覧（モック `21-studio-works-list.md`）
  - **21** = 分析ダッシュボード（モック未）
  - **22** = 作品情報（`22-project-home-alt.md` 正本）
  - **24** = 開発ログ公開（旧 24+25 統合）
  - **25** = 作品設定（旧 26）
  - **17** = プレイヤー個人設定（Studio 17 モックは別物）
- 対照: `docs/ui-mocks/SCREEN-NUMBER-MAP.md`
- 遷移図・handoff 部分更新。確認事項 **#1–#145**（#136 解決）

---

- **14 あとで遊ぶ** — `docs/ui-mocks/14-play-later.md`（3列 grid / 保存中バッジ / 保存日 / ソート）
- **15 フォロー中の開発者** — `docs/ui-mocks/15-following-developers.md`（開発者リスト / 代表作品 / 右サイドバー）
- **16 通知一覧** — `docs/ui-mocks/16-notifications.md`（種別タブ / 未読既読 / 30日保存）
- **17 設定** — `docs/ui-mocks/17-settings.md`（**Studio シェル初出** / 7タブ / アカウント〜サポート）
- **18 月間影響度ランキング** — `docs/ui-mocks/18-monthly-influence-ranking.md`（TOP3 / 影響度スコア / 月選択）
- **20 Studio ホーム** — `docs/ui-mocks/20-studio-home.md`（改善ループ二軌 / 次にやること / 右折りたたみ）
- **21 Studio 作品一覧** — `docs/ui-mocks/21-studio-works-list.md`（**統合 shell 第三形** / 6作品 grid / 状態タブ）
- **22 作品ホーム** — `docs/ui-mocks/22-project-home.md`（Studio 専用 / Loop表 / プレイヤーの声埋め込み）
- **23 プレイヤーの声** — `docs/ui-mocks/23-player-voices.md`（作品内 nav / AI要約 / 開発に役立った）
- **22 作品ホーム 案 B** — `docs/ui-mocks/22-project-home-alt.md`（オーナー採用候補 — 案 A は改善ループ版を保持）
- モック累計 **01–18 + 20–23**（22 は A/B 2案）。確認事項 pending **#1–#145**
- コード変更なし

---

- 正本: `docs/forge-ui-product-decisions.md`（16 項目）
- 作品カード: 開発中は原則ワッペンなし / 完成品のみ **🏆 完成品**
- 応援中廃止 → **フォロー中の開発者**（開発者単位）
- 検索: 作品検索と開発者検索を分離
- 共感・開発者非公開 FB 評価・月間見届け人ランキング等 — 方向性確定（実装はフェーズ分割）
- 第2ラウンド UI 案を上記に合わせ部分更新
- **画面一覧 01–26** — `docs/forge-screen-inventory.md`（目的・機能・現行 URL ギャップ）
- **画面遷移図（全26）** — `docs/forge-screen-transition-diagram.md`（IA 正本。UI モックではない）

---


### P0 — Demo Veteran 開発者 patch

- `--patch-veteran-developer` — Veteran 所有 7 本 additive（既存 25 本維持）
- developer_profiles、Devlog 5/作品、NPC Voice、Released 5 / Reopened 1
- verify 18/18 PASS（Veteran Gold 回帰 + 開発者断言）

### P1 — ForgeGameCard + 正式版 grid

- `components/forge-game-card.tsx` — compact / row / grid + GeneratedThumbnailPoster
- プレイ履歴 / 応援中 / 更新を追う / 更新セクション — 統一カード
- 正式版セクション — 折りたたみ + sm:2 lg:3 grid、grant 詳細削除
- マイページタブ — 遊んだゲーム / 作ったゲーム

### デプロイ

- prod deploy — **保留**

---

### プレイ履歴（`/mypage#play-history`）

- **折りたたみ**：回数集計（🎮 2プレイ 等）を廃止。作品との**関係性バッジ**に変更
  - 🏅 見届け人 / 💬 声を届けた / 🔄 更新を見た / 🎮 複数版プレイ / ▶️ プレイ済み（最低バッジ）
- **展開**：時系列履歴（古→新）。プレイヤー視点のラベル
  - 例：版 0.1 をプレイ → 声を届けた → 版 0.2 が公開されました → 正式版になりました
- 見届け人バッジは `project_witness_grants` を参照

### 前回プレイ後の更新（`/mypage#updates`）

- 開発者行動（Devlog タイトル・開発メモ等）を見出しに使わない
- プレイヤー視点：「版 X が公開されました」「新バージョンが公開されました」「プレイした版の続きが公開されました」
- 「プレイヤーの声を反映」系の文言は採用しない

### 実装

- `lib/player-play-timeline.ts` — バッジ合成・プレイヤー向けタイムライン文言
- `lib/player-update-display.ts` — 更新見出しの共通ロジック
- `components/play-history-section.tsx` / `mypage-updates-section.tsx`
- `hooks/use-player-play-history.ts` — witness grants 取得

### デプロイ判断（オーナー 2026-06-16）

- commit **e6d5fc1** / **b0f1a2f** — main push 済み
- **staging preview** READY — `dpl_3eaac2YQwqVCV5dBQVGasduX8Zyt`
- **本番 prod deploy — 保留**（UI 全面レビュー主要論点 P0–P2 未消化のため）

---

## 2026-06-16 将来像デモ世界 — F1 実装 + staging seed PASS

### 実装

- `scripts/future-demo-lib.ts` / `future-demo-seed.ts` / `future-demo-verify.ts`
- `docs/future-demo-walkthrough.md` — 固定 credential、hide/show 世界戦切替
- npm: seed / verify / hide / show

### staging 結果（verify 13/13 PASS）

- 25 作品、82 Devlog、162 Voice、12 Released、3 Reopened
- Veteran: 12 grants、Gold、46 sessions、38 voices
- ログイン: veteran@ / new@forge-future-demo.local

### 世界戦切替

- `hide:future-demo:staging` — 元の世界戦（private）
- `show:future-demo:staging` — デモ世界戦（public）

---

## 2026-06-16 将来像デモ環境 — 設計 v2（成功した Forge 世界）

### 変更

- ペルソナ中心（8 人）→ **世界中心**（25 作品・NPC 多数）
- オーナーログイン: **Demo Veteran**（Gold・主役）+ **Demo New User**（对比）の 2 のみ
- 固定 credential 案を設計に明記

### doc

- `docs/future-demo-environment-design.md` v2

### Out

- 実装 GO 前、8 ペルソナ巡回

---

## 2026-06-16 将来像デモ環境 — 設計案

### doc

- `docs/future-demo-environment-design.md` — 8 ペルソナ、5–6 作品、CLI seeder 案、コスト見積
- UI 全面レビューの前提テーマ（実装 GO 前）

### 方針

- staging + service-role Seeder + 固定デモユーザー
- 既存画面のみ、本番 UX 変更なし
- PLAYER_VISIBLE=false 維持

---

## 2026-06-16 見届け人 tier — T1/T2 実装

### 実装

- `lib/witness-tier.ts` — 1 / 3 / 10 作品、見届け人 / Silver / Gold
- `/mypage#official-release` — tier バッジ + summary 一行（grant ≥1）
- `npm run verify:witness:tier` — PASS

### 設計

- ChatGPT レビュー GO — Silver/Gold 名称確定
- 正本: `docs/witness-phase-t1-tier.md`
- 014 本番 Dashboard 適用 GO（オーナー Run）

### Out

- プロフィール tier、通知、ランキング、作品詳細

---

## 2026-06-16 main 反映 — 見届け人 Phase（W1–W4）

### 含む

- migration 014 草案、witness-eligibility、W1/W3/W4 verify scripts
- W4 マイページ `#official-release` 見届け人 UI（teal カード・grant_path 表示）
- tier 設計レビュー草案（`docs/witness-tier-design-review.md`）

### main / deploy

- commit `771dfe6` — `97aeb8f..771dfe6` on `main`
- GitHub commit status: **success** — Vercel Deployment has completed（2026-06-16T14:43–14:44Z）
- 本番 URL: https://forge-flame-gamma.vercel.app — 200 OK

### 本番 DB 注意

- migration **014 は staging のみ適用済み**。本番 Dashboard 適用前は grants 空 → 見届け人カードは出ない（想定）

---

## 2026-06-16 見届け人 W4 — マイページ UI

### 実装

- `/mypage#official-release` — 見届け人カード統合
- lib/hook/components 追加
- verify:witness:ui:staging PASS
- build PASS

---

## 2026-06-16 見届け人 W3 — grant verify PASS

### 結果

- 014 staging 適用済み
- sandbox + `verify:witness:grants:staging` — A/B/C' 各 1、negative/owner 除外、Reopened/再Released PASS

### doc

- `docs/witness-phase-w3-verification.md`

---

## 2026-06-16 見届け人 W2 — migration 014 草案

### 追加

- `supabase/migrations/014_project_witness_grants.sql`
- `docs/witness-phase-w2-migration.md` — RLS、trigger、seed 方針
- append-only grants + 初回 Released trigger + 再 Released スキップ

### 次

- オーナー Dashboard 014 適用

---

## 2026-06-16 見届け人 W1 — 判定 lib + staging verify

### 実装

- `lib/witness-eligibility.ts` — D（OR）A / B / C'
- `npm run verify:witness:staging`
- build PASS

### staging 結果

- だもんでとなもんでの冒険 — eligible 0
- d05c457b — plays のみ（sessions 0）→ 不成立（設計どおり）

### 次

- W2 migration 014 — オーナー GO 後

---

## 2026-06-16 見届け人 Phase — 設計レビュー（W0）

### doc

- `docs/witness-phase-design-review.md` — 目的・候補 A–D 比較・悪用・DB・ロードマップ・推奨 D+C'

### オーナー判断待ち

- D（OR）GO か / C'（watch + session≥2）か / migration 014 タイミング

---

## 2026-06-16 正式版 Phase 1 — staging 検証 PASS

### 検証

- 013 Dashboard 適用済み（オーナー）
- `verify:official-release:staging` / `:flow` — PASS
- DB: released → release_reopened → 再 released、events 3 行 append-only
- witness 候補 1 名 — 初回 Released 前プレイ → 「正式版到達を見届けた」data-layer OK
- build PASS

### 残り

- Studio / マイページ — ログイン要の目視（任意）

---

## 2026-06-16 正式版 Phase 1 実装

### 今回やったこと

- migration **013** — `project_release_events` + `projects.release_status`
- Studio 正式版パネル — Released / Release Reopened（履歴保持）
- マイページ `#official-release` — プレイした作品の正式版到達一覧
- プレイ履歴 — release イベント + 見届け人土台サマリ
- build PASS

### ユーザー体験の変化

- 開発者: Studio で正式版宣言・再調整（semver / 審査なし）
- プレイヤー: 育てた作品の正式版到達をマイページで確認可能（013 適用後）

---

## 2026-06-16 Cursor 一気通貫運用 — 運用方針変更

### 方針

- タスク単位で設計→main反映準備まで承認待ちなし
- 停止は 9 条件のみ（課金・本番公開・PLAYER_VISIBLE 等）
- サマリ「今すぐ私がやるべきこと」= オーナー作業のみ

### doc

- `docs/forge-triage-operations.md` §10
- `docs/gpt-run-decision-memo.md` / `AGENTS.md` / `.cursor/rules/forge.mdc` 同期

---

## 2026-06-16 main 反映 — プレイ履歴 + matcher + Phase3

### デプロイ

- commit `d09dfa9` → `origin/main` push 完了
- Vercel 本番 deploy は push 連動（オーナー Dashboard 確認）

---

### 今回やったこと

- migration **012** `project_play_sessions` — 最終版 SQL
- **recordProjectPlayWithSession** — 毎プレイ session INSERT + plays upsert
- **player-play-timeline** — play / voice / devlog 合成 + 「最初のプレイからN日」
- マイページ **「プレイ履歴」** セクション（`#play-history`）
- 「最近プレイした」カードはプレイ履歴に統合
- doc: `docs/player-play-history-verification.md`
- **npm run build PASS**

### ユーザー体験の変化

- **012 適用前**: プレイ履歴 UI は表示可。session 行なし（voice/devlog のみ）
- **012 適用後**: 版ごとのプレイが時系列に残る。プレイのみユーザーも履歴対象

### オーナー確定

- セクション名 **プレイ履歴**
- バックフィルなし
- プレイした作品のみ
- 作品詳細コンパクト → Phase 1b

---

## 2026-06-16 優先順位更新 — プレイ履歴設計 GO

### 方針

- ボトルネックは開発速度。matcher 本番 ∥ プレイ履歴 **並行 GO**
- 新優先: matcher 本番 → **プレイ履歴** → 正式版 → バッジ
- PLAYER_VISIBLE=false 維持

### doc / 草案

- `docs/player-play-history-design.md` — コンセプト・DB・UI・原典整合
- `supabase/migrations/012_project_play_sessions.sql` — 草案
- `docs/parallel-execution-checklist.md` — Vercel + 並行作業

---

## 2026-06-16 Phase3「変化を確かめる」実装

### 今回やったこと

- **adoptionVerifyHref** + `?adoption=` パース + **useAdoptionVerifyContext** hook
- **AdoptionVerifyBanner** — 作品詳細 personal 文脈（NewPlayableVersionBanner の上）
- **VoiceAdoptionsSection** Primary CTA → **「変化を確かめる」**（personal URL）
- **PlayLaunchDialog** — adoption 経由時 contextual copy
- **GameVoiceSection** — adoption 経由時 post-play 前置き 1 行
- **PLAYER_VISIBLE ゲート** — false 中は Phase3 UI も非表示（露出リスクなし）
- doc: `docs/phase3-player-visible-off-verification.md`

### ユーザー体験の変化

- **現時点（PLAYER_VISIBLE=false）**: プレイヤーには **変化なし**（コードのみ merge）
- **表示 GO 後**: マイページ adoption →「変化を確かめる」→ 作品詳細バナー → contextual プレイ → 新版 voice

---

## 2026-06-16 matcher 本番 GO（Run [A]）

### オーナー判断

- labeled 60 / shadow A / shadow B PASS、FP=0 — matcher 本番運用へ
- prompt v2 / 閾値 0.82・0.88 **変更禁止**
- **`NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false` 維持**（Phase2/3 表示 GO まで）

### doc

- `docs/voice-adoptions-matcher-prod-go.md` — Vercel env + 確認手順
- `docs/phase3-implementation-plan.md` — Phase3 実装 GO

### ユーザー体験

- 本番 devlog 公開後、**裏側で** voice↔更新の自動紐づけが動く（プレイヤー UI はまだ非表示）
- Phase3「変化を確かめる」が次のプレイヤー体験強化

---

## 2026-06-16 shadow B 実測 PASS

### 結果

- devlogId `a60a5c11-061c-4219-916d-bd864ddc5f95`（消えるかな？、0.5→0.6）
- mix: direct 2 / indirect 3 / reject 5（計 10 voice）+ 旧 voice で candidate 14
- matcher completed / adoptions **2**（direct UI + BGM）/ **FP=0**
- indirect 3 件は conf **0.8** → 不採用（FN 許容）
- reject 5 件すべて未採用

### 次

- **matcher 本番 GO** 判断（ChatGPT + GPT判断用メモ）

---

## 2026-06-16 shadow A 実測 PASS

### 結果

- devlogId `f45434b3-bd88-435d-8345-82016b3f7e67`（project 消えるかな？）
- matcher completed / candidates 4 / adoptions 1 / **FP=0**
- reject（マルチプレイ）未採用。direct 相当ボス声のみ採用
- indirect（テンポ）conf 0.8 → 不採用（閾値 0.88、FN 許容）
- 初回試行は版名 `shadow-a-*` で candidate 0 → semver bump（0.5）で再実行

### doc / コマンド

- `npm run shadow:a` — 一括実行
- `docs/voice-adoptions-shadow-a-runbook.md`

---

## 2026-06-16 shadow A 準備（プレイヤー非表示 + レビュー手段）

### 今回やったこと

- **`NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE=false`** — shadow 中はマイページ・ゲーム詳細の「声が反映」UI を非表示（`isVoiceAdoptionPlayerVisible()`）
- matcher は live のまま **DB INSERT 継続**。開発者 Studio 件数は表示のまま（マッチャー動作確認用）
- **`npm run shadow:adoption-review -- <devlogId>`** — 公開後の採用行を FP レビュー用に一覧
- **`docs/voice-adoptions-shadow-a-runbook.md`** — env チェックリスト・SQL・合格基準

### ユーザー体験の変化

- shadow A 期間中、**プレイヤーは採用通知を見ない**（誤表示リスクゼロ）
- 開発者は新版公開後、スクリプト/SQL で採用行をレビューして FP=0 を確認してから shadow B へ

---

## 2026-06-16 labeled 60 --live GO → shadow A/B

### 結果

- direct FP=0 FN=0 / indirect FP=0 FN=3 / reject FP=0
- precision 100% / recall 92.5%
- **Run判断 A** — shadow A へ。prompt v2 維持（v3 不要、閾値変更禁止）
- FN 3 件（conf 0.8）対応不要

### doc

- `docs/voice-adoptions-labeled-60-live-results.md`

---

## 2026-06-16 candidate cap 50（precision 保護）

### 今回やったこと

- **`VOICE_ADOPTION_MAX_CANDIDATES = 50`** — `lib/voice-adoption/constants.ts`
- **`applyVoiceAdoptionCandidateCap`** — Stage A 後、created_at 降順で cap
- **Future Scalability Note** — matcher design doc + forge-handoff（大規模 voice 時は embedding 等へ再評価）

### ユーザー体験の変化

- 1 作品の voice が 50 件超のとき、**公開直前に近い 50 件だけ** matcher 対象（古い voice は当該公開では未評価）

---

## 2026-06-16 実測フェーズ開始（prompt v2 + shadow + 見届け人）

### 今回やったこと

- **prompt v2**（`adoption-prompt-v2`）: 同一問題判定、indirect/reject few-shot、類似採用 NG
- **shadow ガイド**: `docs/voice-adoptions-shadow-guide.md`（公開 A/B、FP=0×2、プレイヤー非表示）
- **見届け人**: 初回 Released 付与、Reopen でも剥奪なし
- staging verify 出力強化（FP/FN 代表ケース）
- `--live` 試行 → **OPENAI_API_KEY 未設定**（`.env.local` なし）

### migration / deploy

- なし

---

## 2026-06-16 方針レビュー（FN / Phase3 タイミング / Released Reopen）

### 今回やったこと

- **FN 対応順確定**: prompt → explanation → labeled set → 閾値（最後）。閾値維持
- **Phase3**: 設計・文言・URL・モックは先行 OK。実装は matcher 本番 GO 後
- **Released**: 取り消し（Release Reopened）可。`project_release_events` で履歴保持
- doc 更新: staging-precision-guide, openai-matcher-design, phase3 UX, official-release-design

### migration / deploy

- なし

---

## 2026-06-16 staging labeled set + Phase3 UX 設計 + 正式版方針

### 今回やったこと

- **優先順位確定**: staging 精度 → matcher 本番 GO → Phase3 設計 → Phase3 実装 → 履歴 → 正式版 → バッジ
- **staging labeled set 60 件**: direct 20 / indirect 20 / reject 20（`lib/voice-adoption/staging-labeled-set/`）
- **精度評価**: `staging-precision-eval.ts` + `npm run verify:voice-adoption:staging` + `--live`
- **GO 条件**: 全カテゴリ false positive = 0（recall 低下許容）
- **doc**: `voice-adoptions-staging-precision-guide.md`
- **Phase3 UX 設計**: `phase3-adoption-verify-ux-design.md`（変化を確かめる）
- **正式版方針**: `official-release-design.md`（開発者 Released 宣言、semver NG、正式版後も継続）
- **バッジ doc 更新**: 件数競争 NG、見届け人は単純 1 プレイ NG

### ユーザー体験の変化

- コード変更なし（設計・評価基盤）。Phase3 実装後に CTA「変化を確かめる」が primary になる予定

### migration / deploy

- なし

---

## 2026-06-16 OpenAI matcher staging + indirect 方針確定 + バッジ設計

### 今回やったこと

- **オーナー方針確定**: indirect 採用 GO（confidence ≥ 0.88）、弱い表現 NG、通常 adoption 表示
- **matcher パイプライン**: `run-adoption-matcher.ts` + `POST /api/voice-adoption/run` + devlog 公開後 invoke
- **採用判定**: `adoption-match-eval.ts`（direct 0.82 / indirect 0.88 / 抽象 summary 拒否）
- **OpenAI matcher**: `openai-matcher.ts`（per-voice update_summary）
- **service role INSERT**: `voice-adoption-matcher-db.ts` + `createServiceRoleClient`
- **UI**: `VoiceAdoptionsSection` に AI disclaimer footer
- **設計 doc**: indirect / disclaimer / staging Next API パスを `voice-adoptions-openai-matcher-design.md` に反映
- **バッジ**: `docs/player-badges-design-review.md`（設計のみ。実装 Out）

### ユーザー体験の変化

- devlog 新版公開時（staging、fixture off + service role 設定時）に voice↔更新の自動紐づけが走る経路ができた
- adoption 一覧の下に AI 紐づけの説明と dispute 導線が並ぶ
- indirect も「あなたの声 → 今回の更新」と同じトーンで見える（「たぶん」表現なし）

### migration / deploy

- なし（011 適用済み。本番 OpenAI / Edge deploy は別 Run）

---

## 2026-06-16 update_summary 1対1 + Phase3 CTA 修正

### 今回やったこと

- **設計修正**: `update_summary` = 回答ごとの対応変更（devlog 全体要約 NG）
- **Phase3 CTA**: 「変化を確かめる」（将来 `{update_summary}を確かめる`）
- **コード**: fixture matcher / types / constants をペア別 summary に同期

---

### 今回やったこと

- **migration 011 草案**: `voice_adoptions` / `voice_adoption_matcher_runs` / `voice_adoption_disputes` + RLS + devlog `published_at` / `content_hash` + 公開後本文 immutable trigger
- **正本データ層**: `lib/voice-adoption/*` + `lib/supabase/voice-adoptions-db.ts` + `lib/supabase/schema.ts` 型
- **fixture matcher**: 10 ペア（関連5 / 無関連3 / グレー2）、`ADOPTION_THRESHOLD=0.82`、precision 100% / recall 100% を `npm run verify:voice-adoption` で検証
- **Phase2 UI**: `VoiceAdoptionsSection` —「あなたの回答から変わったこと」。`player_quote` ↔ `update_summary` の対のみ表示（LLM 再呼び出しなし）
- **統合**: `/mypage#voice-adoptions`（Primary）、`/games/{id}` 条件付き（Secondary）、dispute「この関連は違う」→ suppressed
- **Studio**: 公開パネルに「あなたの声が反映された件数」
- **staging 手順**: `docs/voice-adoptions-staging-fixture-guide.md`
- **Edge Function 草案**: `supabase/functions/voice-adoption-matcher`（fixture stub のみ。live OpenAI は 501）
- **dev API**: `POST /api/voice-adoption/matcher`（production 403）

### ユーザー体験の変化

- ログイン済みプレイヤー（fixture モード時）が、**自分の声がどの更新に効いたか**を具体的な引用ペアで見られる
- 0 件のときセクションは非表示（空ブロックなし）
- dispute で誤関連を自分で消せる

### migration

- **未適用**（011 はリポジトリ草案のみ。Dashboard 本番/staging 適用は別 Run）

---

## 2026-06-16 voice_adoptions 実装前レビュー（Phase1+2 同一テーマ）

### 今回やったこと

- **設計のみ**: Phase1 正本 DB + Phase2 最小プレイヤー表示を 1 テーマで整理
- 正本 doc: `docs/voice-adoptions-pre-implementation-review.md`（17 項目 + Run 判断用メモ）
- ADOPTION_THRESHOLD **0.82 確定** / devlog immutable 方針 / 10 ペア precision 手順

### migration

- なし（011 は実装 GO 後）

---

### 今回やったこと

- **設計のみ**: `voice_adoptions` を Forge 正本データとして正式スキーマ化（`docs/voice-adoptions-canonical-design-review.md`）
- **実装順確定**: Phase1 マッチ基盤 → Phase2 表示 → Phase3 再プレイ → Phase4 レジャー（レジャー先行 NG）
- **原則**: 事実 → 体験。Phase1 は通知不要

### migration

- なし（011 草案は GO 後）

---

### 今回やったこと

- **設計のみ**: プレイヤー「育てた実感」のコア体験を正式機能前提で整理（`docs/player-nurture-core-experience-design-review.md`）
- **結論**: 通知単体では不十分。**案A（個人マッチ）+ レジャー + 再プレイ接点**の三層がコア
- **現状診断**: プレイ→回答→更新→再プレイの形はあるが、**自分の声で変わった**接点はゼロ
- **案評価**: A が最強。B/C は補助。手動採用 UI は禁止継続

### migration

- なし（設計レビューのみ）

---

## 2026-06-16 Studio フェーズパネル統合 + プレイヤー更新 UI + AI採用設計レビュー

### 今回やったこと

- **Studio フェーズパネル（P0）**: Hero「次にやること」と「育成サイクル」を1ブロックに統合。タイトルは常に「いま: {工程名}」（イベント語禁止）。工程ガイダンス + primary/secondary CTA
- **工程表示**: `buildNurtureDisplayContext` を phaseLabel / phaseGuidance へ刷新。修正フェーズは「修正の進め方を見る」+「修正が終わった → 変更を記録する」
- **作品カード / Studio ヘッダー**: 「次: プレイヤーの回答が届きました」廃止 → 「いま: {工程名}」
- **プレイヤー更新 UI（P1）**: セクション名「前回プレイ後の更新」。カードは新版公開/更新バッジ + 変更見出し +「もう一度プレイする」「更新内容を見る」。開発者語（開発日誌/開発の歩み/変更の要点）と重複導線を削除
- **作品詳細**: 「開発の歩み」→「これまでの更新」
- **cursor:pointer**: リンク・ボタン等にグローバル + 主要コンポーネント明示
- **P2 設計のみ**: `docs/player-voice-adoption-ai-design-review.md` — AI による voice↔devlog 紐づけと「自分の意見が採用された」体験

### migration

- なし

---

## 2026-06-16 Studio 育成導線の一本化（Forge外修正の明示）

### 今回やったこと

- **育成サイクル文言**: 改善する→ゲームを修正する、開発ログを書く→変更内容を記録する
- **Studio Hero CTA**: 回答受領後は「次はゲームを修正しましょう」+「ゲームを修正する」ボタン → 説明モーダル
- **説明モーダル**: Forge外で修正する旨。「次回から表示しない」localStorage 対応
- **その他のやること**: 補助導線のみ（質問を編集する / 作品情報を編集する）
- **文言**: 「この作品を育てる」→「作品を更新する」
- **作品管理**: 「要対応」セクション削除。カードに状態バッジ（新しい回答 N件 / 変更内容の記録待ち / 新版公開待ち）
- **マイページ**: 「3つのリストの違い」説明ブロック削除

### migration

- なし

---

## 2026-06-15 マイページ IA 統合（タブ化・ダッシュボード）

### 今回やったこと

- **ヘッダー**: 「マイページ」1本化（開発マイページリンク削除）
- **/mypage タブ**: 「プレイヤー活動」「作品管理」。`/my-projects` は `?tab=developer` へリダイレクト
- **プレイヤータブ**: 2×2 カード（更新を見る / 応援中 / あとで見る / 最近プレイした）。各2件プレビュー + さらに表示
- **用語整理**: 応援中 / 更新を追っている / 更新を見る の定義をページ内に明示
- **投稿作品**: プレイヤータブから削除 → 作品管理タブのみ
- **作品管理**: 2カラムグリッド、検索、要対応フィルタ、要対応セクション

### migration

- なし（UI のみ）

---

## 2026-06-15 voice_received 通知 DB 化 + nurture 読了 Supabase 化 + E2E 正本

### 今回やったこと

- **開発者向け「回答届いた」通知（migration 009）**: `user_notifications.type = voice_received` + `version_key`。`project_voice_responses` INSERT 時に SECURITY DEFINER trigger で owner へ通知。owner 自身のテスト回答は除外。未読は owner+project+version で 1 件に集約
- **nurture 読了 Supabase 化（migration 010）**: `project_voice_reads` テーブル。studio「読了にする」で upsert。同版の未読 `voice_received` 通知も既読化
- **アプリ**: 通知 type `voice_received` 表示・studio 深リンク。`useNurtureVoiceRead` が Supabase 正本（localStorage 読了は廃止、移行なし）
- **E2E 正本**: `docs/mvp-production-e2e-checklist.md` 新設

### migration

- **009**: `009_voice_received_notifications.sql` — Dashboard 手動適用待ち
- **010**: `010_project_voice_reads.sql` — 009 後・読了 UI deploy 前に適用推奨
- 手順: `docs/migration-009-010-apply.md`

### デプロイ

- **commit**: `4127731`（実装）+ `eb53333`（changelog）
- **本番**: https://forge-flame-gamma.vercel.app
- **GitHub Deployment ID**: `5069156781` — **success**（2026-06-15T18:29:01Z）
- **migration**: 009/010 Dashboard 適用済み（2026-06-16 オーナー確認）

---

## 2026-06-15 MVP完成向け一括（用語・更新導線・studio・通知）

### 今回やったこと

- **用語統一**: 詳しい材料→詳しい感想、フィードバック→回答（サンプル/devlog/投稿フォーム等）
- **更新を見る**: マイページ `#updates` に変更要点サマリ、通知↔マイページ相互リンク、開発の歩みコピー改善
- **studio 整理**: 重複 CTA 削除。Hero 1本 +「その他のやること」。ヘッダーにプレビュー1本
- **所有者プレビュー**: テストプレイ→確認用にプレイ、新版バナー copy 修正
- **通知**: action hint 明確化、feedback→studio 深リンク、プレイヤー自己送信時の誤通知削除
- **nurture 読了**: Supabase 化見送り（localStorage 継続）

### migration

- なし

### デプロイ

- **commit**: `9391ec9` — MVP P1/P2 一括
- **本番**: https://forge-flame-gamma.vercel.app（deploy `dpl_3mG3QrdXG4XesEzAbQcu75d8pL2V` Ready）

---

## 2026-06-15 studio voice 中心化（project-growth-state / 読了 / read パネル分離）

### 今回やったこと

- **project-growth-state**: 主データを `project_voice_responses` に切替。現行版に voice があれば反応あり。pending は「voice 最新 > devlog 最新」
- **studio read パネル分離**: 主 = プレイヤーの回答（集計・解釈・折りたたみ個別行）。副 = 詳しい感想（project_feedback・任意）
- **読了状態**: localStorage キーを `projectId + playableVersion` に変更（`project_voice_reads` プレフィックス）
- **my-projects**: 作品カードの次アクション・回答件数も voice ベースに
- **データ取得**: `fetchVoiceNurtureSignalsForProjects` / `fetchOwnerVoiceResponseDetails` 追加

### ユーザー体験の変化

- **開発者**: 初声100件・詳しい感想0件でも studio で「回答100件」と表示。反応なしにならない
- **開発者**: studio 上で voice 集計が主役。詳しい感想は補助セクション
- **開発者**: 個別 voice 行は折りたたみ・開発者のみ（公開詳細には出さない）

### migration

- なし

### デプロイ

- **commit**: `d7443b3` — studio voice 中心化
- **本番**: https://forge-flame-gamma.vercel.app（deploy `dpl_BJi4jXt4q2xbfzfd2xAJEf1GSAot` Ready）

---

## 2026-06-16 作品育成 studio / 導線 IA 一括 + メンテ

### 今回やったこと

- **用語統一 + 死コード削除**: FB/フィードバック/改善材料/返事を UI から排除。旧 feedback コンポーネント 5 件削除
- **`/projects/{id}/studio`**: 1 作品の育成専用ページ（GameGrowthCycle + やること一覧 + Primary CTA）
- **`/my-projects` 整理**: 作品一覧 + コンパクトカード。「この作品を育てる」→ studio。`?focus=` は studio へリダイレクト
- **詳細 `/games/{id}` 所有者**: sidebar は「この作品を育てる」→ studio のみ（直リンク集約を撤去）
- **マイページ `/mypage`**: 「更新を見る」セクション追加（追跡中の devlog / 新版 + 開発の歩み・再プレイ導線）
- **通知 `/notifications`**: devlog → `#game-project-history`、新版 → `#new-playable-version-banner`
- **共通化**: `lib/project-nurture-links.ts`（studio URL・section id・やること一覧・通知 href）

### ユーザー体験の変化

- **開発者**: 次に何をするかが studio 1 画面で完結。my-projects は複数作品の入口
- **プレイヤー**: 追跡中作品の更新が mypage で一覧化。通知から開発の歩みへ直接ジャンプ
- **詳細**: 所有者はプレイヤー向けプレビュー + studio 誘導のみ

### migration

- なし

---

## 2026-06-16 サイドバーぶれ修正 / 所有者プレビュー / 用語高優先バッチ

### 今回やったこと

- **サイドバーぶれ修正**: GameVoiceSection の load 前 false 通知を止め、voiceComplete sticky ref、hidden loader 削除
- **所有者プレビューモード**: 自分作品の /games/{id} でプレイヤー初声 UI 非表示、sidebar を開発者導線中心に
- **用語**: プレイヤー CTA を行動ベース（質問に答える / 回答する / 回答を送信しました）。集計見出し「プレイヤーの回答」。開発ダッシュボード→開発マイページ

### ユーザー体験の変化

- 詳細 sidebar の CTA 文言が静止（振動ループ解消）
- 開発者が自分作品を開くとプレビュー + 育成導線。自分で回答する導線なし
- プレイヤー向けボタンは具体行動、コンセプト文は「声」維持

---

### 今回やったこと

- **#6b 初声**: Banner / main embed / sticky bar を削除。プレイ後 dismissible オーバーレイ + sidebar「声を届ける」の 2 入口に整理
- **用語**: プレイヤー向け CTA を「声を届ける」に統一（「返事」「感想」は詳細 main から排除）
- **#3**: 開発者問い設定で「質問テンプレート」と「回答形式」を UI 分離（DB `response_kind` 維持、migration なし）
- **自由記述**: 表示名「自由記述（短文）」→「自由記述」。DB 値 `short_text` 維持。入力欄に 200 文字補足
- **詳細 `/games/{id}`**: プレイヤー CTA と開発者導線を sidebar 内で分離。「編集する」は secondary、開発者ブロックは「作品を育てる」文脈
- **育成ハブ `/my-projects`**: タイトル「開発マイページ」、各作品に「やること一覧」（5 リンク）
- **削除**: `post-play-feedback-banner.tsx` / `post-play-voice-sticky-cta.tsx`

### ユーザー体験の変化

- **プレイヤー**: プレイ直後に軽いオーバーレイ（× / あとで可）。main 列に初声フォーム常設なし。後からは sidebar のみ
- **開発者**: 自分の作品詳細はプレイヤー画面として扱い、育成操作は開発マイページ経由
- **問い設定**: テンプレート選択 → 形式は読み取り専用表示。カスタムのみ形式を選べる

### デプロイ

- **commit**: `17b4243` — Forge IA 一括（#6b / 育成ハブ / #3）
- **本番**: https://forge-flame-gamma.vercel.app（deploy `dpl_HPschPwXLzsNwG1xeYfQq6VmbJr4` Ready）

---

## 2026-06-15 Forge IA 見直し — #6 停止

### 今回やったこと

- 本番確認: #6（64b481f）で入口が sidebar / Banner / main フォームに分散 → ノイズ
- Phase2 #6 **一旦停止**
- `docs/forge-ia-review.md` — サイトマップ・開発者/プレイヤー理想導線・用語・#6 3 案比較

### ユーザー体験の変化

- **まだなし**（レビュー段階）。#6 追加実装は GO 待ち

### 次の方向（レビュー案）

- 初声: プレイ後 dismissible オーバーレイ + 詳細 sidebar 1 入口
- 開発者: 詳細→編集をやめ、my-projects 育成ハブ経由

---

## 2026-06-15 Phase2 #6 — プレイ後初声導線（実装・停止）

### 今回やったこと

- main 列条件付き reorder（played_pending / voice_complete）
- PostPlayFeedbackBanner: 先頭問い preview + CTA「返事を届ける」統一
- sidebar 3 状態 + canEdit interim（開発者メニュー分離）
- VoicePromptCard 未選択アフォーダンス（hover / pointer / 補助文等）
- mobile sticky bottom bar（played_pending・フォーム viewport 外）

### ユーザー体験の変化

- プレイ後: Banner 直下に初声フォーム。desktop sidebar も状態連動
- 選択肢: 未選択時に押せる UI と分かりやすく
- 開発者: 「編集する」が primary CTA から分離、「作品を育てる」へ

### 原典

- §5 プレイ → 声を届ける。プレイ前初声 NG / 1 問 OK / 深い FB 任意

---

## 2026-06-15 Phase2 #6 — 初声導線 詳細設計（未実装）

### 今回やったこと

- 本番確認フィードバックを反映した **#6 詳細設計**（`docs/phase2-6-voice-flow-design.md`）
- Phase2 優先順位を **#5 → #6 → #3** に変更（オーナー判断）

### 設計の要点

- プレイ後: Banner 直下に初声フォーム、サイドバー 3 状態（未プレイ / 未回答 / 回答済）
- 選択肢: 未選択アフォーダンス改善（選択後見た目は維持）
- 開発者 sidebar「編集する」: #6 interim 分離、本格は Phase3 育成ハブ

### ユーザー体験の変化

- **まだなし**（設計レビュー段階）

---

## 2026-06-15 Phase2 #5 — カスタム選択肢 UI

### 今回やったこと

- 開発者問い設定: カスタム選択肢を **選択肢数 2/3/4 + 個別 input** に変更（textarea 改行入力を廃止）
- 保存前 `validatePromptDrafts`（2 個未満・40 字超過で停止）
- 開発者向け **プレイヤーにこう見える** プレビュー
- `/submit`・`/projects/{id}/edit` 両方 + 問い保存エラー表示
- 既存 choice 問いは `options` から個別フィールドへ復元

### ユーザー体験の変化

- 開発者: 選択肢の数と内容を直感的に設定できる
- プレイヤー: VoicePromptCard は変更なし（保存済み options がボタン表示）

### 原典

- §5 版プレイヤー問い — 選択式仮説検証

---

## 2026-06-15 UX Phase1 — 問いプレビュー / 自由記述 / 深いFB other_notes

### 今回やったこと

- **デフォルト問いプレビュー**: `/submit`・`/projects/{id}/edit` で「デフォルト問いを使う」選択時、プレイヤーに表示される問い・選択肢をプレビュー
- **自由記述（短文）**: 開発者向け回答形式ラベルを「1行テキスト」→「自由記述（短文）」に変更。プレイヤー初声 UI を textarea（3行）に
- **深い改善材料**: 「もっと詳しく伝えたい」に **その他・自由に伝えたいこと** 欄を追加
- **migration 008**: `project_feedback.other_notes`

### ユーザー体験の変化

- 開発者: デフォルト問いの中身が編集前に分かる
- プレイヤー: 短文自由記述が textarea で入力しやすい
- プレイヤー: 良かった点/気になった点/バグ以外も開発者に届けられる
- 開発者: FB 受信箱に「その他」が表示される

### 原典

- §5 版プレイヤー問い・2 層フィードバック（初声 / 深い改善材料任意）

---

## 2026-06-15 P0 修正 — 作品編集「更新する」が効かない

### 今回やったこと

- **原因**: 作品詳細閲覧時に `ensure_platform_default_prompt` が `sort_order=0` のデフォルト問い行を DB に作成。開発者が同じ `sort_order=0` で問いを INSERT すると unique 制約違反 → 未捕捉エラーで保存・遷移ともに止まる
- **修正**: `saveDeveloperVersionPrompts` で開発者問いを保存する前に、同一 `(project_id, version_key)` の active な `platform_default` 行を `archived_at` で履歴化
- **UX**: `/projects/{id}/edit` に保存中状態・エラー表示（try/catch）を追加。バリデーション失敗（カスタム選択肢不足等）も画面上に通知

### ユーザー体験の変化

- 作品編集画面で「プレイヤーへの問い」を設定して「更新する」→ 作品詳細へ遷移し、問いが保存される
- 保存失敗時は無反応ではなく赤枠のエラーメッセージが表示される

### 原典

- 開発者が版プレイヤー問いを設定できることは §5 の前提。本番で編集不能だったのはバグ

---

## 2026-06-15 version_prompt immutable（同一版内の問い履歴整合）

### 今回やったこと

- **saveDeveloperVersionPrompts**: 初声 1 件以上付いた prompt は文言・形式を UPDATE しない。変更時は archive + 新 INSERT
- 回答 0 件の prompt は同一 id の UPDATE を継続
- 削除は物理削除禁止（archived_at のみ）
- **migration 007**: `get_public_voice_aggregates` — active + 回答済み archived を表示、未回答 archived は非表示
- **fetchOwnerVoiceAggregates**: 上記と同方針の TS 集計（非公開作品も可）
- 共有ロジック: `lib/supabase/voice-prompt-immutable.ts`

### ユーザー体験の変化

- 開発者が問いを直しても、プレイヤーが届けた声の集計ラベル（問い文）が後から書き換わらない
- 回答済み問いを削除しても「みんなの声」から消えない（その版への声として残る）
- プレイヤー向け初声フォームは **active 問いのみ**（変更後の新問いが対象）

### 原典

- `docs/forge-principles.md` §5（版への返答・個別非公開・集計のみ公開）

---

## 2026-06-15 開発者問い設定 UI + migration 006 確認手順

### 今回やったこと

- **開発者問い設定 UI**（`/submit`・`/projects/{id}/edit`）
  - 旧「特に見てほしい観点」（focusNotes テキスト）を **版プレイヤー問い（version_prompt）** エディタに置換
  - 1 版・最大 10 問。回答形式：はい/いいえ、3 段階、もう一度遊びたい、1 行テキスト、カスタム選択肢
  - 未設定時はデフォルト問い「もう一度遊びたい？」（従来どおり）
  - 3 問以上で回答率低下の注意喚起（原典 §5 準拠）
- **Supabase 保存**：`saveDeveloperVersionPrompts` / `fetchDeveloperVersionPrompts`（archived_at で差分同期）
- **migration 006 本番確認チェックリスト** を `docs/supabase-post-migration-checklist.md` §8 に追加

### ユーザー体験の変化

- 開発者：投稿・編集時にプレイヤーへの問いを構造化して設定できる
- プレイヤー：開発者が設定した問いが詳細の「vX.X への返事」に反映（006 適用後）
- focusNotes は新規投稿では保存しない（既存作品の表示は legacy として残る）

### 原典

- `docs/forge-principles.md` §5（版プレイヤー問い・デフォルト問い）

---

## 2026-06-12 初声（version_prompt）+ みんなの声 — プレイヤーサイクル実装 GO

### 今回やったこと

- 原典 §5 更新：1 版・最大 10 問、初声完了 = 返答 1 件以上、応援≠初声、みんなの声（プレイヤー=グラフ / 開発者=解釈）
- migration **006**：`project_version_prompts` / `project_voice_responses` / 公開集計 RPC / feedback RLS 個別非公開
- 1 段目 UI：`GameVoiceSection`（複数問い・1 問 OK・返事を届ける）
- 2 段目：`GameDeepFeedbackForm`（任意・折りたたみ）
- プレイヤー向け「みんなの声」：集計グラフのみ（個別回答非公開）
- 開発者向け：問い別集計 + ルールベース解釈（AI 前段）
- Phase A 接続：プレイ後バナー / モーダル → `#game-voice-section`

### ユーザー体験の変化

- プレイヤー：5 項目フォーム一括ではなく、開発者の問いに短く返事 → 成功体験完結
- プレイヤー：「みんなの声」で集計傾向を確認（レビュー一覧ではない）
- 開発者：my-projects で問い別の解釈 + 数字を確認
- 個別の初声・深い改善材料は公開されない

### 原典

- `docs/forge-principles.md` §1・§5・§7

---

## 2026-06-12 P1-2.5 作品育成ハブ — /my-projects 情報設計

### 今回やったこと

- `/my-projects` を **作品育成ハブ** に再設計（FB inbox 型から転換）
- 3層構造: 作品一覧 → 作品選択（アコーディオン）→ 作品育成
- 各作品カードに **現在地** + **次にやること** を最優先表示
- 成長ステップ: 投稿/発見/プレイ（小）+ FB/改善/新版公開/反応待ち（大ループ）
- 改善サイクル: 前回/今回/次 の文脈表示（競わせない）
- プレイヤーの声（FB）を展開内最後段に格下げ
- 横断 NextActionsPanel / FB inbox 廃止
- `?focus=id` 拡張余地（任意深リンク）
- 投稿 CTA: 作品あり時 tertiary

### ユーザー体験の変化

- 入室直後に「どの作品を育てるか」が分かる
- FB は材料、主行动は devlog / 版公開
- CTA 散在・重複の解消

### 関連

- オーナー GO: P1-2.5 v2 ワイヤ

---

## 2026-06-12 P1-2 my-projects 強化（案 B B1+B2）

### 今回やったこと

- `/my-projects` 冒頭に **NextActionsPanel**（次にやること）を追加
- **FB inbox** を作品管理テーブルより上へ移動
- 各 FB から **開発ログを書く** primary CTA → `/projects/{id}/devlog/new`
- FB 件数バッジを作品テーブルに表示
- B2 ヒューリスティック: FB 受信後 devlog 未対応作品を「要対応」表示

### ユーザー体験の変化

- 開発者がログイン後すぐ「次に何をすればいいか」が分かる
- FB → 改善(devlog) の 1 クリック導線
- 分析ダッシュボード化ではなく行動導線を優先

### Out（今回やらない）

- 作品別 Studio ページ（案 C）
- DB migration / 開発者 FB 通知 Supabase 化 / AI 要約 / ランキング

### 本番 deploy

- Deploy ID: `dpl_BmY7mgTEqocGqSUDNVvgd6GXzy59` — READY
- 本番: https://forge-flame-gamma.vercel.app

---

## 2026-06-12 P1-1 登録〜メール認証導線（案α A+B）

### 今回やったこと

- signUp 後 **session なしではログイン済み扱いにしない**（auth-provider）
- 新規登録成功後 **`/auth/verify-email`** 確認待ち画面へ遷移
- **`/auth/callback`** で Supabase メール確認リンクの code 交換
- **`/auth/welcome`** で「メール確認完了」「Forgeへようこそ」→ CTA は **ホーム `/`**
- signUp / 再送に `emailRedirectTo` を指定（`lib/auth-redirect.ts`）

### ユーザー体験の変化

- 登録直後にホームへ誤リダイレクトしなくなった
- 確認メール送信・待ち状態が専用画面で明示される
- メール Confirm 後、welcome 経由でログイン済みホームへ進める

### オーナー作業

- Supabase Dashboard → Redirect URLs に `/auth/callback`（本番 + localhost）を追加 — **設定済み（2026-06-12）**

### 本番 deploy

- Deploy ID: `dpl_8NwvuGAZcNTED29DfCn3vxL9Lqcm` — READY
- 本番: https://forge-flame-gamma.vercel.app

### 関連

- オーナー GO: P1-1 案α Phase A+B 一括

---

## 2026-06-13 Discovery 統合 — テストプレイ受付中タブ廃止

### 今回やったこと

- ホーム Discovery を **新着作品 + 急上昇** の 2 タブに整理（「テストプレイ受付中」タブ削除）
- 新着 feed に **全 public 投稿作品** を統合（`lookingForTesters` による exclusion 廃止）
- 投稿時 `lookingForTesters: false` をデフォルト化
- recruitingOnly フィルタチップ・「テストプレイ受付中」ソートを削除
- 投稿完了画面 CTA を原典順に再構成（新着確認 → プレイURL → ダッシュボード → devlog）
- テスター募集系 UI を MVP 非露出（作品編集・詳細 Apply・バッジ・Hero 等）
- `looking_for_testers` DB 列・内部型は温存（migration なし）

### ユーザー体験の変化

- 投稿後、**新着作品タブ**に載る（バグ誤認の解消）
- Forge がテスター募集サイトに見えにくくなった
- 主導線: 発見 → プレイ → FB → 改善

### 関連

- オーナー GO: 2026-06-13 Discovery 設計整理

---

## 2026-06-13 本番 E2E 確認手順書 — 再プレイ→新FB ループ

### 今回やったこと

- **`docs/e2e-version-published-loop-production.md` 新設**
  - 事前条件（005・deploy・2 アカウント・実作品・watch/FB 状態）
  - プレイヤー（B）/ 開発者（A）の 1 クリック単位手順
  - 各ステップの期待結果
  - 失敗時切り分け（通知なし / バナーなし / FB 切替なし）
  - ChatGPT・Cursor 貼付用の結果記録テンプレート

### ユーザー体験の変化

- プロダクト UI 変更なし。**検証フェーズ**のドキュメント整備
- オーナーが本番でコアループ最終節を非エンジニアでも確認可能

### 関連リンク

- `docs/version-published-loop-design.md` / `docs/supabase-dashboard-migration-guide.md` §005 から参照

---

## 2026-06-13 オーナー × ChatGPT × Cursor トリガー運用の恒久化

### 今回やったこと

- **`docs/forge-triage-operations.md` 新設** — トリガー運用の正本
  - `CURSOR` キーワード（Cursor 貼付用完成文 1 本）
  - Run スクショ → Run 判断 [A]〜[D]
  - summary / handoff / 判断用メモ → レビュー運用
  - UX 違和感発言 → UX レビュー
  - プロダクトレビュー優先順位（原典＞ユーザー＞開発者＞MVP＞技術）
  - チャット移行（handoff 初回 → summary 追従）
- `docs/gpt-run-decision-memo.md` — 結論を 4 段階 [A]〜[D] に更新
- `AGENTS.md` / `forge.mdc` / `forge-principles.md` / `chatgpt-summary-format.md` / `chatgpt-handoff.md` に反映

### オーナー・ChatGPT 体験の変化

- 「CURSOR」だけで ChatGPT から Cursor へ貼れる完成指示が得られる
- Run スクショ・サマリ貼付時の ChatGPT の振る舞いが明文化され、解釈ブレを防止
- UX の「なんか違う」等が感想ではなくレビュー依頼として扱われる

### 注意事項

- プロダクトコード変更なし。運用ドキュメントのみ
- 旧 Run 結論「[C] 中止推奨」は **[D] Run禁止** または **[C] 追加確認推奨** に読み替え

---

## 2026-06-12 成長ループ接続 — 新版公開通知 + 再プレイバナー（コード実装済み・DB migration 005 未適用）

### 今回やったこと

- devlog で版 bump 時、watch ユーザーへ **version_published** 通知（devlog 通知とは別 type）
- 通知一覧 → 作品詳細（バナーへアンカー）導線
- 追跡中ユーザー向け「新しいプレイ可能版」バナー（再プレイ + 新 FB 案内）
- migration **005**：`user_notifications.type` に `version_published`、`published_version` 列

### ユーザー目線で変わること（005 + deploy 後）

- プレイヤー：追跡作品の新版公開に通知で気づき、詳細で再プレイ・新 FB を促される
- 開発者：版 bump の結果、プレイヤーが戻りやすくなる

### 注意事項

- **005 適用 → deploy の順**（004 と同様）。コード先行 deploy すると通知 insert が失敗する

---

## 2026-06-12 UX P0 — 開発者導線改善

### 今回やったこと

- devlog フォーム：「今回の更新タイトル / 内容」＋説明文
- 投稿完了画面：「次にやること」（開発ログ・プレイURL確認・テスター募集）
- 開発ダッシュボード（`/my-projects`）：作品行に「開発ログを書く」「フィードバックを見る」
- ヘッダー・各所の名称を「開発ダッシュボード」に統一
- ログイン：パスワード欄 Enter で送信

### ユーザー目線で変わったこと

- 開発者：投稿後・ダッシュボードから「次に何をするか」が分かる
- devlog 投稿時に何を書く画面か迷いにくい

### 注意事項

- DB 変更なし。ホーム「テストプレイ受付中」タブは触っていない（中長期で統合検討）

---

### 今回やったこと

- **migration 004 SQL** 作成：`playable_version`、`version_key` / `updated_at`、UNIQUE（user×作品×版）、devlog `published_version`、phase `プロトタイプ`→`試作版`
- 作品ごとに **プレイ可能版**（自由入力、初期 `0.1`）を保持
- FB：**1ユーザー×1作品×1プレイ可能版 = 1件**。同版は **編集可**（UPDATE）
- devlog 投稿時：「新しいプレイ可能版として公開」チェック + 版名入力 → `playable_version` 更新 + devlog に `published_version` 保存
- 既存 FB は `version_key = 0.1` 扱い。旧版 FB のプレイヤー向け表示は **後回し**
- 開発者 FB 一覧・作品詳細 FB フォーム・開発の歩み（`published_version` ラベル）を対応

### ユーザー目線で変わること（migration + deploy 後）

- プレイヤー：現行プレイ可能版に対して FB を投稿・**同版なら編集**できる
- 開発者：devlog から新版を公開すると FB 枠が版ごとに分かれる。ダッシュボードで版ラベル付き FB を確認

### 注意事項

- **本番 DB 変更あり**。適用順：**Dashboard で 004 → その後 deploy**
- `status` 列は変更しない
- 詳細：`docs/migration-004-design.md`、`docs/supabase-dashboard-migration-guide.md` §004

---

### 今回やったこと

- フェーズ4名称を統一：**試作版 / プレイ可能版 / 通しプレイ版 / 公開準備中**
- 投稿フォーム：各選択肢に開発者向け補足（hint）を表示
- 詳細ページ：フェーズ名 + プレイヤー向け1行説明
- 一覧カード：フェーズ名のみ（旧文字列は表示時に正規化）
- mock 18作品・デモ投稿の古い表現（α版/β版/プロトタイプ等）を整理
- 発見フィルタを新4名称に揃え、旧文字列は一時的に fuzzy マッチ

### ユーザー目線で変わったこと

- 開発者：α/β で迷わず「どこまで遊べるか」で選べる
- プレイヤー：詳細で完成度の目安が1行で分かる

### 注意事項

- DB 変更なし。Supabase に旧 phase が残っていても表示は正規化される
- DB 一括移行は任意（後日オーナー判断）

---

## 2026-06-13 フィードバック表示改善 & 開発者 FB 一覧

### 今回やったこと

- 作品詳細：「コミュニティの声」→「プレイヤーからの改善材料」に変更。星評価・平均スコアを廃止（実データ優先、デモはサンプル表示のみ）
- 良かった点 / 気になった点 / バグ / 観点回答 / 再プレイ意向を構造化表示
- クリエイターダッシュボード（`/my-projects`）に自分の作品への FB 一覧を追加
- 将来方針メモ：`docs/feedback-roadmap.md`（バージョン別 FB は未実装）

### ユーザー目線で変わったこと

- プレイヤー：詳細ページでレビューっぽくなく、改善ヒントとして読める
- 開発者：ダッシュボードで届いた FB を一覧確認できる

### 注意事項

- DB 変更なし。既存 Supabase `project_feedback` をそのまま表示
- バージョン別制約・編集・AI 要約・開発者返信は未実装（意図的）

---

## 2026-06-13 プレイ導線 returnUrl（限定）

### 今回やったこと

- 未ログインでプレイ / 外部リンク → `/login?return=/games/{id}` → ログイン成功後に作品詳細へ
- `/games/{id}` のみホワイトリスト。無効時は `/` へ
- 応援・保存・FB 等は従来どおり return なし

### ユーザー目線で変わったこと

- プレイのためにログインしたあと、**同じ作品詳細に戻れる**

---

## 2026-06-13 マイページ最小版

### 今回やったこと

- `/mypage` 新設：応援中・更新を追う・あとで見る・投稿した作品を分けて表示
- ヘッダーに「マイページ」リンク追加（ダッシュボードは開発者向けのまま）
- DB 参照のみ（`userEngagement` + `projects`）。新規テーブルなし

### ユーザー目線で変わったこと

- ログイン後、「押した操作が何だったか」を一覧で確認できる
- 応援・追跡・保存の意味の違いがページ上で説明される

### 注意事項

- `/bookmarks` は従来どおり存続（マイページと同データ）
- フィードバック履歴・通知管理・フォローは未実装（意図的）

---

## 2026-06-13 localStorage 残骸削除（Step 2）

### 今回やったこと

- デッドコード削除：`play-session.ts`、feedback LS 関数、`loadDeveloperProfiles`
- demo-setup から未使用の support/feedback LS seed 削除
- localStorage 分類ドキュメント追加

### ユーザー目線で変わったこと

- なし（本番 UX は同じ）。コア操作はもともと Supabase 保存。

### 注意事項

- 応援・FB 等のオーナー通知は `forge-notifications`（LS）のまま
- extras / follow / テスター応募数も LS 継続

---

## 2026-06-12 本番 Supabase migration 001/002/003 適用完了

### 今回やったこと

- オーナーが Supabase Dashboard SQL Editor で 001 → 002 → 003 を順に実行
- Table Editor で 9 テーブルすべて確認済み

### ユーザー目線で変わったこと

- 本番で応援・保存・追跡・FB・開発ログ・watch 通知が DB 保存可能になった（画面確認はこれから）

### 注意事項

- 本番 URL は forge-flame-gamma.vercel.app
- 確認手順: docs/supabase-post-migration-checklist.md

---

## 2026-06-12 本番 migration 手順・運用ルール整備

### 今回やったこと

- Supabase Dashboard 向け migration 002/003 適用手順（非エンジニア向け）
- migration 適用後の本番確認チェックリスト（成功/失敗の見え方）
- Run 停止時の **GPT判断用メモ** 運用ルール（AGENTS.md / Cursor Rules / handoff）
- Supabase プラン・課金確認ガイド（オーナー向け）

### ユーザー目線で変わったこと

- なし（ドキュメント・運用のみ）。migration 適用後に devlog・通知・エンゲージメントが本番で動く。

### 注意事項

- migration 002/003 は **オーナーが Dashboard で実行**（Cursor は認証なしのため自動適用しない）

---

## 2026-06-12 開発ログ Supabase 化 + watch 通知

### 今回やったこと

- migration 003：`project_devlogs` / `user_notifications` テーブル追加
- 開発ログを localStorage から Supabase に移行
- devlog 投稿後、`project_watches` を参照して watch ユーザーへ通知を bulk insert
- devlog 通知は Supabase、応援/FB 等の通知は従来どおり localStorage（暫定）

### ユーザー目線で変わったこと

- 開発者が投稿した開発ログが、**他の端末・他のユーザー**からも詳細ページで見える
- **更新を追っている作品**に開発ログが追加されると、**通知一覧**に表示される（別端末でも、ページを開けば反映）
- 組み込みデモ18作品は、従来どおりサンプル履歴表示（DB にログがなければ）

### 開発者目線で変わったこと

- devlog 通知は DB trigger ではなくアプリ側 bulk insert（MVP 向けシンプル構成）
- `/notifications` 表示時に DB 通知を再取得

### 注意事項

- **migration 002 + 003** を本番 Supabase に適用すること
- Realtime / プッシュ通知は未実装（通知ページを開くと反映）

### 未実装事項

- 応援・FB 通知の Supabase 化
- projects extras カラム（プレイ時間・観点）

### 主な変更ファイル

- `supabase/migrations/003_project_devlogs_and_notifications.sql`
- `lib/supabase/project-devlogs.ts`
- `lib/supabase/user-notifications-db.ts`
- `components/games-provider.tsx`

---

## 2026-06-12 開発運用ドキュメント整備

### 今回やったこと

- Forge 原典・判断基準を `docs/forge-principles.md` に集約
- 体験・仕様の変更履歴用 `docs/forge-changelog.md` を新設
- ChatGPT / Cursor 連携用の現在地メモ `docs/forge-handoff.md` を新設
- Cursor 向け開発ルールを `AGENTS.md` に追記

### ユーザー目線で変わったこと

- **アプリの見た目・操作は変わらない**（ドキュメントと運用のみ）

### 開発者目線で変わったこと

- 仕様の原典がリポジトリ内に固定され、チャットに散らばりにくくなった
- 作業完了時に ChatGPT へ貼るサマリ形式が決まった

### 注意事項

- 原典の意味は変更していない（整理・構造化のみ）

### 未実装事項

- 変更なし

### 主な変更ファイル

- `docs/forge-principles.md`（新規）
- `docs/forge-changelog.md`（新規）
- `docs/forge-handoff.md`（新規）
- `AGENTS.md`

---

## 2026-06-12 ログイン必須アクションの整理

### 今回やったこと

- プレイ・外部リンク・応援・あとで見る・更新追跡・フィードバックをログイン必須に
- 未ログインでも詳細ページは閲覧可能
- 未ログイン時はボタンを残し「ログインして〜」表示、`/login` へ遷移
- 応援・ブックマーク・ウォッチ・プレイ・フィードバックを Supabase に保存

### ユーザー目線で変わったこと

- ゲームを**探す・読む**のはログインなしで可能
- **遊ぶ・応援する・保存する**にはログインが必要
- ログイン前でも「ログインすると何ができるか」がボタンから分かる
- 応援は1回押すと「応援中」になり、何度も数字が増えない

### 開発者目線で変わったこと

- エンゲージメント用 Supabase テーブル追加（migration `002_user_engagement.sql`）
- localStorage 依存の応援・ブックマーク等を Supabase へ移行

### 注意事項

- Supabase に migration 002 を適用しないと、応援等が保存されない
- ログイン後は `/` に戻るシンプル仕様（redirect パラメータなし）
- 通知・開発ログ・フォロー等はまだ localStorage 暫定

### 未実装事項

- ログイン後の元ページへ戻る redirect
- 通知・devlog・フォローの Supabase 移行

### 主な変更ファイル

- `components/games-provider.tsx`
- `components/game-detail-sidebar.tsx`
- `components/game-external-links.tsx`
- `components/game-support.tsx`
- `hooks/use-require-auth.ts`
- `supabase/migrations/002_user_engagement.sql`

---

## 2026-06-11 原典に沿った詳細・発見・フィードバック強化

### 今回やったこと

- 詳細ページに概要（フェーズ、プレイ時間、タグ、テスト受付等）を整理表示
- 構造化フィードバック（良かった点 / 気になった点 / バグ / 再プレイ意向）
- プレイ後にフィードバックフォームを表示する導線
- 開発履歴・コミュニティの声セクション
- 更新を追う / あとで見る UI
- トップの発見フィルタ（ジャンル、フェーズ、プレイ時間等）
- 投稿フォームの入力内容が詳細に反映されるよう整理

### ユーザー目線で変わったこと

- 詳細ページで「今遊ぶ理由」が判断しやすくなった
- プレイしてから感想を書く流れになった（いきなり評価を求めない）
- 一覧で完成前ゲームを絞り込みやすくなった

### 開発者目線で変わったこと

- 想定プレイ時間・観点メモ等は一部 localStorage（extras）で暫定保存

### 注意事項

- 応援の連打増加仕様はこの後のログイン整理で改修

### 未実装事項

- extras の Supabase 永続化

### 主な変更ファイル

- `components/game-detail-page-client.tsx`
- `components/game-detail-overview.tsx`
- `components/game-feedback.tsx`
- `components/home-page.tsx`
- `components/submit-page.tsx`

---

## 2026-06-10 投稿フォーム MVP 整理

### 今回やったこと

- 投稿フォームをテスター募集と MVP に合わせて簡素化
- アクセス方法（ブラウザ / ダウンロード / 外部サイト）を明確化
- 重複フィールドの整理

### ユーザー目線で変わったこと

- 作品投稿が短く分かりやすくなった
- どう遊べるゲームか（配布方法）が投稿時に選べる

### 開発者目線で変わったこと

- テスター募集チェックの冗長 UI を削除

### 注意事項

- なし

### 未実装事項

- なし

### 主な変更ファイル

- `components/submit-page.tsx`

---

## 2026-06-10 ログイン後の遷移簡素化

### 今回やったこと

- ログイン成功後は常にトップ `/` へ遷移
- redirect クエリによる複雑な戻り先処理を廃止

### ユーザー目線で変わったこと

- ログイン後の動きが予測しやすくなった（必ずトップ）

### 開発者目線で変わったこと

- redirect 周りの不具合リスクを下げた

### 注意事項

- 保護ページからログインした場合も一旦トップに戻る

### 未実装事項

- ログイン後に元の操作へ戻る UX

### 主な変更ファイル

- ログイン関連コンポーネント・middleware

---

## 2026-06-09 ホーム発見 UX・ビジュアル刷新

### 今回やったこと

- ヒーローコピー：「次にハマるゲームは、完成前に見つかる。」
- 大型ヒーローショーケース（Steam 風の注目作品）
- 重複していた「今注目」セクションを削除
- タブ：新着 / テストプレイ受付中 / 急上昇
- ユーザー向け文言：テスター → テストプレイ
- デモ用 SVG サムネイル（ジャンルが伝わるイラスト風）

### ユーザー目線で変わったこと

- トップが「完成前ゲームのショーケース」らしくなった
- 「テストプレイ受付中」が一般ユーザーにも分かりやすくなった

### 開発者目線で変わったこと

- 内部データ名（lookingForTesters 等）は維持、表示のみマッピング

### 注意事項

- なし

### 未実装事項

- AI サムネ生成（Coming Soon 表示のみ）

### 主な変更ファイル

- `components/home-page.tsx`
- `components/hero-game-showcase.tsx`
- `public/demo-thumbnails/*.svg`

---

## 2026-06-08 Supabase 認証・作品永続化

### 今回やったこと

- Supabase Auth によるログイン / サインアップ
- 投稿作品・開発者プロフィールを Supabase に保存
- 保護ルート（投稿・マイ作品等）の middleware

### ユーザー目線で変わったこと

- アカウントを作ると作品投稿が端末をまたいで残る
- ログインしないと投稿・マイ作品に入れない

### 開発者目線で変わったこと

- mock + localStorage 中心からハイブリッド構成へ

### 注意事項

- Supabase 環境変数未設定時は認証・保存が動かない

### 未実装事項

- エンゲージメント全般の Supabase 化（後日対応）

### 主な変更ファイル

- `lib/supabase/*`
- `components/auth-provider.tsx`
- `supabase/migrations/001_projects_and_developer_profiles.sql`

---

## 2026-06-07 MVP 基盤（初期）

### 今回やったこと

- ダーク × オレンジの Forge ランディング / 一覧 / 詳細
- 日本語 UI
- 応援ボタン、投稿、マイ作品、検索・タグ・ソート
- プレイ URL・外部リンク
- クリエイターページ・フォロー（localStorage）
- フィードバック（当初はコメント形式）

### ユーザー目線で変わったこと

- 開発中ゲームを探して詳細を見て、外部でプレイできる MVP が成立

### 開発者目線で変わったこと

- ほぼ localStorage + React state のプロトタイプ

### 注意事項

- 以降、原典に沿って localStorage 依存を段階的に削減

### 未実装事項

- バックエンド永続化、構造化フィードバック、ログイン方針（すべて後続で対応）

### 主な変更ファイル

- 初期 app / components 一式
