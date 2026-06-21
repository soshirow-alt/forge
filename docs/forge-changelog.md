# Forge Changelog（体験・仕様の変更履歴）

コードの commit 履歴ではなく、**ユーザー体験**と**サービス仕様**がどう変わったかを記録する。

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
