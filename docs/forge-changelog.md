# Forge Changelog（体験・仕様の変更履歴）

コードの commit 履歴ではなく、**ユーザー体験**と**サービス仕様**がどう変わったかを記録する。

---

## 2026-07-24 — Preview: 正式ルート導線をProductionへ復帰（Prototype隔離）

- **正式/home** — queryなしでも `DiscoveryHomePage`（ヒーロー／棚／正式データ経路）。`HomePrototypeRouter` による分岐を廃止
- **PlayerShell** — サイドバー「ホーム」、Studio→公開の「Player切り替え」をProduction文言へ
- **新規投稿** — `studioSubmitModalHref` / Studioホーム「新規投稿」/ `/submit` を正式 `/studio/submit` へ。category-protoは専用URLのみ
- **維持** — `/explore/prototype/**`、カテゴリ投稿Prototype、`/prototype`、OGP immutable path
- **非対象** — main / Production deploy、Explore Phase 5 実装変更、DB / Storage

## 2026-07-24 — Preview: Explore Prototype 発見体験をProduction階層へ再構成（Phase 5）

- **注目** — 静的カードgridを廃止し、中央1作品＋左右peek＋矢印＋ドット＋5秒autoplayのヒーローカルーセルへ（Prototype専用component）
- **通常カード** — 枠・説明・制作者・タグ・カテゴリ固有行・下端CTAを廃止。画像＋タイトル＋フェーズ·更新日＋統計3件の軽量カードへ
- **棚** — 最近更新／新着は pager（PC4列）。横断ホームは混在4件ヒーロー＋カテゴリ別軽量棚＋「すべて見る」
- **関連** — 詳細下部も軽量カードへ寄せ（説明・タグ・CTAなし）
- **非対象** — Production `/home`・正式ヒーロー／カード、OGP、DB、main

## 2026-07-24 — Preview: OGP派生を不変pathへ（Phase 3F・同一URL上書き廃止）

- **Production最終検証（read-only）** — 手動修復済み6作品＋Kick Counterの正式objectが repair manifest の SHA／byteLength と一致。公開14件の破損OGPは0。正常作品のSHA意図変更なし
- **Preview実装** — 派生JPEGの SHA-16 を含む不変path（`og-<sourceHash16>-<derivedJpegHash16>-1200x630.jpg`）へ upload（`upsert:false`）。同一バイトなら再利用、不一致は停止して DB 非更新。旧 OG object は自動削除しない
- **目的** — 同一URL上書きによる CDN／Dashboard の古い画像表示（黒プレビュー）を避ける
- **非対象** — Production DB／Storage write、main／Production deploy、cleanup、title／description 変更

## 2026-07-24 — Preview: Explore Prototype カード視覚統一＋棚内高さ揃え

- **視覚** — 枠・角丸・hover・typography を `/home` 注目カードに寄せ、オレンジCTAを廃止して白CTA（Featured同系）へ。詳細主CTA／関連カードも同ルール
- **高さ** — 同一棚内で `h-full`＋タイトル／説明の2行スロット固定＋footer `mt-auto`。カード全体の巨大 `min-height` は使わない
- **維持** — カード幅・列構成・一覧画像 `h-36`/`xl:h-40`
- **非対象** — 正式 `/home` 構造・正式ゲームカード・OGP・main / Production

## 2026-07-23 — Preview: Explore Prototype 一覧カード縦コンパクト化

- **対象** — `/explore/prototype` 横断ホーム＋各カテゴリ一覧カードのみ（横幅・列構成は維持）
- **変更** — 一覧画像を固定高（`h-36` / `xl:h-40`）、本文 padding・gap 圧縮、`min-h-*` / `flex-1` / `mt-auto` による縦伸びを削除、CTA を `h-9`、情報の横並び強化
- **非対象** — 詳細ページ・正式ゲームカード・OGP・main / Production

## 2026-07-23 — Preview: Explore Prototype サムネ視認性修復

- **原因** — ローカル SVG が黒寄りの面が多く、暗いカード枠（`bg-zinc-950`）に同化して作品差が判別しづらかった
- **asset** — `public/images/explore-prototype/**` 全24件（個別20＋fallback4）を高コントラストに作り直し（Forge紫トーン維持・カテゴリ差が画像だけで分かる構図）
- **表示** — 共通 `ExplorePrototypeThumb`（紫系フレーム背景）。一覧/関連は `object-cover`、詳細は `object-contain`
- **ホーム** — `/explore/prototype` を redirect から横断ハブへ。注目の作品4件＝各カテゴリ代表1件
- **非対象** — `/home`・正式ゲーム・Studio・DB・OGP・main / Production

## 2026-07-23 — Preview: Explore Prototype 作品詳細ページ

- **ルート** — `/explore/prototype/[category]/[slug]`（24作品を静的生成）。不正 category / slug / カテゴリ不一致は `notFound()`
- **導線** — 一覧カード本体・タイトル・CTA から詳細へ遷移（toast廃止）。詳細の主CTAはカテゴリ別toast（外部接続は次工程）
- **詳細** — 共通レイアウト＋カテゴリ固有の作品情報。フィードバックサンプル／最新更新／同カテゴリ関連最大3件
- **非対象** — `/home`・正式 `/games/[id]`・Studio・DB・OGP・Production

## 2026-07-23 — Preview: Kick Counter OGP修復準備（Phase 3D・手動upload待ち）

- **対象** — Production Kick Counter 1件のみ（UUID `3a2f5a74-…`）。ローカルで修復用 1200×630 JPEG を生成し `.tmp-ogp-repair/` に保持
- **非実施** — Production Storage / DB write、derive API、main / Production deploy。オーナーが Dashboard で同名 object を手動上書きするまで停止
- **ツール** — `scripts/production-only/repair-corrupted-og-images.ts` を dry-run 完成（UUID1件・破損一致・execute封印）

## 2026-07-23 — Production: OGP派生アップロード再発防止を反映（Phase 3C）

- **反映** — Phase 3A の Storage upload バイナリガード（exact-length ArrayBuffer・pre/post 検証・成功後のみ `og_image_url` 確定）を main / Production へ
- **非変更** — 既存 Storage object・破損7件は未修復のまま。DB/Storage write・修復 execute なし
- **目的** — 今後のサムネ更新／再派生で UTF-8 破損 JPEG が保存されることを防ぐ

## 2026-07-23 — Staging: OGP派生アップロード canary（Phase 3B）

- **対象** — Staging（`vuqpwvjvgyxffmvpfrxo`）テスト作品 Comet Rush のみ（`dddddddd-dddd-4ddd-8ddd-000000000206`）
- **経路** — Preview の Phase 3A ガード付き derive API（exact ArrayBuffer upload・pre/post 検証後に `og_image_url` 更新）
- **結果** — 1回目・2回目 upsert で A=B=C（SHA 一致・FF D8・1200×630・`image/jpeg`）。他 Staging 公開作品の `og_image_url` 非変更。Preview HTML / Twitterbot の `og:image` / `twitter:image` 一致
- **非対象** — Production DB/Storage、破損7件修復、main / Production deploy

## 2026-07-23 — Preview: OGP派生アップロードの再発防止（Phase 3A）

- **背景** — Production 破損7件は「sharp 正常 JPEG → Storage 保存前」で UTF-8 置換バイト化されたものと一致。ローカル sharp 出力は正常
- **防御** — Storage upload 直前に exact-length `ArrayBuffer` のみ許可（string / Buffer 直渡し拒否）。upload 前 JPEG 検証（SOI・1200×630・sharp・UTF-8置換prefix拒否）。upload 後バイナリ再取得で SHA/長さ/バイト一致を確認してからのみ成功扱い。`og_image_url` 更新は検証成功後のみ（route 既存順を維持）
- **検証** — `npm run verify:og-derive-upload-guards`（mock Storage・Production 破損再現 fixture）。修復スクリプトは dry-run/設計のみ（Production write 封印）
- **非対象** — Production DB/Storage 修復、Staging canary、main / Production deploy、metadata / RPC / home / Explore / Studio UI

## 2026-07-22 — Preview: Exploreカテゴリ別ページ＋作品カード Prototype

- **ルート（Preview専用）** — `/explore/prototype`（→ game redirect）/ `game` / `audio` / `dev-tool` / `service-app`
- **体験** — カテゴリを選ぶ → 棚（注目／最近更新／新着）で一覧 → サムネとカード情報で内容を把握 → 「遊ぶ／聴く／利用する」判断。詳細はトーストのみ（正式詳細・DB・検索・本番は未着手）
- **サムネ** — カテゴリ差・作品差が分かるローカルSVG（個別＋カテゴリ別fallback）。remote / data URI なし
- **非対象** — `/home` 置換、正式カード改修、Supabase、main / Production

## 2026-07-22 — Preview: branch alias 自動追従を復旧

- **原因** — 自動 branch alias が `94f9a47`（`dpl_6gLpwLx…`）に sticky。以降 Ready は `aliasAssigned:true` でも `/deployments/<id>/aliases` が空で hostname が動かなかった。open PR 紐付けも再付与を不安定化
- **復旧** — 当該 hostname を `vercel alias rm` で外し、`preview/landing-01` を Git push。最新 Ready に automatic alias が再登録
- **追従確認** — 続けて別 commit を push し、alias `deploymentId` が新しい Ready へ自動移動することを確認（手動 `alias set` なし）
- **恒久** — `npm run verify:preview-branch-alias` を Preview 完了条件に維持。自動 hostname への恒久 `alias set` 固定はしない

## 2026-07-22 — Preview: branch alias 追従を完了条件に固定

- **原因（根拠）** — `preview/landing-01` への Git Integration Preview は Ready になり続けていたが、オーナー確認用 hostname `forge-git-preview-landing-01-…` の配信 bundle が **`94f9a47` / `forge-7bw0ovb6b` / dashboard `6gLpwLxZoo8z9XRuycQVx8gMVyHi` と byte 一致のまま固定**。`9295fac`・`da82b70` の unique URL は新 helper を配信。追加 push でも alias は更新されず、自動 git branch alias ではなく **特定 Deployment 固定相当**の状態
- **恒久** — Preview 完了は alias 上の bundle 検査（`npm run verify:preview-branch-alias`）まで。自動 git hostname への `vercel alias set` 固定を禁止。Domains で Git Branch=`preview/landing-01` に戻す復旧手順は `docs/vercel-preview-project.md`
- **運用** — `docs/forge-triage-operations.md` §8.1 の Preview 完了条件を alias 追従必須に更新
- **今回** — 最新コードは `da82b70`（Git deploy `forge-cin927fun` / `4dyeE3GJ5FkvQh7YMtMW4mUreQ5d`）。alias 更新は Dashboard の Domains 再割当（一度きり）が必要（この環境に Vercel 認証なし）
## 2026-07-21 — Preview: 新規投稿導線の実クリック経路を修正＋alias再デプロイ

- **原因** — Preview alias が入口修正commitを配信しておらず、実クリックは旧 `/studio/submit` helper のまま
- **修正** — Studioマイページ／一覧の投稿CTAを `onOpenSubmit` button 経由から `Link href={studioSubmitModalHref()}` に一本化
- **確認** — alias 配信バンドルに `category-proto` が含まれることまで検証対象

## 2026-07-21 — Preview: 新規投稿導線をカテゴリ選択へ統一

- **入口** — Studioマイページ／ホーム／空状態／続けて投稿／旧 `/submit` など、新規投稿開始リンクを `/studio/submit?view=category-proto` へ
- **維持** — `/studio/submit` 直アクセスはゲーム正式投稿・回帰用として残置（リダイレクトしない）
- **編集** — 既存作品編集導線は変更なし

## 2026-07-21 — Preview: 3カテゴリ投稿を正本行構成へ統合

- **方針** — 正式 `/studio/submit` のパネル行構成を維持。分類・音源／利用情報・文言・CTA・公開先行だけカテゴリvariant
- **削除** — 「作品情報」まとめパネル、FB活用先、想定用途、課題、登録要否、無料範囲、開発フェーズ非表示、ゲーム特別扱い文言
- **公開先** — Prototype専用候補＋「○○で開く」。正式 `PUBLISH_DESTINATION_KINDS` は未変更
- **主CTA** — 音楽「聴く」／ツール・サービス「利用する」（公開先に依存しない）
- **保存** — 新カテゴリは未接続（押下時トーストのみ）

## 2026-07-21 — Preview: 投稿プロトを正式 `/studio/submit` 流用へ再修正

- **削除** — 独自ウィザード（基本情報／作品情報／フィードバック画面・ステップナビ・独自左右レイアウト）を完全削除
- **残す** — `/studio/submit?view=category-proto` のカテゴリ選択のみ
- **作り直し** — 選択後は正式 `StudioSubmitPage` / `StudioSubmitPlayerPreview` / `StudioSubmitPanel` を直接利用。カテゴリは右パネル内のフィールド・文言のみ差し替え
- **ゲーム** — 正式投稿へ遷移。validation・保存・公開変更なし
- **新カテゴリ** — 同構成UI。保存ボタンは未接続メッセージのみ。DBへダミー変換しない

## 2026-07-21 — Preview: 投稿プロトタイプ作り直し（旧縦長フォーム削除）

- **削除** — 不採用の縦長 `StudioSubmitCategoryPrototype` と専用定数を完全削除（コメントアウト残存なし）
- **（後続で撤回）** — ステップ型プロトは正式画面流用方針により削除済み
- **Explore／詳細プロト** — 維持

## 2026-07-20 — Preview: Explore第二階層ナビ（カテゴリ面）

- **Explore内ナビ** — `/home` 系のメイン上部に横並び第二階層（ホーム / ゲーム / 音楽・音声 / 開発ツール / サービス・アプリ）。現在地を紫選択。スマホは横スクロールで5項目維持
- **仮route** — `/home`、`?category=game|audio|dev-tool|service-app`（定義は `lib/prototype/domain-expansion.ts` に集約）
- **カテゴリ面** — 新カテゴリは fixture 棚（注目の作品・新着）。ゲーム面は現行発見フィード維持
- **入口カード** — Exploreホームの「カテゴリから探す」は残し、ナビと同じカテゴリ面へ遷移
- **DB / API / RPC / Production** — 変更なし

## 2026-07-20 — Preview: 対象領域拡張の薄いUIプロトタイプ

- **Exploreホーム** — `/home` を4カテゴリ横断の Explore プロトタイプに。注目の作品・カテゴリ入口・カテゴリ別抜粋。ナビ表記を Explore に仮変更
- **ゲームカテゴリ面** — `/home?category=game` で現行発見フィードを維持（ゲーム面として比較用）
- **Studio投稿** — `/studio/submit?view=category-proto` でカテゴリ選択＋共通／固有項目の分岐UI。新カテゴリは保存未接続。既存 `/studio/submit` の validation・保存は変更なし
- **詳細上部比較** — `/prototype/works/[slug]` で4カテゴリ＋音楽アート有無2案。主CTAは `recordPlay` 非接続。下部タブは対象外
- **比較ハブ** — `/prototype`
- **DB / API / RPC / Production** — 変更なし（Preview専用 fixture）

## 2026-07-17 — Production hotfix: みんなのフィードバック全ver表示

- **初期表示** — 作品詳細「みんなのフィードバック」を最新ver固定から「すべて」へ変更。タブ件数と同じ全バージョン対象で、旧verにだけFBがある作品でも初期表示が空にならない
- **verフィルター** — 「すべて 件数」＋新しいver順のコンパクトチップ（0件verも薄く表示）。初回にまとめて取得し、切替はクライアント内で即時反映
- **集計・空状態** — 「回答の傾向」も選択中verに追従。全verでは問いをver単位で分離したまま集計し、異なる問いを混在させない。0件verは専用メッセージ＋「すべてのフィードバックを見る」
- **カード** — 回答対象verのバッジに aria-label / tooltip を追加。共感・開発の参考になった・返信・開発者表示・登録ユーザーのみの公開条件は維持
- **DB** — migration / Production DB write なし

## 2026-07-16 — Player / Studio トップバー統一

- **モード切替** — Player 側 `Studio` → `Studio切り替え`（`/studio`）、Studio 側 `作品を探す` → `Player切り替え`（`/home`）。双方とも同じ紫ボタン（固定幅・高さ h-10）
- **検索欄** — Player / Studio で開始位置・高さ・余白を共通クラスで揃え
- **プロフィールアイコン** — トップバーの User アイコンを双方から削除（サイドバーのプロフィールは維持）。通知・ログアウト・モード切替は残す

## 2026-07-16 — Production hotfix: 公開FBカード操作行の視認性

- **開発の参考になった** — オーナー向けを薄いテキストから紫バッジ風トグル（h-9）へ。未選択 `☆ 開発の参考になった`／選択 `★ 開発の参考になった`（塗りつぶし強調）。共感ピンクと色分け
- **返信する** — 操作行右寄せ。Reply アイコン＋`返信する` / `返信 N件`（バッジではない text-sm）。既存 `canOpenThread` / `viewerCanReply` のまま
- **レイアウト** — 日付行の下に操作専用行（左: 共感＋参考になった / 右: 返信）。RPC・DB・共感ロジックは変更なし

## 2026-07-16 — Studio 未読公開FB / 「開発の参考になった」（Production）

- **クイックアクセス** — 「ガイド」を外し「フィードバックを確認」を追加（`/studio/mypage`）。全所有作品の未読公開FB合計が >0 のときだけ「新着 N件」
- **作品カード** — 未読公開FBがある作品のみ紫ピル CTA（`新着FB N件 ›`）。カード本体は overview、バッジのみ `?tab=voices`（みんなのフィードバック）へ。`stopPropagation`
- **未読 SoT** — `project_feedback_owner_reads(project_id, owner_id, last_seen_at)`。登録ユーザー公開カード（short_text / voice_supplement / detailed）のみ。返信・ゲストは除外。バッチ RPC `list_owned_public_feedback_unread_counts`
- **既読** — オーナーが「みんなのフィードバック」タブを開き公開カード fetch 成功時に `mark_project_public_feedback_seen`。overview だけでは既読にしない
- **開発の参考になった** — オーナーのみ ☆/★ トグル（既存 `developer_feedback_helpful_marks` + `toggle_feedback_card_helpful`）。共感ピンクUIは維持
- **DB** — migration `075` を Staging（`vuqpwvjvgyxffmvpfrxo`）・Production（`bpnisgzxuwdxelhnduuf`）ともオーナー適用済み。Staging ephemeral owner で unread/mark-seen 動作 PASS
- **本番反映** — `main` = `faf1c50`（共感 hotfix `fa521d4` 含む）。deploy `dpl_84eog3nSq2e731ExoGqQLwzCQ3nG` / https://forge-flame-gamma.vercel.app。`preview/landing-01` 同期済み

## 2026-07-16 — Production hotfix: 共感ボタンの視認性（ワンウェイ）

- **共感 UI** — 「共感 N」の薄いテキストから、ピンク系・高さ36px前後のハート付きボタンへ。未共感「共感 N」／成功後「共感済み N」で非活性（再押下で解除しない）。自分のFBは非表示、未ログインは EntryGate、auth 未解決時はフラッシュしない。RPC/RLS/件数ロジックは変更なし

## 2026-07-16 — Production hotfix: 共感 toggle / Studioプロフィール Shell

- **共感** — 公開FB cards API が service_role のみで RPC していたため `auth.uid()` が常に null → `viewerCanEmpathy=false` でログイン済みでも「共感 0」が disabled。viewer session で `get_public_feedback_cards` を呼び、自分のFBは 0件時非表示／未ログインは EntryGate
- **Studioプロフィール** — サイドバー／ヘッダーを `/studio/profile` に戻し、middleware・entry gate・page の `/mypage/profile` 強制リダイレクトを撤去。Studio Shell 維持。「Player画面で見る」のみ Player 側へ

## 2026-07-16 — 072/073 prep (answer_value DB cap + notifications minimum privilege)

- **072 Staging 適用済み** — verify `scripts/staging-only/verify-072-post-apply.mjs` PASS（行数1→1、既存行不変、1000 OK / 1001 CHECK拒否、choice/yes_no/scale_3、optional_comment 071 維持）
- **073 Staging 適用済み** — SELECT + read_at UPDATE + type別 INSERT policy
- **074（未適用）** — `developer_has_follower()` SECURITY DEFINER helper; followed_developer INSERT policy を RLS 安全化
- **Staging 専用** — `sync-project-watches-authenticated-select.sql`（`project_watches` SELECT GRANT。Production migration には含めない）
- **ゲスト公開スコープ外・071** — 変更なし

## 2026-07-16 — R18 / FB1000 / 共感・参考になった・返信 / Studioプロフィール（Preview follow-up）

- **070 Staging 適用確認** — `age_rating` CHECK・公開カード enrichment・共感/返信 RPC・anon 書き込み拒否を検証
- **071（未適用）** — `071_public_feedback_engagement_harden.sql`。共感 RPC 専用化／optional_comment≤1000（超過行があれば適用 abort・暗黙更新なし）／公開カード RPC から guest 系を排除。Staging Dashboard 適用待ち
- **ゲストFB** — 公開スコープ外を維持（API `guest_feedback_disabled`、一覧 `p_include_guest: false`、071 で resolve／engagement RPC も registered のみ）。Studio 内部の helpful テーブル経路は非変更
- **Preview** — 正本 Vercel project は `forge`。誤連携していた `forge-app` の Git を disconnect（プロジェクト削除なし）。手順: `docs/vercel-preview-project.md`
- **返信 UI** — 返信不可の第三者／ゲスト投稿者に「返信する」を出さない（件数がある場合の閲覧展開、または `viewerCanReply` のみ）
- **詳しい感想** — 現行 `/games/[id]`（`GameDetailV0Page`）の実導線は `showDeepFeedback={false}` のため到達不能。今回の1000字対象は short_text / ひと言コメントのみ

## 2026-07-16 — R18年齢区分 / FB1000字 / 共感・参考になった・返信 / StudioプロフィールShell（Preview）

- **R18** — `projects.age_rating`（`general` \| `r18`）。ジャンル・タグとは別。Studio「ジャンル・タグ」パネルに年齢制限チェック＋確認モーダル。Player `/games/[id]` はブラウザ自己申告ゲート（localStorage `forge_age_verified_v1`）。Studioプレビューは非対象
- **FB本文** — 自由記述（`short_text` / ひと言コメント）を 200→1000 字。カウンター・自動拡張 textarea。開発者の質問文・詳しい感想フィールドは変更なし
- **みんなのフィードバック** — 4系統カードに共感（toggle・件数・自分のFB不可）／開発者「参考になった」（既存 `developer_feedback_helpful_marks` 再利用・ゲスト源を拡張）／1階層返信（本人またはオーナー、200字、通知 `feedback_reply`）
- **Studioプロフィール** — `/studio/profile` で Studio Shell 維持。Player 活動リンクは Shell を切り替えない。明示的に「Player画面で見る」
- **DB** — migration `070_age_rating_feedback_engagement.sql`（Staging 適用前提）。Production 未適用
- **対象外** — main merge / Production deploy / Production DB

## 2026-07-15 — X共有のOGP反映待ち注意（hotfix）

- **対象** — 共通「外部に共有する」モーダル（投稿完了／作品詳細オーナー／Studio作品カード）の「Xで投稿画面を開く」直下
- **文言** — 「Xでは画像の反映に少し時間がかかることがあります。画像が表示されない場合は、少し待ってから共有してください。」（情報アイコン・中立色。URLコピー領域には出さない）
- **非変更** — 共有URL・X intent・OGP処理。共有操作はブロックしない

## 2026-07-15 — Phase 2 Production UI polish hotfix

- **開発者一覧** (`/search/creators`) — カード `max-w-4xl` を外し一覧列を絞り込み直前まで伸ばす。一覧↔絞り込み gap を約24px。代表作品は件数に応じた横並び（1件で右半分が空かない）
- **Studioホーム** — 3メトリクスカードのヘッダーを icon+title を同一行・`items-center` で揃える。カード2タイトルを「プレイヤーフィードバックの人数」に統一
- **Studioサイドバー** — 「作品を探す」項目のみ削除（ヘッダー／モード切替・Player側は維持）
- **Studioプロジェクト一覧** — 公開状態＋開発フェーズをデスクトップで横並び（検索・並び・表示切替は維持）
- **LP** — プレイヤーカード内の重複「ゲストで作品を見る」を削除。ヘッダー右上のゲスト導線と「ゲームを探す」は維持
- **Production FB掃除** — オーナーアカウントの欠落プロジェクト宛 orphan FB 削除はコード変更外。Production Sensitive env が CLI で空のため、適用 SQL は `scripts/production-only/orphan-owner-fb-delete.sql`（Dashboard）。正規公開作品 FB は対象外
- **対象外** — schema / migration / 069 復活なし

## 2026-07-15 — Phase 2 本番反映（プロフィール／公開プレイヤー数／ゲスト導線）

- **対象** — Preview 上の Phase 2（A–J）を Production コードへ反映。DB は **068 のみ**（オーナー適用済み）。**069 は UNUSED・非適用**
- **問い合わせ対応** — プロフィール画像保存ホットフィックス継続。ゲスト／ログイン／Studio「作品を探す」から他公開作品へ到達できる導線を維持
- **公開プレイヤー数** — `get_public_project_stats.play_player_count`（登録プレイヤー DISTINCT）。UI「プレイヤー N人」。未取得は非表示（偽の 0 なし）
- **X説明** — 設定画面の文言をプロフィールと同文に統一（投稿／DMしない文言は出さない）

## 2026-07-15 — ホーム発見カードにも「プレイヤー N人」（Preview）

- **原因** — `/home` の discovery feed は FB／フォローだけ取り込み、`play_player_count` をマージしていなかった（検索・詳細は表示済み）
- **対応** — feed 取得後に `get_public_project_stats` で play を付与。0 は「プレイヤー 0人」、未取得は非表示のまま
- **対象外** — Production 未反映。home feed SQL 自体への列追加はなし（クライアント側マージ）

## 2026-07-15 — マイページ「FB履歴」実装（Preview）

- **FB履歴タブ** — Coming Soon をやめ、ログインユーザー本人が送信した既存 FB を新しい順に表示（1送信≒1件）
- **正本** — `project_feedback`（詳しい感想＝1行1件）と `project_voice_responses`（同 project+version の回答セット＝1件）。反映表示は `voice_adoptions` が実在するときのみ
- **カード** — 小型サムネ・タイトル・送信日・ver・種別／要約・作品への導線。非公開・削除済みは安全にフォールバック
- **更新追跡中との分離** — FB 本文・履歴一覧は更新追跡中へ再掲しない（追跡カードの反映バッジは従来どおり adoption 正本のみ可）
- **対象外** — Production 未反映。新評価機能・DB migration なし

## 2026-07-15 — migration 069 不採用（table GRANT 恒久化しない）

- **背景** — Staging で `service_role` が `project_plays` を直接読めず（permission denied）、検証スクリプト用に GRANT 復元案 069 を置いていた
- **結論** — **製品ランタイムには 069 不要**。公開「プレイヤー N人」は 068 の `get_public_project_stats`（SECURITY DEFINER）のみ。Production／Staging に 069 を適用しない
- **扱い** — `supabase/migrations/069_*.sql.UNUSED`（適用禁止・履歴のみ）。検証は `scripts/staging-only/verify-068-play-player-count-rollback.sql`（Dashboard postgres・BEGIN/ROLLBACK）

## 2026-07-15 — migration 068 修復（SQL のみ・未適用）

- **Staging 失敗原因** — `CREATE OR REPLACE` では OUT/RETURNS TABLE 形を変えられず `42P13`。同一 BEGIN 内で `DROP FUNCTION …(uuid[])` → CREATE → COMMENT → REVOKE/GRANT
- **play 集計** — `play_player_count` = `COUNT(DISTINCT project_plays.user_id)`（登録プレイヤー。ゲスト行なし＝除外）。表示は「プレイヤー N人」
- **対象外** — Staging／Production への適用はオーナー手動。本作業では SQL 修正と検証のみ。**069 table GRANT は不要**（上記）

## 2026-07-15 — 公開プレイ指標を詳細・ブックマークへ（Preview）

- **作品詳細概要** — ホーム／検索と同じ `DiscoveryCardStatPills`（プレイヤー／フィードバック／フォロー）を最近の動きに表示。`play_player_count` 未取得時はプレイヤーだけ非表示
- **ブックマーク（あとで遊ぶ）** — カードに同指標を追加。オレンジ hover を紫系へ寄せる
- **対象外** — Production / Staging migration 068 の再適用は Management token 無しのため未実施（コードは 068 前提で null-safe）

## 2026-07-15 — モック開発者プロフィール CTA／フェーズ表記（Preview）

- **モック `/creators/[id]`** — コミュニティ参加申請を三点メニュー外（フォロー隣）へ。三点メニューは通報のみ（本番リアルプロフィールと同型）
- **開発フェーズ表示** — `公開準備中` の表示ラベルを「正式版候補」から「公開準備中」に統一（フィルターと一致）

## 2026-07-15 — マイページ「更新追跡中」の責務整理（Preview）

- **混在していたもの** — 「前回プレイ後の更新」「更新を追っている作品」「あとで遊ぶ」が同一タブに並び、同一作品の二重表示と保存作品タブとの重複が起きていた
- **更新追跡中** — 追跡中作品のみ・1作品1カード。更新ありを先頭。状態チップは利用可能な正本のみ（前回プレイ後＝`meaningful_update_at > last_played_at`、新バージョン、最新ver未プレイ、FB反映＝`voice_adoptions`、更新なし）。あとで遊ぶは置かない
- **保存作品** — ブックマークのみ（変更なしの責務。更新追跡中から再掲しない）
- **フィルター** — すべて / 更新あり / 更新なし /（PLAYER_VISIBLE時のみ）FBが反映された。0件を他作品で補完しない
- **カード** — コンパクトな横並び（16:9ミニサムネ＋状態＋CTA）。更新ありは紫系CTA、オレンジ警告用途は使わない
- **通知** — 各更新通知は作品詳細へ。マイページ入口は `/mypage?tab=witnessing`（任意 `project=` でカード強調）
- **対象外** — Production 未反映。DB migration なし（既存 meaningful / sessions / adoptions を利用）

## 2026-07-15 — `/studio/profile`・`/settings` 正本リダイレクトを auth より先に（Preview）

- **症状** — 未ログインで `/studio/profile` / `/studio/settings` に来ると、ページ正本リダイレクトより先に Studio auth gate が走り、`login?return=/studio/...` になることがあった
- **修正** — middleware で auth 判定より前に `/mypage/profile`・`/settings` へ寄せる。login return の sanitize も同正本へ正規化。Studio ガードも stub 経路だけ先に正本へ
- **結果** — ログイン後も旧 Studio 経路を経由しない。Studio 権限が必要な他ページの保護は維持
- **対象外** — Production 未反映

## 2026-07-15 — hotfix: 公開直後に OGP 画像が付かないレースを修正

- **症状** — 新規公開作品（例: Time Battler）の X カードにタイトル/説明のみで画像が付かないことがある
- **原因** — 投稿時に `visibility=public` で先に INSERT するため `first_published_at` が付き、サムネ Storage 保存・`og_image_url` 派生より前に作品ページがクロール可能になっていた。派生失敗も握りつぶしていた
- **修正** — サムネありの公開投稿は先に private INSERT → HTTPS サムネ保存＋ OGP derive（1回リトライ）完了後に public へ昇格。ファイル読み込み中は投稿ボタン無効。「画像を読み込み中…／アップロード中…」。derive 後に `revalidatePath(/games/[id])`
- **対象外** — Production DB / Storage 手動変更なし（コードのみ）

## 2026-07-15 — hotfix: LP / ログインのゲスト導線を復元

- **症状** — Production LP にゲスト CTA がなく、`/login`（return なし）でも「ゲストで参加」が出ない。問い合わせ: 他人の作品を見られない／自分の作品も出せない
- **原因** — `shouldShowGuestLoginEntry` が return 付きゲスト許可パスのときだけ CTA 表示しており、ヘッダー「ログイン」→ `/login` では副導線が消えていた。LP 側も guest 選択を出さない構成のままだった
- **修正** — return なしの `/login` でもゲスト CTA を表示（既定遷移 `/home`）。登録必須 intent / Studio 等の return では従来どおり非表示。LP に「ゲストで作品を見る」（entry mode → `/home`）
- **維持** — ゲストは Auth なし entry mode。登録必須アクションの EntryGate / DB 書込権限は変更なし。未ログインの公開閲覧も維持

## 2026-07-15 — サムネイル3枚以上の推奨表示（Preview）

- **作品投稿・編集** — サムネイル欄の見出しを「3枚以上推奨」に。1枚目が一覧メイン、2〜3枚目で雰囲気が伝わりやすい旨を説明
- **枚数ガイド** — `N / 3枚（推奨）　最大10枚` 形式のカウントと、枚数に応じた短いヘルパー（0〜2枚は追加を促す、3枚以上は完了メッセージ）。未満でも投稿・保存は可能
- **対象外** — Production 未反映

## 2026-07-14 — Studioから他作品へ行ける導線（Preview）

- **調査** — 公開カタログ自体は閲覧可能。Studio 内に発見ナビが無く「他の方のゲームを参照できない」に見えていた
- **対応** — Studio サイドバーに「作品を探す」→`/search`。モード切替を「作品を探す」表記＋`/search`へ。ヘッダー検索placeholderを「自分の作品を検索」に明確化
- **対象外** — Production 未反映

## 2026-07-14 — Studio指標名とプロジェクト絞り込みの整理（Preview）

- **Studioホーム** — 「プレイの深さ／フィードバックの深さ／見届けの広がり」を実集計に合わせた名称へ。カード下の説明文を削除
- **プロジェクト一覧** — 公開状態・開発フェーズ・正式版公開済みを分離。カードに3軸バッジを表示
- **対象外** — Production 未反映

## 2026-07-14 — 公開カードにプレイ人数を追加（Preview / Staging RPC）

- **正本** — `get_public_project_stats.play_player_count` = `COUNT(DISTINCT project_plays.user_id)`（登録プレイヤー。ゲストは `project_plays` に無いため除外）
- **表示** — 「プレイヤー N人」。未取得・RPC未適用時は指標非表示（0 の誤表示なし）。並び: プレイヤー → FB → フォロー
- **migration** — `068`（DROP→CREATE 修復版）。Staging／Production はオーナー手動適用（本作業時点では未適用）
- **対象外** — Production コード未反映

## 2026-07-14 — 開発者カード左右レイアウトとコミュニティ申請CTA（Preview）

- **開発者一覧** — 左に開発者情報、右に代表作品（最大3・横並び）。自己紹介は line-clamp-2。作品0件は右側なし
- **公開プロフィール** — 「コミュニティの参加申請」をフォロー横の補助CTAへ。通報は三点メニューに維持
- **対象外** — Production 未反映

## 2026-07-14 — プロフィール／設定ルートと文言の統一（Preview）

- **プロフィール** — サイドバー表示を「プロフィール」に統一。正本は `/mypage/profile`。`/studio/profile` はリダイレクト
- **設定** — 正本は `/settings`（通知・公開設定を同一画面）。`/studio/settings` はリダイレクト。Player/Studio 相互リンクを削除
- **公開設定** — 「開発者プロフィールを公開」を共通設定へ集約（作品未投稿時は説明付き disabled）
- **X説明** — 「ForgeからXへの投稿やDMは行いません」を削除。連携と公開表示が別である旨のみに整理
- **対象外** — Production 未反映

## 2026-07-14 — hotfix: プロフィール画像の保存失敗を修正

- **症状** — プロフィール編集で画像を選んで保存すると「保存に失敗しました」になる
- **原因** — アップロード画像を巨大な data URL のまま `developer_profiles.avatar_url` に書き込み、CHECK（≤20000文字）に抵触
- **修正** — JPG/PNG/WebP をクライアント圧縮後、`/api/profile/avatar/upload`（service role）で Storage に保存し、短い公開 HTTPS URL のみ DB へ保存。絵文字プリセットは短い SVG data URI のまま
- **共通** — Player/Studio 同一の `SharedSelfProfile` / `ProfileAvatarPicker`。失敗時は既存 `avatar_url` を消さず、DB失敗時は孤立アップロードを後片付け
- **Storage** — 既存 `project-thumbnails` の `profile-avatars/{userId}/…`（新規 bucket / policy 変更なし）

## 2026-07-14 — 検索カードで REALIA 等のサムネが間欠的に欠ける件を修正

- **症状** — `/search` で作品サムネ（特にソース幅が控えめな REALIA）が、リロードやリスト/グリッド切替のあと生成ポスターや欠落に見えることがあった
- **原因** — DiscoveryGameThumbnail が「naturalWidth が display 幅の半分未満なら失敗」と誤判定し、一度失敗すると同一 URL のまま生成ポスターに固着
- **修正** — 空ビットマップのみ失敗扱い。project/src 変更で loading/error をリセット。DB/Storage/作品アートは変更なし

## 2026-07-14 — Player/Studio 共通プロフィール構造とX公開設定

- **正本** — `/mypage/profile` と `/studio/profile` は同一 `SharedSelfProfile`。表示名・アバター・@handle・自己紹介・公開X・Webは `developer_profiles` のみ
- **構成** — 上部は共通公開プロフィール＋編集。下部は「プレイヤーとして」「開発者として」の役割カラム（PC 2列 / モバイル縦）
- **X** — 連携はアカウント共通（Player/Studio/設定）。公開表示は `developer_profiles.x_account` の明示ONのみ（連携だけでは自動公開しない）
- **空状態** — 非開発者は軽いCTA、活動が少ないプレイヤーは巨大空カードにしない
- **対象外** — Production / ホームヒーロー / 新たにプレイヤー活動を公開面へ露出する変更なし

## 2026-07-14 — 開発者一覧／公開プロフィール: サムネ巨大化とぼけ退行を修正

- **原因** — 一覧代表作で `ProjectThumbnail variant=chip`（`sizes=48px`）を全幅に引き伸ばし、低解像度最適化画像が大型領域に引き伸ばされ「ぼけたまま」に見えていた
- **variant** — `mini` / `card` / `profile` / `hero` / `chip`（`compact` は card 互換エイリアス）でサイズ・`sizes` を固定。一覧 `mini` は約140px・16:9
- **一覧** — 開発者情報主役のコンパクトカード。代表作は横並び mini（最大3・タイトル1行）。1件でも巨大化しない
- **公開プロフィール** — ヘッダーを内容量で縮む構成に。フォロワー重複表示を解消。作品グリッドは `max 380px` 列で1件全幅化を防止
- **ロード** — DiscoveryGameThumbnail は CSS blur なし。pulse skeleton → onLoad で本画像。失敗時は生成ポスターへ
- **対象外** — Production 未反映 / ホームヒーロー選出ロジック未変更

## 2026-07-14 — ホーム「注目の作品」4枠ヒーロー

- **見出し** — 「注目＆おすすめ」→「注目の作品」（パーソナライズ推薦と誤認しない）
- **選出** — 独立4枠（各最大1作品）: 反応 / プレイ増加 / 新着 / 意味ある更新。候補なしは非表示・穴埋めなし。ヒーロー内ID重複なし・開発者ソフト分散
- **RPC** — Staging `get_home_featured_hero`（棚の `get_home_discovery_feed` 065 は変更なし）。下棚はヒーローと重複可・順位維持
- **067** — 066 の plpgsql/temp が STABLE で実行失敗（`DROP TABLE is not allowed`）するため、純 SQL STABLE に置換。Staging に 067 適用後は RPC 正本・service-role fallback 削除予定
- **暫定** — 066 適用直後に RPC エラーでヒーローが空になる退行を、RPC soft-fail → compose fallback で回避（匿名 RPC / service_role は compose のみ）
- **対象外** — Production Supabase 未適用 / Production deploy なし

## 2026-07-14 — プロフィール・アバター・サムネ・公開統計の全画面共通化

- **正本** — 公開プロフィール（表示名・アバター・自己紹介・公開X・Web）は `developer_profiles` のみ。X OAuth 連携だけの自動公開を廃止（API も `x_account` 参照）
- **共通部品** — `resolvePublicProfileDisplay` / `ProfileAvatar` / `ProjectThumbnail` / `PublicXLink` / `PublicStatText`。空アバターは絵文字プリセット（ランディングゲーム画像をユーザー代用にしない）
- **対象** — 開発者一覧・公開プロフィール・マイページ・Studio・ホーム/検索カード・作品詳細・Special Thanks・FBカード・通知・コミュニティ・ヘッダー・ランキング等
- **統計** — 未ロードの公開件数を `0` 確定表示しない（skeleton）。開発者カードは公開作品数／フォロワー＋タイトル付き代表作
- **バグ修正** — 開発者一覧がオーナーの `submittedGames` を見ていたため未ログインで 0 件になっていたのを `publicGames` に修正
- **対象外** — Production 反映なし（Preview まで）

## 2026-07-14 — ホーム: ヒーローと下棚の重複を許可

- **変更** — 「注目の作品」に載った作品を、直近7日反応／最近更新／新着の各棚から除外しない。RPC 順位のまま棚に出す（最弱スライムは反応棚 rank1 のまま先頭）
- **維持** — 空棚非表示・候補不足時の補完なし・migration 065（FB/新規フォローのみ反応棚）・棚同士の重複許容
- **対象外** — Production 反映なし

## 2026-07-14 — 開発者公開プロフィール: 画像・FB指標・UI整理

- **アイコン** — `developer_profiles.avatar_url` を正本。`ProfileAvatar` で data/http を安全表示し、失敗時は灰色フォールバック（壊れた画像・alt 非表示）。ゲームサムネへの誤フォールバックを廃止
- **作品サムネ** — ホームと同じ `/api/public/projects/{id}/thumbnail` + `DiscoveryGameThumbnail`
- **FB数** — 公開カタログの `get_public_project_stats`（登録ユーザー distinct）を利用。プロフィール表示時に public catalog を refresh
- **UI** — ヘッダー縮小。参加申請・通報は三点メニューへ。指標は作品数/開発ログのみ。タブは作品・開発ログ。横長説明カードを発見カード型へ
- **対象外** — Production 反映なし（Preview まで）

## 2026-07-14 — ホーム「直近7日で反応」棚: プレイ単独を候補から除外

- **症状** — 「フィードバック 0 / フォロー 0」の作品が棚に混ざり、FB がある作品より前に見える（ヒーロー soft 除外と相まって）
- **原因** — trending 採用条件が `feedback + watch + play > 0` のため、カード非表示のプレイ UU だけで候補入りできた
- **修正** — migration `065`: 採用は `feedback_users_7d + watchers_7d > 0`。`players_7d` は順位の tie-break のみ。空棚非表示・補完なしは維持（ヒーロー除外は後続で廃止）
- **対象外** — Production DB / Production deploy（Preview + Staging まで）

## 2026-07-14 — 公開プロフィール共通化 本番反映

- **内容** — プレイヤー/Studio 公開プロフィール共通化（`071d372` / `508f881`）と関連 ops を Production コードへ反映。migration `064`（`avatar_url`）はオーナー適用済み前提
- **deploy** — `dpl_4yrAAHb2JTJQETeE9QXSUxZuGs76` / https://forge-flame-gamma.vercel.app（git `5276438`；機能本体は `071d372`/`508f881`）
- **対象外** — Production DB 追加 write・未commitのみんなのFB作業ファイル

## 2026-07-14 — Ops: full-auto Run Mode（コード本番一括 / Production DBは手動）

- **内容** — 「本番反映して」「リリースして」= main 反映+push・Production deploy・smoke・main↔preview 同期の一括承認（工程再確認なし）。通常作業は Preview まで自律
- **境界** — Production Supabase の migration / INSERT / UPDATE / DELETE / backfill / Storage はオーナー手動。Cursor は SQL 一式＋適用後 read-only 検証/smoke
- **文書** — AGENTS / stall / forge.mdc / permissions / `docs/cursor-allow-vs-forge-go.md` / triage §8・§10.1
- **対象外** — プロダクト UI・今回の Production deploy なし

## 2026-07-14 — Supabase境界: Staging自律 / Production DBはオーナー手動

- **Staging**（Preview 接続先）— migration・seed・CRUD・Storage を Cursor が自律実行
- **Production DB** — migration / UPDATE / DELETE / backfill / Storage はオーナー手動。Cursor は SQL・実行順・影響・確認 SQL を提示し、適用後 read-only 検証と smoke は自律
- **文書** — AGENTS / stall / forge.mdc / permissions / `docs/cursor-allow-vs-forge-go.md`
- **対象外** — プロダクト UI 変更なし

## 2026-07-14 — ALLOW / Forge GO: オーナー指示スコープ承認

- **内容** — チャット明示指示を作業全体の承認として扱う。Staging 常時自律。通常修正は Preview まで自律。本番反映の一度の指示で main/deploy/必要 DB/smoke/同期まで一括。再確認禁止リストと停止条件7項を rules / AGENTS / permissions に反映
- **正本** — `docs/cursor-allow-vs-forge-go.md` / `.cursor/rules/stall-detection-resume.mdc`
- **対象外** — プロダクト UI・今回の Production 操作なし

## 2026-07-14 — developer_profiles upsert: avatar_url 未適用でも名前・自己紹介を保存

- **背景** — Staging に migration `064`（`avatar_url`）を適用する DB URL / Access Token がローカル env に無く、DDL 未適用のまま upsert が落ちうる
- **対応** — `lib/supabase/developer-profiles-db.ts` で明示カラム select。`avatar_url` 欠落エラー時は同カラムなしで upsert 再試行（public_name / profile / x / website は保存）
- **対象外** — Production / Staging DDL 適用そのもの（オーナーが Dashboard で `064` を貼る必要あり）

## 2026-07-14 — 公開プロフィールをプレイヤー／開発者で共通化

- **原因** — プレイヤープロフィール編集が端末内 state のみ更新し、「端末のみ」文言付きで DB に保存していなかった
- **正本** — `developer_profiles`（表示名・自己紹介・avatar_url・X・Webサイト）。migration `064` で `avatar_url` 追加
- **UI** — `/profile` と Studio プロフィールが同じ行を読み書き。保存中／成功／失敗を明示。端末のみ文言を削除
- **対象外** — 好きなジャンル等の v0 mock 項目、みんなのFB

## 2026-07-14 — Cursor ALLOW / 工程ルール（Previewまで自律）

- **内容** — `.cursor/permissions.json` / `.cursor/sandbox.json` と stall / AGENTS / triage §8 を更新。通常依頼は調査〜commit〜Preview push/deploy/smoke まで再確認なし。Staging DB write 可。Production 境界のみ確認
- **分離** — Cursor ALLOW ≠ Forge Production GO（`docs/cursor-allow-vs-forge-go.md`）
- **対象外** — プロダクト UI・本番データ・今回の Production deploy なし

## 2026-07-13 — みんなのFB: ゲスト行の誤表示・件数水増しを修正

- **原因** — 公開 RPC / API が `p_include_guest: true` のため、過去のゲスト FB（例: `optional_comment = "test"`）が「ゲスト」カードとして表示され、登録ユーザー1件投稿後に通算が水増しされて見えた
- **対応**
  - 公開「みんなのフィードバック」は **登録ユーザーの永続データのみ**（カード・集計・バージョン一覧）
  - 公開FB件数は **登録ユーザーの distinct 参加者数**（問い複数回答・深いFBでも1人1件）
  - ゲスト FB 書き込み API を 403 無効化。作品詳細のゲスト FB 導線はログイン誘導へ
- **DB** — 本番 `project_guest_voice_responses` に該当 `test` 行は残存（read-only 確認済み）。表示からは除外。削除は対象特定済みのため別途オーナー確認
- **対象外** — Studio オーナー向けの届いたFB（ゲスト含む）は維持

## 2026-07-13 — Vercel prerender: useSearchParams CSR bailout 回避

- **原因** — ヘッダー検索と `useRequireAuth`（Player shell のフィードバック等経由）が `useSearchParams` 依存で静的 prerender 失敗
- **対応** — クエリは `window.location` から読む（クリック／マウント時）。`force-dynamic` は使わない。`robots.txt` Allow は維持
- **非対象** — ホーム UI・OGP・認証フローの意味変更なし

## 2026-07-13 — robots.txt 最小追加（Twitterbot Allow）

- **内容** — `public/robots.txt` のみ。`Twitterbot` / `*` に `Allow: /`
- **目的** — OGP 画像不採用切り分けの最小 A/B（他経路は変更なし）

## 2026-07-13 — OGP診断 C/D（既知正常PNG / Skank正規化PNG）

- **C** — `/__ogp-diagnostic/forge-known-good-20260713-c`（画像は既存 `/images/og-default-v2.png`）
- **D** — `/__ogp-diagnostic/skank-normalized-png-20260713-d`（Skank 1200×630 を sRGB PNG 再エンコードして同一 origin 配信）
- **対象外** — 作品ページ・DB・Storage・RPC・`og_image_url`・残8作品は変更なし

## 2026-07-13 — OGP診断ルートを %5F 公開セグメントへ

- **原因** — App Router でフォルダ名 `__ogp-diagnostic` は private（先頭 `_`）扱いとなり、公開 URL `/__ogp-diagnostic/...` が 404 になる
- **対応** — フォルダを `%5F%5Fogp-diagnostic` / `%5F%5Fogp-diagnostic-image` に変更（Next.js の URL エンコード規約）。公開パスは従来どおり `/__ogp-diagnostic/...`
- **対象外** — 作品ページ・DB・Storage・RPC・残8作品 backfill は変更なし

## 2026-07-13 — Xカード診断用一時 path（A/B）

- **目的** — 既存 `/games/[id]`・DB・Storage・RPC を変えず、X の URL キャッシュ vs 画像ホストを切り分ける
- **A** — `/__ogp-diagnostic/skank-supabase-20260713-a`（画像は Production Supabase 派生 JPEG）
- **B** — `/__ogp-diagnostic/skank-forge-20260713-b`（同一 bytes を Forge origin から配信）
- **画像** — `/__ogp-diagnostic-image/skank-ae21e70d34c58acf-1200x630.jpg`
- **非対象** — 既存ゲームページ変更なし。残り8作品 backfill なし

## 2026-07-13 — OGP専用 1200×630 派生画像（Staging / Preview）

- **分離** — ギャラリー `thumbnail_url` と OGP `og_image_url` を分離。RPC は `og_image_url` の https のみ返す
- **生成** — 先頭サムネから sharp で cover+center の 1200×630 JPEG。パス `{projectId}/og-{hash}-1200x630.jpg`
- **metadata** — width/height/type 明示。無ければ `og-default-v2.png`
- **Staging** — Comet Rush canary 済み（派生 JPEG 1200×630・RPC一致・Preview probe smoke PASS）
- **Production** — 063 適用・`10a8522` deploy Ready。Skank Boost のみ og 派生 canary（残り8作品は未 backfill）

## 2026-07-13 — 作品サムネイル Storage 化（Staging / Preview）

- **目的** — 作品固有サムネを OGP に安全表示（data URL を metadata 経路へ戻さない）
- **保存** — 新規投稿・Studio 画像編集で Storage `project-thumbnails` へ upload し、DB には HTTPS URL のみ保存（hash 付きファイル名）
- **書込経路** — server API + service role のみ。Storage は public read。anon / authenticated の直接 write policy なし
- **検証** — magic bytes（jpeg/png/webp/gif）、SVG・非画像拒否、2MB/枚・最大10枚、不正 base64 拒否
- **OGP** — `get_public_project_og_image_url` で短い https のみ取得。無ければ `og-default-v2.png`
- **Production** — 062 適用済み。Skank Boost のみ canary backfill（残り8作品はオーナー X 確認後）

## 2026-07-13 — Xカード用 default OGP 画像 URL 更新（v2）

- **現象** — X投稿で title / description / domain は出るが、画像が汎用アイコンになる
- **対応** — default OGP を `/images/og-default-v2.png` に切替（同内容コピー）。`openGraph.images` に width/height/type を明示
- **目的** — 旧 `/images/og-default.png` の画像取得失敗キャッシュを避ける
- **未実施** — Production deploy（Preview 確認後にオーナー判断）

## 2026-07-13 — 作品詳細ギャラリー表示速度（A+B）

- **A** — 詳細 REST 完了時点で先頭 `/thumbnail` を渡し、枚数 RPC は並列。count 後に 2枚目以降を追加
- **B** — `get_public_project_thumbnail_value`（061）で index 1件だけ取得。`thumbnail_urls` 全配列 SELECT を廃止
- **維持** — 詳細 JSON / ホーム feed に data URL を戻さない。RPC 未適用時は旧 SELECT にフォールバックせず 503

## 2026-07-13 — ホーム「注目＆おすすめ」追加画像枠の復旧

- **修正** — ヒーロー追加画像2枠が常に「追加画像未登録」になっていた退行を解消。注目最大3作品だけ枚数を取得し、`/thumbnail/1`・`/thumbnail/2` を表示
- **軽量化を維持** — ホーム feed に `thumbnail_urls` / data URL は戻さない。追加画像取得はヒーロー描画をブロックしない
- **挙動** — 1枚のみの作品は「追加画像未登録」。2枚なら枠1つ、3枚以上なら枠2つとも画像。登録順を維持

## 2026-07-13 — Production 作品詳細ギャラリーの復旧

- **修正** — 公開作品詳細の複数サムネイルを `/thumbnail/N` のパス形式で配信し、`next/image` の `?index=` 400 によるギャラリー破損を解消
- **軽量化を維持** — 詳細取得では data URL 本体を返さず、060 の公開サムネイル件数 RPC で必要な画像 API パスだけを組み立てる
- **安全性** — 配信対象は公開作品のみ。不正 index・画像なしは 404、画像エラー時はプレースホルダー表示

---

## 2026-07-12 — ホーム速度・公開カタログ鮮度・新着表示の一連対応を完了

一連の対応を完了扱いとする（ホーム遅延の data URL 巨大 JSON、公開カタログ鮮度、新着の first_published_at 順／ヒーロー除外なし、公開サムネ復旧）。

### Production 最終計測（059 適用後）
- **feed RPC** — 約 4.6〜4.9MB → **約 10.4KB**（17行、`thumbnail_url` の data URL 0件・全件 null）
- **feed API** — 約 3秒 → **約 0.95〜1.06秒**（クライアント JSON 約 11.5KB、data URL なし）
- **未ログイン hard reload・最初のカード DOM** — 約 3.4〜4.1秒 → **約 1.2〜1.6秒**
- **サムネ** — `/api/public/projects/[id]/thumbnail` 経由でホーム・検索とも正常表示
- **新着** — `first_published_at` 降順・ヒーロー除外なし。1位は「サキュバス行進曲」。注目／新着の選定順序に異常なし

### Migration
- **059** — Staging / Production **適用済み**（選定ロジック不変、`thumbnail_url` は http(s) のみ。wire 上は現状全件 null）
- **058** — **未適用のまま**（今回の完了条件に含めない）

### 技術負債（別タスク・今回未着手）
- Studio サムネ保存の Storage 化（`readImageAsDataUrl` → data URL を DB へ書く経路の廃止）
- 既存公開 9 作品の data URL → Storage HTTP(S) 移行（dry-run → canary → 本番）

---

## 2026-07-12 — 公開サムネイルを軽量な画像 API 経由で復旧

- **復旧** — `/home`・`/search`・公開作品詳細のサムネイル参照を公開画像 API に切り替え、DB に残る data URL 画像をカードとヒーローで再表示
- **軽量化を維持** — 発見フィードと公開カタログ JSON には data URL を含めず、画像バイナリだけをキャッシュ可能なレスポンスとして配信
- **安全性** — 公開作品だけを対象に、許可 MIME と 1.5 MB の復号上限を適用。不正・過大・画像なしは 404 として扱う

---

## 2026-07-12 — Production の data URL サムネイル配信を遮断

- **修正** — `/home` の発見フィードをサーバー API 経由に切り替え、HTTP(S) 以外のサムネイルをレスポンスへ含めない
- **修正** — `/search` の公開作品一覧は軽量な明示列だけを取得し、サムネイルは HTTP(S) URL のみ別取得。data URL はプレースホルダー表示にする
- **負荷軽減** — 公開カタログは全画面共通の初回 mount では取得せず、`/search` を開いた時に読み込む。ホームの発見フィードとの競合を防ぐ
- **データ保全** — DB 内の既存サムネイルは削除・更新しない。Studio が data URL を保存する根本経路の修正は別対応

---

## 2026-07-12 — 新着棚はヒーロー除外を廃止（first_published_at 順を維持）

- **変更** — `/home`「新着作品」は RPC の `newest` 配列（`first_published_at DESC, project_id ASC`）をそのまま表示。ヒーロー選出作品の除外をやめる
- **維持** — 「最近更新」「直近7日で反応が集まった作品」は従来どおり棚1ページ目のみヒーロー soft 除外

---

## 2026-07-12 — 注目の作品（ヒーロー）選定ロジック正本（コードどおり）

RPC `get_home_discovery_feed`（055/058 同一選定）＋クライアント `selectHeroItems` / `buildSectionCarouselItems`。

### 棚（RPC）共通前提
- 対象作品: `visibility = 'public'` かつ `first_published_at IS NOT NULL`
- 各棚の候補上限: **12件**（`feed_limit`）
- 候補不足: 足りる分だけ返す（**補完なし**）。UI は件数0の棚を**非表示**

### trending（反応・注目棚の元）
- **期間**: 直近 **7日**（`now() - interval '7 days'`）
- **反応イベント**（いずれも期間内）:
  1. `project_voice_responses` — `moderation_status = 'visible'` かつ `user_id IS NOT NULL` → **distinct user_id** を `feedback_users_7d` に合算
  2. `project_feedback` — 同上条件 → 同上（voice と UNION 後に distinct）
  3. `project_watches` — 期間内の行数 → `watchers_7d`（**COUNT(*)**、ユーザー distinct ではない）
  4. `project_play_sessions` — 期間内の **distinct user_id** → `players_7d`（**順位 tie-break のみ**。単独では候補に入らない）
- **採用条件**（065〜）: `feedback_users_7d + watchers_7d > 0`（カード指標と揃う FB / フォロー増のみ。プレイ単独は除外）
- **重み付け**: 数値スコアの加重合計ではない。並べ替えキーの**優先順位**のみ:
  1. `feedback_users_7d` DESC
  2. `watchers_7d` DESC
  3. `players_7d` DESC
  4. `last_engagement_at` DESC NULLS LAST（上記3系統の最新時刻の GREATEST）
  5. `first_published_at` DESC NULLS LAST
  6. `project_id` ASC
- **オーナー FB**: 登録ユーザーなら `user_id IS NOT NULL` でカウント対象（オーナー除外なし）

### updated（意味ある更新）
- **イベント**:
  - `project_devlogs` で `is_initial_publish = false` の `created_at`
  - `project_release_events` で `event_type = 'released'` かつ `source IS DISTINCT FROM 'onboarding'` の `created_at`
- **条件**: 上記イベントが **`first_published_at` より後**にあること。作品ごとの `MAX(event_at)` を `meaningful_update_at` とする
- **並び**: `meaningful_update_at` DESC, `project_id` ASC

### newest
- **基準列**: `first_published_at` DESC, tie-break `project_id` ASC

### 注目の作品（ヒーロー・最大3件）— クライアント
- 入力: 各棚の rank 済み配列（trending / updated / newest）
- **選出**: まず各軸の **1位**を trending → updated → newest の順で採取（既出 ID はスキップ）。足りなければ各軸の 2位以降を同じ軸順でラウンドロビン補充。最大 **3件**。足りなければそれ未満（補完なし）
- **重複時**: 先に選ばれた軸が優先（同一作品は1回のみ）。heroSource は採用した軸名
- **最終並び**: 選出順（上記ミックス順）。カルーセル表示順＝この配列順

### 棚カルーセル（クライアント）
- **最近更新 / 直近7日反応 / 新着**: RPC 配列を**そのまま**表示（ヒーロー除外なし。ヒーローとの重複可）
- 件数0の棚は非表示。候補不足時の補完なし
- ページサイズは UI の HorizontalCardPager（通常4件/ページ）

---

## 2026-07-12 — /home idle defer を撤回（体感悪化の是正）

- **観測** — Production でオーナー実測、ゲームカード表示まで約10秒。計測上の RPC 約4秒との差が大きい
- **原因** — `e884d19` の `/home` 向け `requestIdleCallback`（最大2.5s）は、RPC 待ちでメインスレッドが空いている間に**すぐ発火**し、公開カタログ取得が discovery RPC と帯域競合する。カード表示は feed ready 待ちのため defer は体感を改善せず悪化しうる
- **修正** — idle/2.5s defer を撤回し、mount 時の即時 `reloadPublicCatalog` に戻す。`/search` 鮮度の `refreshPublicCatalog`（`d2b86e3`）は維持
- **続く作業** — navigation→最初のカード描画の全工程計測、RPC SQL（058）は別途

---

## 2026-07-12 — get_home_discovery_feed SQL 最適化（058・適用待ち）

- **切り分け（本番）** — ブラウザ TTFB は軽い。`get_home_discovery_feed` 自体が cold 約2.3–3.9s / 再呼出し約1.0s。Staging REST は cold〜0.7s・warm〜0.1s。遅い主因は **Production 上の SQL/データ量（RPC 本体）** であり、ブラウザ専用でも REST 層単独でもない
- **実装** — `058_optimize_home_discovery_feed.sql`（選定仕様は 055 と同一）。`project_id_text` を一度だけ生成、7d 集計を公開作品に限定、カード用 stats を candidate のみにインライン（未使用の witness / latest_devlog スキャンを feed から除外）
- **適用** — Staging → Production の順で Dashboard SQL。適用後に warm ≤1s 目標で再計測
- **選定ロジック正本** — 上記「注目の作品（ヒーロー）選定ロジック正本」を参照（058 でも選定意味は変更しない）

---

## 2026-07-12 — /home 初回表示のネットワーク競合を緩和（撤回済み）

- 当時の意図: `/home` で公開カタログを idle 遅延して RPC 競合を避ける
- **撤回** — 上記「idle defer を撤回」を参照。`requestIdleCallback` が RPC 待ち中に発火し逆効果

---

## 2026-07-12 — 公開カタログ鮮度（/search 再検証）

- **事象** — 新規公開作品が作品詳細・ホーム注目には出る一方、「作品を探す」が同一セッション内で古い件数のまま残ることがあった
- **原因** — `GamesProvider` が公開カタログをマウント時（と投稿ミューテート時）にしか再取得せず、`/search` 表示では再検証していなかった
- **修正** — `/search` 表示時に `refreshPublicCatalog` で公開カタログを再取得（直近3秒内の取得は重複スキップ）。件数は最新取得結果から算出
- **ホーム新着** — 候補自体には含まれる。以前はヒーロー除外で先頭ページから外れることがあった（本変更で新着のヒーロー除外は廃止）

---

## 2026-07-12 — 作品紹介など複数行テキストの改行表示を維持

- **診断** — 保存は `trim` のみで改行を除去しない。作品詳細の紹介表示が `white-space: normal` のため改行が潰れていた
- **表示** — 作品紹介・特徴説明・開発ログ本文抜粋・フォーカスノート・自己紹介・開発者が聞きたいことに `whitespace-pre-wrap break-words` を適用（プレーンテキストのまま）
- **1行項目** — 一覧用 `description` 生成時のみ改行を空白に畳む（`deriveProjectDescription`）

---

## 2026-07-12 — プレイヤーへの問い上限を最大5問に統一

- **表示** — 「問いを追加（最大5問）」（旧: 最大10問）
- **追加・保存** — `MAX_PROMPTS_PER_VERSION = 5`。新規投稿・既存編集・Studio 問いモーダルで共通
- **既存超過** — 6問以上が保存済みでも自動削除しない。編集画面では全件表示し、追加は不可。保存時は5問以下にするようバリデーション

---

## 2026-07-12 — 公開先 / 関連リンク再編（作成・編集・作品ページ・設定）

- **公開先** — Steam / itch.io / Unity Play 等の種類＋URL（自サイト・その他のみ利用方法）。メイン公開先が主CTA、その他は補助リンク
- **関連リンク** — note・ブログ・制作記録 / PV・動画 / 公式サイト / その他（表示名任意）。公開先とは別ブロック
- **Studio** — 新規投稿と既存編集を同一仕様。プレイ情報は対応環境＋料金のみ。キャンセルは未確定内容を反映しない
- **DB** — `publish_destinations` / `related_links` JSONB（057）。レガシー URL 列へ二重書き込み。未適用時は列フォールバックで既存データ表示を維持
- **設定** — 未実装（comingSoon）トグルを非表示。実装済み通知・開発者プロフィール公開は維持
- **用語** — 遊ぶ／入手は「公開先」、読む／見るは「関連リンク」（規約・通報・安全注記・DBタグは維持）

---

## 2026-07-12 — Studioホーム週次初期値 + プレイヤーへの問い UI

- **Studioホーム** — 日次／週次／月次の初回表示デフォルトを週次に変更（切替・保持は維持）
- **プレイヤーへの問い** — 左「自分で問いを設定する」／右「デフォルト問いを使う」。新規・未設定は自分で設定が初期選択
- **自分で設定** — 質問テンプレート／「カスタム」を廃止し、質問文＋回答形式の直接入力のみ
- **デフォルト問い** — 固定プレビューをやめ、質問テンプレート3件（もう一度／チュートリアル／難易度）＋回答形式。カスタム選択肢なし
- **色** — 選択枠・focus・問い追加を Forge violet に統一（警告 amber は維持）
- **未変更** — DB / RPC / migration / seed、公開側回答 UI、未設定時のシステムデフォルト問い

---

## 2026-07-12 — ホーム注目カルーセル hotfix（autoplay + 画像peek）

- **autoplay** — マウスクリック後の残 focus による `focus-within` 永久停止を解消。`:focus-visible`（キーボード）のみ停止。`setTimeout` 1 本で 5 秒スケジュールを clear/reset
- **左右 peek** — フルカード見切れを廃止し、隣作品のメイン画像のみ（object-cover、左は right / 右は left）。opacity ≈0.38・hover ≈0.5。中央 FeaturedGameCard・矢印は維持
- **未変更** — 選定ロジック、棚、DB/RPC、seed

---

## 2026-07-12 — ホーム注目カルーセル viewport 全幅・循環・自動送り（Preview）

- **Home** — 3件以上で `md:max-w-[1424px]` 固定を廃止し、メイン領域 `w-full`。active は 1000×350 中央のまま、左右の同一フルカードが見切れ幅 `(viewport-1000)/2 - gap` で画面端まで連続
- **非active** — 黒塗り overlay をやめ opacity ≈0.38（hover ≈0.52）+ わずかな brightness。内部操作不可・カード全体クリックで切替
- **循環** — 3件以上は先頭／末尾でも左右に前後カード（表示用 clone）。2件以下は peek なし中央
- **自動送り** — 元実装に無し。3件以上で 5 秒間隔・右循環。hover / focus / タブ非表示 / `prefers-reduced-motion` で停止。操作でタイマーリセット
- **未変更** — 矢印位置、カード寸法、選定ロジック、棚、DB/RPC、main / 本番

---

## 2026-07-11 — Staging hero carousel seed スクリプト追加

- `scripts/staging-only/hero-carousel-seed.mjs` — 開発者 2 名・プレイヤー 10 名・プロジェクト P1〜P6・devlog・FB・watch・bookmark・developer_follows を固定 UUID (dddddddd 名前空間) で Staging に投入。デフォルト dry-run、`--execute` で書き込み。PNG サムネイルを zlib で in-memory 生成し storage へアップロード。事後に DB カウント検証 + `get_home_discovery_feed` RPC 確認
- `scripts/staging-only/hero-carousel-seed-cleanup.mjs` — 上記 seed の全行を安全な順序で削除。Smoke A/B / Owner は削除しない
- `scripts/staging-only/hero-carousel-seed-README.md` — 使い方説明

---

## 2026-07-11 — ホーム注目カルーセルを同一フルカード track へ（Preview）

- **Home** — 左右の小型 AdjacentGamePreview を廃止。同一 `FeaturedGameCard`（1000×350）を横 track で並べ、`overflow-hidden` + `translateX` で左右約200px見切れ（viewport `md:max-w-[1424px]`、3件以上）。2件以下は peek なし中央表示
- **Staging** — 検証用 hero-carousel seed（開発者2・プレイヤー10・作品6）を独立投入（Production 非接続）
- **未変更** — 選定ロジック、PlayerShell、main / 本番

---

## 2026-07-11 — ホーム注目カルーセルを v0 構造へ移植（Preview・未 push）

- **Home** — 最上段ヒーローを v0 参照と同じ DOM／分割／寸法へ置換（`FeaturedGameCarousel` ほか）。viewport `md:h-[350px]`、中央 `max-w-[1000px]`、メディア `md:w-[620px]`、追加画像 `aspect-video w-40`、隣接 `w-[140px] xl:w-[200px]`（3件以上で左右、2件は右のみ）
- **データ** — 既存フィード選定・キャッシュ・`thumbnail_urls`・FB/フォロー件数はそのまま接続
- **未変更** — PlayerShell／サイドバー、Studio・タブ・Creator 等の他 UI 改善、main / 本番、commit/push 待ち

---

## 2026-07-11 — ホーム注目ヒーロー Steam風カルーセル（Preview）

- **Home** — 中央カード約950px（画像16:9≈587×330＋情報≈363）。追加画像160×90。大画面で左右に隣接作品ピーク（xl+、2件時は片側のみ）
- **未変更** — 選定／取得／キャッシュ／FB件数／CTA、main / 本番

---

## 2026-07-11 — ホーム注目ヒーロー 1.1倍（Preview）

- **Home** — デスクトップ本体 `330px`。画像列 `minmax(0,520px)`（正方形≈330×330）。右パネルが残り幅。`max-w-[1280px]` 維持
- **未変更** — カルーセル／追加画像切替／取得、FB 仕様、main / 本番

---

## 2026-07-11 — ホーム注目ヒーロー高さ・画像幅（Preview）

- **Home** — デスクトップ本体 `360px`。画像列は 68:32 をやめ `minmax(0,560px)`（正方形≈360×360）。右パネルが残り幅。`max-w-[1280px]` 維持。追加枠をやや拡大
- **未変更** — カルーセル／追加画像切替／取得、FB 仕様、main / 本番

---

## 2026-07-11 — ホーム注目ヒーロー高さ調整（Preview）

- **Home** — 「注目の作品」デスクトップ高さを約 300px に固定（ワイド幅でも縦に伸びない）。`max-w-[1280px]` 中央寄せ。追加画像2枠を縮小。左右 68:32 / `object-contain` / カルーセル・取得処理は維持
- **未変更** — FB データ・集計・タブ仕様、main / 本番

---

## 2026-07-11 — Studio / Home / Creator v0 UI 整理

- **Studio** — 右パネルをアクションリスト化（`StudioActionRow`）。カテゴリ見出しは枠なし。選択タブ・主要CTA・編集選択・チャート装飾を紫へ。未確認FB・新着通知・Coming Soon・警告のオレンジ/amberは維持
- **Preview tabs** — Studio 公開プレビュー／投稿プレビューを公開ページと同じ 4 タブに統一（`GameDetailTabBar` 共有）。投稿時は件数バッジなし
- **Home** — 注目ヒーローを contain メイン＋追加画像枠＋メタ/CTA。追加画像は公開作品の `thumbnail_urls` をヒーロー ID 一括 SELECT（RPC 変更なし）。trending カードの順位バッジは削除（並びで表現）
- **Detail / Creator** — 開発者カードはアバター+名前リンク化。「プロフィールを見る →」削除。Creator 上段に実績4項目を統合
- **未変更** — 注目選定ロジック・DB/RPC・main / 本番

---

## 2026-07-11 — 作品詳細セグメントタブ Production 反映

- **main** — `preview/landing-01` を fast-forward（`f7ea6bb`）。`origin/main` と `origin/preview/landing-01` 同一
- **Production** — https://forge-flame-gamma.vercel.app（DB/RPC 変更なし）

---

## 2026-07-11 — 作品詳細タブを一体型セグメントに

- **UI** — `/games/[id]` の「概要 / 開発ログ / みんなのフィードバック / Special Thanks」を、枠付き一体型セグメントタブに変更（アイコン付き）
- **件数** — 「みんなのフィードバック」のみ。`publicStats` 取得成功後の `feedbackParticipantCount` を表示（実データの 0 も表示）。未取得・取得中・失敗時はバッジ非表示
- **見た目** — 選択中は紫アクセント背景＋白文字（主要CTAの `bg-violet-600` より弱め）。未選択 hover は薄い紫
- **未変更** — タブ中身・URL・DB/RPC・認証・タブ以外のUI

---

## 2026-07-11 — ホーム発見ロジック Production 反映

- **main** — `preview/landing-01` を fast-forward（`6941321`）。Production URL: https://forge-flame-gamma.vercel.app
- **Production DB（オーナー手動）** — 050 / 051 / 052 適用。053〜055 は 052 が最終 LANGUAGE sql と同一のため省略。056 相当の publish 権限確定 + 初回公開devlog 7 ID の `is_initial_publish=true`
- **本番ホーム** — 「注目の作品」+ trending / newest。updated 候補 0 のため「最近更新」非表示（仕様どおり）
- **未実施の追加 DB** — この反映以降の DDL/DML なし

---

## 2026-07-11 — publish RPC: anon EXECUTE を明示 REVOKE（056）

- **051** — `publish_project_version_with_devlog` に `REVOKE … FROM anon` と grant 検証 DO を追加（PUBLIC のみでは anon が EXECUTE 可能な場合がある）
- **056** — 既適用環境向けの同権限修正 + 検証。`authenticated` のみ GRANT。anon / service_role へは GRANT しない
- **確認 SQL** — `scripts/staging-only/verify-publish-rpc-grants-READONLY.sql`
- **未実施** — Production での手動 REVOKE / 056 適用、052 以降の Production 適用、main / 本番 deploy

---

## 2026-07-11 — ホーム発見: Staging 棚 seed 実 UI 確認

- **anon feed** — newest6 / updated3 / trending3。ヒーロー3軸: A(trending) / D(updated) / C(newest)
- **Preview** — 棚ラベル（公開/更新/反応）、ヒーロー除外、他棚非補完、PC/390px を確認。stats RPC と FB/フォロー一致
- **rollback** — engagement/devlog は削除済み。`projects` は service_role DELETE 不可のため `home-discovery-shelf-seed-rollback.sql` の projects 削除を Staging SQL で要実行
- **未実施** — Production / main / 本番 deploy

---

## 2026-07-11 — ホーム発見: 初回ロード堅牢化 + Staging 棚確認用 seed

- **UI** — `/home` feed 取得を `loading | ready | error` に整理。取得中はエラーを出さず skeleton。RPC 失敗時のみエラー。1回リトライ
- **Staging seed** — `scripts/staging-only/home-discovery-shelf-seed.sql`（C–F）。`service_role` は projects INSERT 不可のため Dashboard SQL 適用。Smoke A/B 非破壊。rollback 手順同梱
- **cold-load** — anon RPC 12/12 PASS（Staging）。Preview HTML shell 12/12 HTTP 200
- **未実施** — seed SQL の Staging 適用（オーナー Run 待ち）後の棚 UI 実確認 / Production / main

---

## 2026-07-11 — ホーム発見 RPC: Staging 055 適用確認

- **Staging** — `055` LANGUAGE sql 適用後、anon `get_home_discovery_feed` PASS（newest2 / updated1 / trending1）
- **Preview `/home`** — ヒーロー2件（A: 今日反応あり / B: 1日前公開）。3棚はヒーロー除外後0件で非表示（仕様どおり）
- **権限** — feed: anon+authenticated OK / service_role DENY。publish RPC: anon DENY
- **未実施** — Production migration / main / 本番 deploy。棚の「更新」ラベルは公開2件では棚非表示のため UI 未表示（RPC 側は生成済み）

---

## 2026-07-11 — ホーム発見 RPC: LANGUAGE sql 決定版（055）

- **RPC** — `get_home_discovery_feed` を **LANGUAGE sql** に全面置換。plpgsql の `RETURNS TABLE` 出力変数と SQL 列の 42702 衝突を根絶（`rank` → `project_id` の逐次再発を止める）
- **整合** — `052`–`055` の関数本体を同一最終定義に揃えた。Staging は **055 を 1 回 Run** すれば到達
- **検証** — PGlite で empty / newest / updated / trending / 重複セクション / 不正 text project_id / GRANT 形状を PASS（Docker/本番 Postgres なし）
- **未実施** — Staging 055 適用・Preview 再確認 / Production / main / 本番 deploy

---

## 2026-07-11 — ホーム発見: ヒーロー初回ページ除外の厳密化 + feed rank 修正

- **carousel** — 非ヒーローが4件未満の棚はヒーローで埋めず、0件なら非表示。ヒーロー再登場は非ヒーロー初回4件が揃う場合のみ
- **RPC** — `054` で PL/pgSQL `RETURNS TABLE(rank)` と CTE 列名衝突を解消（内部列 `rn`）※後続 `055` で LANGUAGE sql 決定版に置換
- **Staging** — `053` 適用済みでも anon 実行が `rank` ambiguous のまま → `054` 要適用
- **未実施** — Production / main / 本番 deploy

---

## 2026-07-11 — ホーム発見ロジック再設計（Staging / Preview）

- **新着** — `first_published_at` 降順（初回 public 化時刻。不変。既存 public は `created_at` 近似バックフィル）
- **最近更新** — `projects.updated_at` 廃止。初回以外の devlog（`is_initial_publish=false`）と studio `released`（onboarding 除外）の最新時刻
- **直近7日で反応が集まった作品** — ローリング7日の FB UU / 新規フォロー継続中 / プレイ UU（`project_supports` 非使用）
- **ヒーロー** — 「注目の作品」。trending→updated→newest の3軸ミックス。棚1ページ目のみヒーロー除外（2ページ目以降再登場可）
- **日時ラベル** — 公開 / 更新 / 反応を混同しない
- **RPC** — `get_home_discovery_feed`（anon+authenticated）、`publish_project_version_with_devlog`（authenticated / owner のみ）
- **DB** — migrations `050`–`052`（Staging 適用手順あり。本番未適用）
- **未実施** — Production migration / 本番 initial-devlog flag / main merge / 本番 deploy

---

## 2026-07-11 — 本番反映: 作品詳細 Special Thanks タブ

- **main / preview** — `feature/project-special-thanks-tab` を `main` FF（`dff280c`）。`origin/main` = `origin/preview/landing-01`
- **本番 DB** — `049_project_special_thanks_rpc.sql` 適用済み（`latest_update_summary` / user_id / email 非返却。anon+authenticated EXECUTE）
- **UI** — `/games/[id]` 第4タブ Special Thanks。参考FB N件。共通バッジ「見届け中」「初期FB」なし。summary 非表示
- **未実施** — Staging density rollback / 048 / 047 / OGP / backfill / restore

---

## 2026-07-11 — Special Thanks RPC: latest_update_summary を非返却

- **RPC** — `get_project_special_thanks` の `update_contributors` から `latest_update_summary` を削除（anon/authenticated 公開レスポンスに FB 要約を含めない）
- **UI** — 参考FB N件 / ver のみ（summary 非表示を維持）。「採用」表記なし
- **Staging** — 049 を CREATE OR REPLACE 再適用して確認。本番 049 は未適用
- **未実施** — 本番 049 / main merge / production deploy / rollback execute

---

## 2026-07-11 — 作品詳細 Special Thanks: 共通バッジ削除・参考FB表記

- **見届け** — 全員共通の「見届け中」バッジを削除。日付チップ（YYYY/MM/DD〜）のみ
- **アップデート貢献** — 「採用FB N件」→「参考FB N件」。feedback summary 行を非表示。1人1カード（件数合算）を維持
- **初期FB** — 全員共通の「初期FB」バッジを削除。ver / 日付チップのみ
- **方針** — セクション全員に同じ意味のバッジは出さない。Special Thanks は関わり一覧であり FB 明細ではない
- **未実施** — main / 本番 / rollback execute

---

## 2026-07-11 — 作品詳細 Special Thanks: バッジ中心カード

- **変更** — 説明文を削除。貢献種別・日付・ver・件数をバッジ/チップ化。反映内容は貢献者のみ最大1行
- **レイアウト** — desktop 2列・初期6件+展開を維持。文章補足の重複表示を廃止
- **未実施** — density seed `--execute`・10件以上実データ smoke・main / 本番

---

## 2026-07-11 — 作品詳細 Special Thanks: 横レイアウトカード + 密度確認用 seed

- **変更** — カードを横方向レイアウト（左 avatar / 中央名前 / 右 日付・件数・ver）。desktop 2列・初期6件+「ほかN人を見る」
- **文言** — 「声」不使用。フィードバック統一を維持
- **Staging** — density seed / rollback script を追加（Admin API・staging ref ガード・default dry-run）。実行はオーナー GO 後
- **未実施** — density seed 実行・10件以上 smoke・main / 本番

---

## 2026-07-11 — 作品詳細 Special Thanks: プレイヤーカード UI

- **変更** — 文字列列挙をやめ、avatar / 表示名 / handle / 理由・日付・版・件数つきのプレイヤーカードに変更
- **見出し** — 見届けているプレイヤー / アップデートに貢献したプレイヤー / 初期にフィードバックしたプレイヤー（正式版後は最後まで見届けたプレイヤー）。「声」表現を排除
- **RPC** — `avatar_url` 追加。`adoptions` 行一覧を `update_contributors`（user 集約）に変更。`early_players.first_version_key` 追加（`049` 更新）
- **未実施** — Staging 049 再適用・Preview 非空 smoke・main / 本番

---

## 2026-07-11 — 作品詳細 Special Thanks: watchers 名簿対応

- **変更** — 見届けは人数のみではなく `watchers` 表示名一覧。正式版後は `witnesses`。採用FB / 早期声の見出しを更新。上部の抽象説明文を削除
- **RPC** — `get_project_special_thanks` に `watchers[{display_name,handle,watched_at}]` を追加（`049` 更新）
- **未実施** — Staging 再適用・非空 seed・push・main / 本番

---

## 2026-07-11 — 作品詳細 Special Thanks タブ（実装）

- **場所** — `/games/[id]` 第4タブ「Special Thanks」（`?tab=special-thanks`）
- **内容** — 作品ごとの関わり可視化（見届け / 完走見届け / 採用FB / 早期初声・初FB）
- **データ** — `get_project_special_thanks` SECURITY DEFINER RPC（`049_project_special_thanks_rpc.sql`）。公開作品のみ。`user_id` / email 非返却
- **使わない** — `project_play_sessions`、`developer_feedback_helpful_marks`、`special_thanks_entries` / 047 / 048

---

## 2026-07-10 — 本番反映: non-production → 本番 Supabase write guard

- **main** — `b2408b2..cd65c52` FF（`78f1131` / `845263f` / merge `cd65c52`）
- **production deploy** — `dpl_GgPbTxd2MpsoSG2xG6Lb9upo5L3E`（https://forge-flame-gamma.vercel.app）
- **smoke PASS** — `/search`・REALIA 詳細 200、プレイ CTA → `/login?return=/games/0aea6406-...`、`og:image` = default png（data URL なし）
- **未実施** — DB / Storage write / migration / restore `--execute` / 047 / backfill
- **preview 同期** — `origin/main` = `origin/preview/landing-01` = `cd65c52`

---

## 2026-07-10 — 本番反映: public discovery auth gate（A案）

- **main** — `d72480b..09b6de9` FF（`8d9fd59` / `287799a` / `51e6c9e` / `09b6de9`）
- **production deploy** — `dpl_D6YTTXm2LQJ5WZ158csGCdRcibAZ`（https://forge-flame-gamma.vercel.app）
- **smoke PASS** — `/search`・REALIA 詳細で入口モーダルなし、プレイ CTA → `/login?return=/games/0aea6406-...`、ゲスト副導線あり、ゲスト後 return 復帰、`og:image` = default png（data URL なし）
- **未実施** — DB / Storage / migration / 047 / backfill / restore
- **preview 同期** — `preview/landing-01` = `09b6de9`（旧 tip `8832535` は `archive/ogp-storage-047-preview` に退避）

---

## 2026-07-10 — 保護アクション: 確認モーダル廃止・/login 直接遷移（A案確定）

- **方針** — 発見・閲覧前の全面モーダル（ForgeEntryGate）は使わない。ログイン誘導は価値ある行動の瞬間に寄せ、**画面上モーダルではなく** `/login?return=現在URL` へ遷移
- **変更** — プレイ / FB / 応援 / 見届け / あとで見る等の保護アクションは即 `/login` へ。確認モーダルは出さない
- **ゲスト** — `/login` ではログイン・新規登録が主導線、ゲスト参加は副導線。登録必須アクションは `intent=registered` でゲスト非表示、プレイは intent なしでゲスト可
- **維持** — `/home` `/search` `/games/[id]` の未ログイン閲覧、Studio / mypage / settings 等のログイン必須
- **対象** — `fix/public-discovery-auth-gate` → main 反映済み

---

## 2026-07-10 — 登録必須アクションの login: ゲスト参加を非表示（intent=registered）

- **変更** — 登録必須アクションで `/login` に遷移するとき `intent=registered` を付与。`/login` ではゲスト参加ボタンを出さない
- **維持** — `return` URL は従来どおり。プレイ導線（`variant: play`）は intent なしでゲスト参加を維持。middleware 直打ち保護は変更なし
- **対象** — `fix/public-discovery-auth-gate`（main merge 前）

---

## 2026-07-10 — 公開ページの保護アクション: 確認モーダル（後に廃止）

- **当時** — 未ログイン保護アクションで確認モーダルを表示（「ログインして続ける / 今はやめる」）
- **その後** — A案確定により確認モーダルを廃止し、`/login?return=...` 直接遷移へ変更（上記「保護アクション: 確認モーダル廃止」参照）
- **対象** — `fix/public-discovery-auth-gate`（main merge 前）

---

## 2026-07-10 — 発見閲覧の開放（入口ゲート廃止・A案）

- **閲覧** — `/search` `/games/[id]` `/home` `/guide` `/creators/*` `/rankings/*` 等は未ログイン・entry 未選択でも**初期表示の「Forgeへようこそ」モーダルを出さない**
- **アクション時 login** — プレイ・フィードバック・応援・更新を追う・あとで見る等は画面上モーダルではなく **`/login?return=現在URL`** へ遷移（登録必須プロンプトモーダルも廃止）
- **ゲスト参加** — `/login` の副導線は維持。return 先に `/search`（クエリ付き）・作品詳細等を追加
- **削除** — `ForgeEntryGate` コンポーネント・`/games/[id]` 初回の login 強制リダイレクト
- **DB / Storage / migration なし**
- **対象** — `fix/public-discovery-auth-gate`（main 起点）

---

## 2026-07-09 — Hotfix: non-production → 本番 Supabase write guard

- **guard** — `lib/supabase/write-guard.ts` + `createServiceRoleClient()` で non-production から本番 ref への service role write を拒否
- **fail closed** — `FORGE_PRODUCTION_SUPABASE_REF` 未設定または URL から ref 抽出不能時も拒否
- **一時許可** — `FORGE_ALLOW_PRODUCTION_SUPABASE_WRITE=1`（script 用・常時設定禁止）
- **script** — seed / shadow / restore execute / verify flow に `--execute` デフォルト dry-run + guard
- **検証** — `npm run verify:supabase-write-guard`（8ケースを ts / mjs 両方 + parity チェック）
- **未実施** — main merge / production deploy / DB write

---

## 2026-07-09 — P0: 本番 / Staging 環境分離の準備（doc + read-only ツール）

- **方針確定** — Production = 本番 Supabase のみ。Preview / local = Staging Supabase のみ。preview/landing-01 凍結・main 直 merge 禁止
- **Staging 手順** — `docs/staging-supabase-environment-separation-guide.md` に migration 001–046（047 除外）・最小 seed 仕様を整理
- **env チェックリスト** — `docs/vercel-local-env-separation-checklist.md`（秘密値なし）
- **接続先確認** — `scripts/check-supabase-connection-target.mjs` / `npm run check:supabase-connection`（read-only、本番 ref 誤接続時は警告）
- **script 監査** — `docs/script-safety-audit.md`（dry-run / guard 改修対象一覧）
- **バックアップ方針** — `docs/supabase-backup-recovery-guide.md`（オーナー Dashboard 確認項目）
- **guard 設計** — `docs/non-production-supabase-write-guard-design.md`（実装は未着手・main 起点 hotfix 予定）
- **未実施** — DB / Storage / deploy / migration 047 / backfill / restore execute / OGP 再開

---

## 2026-07-09 — インシデント復旧: REALIA / 民俗STG サムネ復元

- **対象** — 公開2作品のみ（`0aea6406-…` REALIA、`ca75ee30-…` インターネット民俗STG）
- **方法** — 消失前 stash 証拠から `thumbnail_url` / `thumbnail_urls`（data URL）を本番DBへ書き戻し
- **影響** — 他38作品のサムネ列・`updated_at` は不変。047 / Storage OGP / backfill は未実施
- **UI** — 本番ホーム・作品詳細・`/api/projects/{id}/og-image` でサムネ復帰を確認

---

## 2026-07-09 — Hotfix: 最小 read-only OGP（作品詳細 metadata）

- **og:image** — 公開作品の `thumbnail_urls` / `thumbnail_url` から **http(s) のみ** 採用。data URL / 空は `/images/og-default.png`（絶対URL）
- **read-only** — `generateMetadata` + `fetchPublicProjectForOg` の SELECT のみ。DB / Storage write なし
- **非公開・不存在** — デフォルト OGP（Forge 定型）
- **除外** — og-image API 経由の data URL カード、047 / Storage / backfill
- **対象** — `hotfix/minimal-readonly-ogp`（main 起点）
- **本番反映** — `main` FF `780838b` → `vercel deploy --prod`（`dpl_6g9LVKxms2nP8WysHm1855iYs2h6`、https://forge-flame-gamma.vercel.app）
- **本番 smoke** — REALIA / 民俗STG: `og:image` = default png（data URL サムネは未使用）、`twitter:card=summary_large_image`、HTTP 200・`/login` リダイレクトなし

---

## 2026-07-09 — Hotfix準備: Studio保存のサムネ空上書き防止

- **編集保存** — サムネ未変更時は `thumbnail_url` / `thumbnail_urls` を UPDATE payload に含めない
- **空上書き禁止** — 既存サムネあり + 送信が空のときは上書きしない（他パネル保存時の事故防止）
- **明示削除** — 画像パネル保存時のみ `explicitThumbnailUpdate` で全削除を許可
- **対象** — `hotfix/studio-thumbnail-save-guard`（main 起点・OGP/047 非含有）

---

## 2026-07-08 — Studioパネル文言削ぎ落とし（入力画面へ寄せる）

- **上部案内削除** — 「右の項目を編集すると…」「左プレビューをクリックして…」などの操作説明を投稿・編集パネルから削除。投稿画面ヘッダー下の補足も削除
- **各項目の説明削除** — 開発フェーズ / プレイ情報 / 料金・公開形態 / アクセス方法 / URL補足 / 配布形式ヒント / FB未設定注記 / 公開設定オプションhint / 外部リンク長文案内を削除（見出し・ラベル中心）
- **プレイURL** — ラベルを「遊べるURL」に変更。placeholder は `https://...` のみ
- **正式版公開済み** — 折りたたみ「＋ 正式版公開済み（任意）」／展開「正式版公開済み」「完成品として扱う設定です。」「設定する」。確認モーダルは結論＋リスク箇条書き＋将来影響一文に短縮
- **方針** — Studioパネルは説明を読ませる画面ではなく入力する画面。注意喚起はモーダル等の判断直前に寄せる
- **対象** — Preview のみ（DB / main / 本番未変更）

---

## 2026-07-08 — OGP: data URL サムネをクロール可能な画像URLに

- **og:image / twitter:image** — DB に `data:image/...;base64,...` で保存されたプロジェクトサムネを、公開 API `/api/projects/{id}/og-image` 経由の絶対 HTTP URL で返す（social crawler 向け）
- **説明文** — キャッチコピー（`description`）→ 概要導入（`overview_introduction`）→ 定型文の優先。版・ステータス接尾辞は付けない
- **対象** — 公開（`visibility=public`）プロジェクトのみ。Studio UI / DB migration / 本番 main は変更なし

---

## 2026-07-08 — Studio右パネルUI再調整（二重スクロール解消・パネル分割・正式版控えめ化）

- **二重スクロール解消** — 縦スクロールは右パネル本文1本のみ。`StudioPanelEditShell` から内側スクロールを除去
- **薄いスクロールバー** — `.forge-thin-scrollbar` を追加（6px / 低コントラスト）
- **パネル分割** — 「プレイ情報」と「公開先・公開設定」を別編集パネルに分離
- **公開先クリック** — パネル先頭から開く（下部へ飛ばさない）
- **正式版カード** — 折りたたみの控えめ表示。強い黄色CTAとヘルプリンクを廃止
- **確認モーダル** — 「完成品に見えてしまう」不都合を中心に文言刷新
- **ジャンルクリック** — 左プレビューのジャンルバッジ → ジャンル入力へ移動

---

## 2026-07-08 — Studio右パネル横スクロール修正・ハイライト簡素化

- **横スクロール除去** — 右パネル / 編集シェル / スクロール本文に `overflow-x-hidden`・`min-w-0`・`max-w-full` を徹底。ヘッダーの負の margin を廃止
- **ハイライト** — `StudioFieldAnchor` の ring/囲み枠を廃止。スクロール＋入力欄 focus のみ
- **左プレビューhover** — 「編集」テキストを削除し、鉛筆アイコンのみ

---

## 2026-07-08 — Studio投稿/編集プレビューUI改善（正式版誤操作防止・編集導線）

- **正式版公開済み** — チェックボックスを廃止し「重要アクションカード」に変更。設定前に確認モーダル＋「内容を理解しました」必須。保存前は設定予定の取り消し可。保存時の二重モーダルは廃止
- **料金・公開形態** — UI表記を「プレイ条件」から変更（DB値 `play_access_type` は不変）。選択肢ラベルを「無料で遊べる」等に更新。発見フィルタ見出しも同期
- **左プレビュー編集導線** — タイトル・キャッチコピー・作品紹介・バッジ・プレイ情報・公開先・サムネ等を hover/click で右パネル該当欄へスクロール＋一時ハイライト
- **右Studioパネル** — 編集案内文追加、内部スクロール、保存/投稿ボタン sticky（編集シェル含む）
- **プレイ情報・公開先** — パネル分割はせず、小見出し（料金・公開形態 / プレイ情報 / アクセス方法）で整理

---

## 2026-07-08 — 正式版スコープイン（投稿時申告・プレイ条件）

- **三軸の分離** — 開発フェーズ（`phase`）/ 正式版公開済み（`release_status` + events）/ プレイ条件（`play_access_type`）を投稿・編集フォームで別入力
- **正式版公開済み（onboarding）** — 投稿・編集でチェック → 保存前確認モーダル → `source=onboarding` で event 作成。**フォロワー通知なし**、devlog/playable 不要。v1 では通常編集で取り消し不可
- **Studio 正式版宣言** — 現行維持（`source=studio`、devlog + playable 必須、フォロワー通知あり）
- **プレイ条件** — 無料 / 体験版あり / 有料 / その他。既存作品は `unspecified`（バッジ非表示）。新規投稿は UI 初期値 `free`
- **表示** — 完成品バッジ優先、料金バッジ、CTA 文言変更、発見フィルタにプレイ条件追加
- **migration** — `046_formal_release_scope_in.sql`（Dashboard 適用はオーナー GO 後）
- **設計** — `docs/formal-release-scope-in-design.md`

---

## 2026-07-07 — 開発フェーズ表示ラベル更新（α版 / β版 / 正式版候補）

- **開発フェーズ（表示のみ）** — DB値 `projects.phase` は変更なし。プレイヤー・作者向けラベルを更新
  - 試作版 → 試作版（説明文更新）
  - プレイ可能版 → **α版**
  - 通しプレイ版 → **β版**
  - 公開準備中 → **正式版候補**
- **正本** — `lib/development-phases.ts`（`displayPhase` / 投稿フォーム / 発見フィルタ / 作品詳細バッジ）
- **触らない** — `playable_version`、正式版（`release_status`）、phase への「公開済み」追加
- **commit** — `647614e`（`origin/main` = `origin/preview/landing-01`）
- **本番 URL** — https://forge-flame-gamma.vercel.app
- **deploy** — `dpl_3jqereSD3BYxhXBTyzPF8KkYGm7C`（`npx vercel deploy --prod`）
- **本番確認** — 作品詳細 `β版` / `正式版候補` 表示、旧フェーズラベルなし、`/home` カード `0.1` 維持

---

- **作品投稿 / 編集 / 検索フィルタ** — 共通ジャンル一覧に **カードゲーム** を追加（作者登録ブロッカー解消）
- **DB migration 不要** — `projects.genres text[]` は値制約なし。正本は `lib/forge-genre-options.ts`
- **commit** — `44bc8f5`（`origin/main` = `origin/preview/landing-01`）
- **本番 URL** — https://forge-flame-gamma.vercel.app
- **deploy** — `dpl_6G1xCXuBv5Q8m4XUcAywVTAwq36F`（`vercel deploy --prod`）

---

## 2026-07-07 — 発見カード集計の RPC 配線（migration 045）本番反映

- **発見カード（/home・/search・/creators/[id]）** — 2指標を統一
  - **フィードバック N** — 登録ユーザーの distinct user_id（`project_voice_responses ∪ project_feedback`、`moderation_status = visible`）。ゲストFBは含めない
  - **フォロー N** — `project_watches` 件数（作品の更新追跡 / 作品フォロー）
- **撤去** — カード上の「見届け人」ラベル、`project_supports`（応援）の誤配線
- **見届け人（称号）** — `project_witness_grants` は RPC で返すがカード常設には使わない（詳細・バッジ文脈用）
- **DB** — `045_public_project_stats_rpc.sql`（`get_public_project_stats`）Dashboard 適用済み
- **検索ソート** — 「フォローが多い順」「フィードバックが多い順」（旧 URL `sort=witness` / `sort=voices` は互換読み取り）
- **今週人気** — ソート定義（`project_supports` 応援数）は変更なし
- **commit** — `b15f93a`（`origin/main` = `origin/preview/landing-01`）
- **本番 URL** — https://forge-flame-gamma.vercel.app
- **deploy** — `dpl_2g1YrCE3kSs7ajGzSU7GFijNw65g`（`vercel deploy --prod`）

---

## 2026-07-07 — 通知パッケージ・設定UI整理・アカウント削除文言 本番反映

- **通知** — 作品フォロー（`project_watched`）、フォロー中の開発者の新作・正式版公開通知。migration 044 適用済み
- **設定** — 通知・プライバシーUI整理（「？」ヒント、近日対応ピル、ラベル調整）。Studio「作品フォロー」
- **設定（アカウント）** — セクション見出し「アカウント削除」、実行リンク「アカウントを削除する」に統一（説明文・モーダル内の「退会」表現は維持）
- **コアループ小改善** — Studio未確認ワッペン修正、通知 reload、プレイヤーマイページ「最新版未プレイ」ワッペン
- **commit** — `444ca92`（`origin/main` = `origin/preview/landing-01`）
- **本番 URL** — https://forge-flame-gamma.vercel.app
- **deploy** — `dpl_8AwJ9PNuU9tNXHtBARRqpFH8zfh3`（`vercel deploy --prod`）

---

## 2026-07-07 — 設定画面「？」ヒント文の簡素化（preview/landing-01・Preview のみ）

- **設定** — 「？」補足を「何を指すか」だけの短文に統一。否定形・将来予定・仕様説明を削除
- **本番未反映**（→ 上記 2026-07-07 本番反映に含む）

---

## 2026-07-07 — 設定画面ラベル・ピル配置調整（preview/landing-01・Preview のみ）

- **設定** — 項目名を意味が通る長さに調整（追跡・フォロー新作/正式版・初プレイ・ver更新後プレイ等）。「声」「版」は不使用
- **レイアウト** — 近日対応ピルを右端（スイッチ位置）へ。「？」は項目名直後に配置
- **DB / 通知ロジック変更なし・本番未反映**（→ 上記 2026-07-07 本番反映に含む）

---

## 2026-07-07 — 設定画面UI文言整理（preview/landing-01・Preview のみ）

- **設定（/settings・/studio/settings）** — 通知・プライバシーの説明文を通常表示から削除。項目名 + ON/OFF（または近日対応ピル）のみ。補足は「？」アイコン（hover）に移動
- **通知** — Studio「作品を追われたとき」→「作品フォロー」。Player/Studio サブ見出しを簡素化
- **DB / 通知ロジック変更なし・本番未反映**（→ 上記 2026-07-07 本番反映に含む）

---

## 2026-07-06 — 通知コアループ整理（preview/landing-01・Preview のみ）

- **Player: フォロー中の開発者** — 新作公開・正式版公開時にフォロワーへアプリ内通知（`developer-follow` 設定でON/OFF）。devlogのみの更新は通知しない
- **Studio: 作品を追われたとき** — `project_watches` 新規作成時にオーナーへ通知（`notify_studio.witness` 設定でON/OFF）。ラベルを「作品を追われたとき」に整理
- **設定画面（通知のみ）** — 操作可能: 更新追跡・フォロー中の開発者・作品を追われたとき。近日対応はスイッチなしの控えめ行に分離。プレイ通知は「毎回ではなく将来は節目のみ」と明記。voice_received は既定ONの説明のみ
- **既存維持** — 更新追跡（devlog/version/confirmation）、voice_received（DB trigger）、通知 reload 強化
- **DB migration** — `044_follow_and_watch_notifications.sql` 追加（型制約・project_watches trigger・studio pref RPC）。**Dashboard 手動適用が必要・本番未反映**

---

## 2026-07-06 — コアループ小改善パッケージ（preview/landing-01・Preview のみ）

- **Studio マイページ** — 作品カードの未確認ワッペンが `useNurtureVoiceRead`（`project_voice_reads` 正本）を参照するよう修正。既読後に未確認バッジが残り続ける不具合を解消
- **設定** — 未接続の通知・プライバシートグル（フォロー中の開発者、コミュニティ、Forgeお知らせ、見届け人/プレイ/コミュニティ通知、プロフィール公開・活動表示）を disabled +「近日対応」表示。ランキング表示は DB/RPC 接続済みだがランキング機能自体が非活性のため同様に近日対応扱い（注記で区別）。実際に効く項目（更新追跡通知、開発者プロフィール公開、アカウント系）は従来どおり操作可能
- **通知** — pull-only のまま、タブ再表示・ウィンドウフォーカス復帰・ベルクリック時に `reloadNotifications()`（5秒スロットル付き）。`/notifications` 表示時の既存 reload は維持
- **プレイヤーマイページ** — 「遊んだゲーム」カードに「最新版未プレイ」ワッペンを追加（既存 `hasPlayedLatestVersion` 判定を流用）
- **DB migration なし・本番未反映**

---

## 2026-07-06 — 投稿完了画面 CTA 文言のみ調整（preview/landing-01）

- **投稿成功パネル** — 「もう1本投稿する」→「続けて投稿する」のみ変更。見出し・説明・その他CTAは従来どおり維持
- **DB / auth 変更なし**

### 本番反映（同日）

- **commit** — `10260fb`（`origin/main` = `origin/preview/landing-01`）
- **本番 URL** — https://forge-flame-gamma.vercel.app
- **deploy** — `dpl_Eoyu9qDDNTqGuScFyAYdLmvkLyeR`（`vercel deploy --prod`）

---

## 2026-07-06 — 作品ページ共有導線・ログイン return・オーナーUI 本番反映

- **commit** — `be4f4b8`（`fd53bbb`〜`be4f4b8` を `main` FF。`origin/main` = `origin/preview/landing-01`）
- **本番 URL** — https://forge-flame-gamma.vercel.app
- **deploy** — `dpl_D7XKA4jQZ64o98V8Xi9XvKWvqQip`（`vercel deploy --prod`）
- **含む** — 作品ページUI改善 / 共有URL未ログイン→ログインページ遷移 / ログイン・登録 return / returnなし→`/home` / オーナー右カラム「これはあなたの作品です」 / 「フィードバックする」文言統一 / みんなのFB初回並列fetch / オーナーカード2ボタン化
- **smoke** — `/home` 200、作品ページ・ログイン bundle 文言/導線、public-feedback API 200 — すべて PASS
- **DB migration なし**

---

## 2026-07-06 — 作品ページ オーナー差分の右カラム集約・文言整理（preview/landing-01）

- **オーナー共有バー** — ヒーロー上の共有バーを廃止。公開ページは誰が見ても同じ見た目に
- **右カラム** — オーナー本人は「これはあなたの作品です」カード（外部共有・Studio編集）。他人・未ログイン・ゲストは従来どおり「あなたの関わり」
- **ユーザー向け文言** — 「声を届ける」系を「フィードバックする」に統一（タブ名「みんなのフィードバック」は維持）
- **みんなのFBタブ** — 初回表示時、カード取得と集計RPCを並列化（低リスクの表示高速化）。今後候補: スケルトンUI / API統合 / タブprefetch
- **DB / auth / EntryGate 変更なし**

### 追記（同日）

- オーナーカードから「URLをコピー」単独ボタンを削除（「外部に共有する」モーダル内でコピー可能なため）

---

## 2026-07-06 — 作品ページ 共有前提 UI/UX 軽量改善（preview/landing-01）

- **対象** — `/games/[id]`（初見プレイヤー・共有URL着地）
- **ヒーロー** — lead 未設定時は `phaseDescription` を補助説明に表示。lead あり時はタイトル下にフェーズ説明を短く併記。フェーズバッジを violet/zinc に統一
- **CTA** — 主CTA「プレイする」維持。セカンダリ「プレイ後に声を届ける」をヒーロー直下に追加（outline）。追跡・保存・フォローは2行目・軽量表示
- **概要タブ** — `onFeedback` / `feedbackCtaLabel` を `GameDetailPlayerOverview` へ接続。「最近の動き」内に控えめなテキスト導線
- **色味** — みんなのFBタブ内 orange/amber CTA・フィルタ選択を violet/zinc に。play URL 未設定警告を zinc 寄りに
- **オーナー共有バー** — 説明を1行に圧縮（「このURLをプレイヤーに共有できます」）
- **DB / auth / EntryGate 変更なし**

---

## 2026-07-06 — 共有リンク向け 登録 return 受け渡し（preview/landing-01）

- **登録 return** — `buildRegisterUrlWithReturn` を追加。ログイン画面・保護CTAモーダル・登録画面・登録画面のログインリンクで `return` を引き継ぐ
- **登録完了後** — `resolvePostLoginPath(returnParam)` で作品ページ等へ復帰（return なしは従来どおり）
- **メール確認** — `emailRedirectTo` 経由で `/auth/welcome?return=...` を渡す。ウェルカム画面の続行ボタンが return 先へ（なしは `/home`）
- **DB / EntryGate / RLS 変更なし**

---

## 2026-07-06 — 共有作品URLの EntryGate → ログインページ遷移（preview/landing-01）

- **`/games/[id]`** — 未ログイン・entry未選択時、ForgeEntryGate モーダルではなくクライアント側で `/login?return=...` へ遷移（OGP/HTMLは作品ページのまま）
- **ログインページ** — return がゲスト許可パス（作品ページ等）のときだけ「ゲストで参加」を表示。Studio 等の return では非表示
- **return 許可拡張** — `/mypage`・`/mypage/*`・`/settings` を sanitize 対象に追加（ブックマーク復帰用）
- **DB / middleware 変更なし**

---

## 2026-07-06 — return なしログイン/登録のデフォルトを `/home` に（preview/landing-01）

- **`DEFAULT_POST_LOGIN_PATH`** — `/studio/mypage` から `/home`（`DEFAULT_POST_PLAYER_HOME_PATH` と統一）
- **return あり** — 従来どおり `resolvePostLoginPath(returnParam)` で作品ページ・Studio・settings 等へ復帰
- **Studio へ行くのは return 明示時のみ**（例: `/login?return=/studio/mypage`）

---

## 2026-07-06 — 投稿後・作品ページ共有導線 本番反映

- **commit** — `cf10c67`（`a272840`〜`cf10c67` を `main` FF。`origin/main` = `origin/preview/landing-01`）
- **本番 URL** — https://forge-flame-gamma.vercel.app
- **deploy** — `dpl_UNzYHP35JhfAtRbCiQMx9wKYZJzv`（`vercel deploy --prod`）
- **投稿成功画面** — 作品タイトル表示。「Player表示で作品ページを見る」/ 外部に共有 / 投稿した作品を編集する / もう1本投稿。非公開は Player 表示・共有を非活性/非表示、編集へ誘導
- **共有モーダル** — 共有URL目視表示。violet + zinc トーン
- **作品ページ（オーナーのみ）** — 薄い共有バー（外部に共有する / 作品を編集する）。非公開は共有不可案内
- **DB migration なし**

---

## 2026-07-06 — 投稿後・作品ページ共有導線の補強（preview/landing-01）

- **commit** — `a272840`（`preview/landing-01` のみ。本番未反映）
- **Preview URL** — https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
- **投稿成功画面** — 作品タイトル（『{title}』を投稿しました）を表示。「投稿した作品を編集する」（`/projects/{id}/studio`）。CTA・アイコンは violet 系（v0 トーン統一）。非公開時の案内は「公開設定を変更」へ
- **共有モーダル** — 共有URLを読み取り専用で目視表示。X ボタン等も violet 系に統一
- **作品ページ（オーナーのみ）** — 薄い共有バー（外部に共有する / 作品を編集する）。非公開は共有不可の案内のみ
- **DB migration なし**

---

## 2026-07-06 — 投稿後共有導線 文言・色味調整（preview/landing-01）

- **文言** — 「Studioで管理する」→ 成功画面「投稿した作品を編集する」、作品ページ共有バー「作品を編集する」
- **色** — 投稿成功・共有モーダル・オーナー共有バーの orange/amber CTA を violet + zinc 基調に統一（v0 トーン）
- **維持** — 共有URL目視表示、CTA 構成、機能挙動は変更なし

---

## 2026-07-06 — 投稿成功画面 Player表示文言・非公開CTA整理（preview/landing-01）

- **公開** — primary「Player表示で作品ページを見る」（`/games/{id}`）。CTA: 共有 / 投稿した作品を編集する / もう1本投稿
- **非公開** — 「Player表示で作品ページを見る」は非活性。外部共有CTAは非表示。説明文で公開後の共有を案内。編集へ進める構成

---

## 2026-07-06 — PlayerShell 共通 layout Phase 1 本番反映

- **commit** — `0f84b67`（Phase 1 コア `6fdfd00` + changelog。`origin/main` = `origin/preview/landing-01`）
- **本番 URL** — https://forge-flame-gamma.vercel.app
- **deploy** — `dpl_uwDZJxL2YRvhcppkkp45JLASy7B5`（`vercel deploy --prod`）
- **内容** — `/home` `/search` `/mypage` `/mypage/community` `/settings` を `app/(player)/` route group 化。`PlayerShellLayout` で sidebar/header を遷移間維持。`HeaderSearchForm` が URL から `q` を自己解決
- **未移行（別タスク）** — 残り Player ルート、StudioShell layout 化、GamesProvider 分解、auth/getUser 整理
- **残課題** — サイドバー遷移はまだ少し遅いが現時点ではギリ許容範囲。さらなる改善は別タスクで慎重に（Phase 2 / Studio layout / GamesProvider / auth 整理）。route-level `loading.tsx` 全画面 skeleton は不採用（UX 悪化のため revert 済み）

---

## 2026-07-06 — PlayerShell 共通 layout Phase 1（preview/landing-01）

- **対象** — `/home` `/search` `/mypage` `/mypage/community` `/settings` を `app/(player)/` route group 化
- **構造** — `PlayerShellLayout` が layout で1回だけ mount。page 側は main content のみ
- **検索欄** — `HeaderSearchForm` が pathname + searchParams から `q` を自己解決
- **未移行** — `/games/[id]` Studio 系 rankings / notifications / guide / creators 等は従来どおり page 内 Shell

---

## 2026-07-06 — 主要導線パフォーマンス改善 本番反映

- **commit** — `122cb6b`
- **本番 URL** — https://forge-flame-gamma.vercel.app
- **deploy** — `dpl_ARS8yDJzg9gD4iQbhpKoSDEiLYnD`（`vercel deploy --prod`）
- **内容** — 作品詳細1件直取得、GamesProvider グローバル取得遅延、instant tab（`useInstantQueryTab`）、タブスクロール維持、ログイン入力保持、mypage/Studio タブ即時化、skeleton 化、`[forge:perf]` 計測基盤
- **残課題（次フェーズ）** — サイドバー遷移のさらなる改善は Phase 1 layout 化で一部緩和。完全解消は別タスク

---

- **voices スクロール戻り** — 非アクティブパネル `hidden` によるドキュメント高さ崩れが原因。`captureScrollPosition` + タブ領域 `min-h-[28rem]`
- **横展開** — `/mypage` `/studio/mypage` を `useInstantQueryTab` 化（play-history / followers は lazy mount）
- **ログイン** — `revalidatePath("/", "layout")` 削除（submit 後の layout 再検証でフォームが remount→入力消去）。controlled inputs + 「ログイン中…」+ `[forge:perf] login.submit.*`

---

- **原因** — タブ切替で `router.replace(?tab=)` → Next.js navigation → `useSearchParams` 経由で GameDetail 全体が再レンダー
- **修正** — `useInstantQueryTab` + `history.replaceState` で **ローカル state を即時更新**、URL は navigation なしで同期
- **分離** — `GameDetailTabBar` / `GameDetailTabPanels` を memo 化、タブパネルを `useMemo` で安定化
- **計測** — `[forge:perf] game-detail-tab.underline` / `.panel`（rAF1/rAF2）

---

- **作品詳細** — `useGameDetailProject` で `fetchPublicProjectById` / `fetchOwnedProjectById` を並列実行。`publicCatalogReady` / owner catalog 完了を待たず初期表示
- **GamesProvider** — `fetchAllProjectDevlogs` / `fetchAllProjectReleaseEvents` / `support counts` をマウント直後から `setTimeout(0)` で遅延（public catalog との帯域競合を緩和）
- **devlog タブ** — グローバル devlogs 未完了時は `fetchProjectDevlogsForProject` で当該作品のみ取得
- **タブ遅延 mount** — devlog / voices は初回タブ訪問まで mount しない（初期表示で voices API を走らせない）
- **計測** — `[forge:perf] game-detail.projectReady` / `supabase.fetchPublicProjectById` 等

---

- **計測** — dev 環境で `[forge:perf]` ログ（`lib/forge-perf-log.ts`）。route 表示開始〜コンテンツ ready、Supabase fetch、provider 初期化を計測。Preview でも `NEXT_PUBLIC_FORGE_PERF_LOG=1` で有効化可
- **auth** — サーバーで session 確認済みのため `authResolved` の初期値を `true` に。クライアント `getUser()` 完了まで全画面をブロックしない
- **作品詳細** — 公開作品は `publicCatalogReady` 後すぐ表示（ログイン済みユーザーの owner catalog 待ちを不要化）。`getPublicGameById` 追加
- **loading UX** — `/home`・`/search`・作品詳細・マイページ・Studio で「読み込み中…」全画面を skeleton に置換
- **タブ** — 作品詳細・マイページ・Studio マイページのタブを mount 維持（`ForgeTabPanel`）。再訪時の不要 refetch を削減
- **通知 fetch** — `submittedGames` 変化による二重 `fetchUserNotifications` を解消

---

## 2026-07-06 — X Auth 本番 deploy GO 完了

- **commit** — `6192348`（`origin/main` = `origin/preview/landing-01`）
- **env** — Vercel Production `NEXT_PUBLIC_X_AUTH_ENABLED=true`
- **Supabase** — Site URL 本番維持 / Redirect URLs×3 / X Provider ON / Manual linking ON（目視確認済み）
- **merge** — `git merge --ff-only origin/preview/landing-01` → `main` push → preview 同期
- **本番 smoke PASS** — `/login`・`/register`「Xでログイン」/ X→`/home` / `@Forge_game_0601` 連携済み / メール・ゲスト・作品詳細・旧ログイン UI 非表示
- **同梱** — 041 公開FB Phase 2 UI / ゲストFB Phase 1 / X OAuth 一式（042/043 DB は事前適用済み）
- **ロールバック方針** — 問題時は `NEXT_PUBLIC_X_AUTH_ENABLED=false` + Redeploy を第一手段

---

- **文言** — `/login`・`/register` とも X ボタンは **「Xでログイン」**
- **遷移** — X ログイン（`/login` / `/register`）で return 未指定時は **新規・既存を問わず `/home`**。`/settings` X連携は **`/settings?x=linked`** のまま
- **意図** — 初回体験は Player 発見側へ。Studio はユーザーが明示的に入る（メール新規登録のデフォルト `/studio/mypage` は別経路のまま）
- **削除** — `forge_oauth_entry` cookie と初回作成時のみ `/home` へ寄せる分岐

---

## 2026-07-06 — Preview X OAuth E2E 全項目 PASS

- **`/login` X** — ログアウト後 Preview `/login` → X同意 → 同一 origin 完結。`forge.operation@gmail.com` / `@Forge_game_0601` でログイン。`/settings` 連携済み表示
- **合わせて PASS** — settings 連携 / `user_x_profiles` / redirect / callback / 旧ログイン UI 非表示

---

## 2026-07-06 — Preview `/settings` X連携 通常系 E2E PASS（DB 確認済み）

- **経路** — 別 Forge アカウントでメールログイン → Preview `/settings` → Xで連携（`linkIdentity` / `x_link`）。**`/login` Xログインは未使用**
- **結果** — X 同意後 **Preview** `/settings?x=linked` に復帰（本番 LP へ飛ばない）。「Xアカウントを連携しました。」・連携済み・`@Forge_game_0601` 表示
- **DB** — `public.user_x_profiles` 1行: `user_id=dffa79de-...` / `x_user_id=1346719389022707712` / `x_username=Forge_game_0601` / `x_display_name=Forge 運営`
- **PASS** — Preview redirect / settings 連携通常系 / `linkIdentity`+`x_link` / `syncUserXProfileAfterAuth`→`upsert_own_x_profile` / 成功 UI / `@handle` / 旧紐づけ解除後の再連携 / **`/login` X**（後続エントリ参照）
- **未確認** — 本番環境 `NEXT_PUBLIC_X_AUTH_ENABLED` 下での同一 E2E
- **未実施** — main merge / 本番 deploy

---

## 2026-07-06 — 新規登録画面の X ボタン文言（一時変更・差し戻し）

- ~~「Xで続ける」~~ → **`Xでログイン` に戻した**（後続エントリ参照）

---

## 2026-07-06 — E2E用 X identity 手動解除（Dashboard SQL・Cursor 未実行）

- **目的** — `@Forge_game_0601`（`provider_id=1346719389022707712`）を `soshirow@gmail.com` から外し、別 Forge アカウントで E2E 連携できるようにする
- **Pre-check（REST Admin API）** — `user_id=d05c457b-6bd0-4ebb-b493-315bf01bcb99` / `email=soshirow@gmail.com` / X identity 1件（`preferred_username` / `user_name` = `Forge_game_0601`）。`user_x_profiles` は **0行**
- **未実行** — `.env.local` に `DATABASE_URL` 無し。`auth.identities` DELETE は **Supabase Dashboard SQL** でオーナー実施（本番運用パターンではない）
- **将来** — ユーザー向け解除は `supabase.auth.unlinkIdentity()` を想定（**未実装**。今回は検証用の手動 SQL のみ）

---

## 2026-07-06 — identity_already_exists 文言 + user_x_profiles 回復同期

- **E2E 切り分け** — Preview redirect **PASS寄り**。`@Forge_game_0601` は既に別 Forge ユーザー（`soshirow@gmail.com` / `auth.identities`）に紐づき。**`identity_already_exists` 拒否は正しい挙動**
- **文言** — `identity_already_exists` / `error_code` を `reason=x_account_already_linked` に正規化。表示: 「このXアカウントは別のForgeアカウントに連携済みです。別のXアカウントを使うか、Xでログインしてください。」
- **回復** — `auth.identities` に X があるが `user_x_profiles` が無い場合: Xログイン callback で同期試行、`/settings` 表示時に `reconcileOwnXProfileFromAuth` で backfill
- **未確認（当時）** — 未使用 X での `/settings` 連携成功 / `user_x_profiles` 作成 / `/login` Xログイン（settings 通常系は後続エントリで **PASS**）
- **未実施** — main / 本番 deploy

---

## 2026-07-06 — X連携 callback 完了処理修正 + reason 細分化（E2E FAIL 継続）

- **事象** — `af53bba` 後: Preview に戻るが **「X連携の完了処理に失敗」**（`callback_failed` 想定）。本番 LP 問題は改善
- **修正** — Route Handler で **Supabase session cookie を redirect に載せる**（`createRouteHandlerSupabase`）。`exchangeCodeForSession` 失敗の切り分けを server log + URL `reason` に細分化（`exchange_failed` / `missing_x_identity` / `upsert_failed` 等）
- **identity 抽出** — `provider_id` / `screen_name` / `nickname` 等を追加。`x_link` 時は X identity 必須
- **DB** — `user_x_profiles` **0行**（連携未完了）。`auth.identities` はオーナー Dashboard SQL で確認
- **未実施** — Preview E2E 再試行 / main / 本番 deploy

---

## 2026-07-06 — OAuth redirectTo を query なし + cookie 方式に変更（E2E FAIL 再発）

- **事象** — `29dc1a7` 後も Preview `/settings` → X 許可 → **本番 LP** へ遷移。E2E **FAIL** 継続
- **仮説** — Supabase Redirect URLs は path のみ allowlist。`redirectTo` に `?next=&flow=` があると **完全一致せず** Site URL へフォールバック
- **修正** — `redirectTo` は **`${origin}/auth/callback` のみ**（query なし）。`flow` / `next` は OAuth 開始前に短命 cookie（`forge_oauth_flow` / `forge_oauth_next`、600s、SameSite=Lax、Secure）。`/auth/callback` が cookie から分岐し処理後削除
- **維持** — Preview OAuth 導線 / Supabase Redirect URLs 3 件 / flow 分離（`x_login` vs `x_link`）
- **未実施** — Preview OAuth E2E 再試行 / main / 本番 deploy

---

## 2026-07-06 — Preview OAuth E2E FAIL → redirect 修正（NO-GO 継続）

- **事象** — Preview `/settings` → X 許可後、Preview に戻らず **本番 LP** へ遷移。E2E **FAIL** → main / 本番 deploy **NO-GO**
- **原因（最有力）** — Supabase Redirect URLs allowlist に Preview `/auth/callback` が未登録 or 不一致 → Site URL（本番）へフォールバック
- **コード修正** — OAuth `redirectTo` を **`window.location.origin` 固定**（`getClientAuthOrigin`）。`flow=x_login` / `flow=x_link` を callback に付与。`x_link` 成功時は必ず同一 origin の `/settings?x=linked`。エラー時も `x_link` は `/settings?x=error…`（本番 login へ飛ばさない）
- **旧ログイン UI** — `OAuthComingSoonSection` / `OAuthButtons`（Google/Discord/GitHub Coming Soon 文言）を repo から削除。現行 `/login` は X + メール + ゲストのみ。**本番（main 未 merge）では旧 UI が残る** — merge 後解消
- **初回開発者導線** — 「いいえ」→ `/studio` 上なら `/home`（発見）へ。Studio ボタンは後から利用可
- **オーナー必須** — Supabase Redirect URLs に Preview callback を **正確に** 追加してから E2E 再試行。`user_x_profiles` 既存行は Dashboard SQL で確認（テスト X が既連携なら `already_linked` 用に整理）
- **未実施** — Preview OAuth E2E 再試行 / main / 本番 deploy

---

## 2026-07-06 — 本番 deploy 前 GO 条件更新（041 再確認 / App名 / env）

- **041 適用済み再確認** — `bpnisgzxuwdxelhnduuf` で post-check REST **PASS**（FB 4 テーブル / `optional_comment` / `moderation_status` / `hidden_at` / `report_count` / `feedback_reports` / `get_public_feedback_cards`）。042 pre-check 時と同一 DB 上で 041 前提 OK
- **X Developer App 表示名** — **`Forge game`**（`Forge` 単体は取得不可）。E2E 同意画面で **Forge game** 表示を確認すること
- **本番 deploy 直前 env** — Vercel Production で `NEXT_PUBLIC_X_AUTH_ENABLED=true` **必須**。X Client Secret は Supabase Dashboard のみ（Vercel 不可）
- **GPT 判定** — Preview OAuth E2E PASS 後に本番 deploy **GO 寄り**
- **未実施** — Preview OAuth E2E / main / 本番 deploy

---

## 2026-07-06 — X Developer クレジット $5 購入 + Preview OAuth E2E 開始

- **X Developer** — **$5 credit 購入済み**。自動チャージ **OFF**（ON にしない）。Premium+ / xAI / 追加自動課金なし
- **運用** — OAuth E2E 中は残高推移を軽く確認。想定外の減少時は停止して切り分け。残高不足エラーのみ最小追加購入を検討
- **Phase A UI** — **PASS**（オーナー確認済み）
- **次** — テスト用 X で Preview OAuth E2E（§runbook 7: 連携 / callback / `user_x_profiles` / `@handle` / `already_linked`）
- **未実施** — main / 本番 deploy

---

## 2026-07-06 — /settings X連携カード文言（プレイヤー向け）

- **説明** — 「OAuth tokenも保存しません」を削除。`Forge上にXの@handleを表示できます。ForgeからXへの投稿やDMは行いません。` に統一（技術用語は runbook / プライバシーポリシー側）

---

## 2026-07-06 — Studio X連携導線 + OAuth scope 調査

- **Studio設定 / Studioプロフィール** — X OAuth UI は複製せず、`/settings` へ誘導する「Xアカウント連携」カードを追加（未連携: 「アカウント設定で連携する」/ 連携済み: `@handle` + 「アカウント設定を開く」）。解除・変更の誤解を招く文言なし
- **OAuth scope 実測** — Supabase 経由 X URL の `scope=` は `users.email tweet.read users.read offline.access`。Forge は scopes 未指定。`options.scopes: tweet.read users.read` でも削減不可（append のみ）。write/DM 系なし
- **email 表示** — Request email OFF でも `users.email` scope が URL に載るため同意画面に出うる
- **日本語化** — X authorize URL に lang 系パラメータなし。Forge から確実な日本語化は未確認
- **本番 GO 前（オーナー）** — X Developer App 表示名 **`Forge game`**（`Forge` 単体は取得不可）。同意画面の権限表示と Forge 実利用の差は runbook §4.1 参照
- **本番 GO 前（確認）** — 本番 hostname で `NEXT_PUBLIC_X_AUTH_ENABLED` 未設定時に X ボタンが **出ない**こと（意図どおり）。Preview hostname 判定の退行がないこと
- **未実施** — main / 本番 deploy

---

## 2026-07-06 — X Auth flag 既定値修正 + ログインフッター位置

- **Xボタン** — `preview-landing-01` ホスト/ブランチは **常に表示**（`NEXT_PUBLIC_X_AUTH_ENABLED=false` や `NEXT_PUBLIC_FORGE_PRODUCTION_MODE=true` でも E2E 可）。local 未設定も ON。本番 release は `true` 明示まで OFF
- **ログイン/登録シェル** — `AuthPageShell` を `min-h-screen` に変更しフッターを画面下に固定
- **未実施** — Provider E2E / main / 本番 deploy

---

## 2026-07-06 — X Auth feature flag（NEXT_PUBLIC_X_AUTH_ENABLED）

- **Phase A 再修正** — Provider 未設定時に Supabase 生 JSON へ遷移する事故を防ぐため、`NEXT_PUBLIC_X_AUTH_ENABLED=true` 時のみ X 導線を表示
- **既定** — 未設定/false で `/login`・`/register` の X ボタン非表示、`/settings` の Xで連携非表示（連携済みは read-only 表示）
- **有効化手順** — Supabase X Provider ON 後、Preview Vercel で `NEXT_PUBLIC_X_AUTH_ENABLED=true` → redeploy → E2E
- **未実施** — Vercel env 設定 / Provider E2E / main / 本番 deploy

---

## 2026-07-06 — Xログイン/連携 UI修正（preview/landing-01）

- **ログイン画面** — CTA中心に整理。並び: メールでログイン → Xでログイン → ゲストで参加（確認モーダル）→ 新規登録。説明文削除
- **エラー表示** — Xログイン/連携で生JSON・JSエラーを出さず汎用メッセージに変換
- **linkIdentity 修正** — メソッド切り離しによる `linkIdentityOAuth` undefined を解消（`auth-provider.linkOAuthIdentity` で `supabase.auth.linkIdentity` を直接呼び出し）
- **設定 X連携** — 説明文を短縮
- **プレイヤープロフィール X表示** — 実プロフィール接続時の別TODO（今回E2E対象外）

---

## 2026-07-06 — X Provider 設定 GO（[A]）— Site URL 本番維持方針

- **GO** — X Developer Console 作成、Supabase X Provider ON、Manual linking ON、Redirect URLs 3 件追加
- **オーナー** — 上記方針で Provider 手動設定に進行中。完了後 Preview E2E（Xログイン / メールユーザー連携 / user_x_profiles / @handle / 同一X拒否）
- **Site URL** — `https://forge-flame-gamma.vercel.app` **維持**（Preview 検証中も変更しない。共通 Supabase のメール認証・PW リセット保護）
- **Redirect URLs 追加** — Preview / 本番 / localhost の `/auth/callback`（X OAuth は `redirectTo` で各 origin を使用）
- **X Developer Callback** — `https://bpnisgzxuwdxelhnduuf.supabase.co/auth/v1/callback` のみ（Forge `/auth/callback` 不可）
- **Secret** — Supabase Dashboard のみ（Forge / Vercel env 不可）
- **次** — Provider 設定後 Preview E2E（Xログイン / メールユーザー連携 / user_x_profiles / @handle / 同一X拒否）。**プレイヤープロフィール `/players/[handle]` の X 表示は未実装・E2E対象外**
- **未実施** — Provider 実設定 / main / 本番 deploy

---

## 2026-07-06 — X連携 DB post-check 最終 PASS → Provider 設定 GO 判断

- **042 + 043** — Dashboard grants / RLS / anonymize DELETE / REST 統合 post-check 最終 **PASS**
- **次** — X Developer Console + Supabase Auth Provider（X）+ Manual linking（オーナー手動。Preview E2E まで）
- **未実施** — X Developer / Supabase Provider 実設定 / main / 本番 deploy

---

## 2026-07-06 — X連携 043 権限補正 Dashboard 適用（統合 post-check）

- **043 適用** — オーナー Dashboard で権限補正 SQL Run 完了（Success / No rows returned）
- **統合 post-check REST** — `upsert_own_x_profile` anon は `permission denied`（042 時の `not_authenticated` から変化 = anon EXECUTE 剥奪を反映）、`get_public_feedback_cards` anon 200、`get_public_x_profile` 404
- **repo** — `supabase/migrations/043_user_x_profiles_rpc_grants_fixup.sql` 正本として残置
- **未実施** — X Developer / Supabase Provider / main / 本番 deploy

---

## 2026-07-06 — X連携 042 post-check NG → 043 権限補正SQL 追加

- **042 post-check NG** — `upsert_own_x_profile` / `anonymize_own_account_data` に anon EXECUTE が残存（止める条件該当）
- **043 追加** — `supabase/migrations/043_user_x_profiles_rpc_grants_fixup.sql`（PUBLIC/anon REVOKE → authenticated のみ GRANT、`get_public_feedback_cards` は anon+authenticated 明示 GRANT）
- **042 正本も更新** — 将来適用時に anon REVOKE を含む（既適用 DB は 043 で補正）
- **未実施** — 043 Dashboard 適用 / X Developer / Supabase Provider / main / 本番 deploy

---

## 2026-07-06 — X連携 042 Dashboard 適用済み（post-check REST 通過）

- **042 適用** — オーナー Dashboard SQL Editor で `042_user_x_profiles.sql` 全文 Run 完了
- **post-check REST 通過** — `user_x_profiles` 存在、旧 `get_public_x_profile(s)` なし、`get_public_feedback_cards` に `author_x_username`、`upsert_own_x_profile` は anon 拒否（`not_authenticated`）
- **残確認** — Dashboard で `upsert_own_x_profile` / `get_public_feedback_cards` / `anonymize_own_account_data` の routine_privileges（RLS / anonymize DELETE は SQL post-check）
- **未実施** — X Developer / Supabase Provider / Preview X E2E / main / 本番 deploy

---

## 2026-07-06 — X連携 042 pre-check 通過（GPT B判定 / Dashboard Run 待ち）

- **pre-check 通過** — `bpnisgzxuwdxelhnduuf` で REST 確認済み: 旧 `get_public_x_profile(s)` なし、`user_x_profiles` / `upsert_own_x_profile` 未存在、`author_x_username` 未追加、041 前提（FB 4 テーブル / optional_comment / moderation_status / feedback_reports / 公開 RPC）OK
- **次** — オーナー Dashboard SQL Editor で `042_user_x_profiles.sql` 全文 Run → post-check → Preview X 連携確認
- **Cursor 確認済み** — Preview `GET /api/projects/.../public-author-x` は `{ ok, xUsername }` のみ（042 適用前は `xUsername: null`）
- **未実施** — 042 Dashboard 適用 / X Developer / Supabase Provider / main / 本番 deploy

---

## 2026-07-06 — X連携 042 プライバシー修正（preview/landing-01）

- **042 正本修正** — `get_public_x_profile` / `get_public_x_profiles` を削除（user_id キー公開 RPC を廃止）
- **公開 X 表示** — リソース起点のみ: FB カード `author_x_username`、作品 `GET /api/projects/[id]/public-author-x`、開発者 `GET /api/creators/[routeId]/public-x`（いずれも `xUsername` のみ、user_id / x_user_id / token なし）
- **未実施** — 042 Dashboard 適用 / X Developer / Supabase Provider / main / 本番 deploy

---

## 2026-07-06 — X アカウント連携（preview/landing-01）

- **Xでログイン** — ログイン / 新規登録画面に「Xでログイン」を追加（Supabase Auth `provider: 'x'`）。メールログイン・ゲスト参加は維持
- **既存ユーザーのX連携** — 設定画面に「Xアカウント連携」（`linkIdentity`）。Manual linking は Dashboard で ON 必須
- **保存** — `user_x_profiles`（`x_user_id`, `x_username`, `x_display_name`, `x_avatar_url`, `x_connected_at`, `x_last_synced_at`）。OAuth token は保存しない
- **表示** — 公開FBカード / 開発者プロフィール / 作品作者に `@handle`。表示名・アイコンは X 初期値（Forge 未設定時のみ上書き seed）
- **042 migration** — ファイル作成済み。**Dashboard 適用は未実施**
- **手順** — `docs/x-auth-setup-runbook.md`
- **未実施** — main / 本番 deploy / Dashboard・X Developer 設定 / 042 適用

---

## 2026-07-06 — みんなのFB Phase 2 表示仕様修正（preview/landing-01）

- **個別カード** — `voice_supplement` に関連選択肢ピル（回答: …）を表示。service role API で `answer_label` を enrich（DB migration なし）
- **上段集計** — 回答1件から内訳・比率バーを常時表示（3件未満非表示を廃止）
- **バージョン** — 初期表示は最新 playable ver のみ。ver フィルタ（最新 / すべて / 各ver）+ カードに v0.x バッジ
- **UI** — 上段サマリ / 下段個別FB の区切り・文字階層・余白を軽く改善
- **未実施** — main / 本番 deploy / migration / テスト投稿 / 共感・通報

### 後続 TODO（Phase 2 完了時点・未着手）

**通報（Phase 4 想定）**

- 公開FBカードへの通報導線は後続実装（`PublicFeedbackCardView` の `data-feedback-card-actions` スロット）
- 初期は**登録ユーザーのみ**通報可能でよい
- `feedback_reports` + `POST /api/feedback/report` + opaque `card_id`（`resolve_feedback_card_id` は service role のみ）
- **自動非表示は初期では行わない**（通報 ≠ 即 hidden）
- Studio / 管理側で通報一覧・確認できるようにする
- オーナーによる hidden 導線も後続で検討

**共感** — 未着手（`empathy_count` は RPC 返却のみ。UI/DB 本実装は後続）

**UI メリハリ** — Phase 2 で軽く改善済み。さらなる typography / 余白 / 強調の磨き込みは後続

**RPC 正本** — `choice_answer_label` / `version_key` を `get_public_feedback_cards` 返却に含める migration 更新は、Dashboard 再適用 GO 後に API enrich を簡略化可能

---

## 2026-07-05 — みんなのFB 個別カード公開 Phase 2 UI（preview/landing-01）

- **送信前同意** — 初声/ゲスト初声/詳しい感想フォームに必須チェック追加（同意時刻・policy version は DB に保存しない）
- **optional_comment** — 選択式のひと言コメントを `answer_label` から分離して登録/ゲスト API 両方で書き込み
- **EveryonesVoiceSection v2** — 上段=選択式集計 + 回答数/公開FB件数、下段=`get_public_feedback_cards` 個別カード（初期3件・すべて見る）
- **旧文言差し替え** — 「個別の回答内容は公開されません」等を新方針（集計 + 文章FB公開）に更新
- **PublicFeedbackCardView** — ゲスト/登録の投稿者表示、将来の共感・通報用アクション領域のみ（本実装は Phase 4）
- **未実施** — main 反映 / 本番 deploy / 追加 migration / 共感・通報本実装

---

## 2026-07-05 — 041 Phase 1 DB 適用完了 + migration 正本 GRANT 同期（preview/landing-01）

- **本番 DB** — `041_public_feedback_cards.sql` Dashboard 適用済み（`bpnisgzxuwdxelhnduuf`）。post-check B（`feedback_reports` policy 0 行）・D（`resolve_feedback_card_id` は postgres / service_role のみ EXECUTE）確認済み
- **041 正本** — `resolve_feedback_card_id` に `REVOKE … FROM anon/authenticated` を明示（Dashboard 追加 REVOKE と同期）
- **未実施** — main / 本番 deploy / Phase 2 UI

---

## 2026-07-05 — みんなのFB 個別カード公開 Phase 0（原典・法務・041 草案）

- **原典** — `docs/forge-principles.md` §5 を v2 に更新。上段=選択式集計、下段=テキストカード（問い補足/短文・詳しい感想 4 項目）。opaque `card_id`、通報 API 経由、モデレーション非表示
- **法務 UI** — プライバシーポリシー第3条・利用規約第7条/第12条を個別カード公開・送信前同意・通報 API に整合（最終更新日 2026-07-05）
- **Phase 0 整理** — `docs/public-feedback-cards-phase0.md`（Phase 表、同意文言反映方針、本番 DB 共有前提、4 値 `target_source`）
- **041 草案** — `supabase/migrations/041_public_feedback_cards.sql`（`optional_comment` + backfill、moderation 列、`feedback_reports`、RPC `get_public_feedback_cards` / `resolve_feedback_card_id`、集計 RPC の answer_value 正規化）。**Dashboard 適用・UI/API 実装・main/deploy は未実施**

---

## 2026-07-05 — みんなのFB: 選択式集計の answer_value 正規化（preview/landing-01）

- **原因** — RPC `get_public_voice_aggregates` が `answer_value` + `answer_label` で GROUP BY するため、任意コメント付き回答が別行に分裂。公開 UI が `answer_label`（自由記述混在）をそのまま表示していた
- **修正** — `buildVoicePromptAggregates` で `answer_value` ベースにマージし、表示ラベルは prompt options / 既定選択肢から解決（DB migration なし）
- **UI** — 公開「みんなのFB」は積み上げバー + 凡例。「多かった反応: …」の長文表示を廃止。Studio は従来の横棒表示のまま

---

## 2026-07-05 — ゲスト FB Phase 1: UI + Studio 表示マージ（preview/landing-01）

- **作品詳細** — entry mode = guest でも FB 導線をログインモーダルで止めない。`GameDetailGuestVoiceLayer` + `GuestVoiceSection` / `GuestDeepFeedbackForm` で guest-voice / guest-feedback API へ送信。成功時「ゲストとして開発者に届けました」。ゲストプレイは DB 記録・プレイ人数加算なし
- **Studio** — 質問への回答・自由な意見に登録ユーザー + ゲストを時系列マージ。ゲスト行に「ゲスト」バッジ。helpful mark はゲスト行に非表示。Studio 件数のみ `fetchOwnerStudioVoiceResponseCount`（通知・ranking・growth 信号は登録者のみのまま）
- **みんなの FB** — 既存 RPC（ゲスト含む）で問い回答集計は反映。short_text 本文は公開しない
- **未反映** — main merge / 本番 deploy なし（Preview 確認待ち）

---

## 2026-07-05 — ゲスト FB Phase 1: migration 040 本番 DB 適用

- **040 適用** — Supabase Dashboard（`bpnisgzxuwdxelhnduuf`）に `040_project_guest_feedback.sql` 適用済み
- **追加** — `project_guest_voice_responses` / `project_guest_feedback` / `guest_feedback_rate_events`
- **RPC** — `get_public_voice_aggregates(text,text,boolean)` に更新。2 キー呼び出し後方互換（DEFAULT true）
- **確認** — 2 キー / `p_include_guest:false` RPC 200、anon direct INSERT は RLS 拒否、本番 guest-voice / guest-feedback API upsert 成功、みんなの FB 表示維持

---

## 2026-07-05 — ゲスト FB Phase 1: main deploy（040 後方互換コード・DB 未適用）

- **main 反映** — `825b267` → `4c5925a` fast-forward（`preview/landing-01` と同期済み）
- **本番 deploy** — `dpl_ALbDsanGACwafNZ7TYtJtcDpY953`（https://forge-flame-gamma.vercel.app）
- **040** — migration ファイルはリポジトリにあり。**本番 DB Dashboard 適用は別途**（Preview/Production 共通 Supabase `bpnisgzxuwdxelhnduuf`）
- **deploy 後確認** — LP / login / ゲストで参加 / 作品詳細 / みんなのFB / privacy 正常。040 未適用時 guest API はテーブル未作成で失敗（想定）

---

## 2026-07-05 — ゲスト FB Phase 1: migration 040 草案 + API 骨組み（DB 未適用）

- **DB** — `supabase/migrations/040_project_guest_feedback.sql` をリポジトリに追加（Preview / 本番とも **未適用**）。`project_guest_voice_responses` / `project_guest_feedback` / `guest_feedback_rate_events`。038/039・登録者テーブルは変更なし
- **公開集計** — `get_public_voice_aggregates(p_project_id, p_version_key, p_include_guest default true)` に刷新。`short_text` は登録・ゲストとも **件数のみ**（`answer_value` / `answer_label` は NULL）。選択式・再プレイ意向等のみバケット集計
- **API** — service role 経由のみ。`POST/DELETE /api/guest/submitter`（`forge_guest_submitter` cookie）、`POST /api/projects/[projectId]/guest-voice`、`POST …/guest-feedback`。validation・rate limit（IP ハッシュ + submitter_key）・エラーコード整備
- **submitter cookie** — 連投防止用 UUID。`user_id` と紐づけない。通常ログイン成功時に server action + 登録済みセッション検知で cookie 削除
- **プライバシーポリシー** — ゲスト FB・集計・cookie/IP ハッシュ・非統合を第3条に追記（Phase 1 本番反映前の前提文案）
- **次** — Preview DB へ 040 適用 → UI（ゲスト送信・Studio 閲覧）→ E2E 確認。本番反映は別途
- **後方互換（push 前）** — `fetchPublicVoiceAggregates` は `includeGuest:false` 時のみ `p_include_guest` を送信（旧 007 RPC と共存）。`buildVoicePromptAggregates` は 040 の count-only `short_text` 行を `totalResponses` に反映

---

## 2026-07-05 — entry mode / LP / ゲスト UX（本番反映）

- **範囲** — `c96b694` entry mode（Anonymous Auth 廃止）+ `a5e650a` LP 導線整理 + `a73cac3` ゲスト `/login` 挙動・登録限定導線
- **前提維持** — Allow anonymous sign-ins OFF、038/039 migration 安全ガード、ゲスト FB Phase 1 未実装
- **本番反映** — `preview/landing-01` → `main` fast-forward（`a73cac3`）。`vercel deploy --prod`（`forge-flame-gamma.vercel.app`、deploy `dpl_3Nxh8nzunF8GSD5ZfqVvfXkqKnym`）。`origin/main` と `origin/preview/landing-01` 同一
- **本番確認（HTML/静的）** — LP カード下「アカウントを作成する」0件、右上「新規登録」あり、「ゲームを探す」→ `/login?return=/home`、ログイン画面「ゲストで参加」・新規登録導線あり

---

## 2026-07-05 — ゲスト UX: ログイン画面表示と登録限定導線（Preview）

- **/login /register** — ゲスト entry mode でも画面を表示（ゲストを `/home` へ自動 redirect しない）。通常ログイン済みユーザーのみ従来どおり redirect
- **入口ゲート** — `/login` `/register` では表示しない
- **登録限定 UI クリック** — マイページ / コミュニティ / Studio / 通知 / 設定などは遷移せず、その場で「ログインが必要」モーダルを表示。モーダル内の「ログインする」だけ `/login` へ
- **URL 直打ち** — `/mypage` `/studio` 等は従来どおり `/login?notice=account-required` へ（ログイン画面は表示したまま案内）
- **ログイン成功** — entry mode をクリア（既存 `EntryModeAuthSync`）
- **あとで見る / 更新を追う / 保存** 等のボタンも `requireAuth` 経由で同様にモーダル案内

---

## 2026-07-05 — LP 導線整理（Preview）

- **LP カード** — プレイヤー/開発者カード下の「アカウントを作成する」を削除。新規登録は右上ヘッダーのみ
- **LP CTA** — 「ゲームを探す」「Studioに入る」はいずれも `/login?return=…` へ（プレイヤーは `/home`、Studio は `/studio`）。LP から入口ゲート/ゲスト選択は出さない
- **ログイン画面** — 「ゲストで続ける」を「ゲストで参加」に文言変更（ログイン画面内の新規登録導線は維持）
- **return URL** — ログイン後の return 先に `/home` を許可

---

## 2026-07-05 — ゲスト方針確定: entry mode（Anonymous Auth 廃止）

- **原典 v2 追補** — `docs/forge-principles.md` §3 を entry mode 方式に更新（Anonymous Auth 不使用・ゲストプレイ DB 非記録・ゲスト FB 方針・038/039 維持）
- **Supabase Anonymous Auth は使わない** — `signInAnonymously` を通常 UI から削除。既存匿名セッションは起動時に sign-out
- **entry mode** — `localStorage` で `guest` を保存。「ゲストで続ける」は Auth を呼ばず return 先へ
- **入口ゲート** — 未選択時に `/home` `/games/*` 等でクライアントオーバーレイ（OGP 用 middleware 全リダイレクトなし）
- **ゲストプレイ** — `project_plays` / `project_play_sessions` 非記録。外部リンクのみ。プレイ人数に含めない
- **038/039** — ロールバック不要。安全側ガードとして維持（Allow anonymous sign-ins は OFF）
- **Phase 1 待ち** — ゲスト FB のみ DB 保存（「ゲスト」名義・user_id なし）は別 migration/API 設計

---

## 2026-07-05 — RLS: 匿名ユーザーのプレイヤー系 write 遮断（migration 039）

- **`039_block_anonymous_player_writes.sql`** — voice_responses / feedback / plays / play_sessions / bookmarks / watches / supports / community apply・replies / platform_feedback / content_reports / disputes / notification既読 等の write を匿名 JWT から拒否
- **SECURITY DEFINER 補強** — `ensure_platform_default_prompt`・`anonymize_own_account_data` も匿名呼び出し拒否
- **SELECT は未変更** — Phase 1 で play/初回 FB 開放時に対象テーブルだけ匿名許可 migration を別途作成予定
- **適用** — 038 → 039。Allow anonymous sign-ins は **OFF 維持**（entry mode ゲストは Auth 非使用）

---

## 2026-07-05 — RLS: 匿名ユーザーの開発者系 write 遮断（migration 038）

- **`038_block_anonymous_developer_writes.sql`** — `auth_is_registered_user()` ヘルパー追加。projects / developer_profiles / devlogs / version_prompts / confirmation_requests / release_events / communities 等の INSERT/UPDATE/DELETE を匿名 JWT から拒否
- **プレイヤー系は未変更** — voice_responses / feedback / plays / bookmarks / watches 等は Phase 1 で別設計
- **適用** — Supabase Dashboard SQL（staging-first）。**Anonymous Sign-ins 有効化の前に適用**
- **コード変更なし** — migration ファイル追加のみ

---

## 2026-07-05 — ゲストログイン Phase 0（匿名セッション基盤）

- **ゲストで続ける** — `/login` に匿名ログイン（`signInAnonymously`）ボタンを追加。return URL ありなら復帰、なければ `/home`（`/studio/mypage` へは飛ばさない）
- **ゲスト判定** — `User.isAnonymous` / `useAuth().isGuest` / `isRegisteredUser`。`useRequireAuth` の `isLoggedIn` は通常アカウントのみ
- **開発者導線ブロック** — middleware + `RegisteredAccountGuard` + Studio ガードでゲストを `/studio` `/mypage` `/notifications` `/settings` `/submit` `/projects/...` 等から遮断
- **送客防止（原典準拠・次フェーズ向けメモ）** — Phase 1 でプレイ接続時はセッション作成→プレイ記録→外部リンクの順を実装予定。今回は未接続
- **Supabase Dashboard** — Anonymous Sign-ins の有効化が必要（未設定時はゲストボタンでエラー表示）
- **RLS / DB** — 変更なし（Phase 1 前の確認メモは実装レスポンス参照）

---

## 2026-07-05 — 原典 v2（用語体系・ゲスト方針）

- **`docs/forge-principles.md` 原典 v2** — 実装・Preview・オーナー判断を反映。古い原典への回帰ではなく、芯（完成前の場・非レビュー・学習ループ・送客防止）を維持
- **用語体系** — 概念層（声を届ける・初声）と UI 層（フィードバック）の併記。みんなの声＝公開集計の概念、UI では「みんなのフィードバック」等を許容
- **見届け人 / 更新を追う** — 称号と行動を分離。「見届ける」は比喩のみ
- **あとで見る** — 概念名は「あとで見る」。「あとで遊ぶ」「保存作品」は当面許容
- **作品単位応援** — 主導線外レガシー。ゲスト・通常アカウント新規拡張の対象外（`project_supports` 削除は別タスク）
- **ゲスト方針** — 匿名プレイヤーセッション。Phase 1: 記録付きプレイ + 初回フィードバック（最小限の反応＝初声）。Phase 2 候補: あとで見る・更新を追う
- **送客防止** — 未セッションのまま外部へ飛ばさない。ゲストでもセッション作成→プレイ記録→外部リンク
- **ドキュメント運用** — handoff / GPT サマリは節目のみ。changelog は通常タスクでも更新（§7・§8 整理）
- **コード変更なし** — 実装・画面文言・DB/認証/RLS は未変更（docs only）

---

## 2026-07-05 — 投稿成功・共有導線・レガシーStudio削除（本番反映）

- **投稿成功** — 成功画面、外部共有（X Web Intent）、作品情報編集への直接導線
- **公開作品ページ** — オーナー管理バー削除（プレイヤーと同じ見え方）
- **非公開共有** — 投稿成功・マイページ作品カードで disabled + 案内
- **旧編集UI廃止** — `SHOW_LEGACY_STUDIO_UI` / 旧モーダル削除。Studio インライン編集へ統一
- **プレイ情報編集** — Steam/itch/Discord 等を Studio「プレイ情報・公開先」パネルに統合
- **本番ガード** — `game-extra-storage` / local 通知の本番 no-op。旧 edit/submit URL は server redirect
- **本番反映** — `5308dbd` を `main` FF + `vercel deploy --prod`（`forge-flame-gamma.vercel.app`、deploy `dpl_BYLCKkWcyACxhGbA8ittNykP7n6E`）。`origin/main` と `origin/preview/landing-01` 同一

---

## 2026-07-05 — 本番ガード: localStorage 混入防止（game-extra / 通知）

- **game-extra-storage** — 本番モード（`shouldHideV0MockContent()`）では `mergeGameWithExtras` / `loadGameExtras` が no-op。実作品の `estimatedPlayTime` / `focusNotes` は DB 正本のみ
- **通知** — 本番では `addNotification` の local 追記を停止。`getNotifications` / 未読数は DB 通知のみ（共感操作後の幽霊通知なし）
- **旧編集URL** — `/projects/[id]/edit` と `/submit?edit=` はサーバー redirect のみ（現行UIの href からは参照しない）
- **Preview** — mock / V0 用 localStorage 上書きは Preview 専用のまま

---

## 2026-07-05 — レガシーStudio UI削除（SHOW_LEGACY_STUDIO_UI 廃止）

- **削除** — `SHOW_LEGACY_STUDIO_UI` ブロック、`StudioProjectToolbar`、`StudioNurtureRail`、`StudioImprovementLoop`、`ProjectDistributionLinksModal`（いずれも通常ルート未使用）
- **現行Studio** — `StudioTabContextPanel` + インライン編集パネルのみ。挙動変更なし
- **残したもの** — `ProjectReleaseStudioPanel`（`studio-release-detail-modal` で使用中）、`StudioPlayerFeedbackPanel`（現行 voices タブで使用中）
- **既知ギャップ** — 投稿後の Steam/itch 等の外部リンク編集は新Studioに未統合（旧モーダルも既に到達不能だった）。次タスク候補

---

## 2026-07-05 — プレイ情報編集へ関連リンク統合

- **Studio「プレイ情報・公開先を編集」** — `ExternalLinksFormFields` を統合。投稿済み作品でプレイURL・配布形式に加え、Steam / itch / Discord / X / 公式 / YouTube / GitHub を表示・編集・保存可能
- **公開ページ反映** — 保存後 `resolvePlayDestinations`（プレイ先）と `GameExternalLinks`（関連リンク）が更新データを参照
- **旧UI復活なし** — `ProjectDistributionLinksModal` は戻さず、新Studioパネルへフォーム部品のみ移植

---

## 2026-07-05 — 投稿成功後・共有導線の追加修正（Preview）

- **公開作品ページ** — オーナー向け管理バーを削除。オーナーでもプレイヤーと同じ見え方
- **旧編集モーダル廃止** — `?edit=project` は新Studioインライン編集（`?edit=basic-info` 等）へ差し替え。`ProjectEditModal` / `ProjectEditForm` 削除
- **非公開時の共有** — 投稿成功画面で「外部に共有する」を disabled + 案内文。マイページ作品カードでも非公開は共有不可
- **共有導線の置き場** — 投稿成功画面・マイページ作品カードが主。Studio編集パネル内は小さめ補助リンクのみ
- **X Web Intent** — 紹介文とURLは `text` パラメータのみ（URL重複なし）
- **編集UX** — 編集パネル開始時にスクロール先頭へ。入力後にバリデーション注意が残る問題を修正（投稿・Studio編集）

---

## 2026-07-04 — 投稿成功後の導線改善 / 所有者向け共有導線

- **投稿成功** — `/studio/submit` 成功後は Studio へ即リダイレクトせず「投稿しました！」画面を表示。主要導線: 作品ページを見る / 外部に共有する / 作品情報を編集する / もう1本投稿する
- **外部共有メニュー** — Xで投稿画面を開く（Web Intent・自動投稿なし）/ 紹介文とリンクをコピー / リンクだけコピー。コピー成功時は軽いフィードバック
- **所有者向け作品ページ** — 「Studioプレビュー中…」等の説明文をやめ、小さめの管理バー（公開中 / 外部に共有する / 作品情報を編集する / Studioで見る）に整理
- **対象外** — X OAuth/API、DB/RLS、通知、プレイ記録、フィードバック、OGP大規模改修は変更なし。共有URLはクライアントの `window.location.origin`（本番・Preview 各環境の作品URL）

---

## 2026-07-04 — 作品詳細の公開カタログ待ち（not-found / mock フラッシュ防止）

- **原因** — `/games/{id}` が `dataReady`（auth + オーナー catalog）だけで判定し、`publicCatalogReady`（`fetchPublicProjects`）完了前に not-found または mock 詳細へ進んでいた
- **修正** — 公開 Supabase UUID では `publicCatalogReady` まで「読み込み中...」。完了後も見つからない場合のみ `GameNotFoundPanel`。Body の `waitingForCatalog` も同様（Preview の mock 一瞬表示を防止）
- **堅牢化** — `getSubmittedGameById` の `publicGames` 参照は `publicCatalogReady` 後のみ。オーナー作品は `submittedGames` 優先のまま（Studio 非破壊）
- **対象外** — `/home`・`/search`・DB・RLS は変更なし
- **本番反映** — `d612ad7` を `main` に FF + `vercel deploy --prod`（`forge-flame-gamma.vercel.app`）。`origin/main` と `origin/preview/landing-01` 同一

---

## 2026-07-04 — 概要タブ「プレイ情報」の重複CTA削除

- **プレイ情報カード** — 大きい紫の「ブラウザで起動」ボタンを削除。想定時間・対応端末・遊び方の情報表示のみに戻す
- **主CTA** — 上部「プレイする」を維持
- **公開先** — 小さいリンク群（ブラウザで起動 / 公式サイトで開く）は維持。hotfix の `<a target="_blank">` + fire-and-forget `recordPlay` は変更なし
- **本番反映** — `96a0222` を `main` に FF + `vercel deploy --prod`（`forge-flame-gamma.vercel.app`）。`origin/main` と `origin/preview/landing-01` 同一
- **別件（未着手）** — 「あなたの関わり」プレイ回数が連打しても増えない件。`project_plays` upsert の2回目以降が UPDATE RLS 欠如で失敗し、`project_play_sessions` 追記まで届かない可能性。P0ブロッカーではない

---

## 2026-07-04 — OGP画像URL安全化（data URI フォールバック / デフォルトPNG）

- **og:image** — `data:` / `blob:` / 非 http(s) / 壊れた `https://host/data:image...` は使わず、デフォルトOGPへフォールバック（`resolveOgImageUrl`）
- **デフォルト画像** — `public/images/og-default.png`（Xカード互換のため PNG）
- **http(s) サムネ** — そのまま採用。同一オリジン相対パス（`/images/...`）は絶対URL化

---

## 2026-07-04 — 作品ページ Phase 1（OGP / あなたの関わり）

- **動的OGP** — `/games/{id}` で公開作品ごとに title・description・サムネ（なければデフォルト）・Twitter `summary_large_image` を出力。X に貼ったときの見栄え用
- **あなたの関わり** — 作品詳細右カラム。ログイン済みユーザー向けに、初回プレイ・版・回数・届けた声・更新追跡・最新版プレイ状況を表示（既存 play/voice/feedback/watch のみ。DB変更なし）
- **未ログイン** — 関わりカードは軽い案内のみ（強いログイン圧なし）
- **ハブカードは出さない** — プレイ / 声 / 開発ログは既存ヒーロー・ボタン・タブで足りるため、重複する「この作品のハブ」カードは削除
- **対象外** — ゲストFB/プレイ、X OAuth、規約改定、FB履歴タブ改修は含まない

---

## 2026-07-04 — 作品詳細「プレイする」が外部URLを開けない不具合（P0 hotfix）

- **症状** — 本番で `play_url` が入っている作品でも、詳細の「プレイする」／公開先の「ブラウザで起動」「公式サイトで開く」が無反応、または Forge 内 404 に見えることがあった
- **原因**
  - `recordPlay` を `await` してから `window.open` しており popup blocker で無反応
  - `play_url` と `official_url` が両方あると選択モーダル経由になり、主CTAが直接開かなかった
  - scheme なし URL を相対パス扱いすると同一オリジン遷移になり Forge 404 になり得る
- **修正**
  - `normalizeExternalUrl` で http(s) を保証（なければ `https://` 付与）
  - 主CTA・公開先・選択モーダルは `<a target="_blank" rel="noopener noreferrer">` 優先（ネイティブ新規タブ）
  - 主CTAは `projects.play_url` を最優先。プレイ記録はバックグラウンド（失敗してもタブは開く）
  - URL未設定時は disabled ＋「この作品はまだプレイURLが設定されていません」
- **公開準備中** — phase によるプレイ制限はなし（visibility=public なら一般ユーザーもログイン後にプレイ可）
- **DB書き込み不要** — 対象作品は既に `play_url` / `official_url` 登録済み
- **本番反映** — `preview/landing-01` → `main` fast-forward（hotfix `182791a` 含む）。Git push だけでは Vercel Production が更新されなかったため `vercel deploy --prod` で `forge-flame-gamma.vercel.app` に反映。`origin/main` と `origin/preview/landing-01` は `9f51c3b` で同一

---

## 2026-07-03 — ユーザー向け文言「テスター」→「プレイヤー」

- **投稿・編集フォーム** — 「プレイヤーのアクセス方法」等、配布・アクセス・完成度・対応環境の説明文を統一
- **表示ガード** — 内部 status/tag「テスター募集中」は従来どおり DB 保存。画面では `displayGameStatus` / `getUserFacingGameTags` 経由のみ（「テストプレイ受付中」等）。作品詳細・プレビュー・FB モーダルのタグ直出しも同ヘルパーに寄せた

---

## 2026-07-03 — スクリーンショット撮影用 `/demo/screenshot/*`（Studio 再差し替え）

- **Studio シーン** — 独自 fixture 画面を廃止。現行 `/studio` と同じ `StudioHomeView`（3グラフ・日/週/月切替・気になる動き・クイックアクセス・開発のヒント）を流用し、表示データのみ `screenshot-catalog` の fixture に差し替え

---

## 2026-07-03 — スクリーンショット撮影用 `/demo/screenshot/*`（Studio 追記）

- **Studio シーン** — 旧「あなたの作品」リスト（ad-screenshot 風）を廃止。fixture 専用の **Studio ホーム** に差し替え（見出し・気になる動き・作品カード・6段 micro rail・次のアクション）。代表作「星灯の旅路」は catalog と整合

---

## 2026-07-03 — スクリーンショット撮影用 `/demo/screenshot/*`（追記）

- **devlog タブ** — 固定 Preview（`VERCEL_ENV=production`）でも空にならないよう、fixture 専用パネルに差し替え（3件・声を受けた改善文面）
- **日付表示** — 代表作まわりを相対表現（3時間前 / 昨日 / 3日前 等）に統一

---

## 2026-07-03 — スクリーンショット撮影用 `/demo/screenshot/*`

- **追加** — X投稿・LP向けの固定 fixture 画面（Preview / localhost のみ。本番 hostname では `/demo/*` 404）
- **6シーン** — プレイヤーホーム、作品詳細（概要 / みんなの声 / 開発ログ）、マイページ・プレイ履歴、Studio・あなたの作品
- **データ** — `lib/demo/screenshot-catalog.ts`（代表作「星灯の旅路」を軸に世界観統一）。Supabase seed・API 書き込みなし
- **ハブ** — `/demo/screenshot` から各シーンへ。本番導線・サイドバーにはリンクなし
- **確認** — `npm run dev` → `http://localhost:3000/demo/screenshot`（撮影時はブラウザ幅 1280px+ 推奨）

---

- **Studio 用語統一（声・Devlog）** — 開発のヒント・はじめてガイド・育成ループ・プロフィール等のユーザー向け文言から「声」「Devlog」を排除（フィードバック / 開発ログに統一）
- **本番 deploy** — `preview/landing-01` を `main` に fast-forward（`3b90393`）。Studio ホーム（実データ3カード・日/週/月切替）、みんなのFB集計表示・文言統一、`tools/promo-artboards/`（本体ルート非接触）。migration 036/037 は Dashboard 適用済み前提。`PLAYER_VISIBLE=false` 維持。`origin/main` と `origin/preview/landing-01` を同一 commit に同期
- **みんなのフィードバック（文言）** — `/games/[id]` voices タブの「声」表現を「反応」「フィードバック」に統一。少数回答時の重複説明をカード内のみに整理
- **Studio ホーム UI（フッター下余白）** — 3カード共通のフッター行高を 7.75rem → 7.25rem に微調整。見出し・リスト位置は維持
- **Studio ホーム UI（v0テイスト）** — `/studio` メインコンテンツのみ。グラス感・グラデーション・アイコン付きクイックアクセス・リッチな3グラフカード。文言を「プレイの深さ」「フィードバックの深さ」「見届けの広がり」等に統一。shell / DB / RPC / hooks は変更なし
- **Studio ホーム表示修正** — グラフ数値は `/api/studio/home-metrics` のみ使用（サンプル/mock なし）。RPC 適用済みなら全月0でも API 系列を表示。低データ時はカード上部に現在値を大きく表示

---

- **Studio ホーム再整理** — `/studio` を作品一覧ではなく「公開作品全体のプレイヤーとのつながり」ダッシュボードに変更。主役は直近6か月の3グラフ（遊びの深さ・声の届き方・見届け・コミュニティ［見届けている人・コミュニティ参加者のみ］）。作品カード・今週の伸び・最近の動き・NBA 風ヒントを撤去。小さく「気になる動き」（未確認の声・コミュニティ返信）、クイックアクセス、静的「開発のヒント」を配置。見届けは `project_watches` ベース（`project_witness_grants` 未使用）。集計 RPC `get_studio_home_connection_metrics` を migration 036 で追加（**Dashboard 手動適用が必要**）。RLS 変更なし

---

- **X広告用 AIモック画像（ラフ）** — 静的 HTML アートボード方針を一旦停止し、`tools/promo-ai-images/` で AI ベース + SVG 後載せの 4 枚（ホーム / 詳細 / みんなのFB / コミュニティ）。1200×675 と 1600×900。本番 DB・seed・app ルート・deploy には非接触

---

- **広告用静的アートボード（本体と分離）** — `tools/promo-artboards/` に X 投稿用 4 画面（HTML/CSS、1200×675 PNG 書き出し可）。本番 DB・seed・app ルート・deploy には非接触

---

- **みんなのフィードバック（本番）** — `/games/[id]` の voices タブを production mode でも集計表示に。既存 RPC `get_public_voice_aggregates` + `EveryonesVoiceSection` を再利用。個別回答・自由記述本文は非公開（件数のみ）。回答3件未満は傾向非表示。DB migration なし

---

- **本番 deploy** — `preview/landing-01` を `main` に fast-forward（`48eb666`）。プライバシーポリシー A 項目（運営へのご意見・開発者共有範囲）、auth フッター整理、設定画面の法務導線、利用規約第3条表記統一を本番反映。`origin/main` と `origin/preview/landing-01` を同一 commit に同期

---

- **利用規約 第3条の表記統一** — 「その他当社が定める機能」を「その他運営者が定める機能」に修正（文書全体の「運営者」表記に揃え）。DB migration なし

---

- **プライバシーポリシー A 項目（X投稿前）** — `/privacy` に運営へのご意見（保存・運営メール通知）と開発者への共有範囲（FB内容は開発者が閲覧可、メール原則非提供、みんなのFBは集計中心、コミュニティの表示名等）を追記。auth フッターの未リンク「クッキーポリシー」「運営会社」を削除。`/settings`・`/studio/settings` 下部に規約・PP・お問い合わせ導線を追加。DB migration なし

---

- **本番 deploy（Batch 1）** — `preview/landing-01` を `main` に fast-forward（`ba48003`）。Studio 投稿/編集パネル、mock 漏れ防止、通知導線、コミュニティ guards 等 52 commit を本番反映。`PLAYER_VISIBLE=false` 維持。オーナー Preview スモーク + DB 汚染掃除後 GO

- **Studio / マイページ コミュニティの mock 漏れ防止** — `/studio/community`・`/mypage/community` でログイン済み実ユーザーに mock「しゃねこコミュニティ」を表示しない。本番同等 Preview では Supabase のみ参照し、mock id/name は表示・upsert しない。コミュニティ未作成時は「コミュニティを準備中です」空状態。DB migration なし

--- — タブ「フィードバック」を意図的に「フィード / バック」の2行表示に。傾向カードの空状態を「十分なフィードバックがありません」に短縮（不自然な1文字改行を回避）。DB migration なし

--- — `/studio` 上部は `project_voice_responses` がある作品のみ表示（0件時は空状態 + 作品一覧/新規投稿 CTA）。見出しを「確認したいプレイヤーの反応」に変更、「新しい回答」バッジを「未確認の回答」に変更。「届いたFBを見る」は回答あり時のみ `作品Studio` フィードバックへリンク。StudioShell の通知ベルは `/notifications` へ（実データの未読バッジ）。`/studio/notifications` 直アクセス時は通知ページへの案内を表示。DB migration なし

--- — 本番Previewで `/mypage/profile`・`/studio/profile` ログアウト直後に mock「しゃねこ」が一瞬出ないよう、hideV0Mock 時の user null fallback を廃止（loading 表示）。Studio 開発ログ右ペインを「公開ログの確認 + 問い設定」に文言整理（「編集」表記を廃止、本文は読み取り専用のまま）。DB migration なし

---

- **新規投稿時の初回開発ログ自動作成** — `/studio/submit` で作品投稿時に `初回公開`（v0.1）の開発ログを1件自動作成。本文は投稿時の作品紹介。`insertProjectDevlog` 直接（通知・adoption matcher・playable_version 二重更新なし）。投稿前プレビューの開発ログタブに初回公開予定を表示。既存作品バックフィルなし。DB migration なし

---

- **公開ページ 未設定サムネをForgeポスターに統一** — `/games/[id]` の実投稿でサムネ未設定時、`DEFAULT_HERO` ストック画像ではなく `GeneratedThumbnailPoster`（青いForgeポスター）を表示。Studioプレビュー・一覧カードと同型に揃えた。開発者アバターはサムネ未設定時にイニシャル表示。フィードバックモーダルのサマリーカードも同様。DB migration なし

---

- **Studio キャッチコピー表記・タイトル40文字制限** — ユーザー向け「1行説明」を「キャッチコピー」に改称（ラベル・ヒント・バリデーション・右パネル要約）。タイトルを最大40文字に制限（共有フィールド・カウンター・保存時バリデーション）。ヒーロー・カードのタイトル表示は `line-clamp-2` で縦伸びを防止。DB migration なし

---

- **Studio 1行説明・仮サムネ安定化（追修正）** — 編集画面の1行説明を共有コンポーネントで確実に60文字制限（読込時クランプ・貼り付け・IME後クランプ）。未設定サムネの背景・柄・色は `projectId` 固定 seed にし、タイトル入力中にチカチカ切り替わらないよう修正。DB migration なし

---

- **Studio 1行説明 60文字制限** — 新規投稿・編集の1行説明を最大60文字に制限（`maxLength`・カウンター・保存時バリデーション）。左プレビューのヒーロー表示は `line-clamp-2` で縦伸びを防止。DB migration なし

---

- **Studio パネルUX改善（戻る・操作感・1行説明・編集プレビュー）** — 右パネル内の戻る導線をバー型にし「〜に戻る」表記に統一。右Studioパネルにオレンジアクセントで操作エリア感を追加。新規投稿で1行説明と作品紹介を分離（作品紹介からの自動生成を廃止）。編集画面でも保存前の入力が左プレビューにリアルタイム反映（DB保存は従来どおり「保存」時のみ）。DB migration なし

---

- **Studio Aバッチ（UI崩れ・戻る導線・仮サムネ）** — 投稿・編集のページ戻るを「← マイページ」`/studio/mypage` に統一。長文・URLの折り返し（ヒーロー・概要・右パネル要約）。投稿の画像/公開設定編集で右パネル幅が崩れる問題を修正。Studio左プレビューの未設定サムネを `GeneratedThumbnailPoster` に統一（編集パネルと同型）。DB 変更なし

---

- **Studio 新規投稿 必須案内・バリデーション誘導** — `/studio/submit` の Studioパネルに必須/任意バッジと項目ヒントを表示（タイトル・ジャンル・作品紹介・開発フェーズ・配布形式・プレイURL がどの編集パネルか明示）。「投稿する」バリデーション失敗時は該当編集パネルを自動で開き、エラー文にセクション名を含める（例：「プレイ情報・公開先」を確認してください）。DB 変更なし

---

- **コミュニティ hub 骨格先出し** — `community-hub-page` の `supabaseHub.loaded` 全文ゲートを廃止。タイトル・タブは先表示、プロフィール・投稿・メンバーは skeleton。本番 loading 中の mock（shaneco）フォールバックを廃止。DB 変更なし

---

- **ログイン P0（return・自動遷移）** — ログイン済みで `/login` を開いたとき、return があればそこへ・なければ `/studio/mypage` へ自動遷移（手動「続ける」廃止）。Studio・通知・ブックマーク等のクライアント側 login redirect に `?return=` を付与。return なしログイン成功後のデフォルト先を `/studio/mypage` に変更。`/bookmarks`・`/notifications` を return ホワイトリストに追加。Preview bypass は未変更。DB 変更なし

---

- **Studio 編集 P0.5（保存軽量化・基本情報反映）** — `updateProjectDetails` の保存完了を DB + provider upsert までに限定し、プロフィール再取得・catalog reload はバックグラウンド化。DB成功後の upsert では `title` / `description` / `phase` を保存payloadで明示反映。dev のみ DB/payload ズレを `console.warn`。DB 変更なし

---

- **Studio 編集 P0（保存反映・F5）** — `submittedGames` を upsert 化し保存直後に provider state へ確実反映。Studio 編集は `getOwnedProjectById`（public フォールバックなし）を正本に。owner ガードを loading / owner / notOwner の三値化し判定完了前の `/games/{id}` 誤リダイレクトを防止。DB 変更なし

---

- **Studio 編集画面復旧** — 保存後の左プレビュー未反映と F5 時の `/games/{id}` 誤リダイレクトを修正。`getSubmittedGameById` の catalog 読込前フォールバックを止め、保存時に `submittedGames` / `publicGames` を同期。`GameDetailPlayerPreview` を Phase 1 前に戻し draft は `StudioSubmitPlayerPreview` に分離。DB 変更なし

---

- **Studio 新規投稿 Phase 1 修正** — Studio編集画面の左プレビュー回帰を修正（`GameDetailPlayerPreview` の projectId モードを Phase 1 以前の実装に分離）。`/studio/submit` 初期表示からランダム画像・PC/外部サイトの初期選択を除去し、未入力はプレースホルダーのみ表示（保存値には混ぜない）。DB 変更なし

---

- **Studio 新規投稿 Phase 1** — `/studio/submit` を新設（左プレビュー + 右Studioパネル）。投稿後は `/projects/{id}/studio` へ遷移。`/submit` と `?submit=1` は新ページへリダイレクト。プレイヤーへの問い（任意）はモーダルで設定可能。DB 変更なし

---

- **Studio 概要タブ右ペイン密度調整** — 編集ブロックを「ページの内容」「遊び方・公開」の2グループに整理。各ブロックの HintList を廃止し縦長さを軽減。共有導線は枠なしの軽いボタン列に。DB 変更なし

---

- **Studio 右ペイン文言トーン統一** — 「編集パネル」を「Studioパネル」に。タブ見出しを「開発ログを更新」「フィードバックを見る」に揃え、フィードバックブロック見出しの重複を解消。概要編集の戻るリンクを「← 概要」に。DB 変更なし

---

- **Studio 開発ログタブ右ペイン整理** — 3ブロック構成（新verの開発ログを書く / 現在の開発ログを編集 / 正式版について）。「最新の開発ログ」単独プレビューを廃止し二重表示を解消。質問事項は「現在の開発ログを編集」内に「質問設定を開く」→ モーダル（VersionPromptStudioModal）。正式版は軽い入口＋詳細モーダル。DB 変更なし

---

- **Studio 質問への回答（右ペイン入口化）** — 右ペインから個票一覧・集計タブを廃止し「質問への回答 / 自由な意見」の2分類に。質問回答はサマリー＋「回答を詳しく見る」モーダル（質問ごと集計バー or 自由記述一覧）。DB 変更なし

---

- **Studio フィードバックの傾向表現** — 右ペイン「次に直すこと」を「フィードバックの傾向」に変更。断定表現（直す・取り組む・優先候補）を廃止。自由な意見タブの空状態文言を調整。DB 変更なし
  - **後続TODO（プレイヤー自由な意見導線）**: Studio「自由な意見」は `project_feedback` を表示する。現行 `/games/[id]` では `GameDeepFeedbackForm` が `showDeepFeedback={false}` により到達不能。Studio 大改修後にプレイヤー側の任意フィードバック導線を復活させる必要がある。想定方針: 質問への回答完了後に「自由に伝えたいことを書く（任意）」の任意ステップ。DB 変更は不要そうだが `/games/[id]` 側の導線設計が必要

---

- **Studio フィードバック分類名変更** — 右ペインタブを「質問への回答 / 自由な意見 / 集計」に変更（旧 かんたんFB / 詳しいFB）。DB 変更なし

---

- **Studio フィードバックタブ右ペイン統合** — 「新しいFBを確認する」「届いたFBを読む」の重複導線を削除し、届いたフィードバック1ブロックに統合。タブ表示時に markRead。DB 変更なし

---

- **Studio Phase B3-1 開発ログ導線修正** — 開発ログタブ右ペインを「新verの開発ログを書く」「現在の開発ログを編集」の2導線に整理。質問事項編集を後者内に統合（本文表示 + VersionPromptEditor）。DB 変更なし

---

- **Studio Phase B3-1 追加修正** — 「従来の編集画面」導線を全削除。概要タブ右ペインを「基本情報」「ジャンル・タグ」「画像」「作品紹介」「プレイ情報」「公開設定」に分割し右ペイン内で保存。開発ログタブからテストプレイ削除、「現在の開発ログを編集」「質問事項を編集」導線追加。正式版カードの「開発中」バッジ削除。FBセグメント改行修正。DB 変更なし

---

- **Studio Phase B3-1** — 概要タブ右ペインで「作品情報」「作品紹介」「プレイ情報・公開先」をブロック単位の右ペイン内フォーム化。DB 変更なし

---

- **Studio Phase B3 Preview 2.4** — 右編集パネルの見出し・アクセント・セグメントを強化し主操作感を向上。Studio内プレビューの左タブのみ控えめ化（/games/[id] 無変更）。DB 変更なし

---

- **Studio Phase B3 Preview 2.3** — 2.2 の全高インスペクター/黒壁を撤回し 2.1 系の軽い rounded パネル + 内側カードに戻す。header 横線の左限定・右主導セグメント・左右同期は維持。DB 変更なし

---

- **Studio Phase B3 Preview 2.2** — 右ペインを固定インスペクター化（左カラムのみ header border、flex 分割、全高 bg + border-l）。内側カードを操作行メニューに弱体化。DB 変更なし

---

- **Studio Phase B3 Preview 2.1** — 右ペインを単一パネル面（`rounded-2xl` + `bg-zinc-900/55` + 全周 border）に変更。左との `gap-8` で境界干渉を解消。内側カードはネスト調整。DB 変更なし

---

- **Studio Phase B3 Preview 2** — 右ペイン上部に「編集する場所」セグメント（概要/開発ログ/フィードバック）を追加し主導線化。`activeSection` を左右で共有同期。右ペインに背景差・左境界・sticky。作品紹介の右パネル内編集は維持。DB 変更なし

---

- **Studio Phase B3 Preview** — 概要タブ右パネルで「作品紹介を編集」のみ右パネル内編集（`StudioOverviewIntroductionEditPanel`）。既存 `updateProjectOverview` / `GameDetailOverviewV0Tab` 再利用。保存後は games state 更新で左プレビューへ即反映。他項目は既存モーダルのまま。DB 変更なし

---

- **Studio Phase B2.7（タブ連動右パネル Preview）** — 左プレビューのタブ状態に応じて右側を切り替え（`StudioTabContextPanel`）。概要＝公開ページ編集、開発ログ＝ログ・更新・正式版、FB＝確認・次に直すこと。既存モーダル/パネル再利用。左に編集ボタン追加なし。DB 変更なし

---

- **Studio Phase B2.5** — 上部ヘッダー軽量化（作品名削除・Studio編集+版表示）。左メイン見出しを「公開ページの見え方」に。テストプレイを右Rail「今日やること」へ移動、左はプレイヤーCTA見た目のみ。Rail見出しを今日やること/編集する/公開・共有/正式版に再編。DB 変更なし

---

- **Studio Phase B2** — `StudioNurtureRail` 新設。公開ページプレビュー（左）+ 育成・運用 Rail（右）の2カラム化。既存モーダル・FB/優先度/正式ver を Rail へ再配置。旧 Toolbar / ImprovementLoop / ReleasePanel は `SHOW_LEGACY_STUDIO_UI` で非表示（ロールバック可）。DB 変更なし

---

- **Studio Phase B1** — `/projects/[id]/studio` にプレイヤー詳細同型の読み取り専用プレビュー（`GameDetailPlayerPreview`）を追加。ヒーロー・CTA・タブ・概要2カラムを Studio 内で確認可能。既存 Studio 機能は維持。DB 変更なし

---

- **プレイヤー作品詳細（Phase A）** — プレイ情報カードから開発フェーズ説明文を削除（フェーズはヒーローバッジのみ）。想定時間 / 対応端末 / 遊び方に限定。DB 変更なし

---

- **プレイヤー作品詳細（Phase A ノイズ削減）** — ページ右サイドバー「関連タグ」削除。概要「最近の動き」内の「更新を追う」削除（ヒーローCTAに集約）。「公開先」を非リンクチップのみに簡素化。更新追跡時の長い緑バナー削除（ボタン状態変化のみ）。DB 変更なし

---

- **プレイヤー作品詳細（Phase A 最終調整）** — 右カラム「関連タグ」削除（将来「類似の作品」配置候補をコメントで残す）。「いまの状況」→「最近の動き」（表示専用サマリー）。「外部リンク」→「公開先」（情報表示のみ・プレイ導線はヒーローCTA）。複数公開先時は「プレイする」で選択モーダル。プレイ情報を想定時間/対応端末/遊び方に再分類（ブラウザは遊び方側）。DB 変更なし

---

- **プレイヤー作品詳細（Phase A 仕上げ）** — 概要タブの重複削減（フェーズバッジはヒーローのみ、最終更新はヒーローのみ、概要内タグ削除）。右カラム見出しを「プレイ情報」に、対応環境は PC/スマホ/ブラウザ全表示＋該当強調、プレイ方法を分離表示。「いまの状況」を短いサマリー＋更新を追うのみに。作品紹介は line-clamp-4 + もっと見る。ヒーロー画像は object-contain。DB 変更なし

---

- **プレイヤー作品詳細（概要タブ 2カラム清書）** — 概要タブを全幅2カラム化（左：作品紹介・開発状況 / 右：遊ぶ前情報・外部リンク・特徴）。紹介文は長文優先・なければ1行説明を表示。開発状況カードのオレンジ強調を抑え、プレイヤー向け文言から「声」表現を排除。DB 変更なし

---

- **プレイヤー作品詳細（概要タブ清書）** — 管理項目の縦積みをやめ、3カード構成（作品紹介 / 遊ぶ前に知っておくこと / いまの開発状況）に再設計。ヒーローと重複する1行説明は非表示、メタはチップ表示、外部リンクは開発状況カード末尾に小型配置。DB 変更なし

---

- **プレイヤー作品詳細（Phase A 手直し）** — 上部をプレイ判断に絞り、詳細は概要タブへ集約。「この作品の状況」大カード削除。ヒーローはフェーズ小バッジ＋最終更新のみ。CTA をヒーロー直後に配置。関連リンク・プレイ時間・対応環境・開発ログ/声の導線は概要タブへ。オーナープレビューは細い Studio 帯に縮小。DB 変更なし

---

- **プレイヤー作品詳細（Phase A）** — `/games/[id]` の情報配置を整理。ヒーロー右に開発フェーズ・想定プレイ時間・対応環境（`getPlayEnvironmentLabels` — ジャンルタグとは分離）を追加。ヒーロー直下に「この作品の状況」ブロック（フェーズ・最新更新・開発ログ・プレイヤーの声・いま見てほしいところ）。概要タブに「どんなゲーム？」「いま見てほしいところ」、開発フェーズ説明、プレイ情報を追加。開発ログ・みんなのFB の空状態文言を改善。DB 変更なし

---

- **Studio ホーム「あなたの作品」** — セクション見出し横の「新着あり · 作品 Studio を開く」CTA を削除（カード内導線と重複のため）

---

- **Studio ホーム「あなたの作品」** — 見出しを「プレイヤーから新たな反応があった作品」、説明を「新たなフィードバックが届きました」に変更。カード右の「削除」を「届いたFBを見る」ボタンに差し替え（遷移先は未配線）。メタ行の「サイクル N」を非表示。同一作品は1行のままバッジ件数で表現 — `useActionState` 経由では server `redirect()` が効かず、ログイン成功後も `/login` に残る不具合を修正。`loginAction` は `redirectTo` を返し、フォーム送信成功時のみ `window.location.assign` で return 先へ遷移。「続ける →」は `<a href>` でフル遷移

---

- **P0 hotfix — ログイン直後の即ログアウト（本番）** — `AuthProvider` が null session イベントで `user` を消していたのと、`StudioDirectAccessGuard` が本番で client `user=null` だけを根拠に `/login` へ戻していたのを修正

---

- **P0 hotfix — Studio 認証ループ（本番）** — `/login` のサーバー `getUser()` 即時 redirect を廃止。ログアウト後にサーバーだけログイン済みと誤認し `/studio` と `/login?return=/studio` を往復する不具合を修正

---

- **サービスイン前 Ready チェック Batch 1** — `docs/forge-production-readiness-checklist.md` を新設（固定 Preview URL・deploy 停止条件・migration/env・rollback）。`/home` は公開環境で mock 配列を merge しない経路に整理。`/games/[id]` は deployment context 経由の mock 判定に統一し、公開環境で playUrl のない実作品にプレイ用スタブモーダルが出ないよう抑止

---

- **Phase 3 PR1 — `/studio` home viewModel** — `buildStudioHomeViewModel` で通知バッジと下部セクション（最近の動き・今週の伸び・開発ヒント）の表示分岐をデータ層へ移動。`studio-home-page.tsx` から mock 直接 import と `hideV0Mock` 分岐を削減。見た目・セクション順は維持。「あなたの作品」は現状のまま

---

- **Coming Soon 表記統一** — 「追って機能追加予定」「準備中です」等の未提供機能表現をユーザー画面で `Coming Soon`（大文字・スペースあり）に統一。`FeatureComingSoonPanel`・OAuth・Forge SDK・各種空状態パネルを含む

---

- **UI文言整理（実装用語の除去）** — ユーザー向け画面から `preview mock`・`本番では`・Supabase / migration 露出を除去。OAuth・Forge SDK・サムネ AI の Coming soon 表記は維持。確認用画面は「確認用データ」「端末内の一時保存」等の自然な表現に。設定フッターの生 URL を「Player / Studio の設定」ラベルに変更

---

- **Studio 認証リダイレクトループ修正** — `/studio` と `/login?return=/studio` の往復を解消。サーバー `initialUser` をクライアント `getSession()` の一時空で上書きしないよう `getUser()` + `authResolved` で初回確認。`StudioDirectAccessGuard` は認証未確定間は login へ飛ばさない

---

- **公開カタログ分離（/home・検索）** — `publicGames` / `publicCatalogReady` を追加し、`visibility='public'` の作品だけをマウント時に取得（`fetchPublicProjects`）。`/home` と `/search` は auth / `dataReady` を待たず公開カタログのみで表示。`submittedGames` は Studio・マイページ等のログイン依存画面向けに維持。応援数・devlog・通知等は初期表示をブロックしない

---

- **ゲーム詳細 devlog 0件クラッシュ修正** — 実作品で開発ログが0件のとき `getDevlogStatsForGame([])` が `undefined.version` で落ちる不具合を修正。0件時は `currentVersion` / `lastUpdated` を `—`、fake ver 表示なし

---

- **ゲーム詳細 hotfix（shell / devlog / home）** — `/games/[id]` のタブ切替で親レイアウト幅が変わらないよう右サイドバーを全タブで固定（`activeTab !== "voices"` 分岐を削除）。実 UUID 作品の devlog は Supabase のみ正本（localStorage extras・mock fallback 不混入）。**devlog タブ初回マウント時** — 実作品では `useSyncExternalStore`（localStorage extras）を購読せず real/mock フック分離し、hydration クラッシュを防止。`devlogsReady` まで loading・0 件は empty。`realDevlogToV0` を null-safe、相対日時は SSR 安定の固定日付表示。実 UUID は `dataReady` 前に mock hero を出さない。`/home` は `dataReady` 前に空メッセージを出さず loading。Studio 作品 Studio（`/projects/{id}/studio`）とマイページ Directory に **公開ページを見る** → `/games/{id}`（同一 shell・owner preview 分岐）

---

---

- **通知・ログイン導線** — 通知とマイページ更新の死んだ hash（`#game-project-history` 等）を **`?tab=devlog`** に統一。ログイン後 return URL を `/games`・`/submit`・`/studio`・`/projects/{id}/studio`・`/my-projects` に限定拡張（open redirect 対策付き verify 追加）。本番で mock 通知 localStorage / `getGameById` mock フォールバックを抑制

---

- **Studio / ログイン** — 本番で Studio ボタンが無反応になる・ログイン後 Studio に戻れない問題を修正（未ログインは `/login?return=/studio` の Link、hydrate 前も同導線）。ログインフォームに autofill 用 readOnly 解除を復帰

---

- **Studio 遷移の点滅** — 本番の主因は **hydrate 前にログイン済みでも Studio がログインリンクになる**件の修正（ログイン済みは Link 直遷移）。`router.push` の同一パス再遷移・オンボーディングモーダルの再表示を抑制。作品一覧は読み込み中スケルトンで async 読み込みのチラつきを防止（本番では mock グリッドは出ない。Preview で実作品ありの旧挙動向けに mock→実の一瞬切り替えも潰した）

---

- **Studio 点滅（追補）** — スケルトンの `animate-pulse` を廃止（点滅に見えていた）。`catalogReady` をユーザー切替時以外リセットしない（Studio 再入場で空→表示のチラつき防止）。Studio ホームの mock 表示判定を deployment context に統一（SSR/CSR 不一致で Preview mock が一瞬出る問題）。`StudioDirectAccessGuard` を `/studio` layout に移動

---

- **Player ホーム `/home` の空表示** — `mergeHomeCards` が `shouldHideV0MockContent()` を client 直呼びしており Preview でも本番扱いになることがあった。`useHideV0MockContent()`（deployment context）経由に修正。本番 URL では mock は出ず実公開作品のみ（未投稿なら空が正しい）

---

- **Studio マイページ Phase 1（data-layer）** — `/studio/mypage` の `StudioProjectsTabPanel` ↔ `DirectoryPanel` UI 差し替えを廃止。`GamesProvider.getStudioMypageOwnedProjects` が本番は実データのみ・Preview/local はデータ層で mock 注入。作品タブ UI は Directory のみ

---

- **data-layer Phase 2 — ad demo 隔離（`4282b4a` + `0d500d0` + `44013bd`）** — **状態: ログイン済み Preview 確認待ち**（本番 deploy 禁止。Phase 3 未着手）
  - **`4282b4a` 本体** — `/studio`・`/studio/mypage`・`/mypage` から `isAdScreenshotDemoEnabled` / env 分岐を除去。fixture は **`/demo/ad-screenshot`** 配下に集約。`NEXT_PUBLIC_FORGE_AD_SCREENSHOT_DEMO` は不要
  - **`0d500d0` Preview 確認ブロッカー** — `/demo` の legacy middleware リダイレクト（`/home`）を削除。未ログイン時 `catalogReady` が false のまま Studio が読み込み中で止まる問題を修正
  - **`44013bd` demo route 許可** — `VERCEL_ENV=preview`・preview ブランチ alias・local で `/demo/ad-screenshot` を許可（`NEXT_PUBLIC_FORGE_PRODUCTION_MODE` が Preview に付いていても fixture 可）。本番は `VERCEL_ENV=production` で 404
  - **撮影候補 URL（Preview / local）** — `/demo/ad-screenshot`、`/demo/ad-screenshot/studio`、`/demo/ad-screenshot/studio-mypage`、`/demo/ad-screenshot/mypage?tab=feedback` 等（インデックスに一覧）
  - **本体** — `/studio`・`/studio/mypage` は実データ / Preview mock（0 件時）のみ。ad demo 用 UI 差し替えなし
  - **オーナー Preview 確認（ログイン済み）** — (1) `/studio` が読み込み中で止まらない (2) `/studio/mypage` 同 (3) `/mypage` に ad demo 由来の特殊タブ・mock が出ない (4) `/home`・実作品詳細の表示崩れなし

---

- **広告スクショ用デモ（旧・廃止）** — ~~`NEXT_PUBLIC_FORGE_AD_SCREENSHOT_DEMO=true` のとき Studio ホーム・マイページ・Player マイページ一部タブに厚い mock を強制表示~~ → data-layer Phase 2（`4282b4a` 他）で `/demo/ad-screenshot` に移行

---

- **作品 Studio** — 育成エリアの **届いたFBを読む** ボタン・リンクの重複を整理。FB一覧が同じ画面に出ているときは上部の案内文だけにし、動かない「下の〜から確認」リンクと **FBを見る →** を削除

---

- **作品詳細** — 開発ログタブが開かないことがあった不具合を修正。タブ状態を URL（`?tab=devlog`）と同期し、通知・リンクからの遷移とタブクリックの両方で確実に切り替わるように変更。ヒーロー内の **Devlog** 表示もタップで開発ログタブへ移動

---

- **ログイン** — パスワード自動入力が再発しやすかった問題を、**サーバーアクション + ネイティブ HTML フォーム**に変更して恒久対応。`Suspense` によるフォーム再マウントを廃止

---

- **作品投稿** — 本番 DB に新しい列（複数ジャンル・複数サムネ等）が未適用でも投稿できるよう **スキーマ差分フォールバック** を追加。サムネはアップロード時にリサイズ・圧縮して保存サイズを抑制

---

- **作品投稿・サムネイル** — 新規投稿を **Studio マイページ上のモーダル** に統一（作品編集と同様）。`/submit` は Studio へリダイレクト。サムネイルは **2枚以上あるときドラッグで並べ替え** 可能（1枚目が一覧用）

---

- **作品投稿** — 投稿成功後に開発者プロフィール全件を再取得して失敗していた不具合を修正。自動作成する開発者プロフィールに自己紹介の既定値を入れ、エラー内容が分かるよう改善

---

- **Forge SDK** — 投稿・作品編集などの SDK 案内を **Coming soon** 表示に変更。「Forge SDK」ラベル付きで、SDK 未リリースであることが分かる文言に整理

---

- **プレイヤーへの問い** — 問い設定モーダルの主ボタンを **閉じる → 保存** に変更（キャンセルとの対比を明確化）

---

- **開発者名** — 初回作品投稿時の「開発者名」入力を廃止。公開名は **Studioプロフィール**（`/studio/profile`）だけで設定・変更。投稿時は登録名またはプロフィールの表示名を自動使用。名前変更時は既存作品の表示名も追随

---

- **Player / Studio モバイルメニュー** — ドロワー下部の **運営へのご意見** と **ログアウト** が重なるレイアウトを修正。ナビはスクロール、ご意見・ログアウトは下部固定フッターにまとめて縦に並べる

---

- **ログイン** — Chrome のパスワード自動入力が再び効かない問題を修正。controlled input + readOnly 解除の競合をやめ、ログインフォームを **uncontrolled**（送信時に FormData 取得）に変更

---

- **Player / Studio シェル** — `lg` 未満はサイドバーを **ハンバーガーメニュー＋ドロワー** に変更（PC は従来どおり常時表示）。**Player ↔ Studio** 切り替えは全画面幅で表示し、ドロワー上部にも配置

---

- **Studio** — 育成ブロックに **作品のリンクをコピー**（？ヒント付き）を追加。Forge外へのURL配布であることが分かるよう、モーダルで作品ページURLをコピー

---

- **Studio（Preview 試作）** — 操作バーの順序を **作品の設定 → 育成** に変更。育成ブロックをオレンジ系で強調（主CTAは新verの開発ログ）。初期の **作品ページURLコピー** は状態ストリップ内の控えめなリンクに格下げ

---

- **Studio（Preview 試作）** — 操作バーを **育成**（新verの開発ログ・届いたFB）と **作品の設定**（作品情報・配布・リンク）の2ブロックに分割。開発ログは他と同様 **モーダル** で開く（`/projects/{id}/studio?devlog=1` でも可）
- **新verの開発ログ** — 「プレイヤーへの問い」専用ボタンを廃止。問いは開発ログ内で編集（前verの問いを初期表示）。チェックボックスの代わりに **いまの ver の問いだけ更新** / **新verを公開して開発ログを投稿** の2ボタン

---

- **Studio（Preview 試作）** — 5段ステッパーと「現在の工程」大パネルを廃止。操作は **道具バー**（開発ログ・FB・問い・作品情報・配布）に統一。おすすめは1行＋状況に応じた Primary のみ

---

- **Studio** — 上部の **問いを設定** を廃止。プレイヤーへの問いは **開発ログを書く**（`/projects/{id}/devlog/new`）に集約

---

- **投稿・編集** — サムネイル登録上限を **30枚 → 10枚** に変更

---

- **Studio** — 作品育成ページ上部に常時 **開発ログを書く**（Primary）。折りたたみ「作品の設定」にも同リンクを追加
- **投稿完了** — 「次にやること」の順序を育成ページ・開発ログ優先に整理

---

- **投稿・編集** — サムネイル **最大10枚** まで登録可能。1枚目は一覧用、2枚目以降は作品詳細で **5秒ごとに自動切り替え**
- **DB** — `thumbnail_urls` 列を追加（migration **035**）。既存 `thumbnail_url` は先頭1枚と同期

---

- **共有** — 作品紹介・公開・開発フェーズ・想定プレイ時間・アクセス方法（対応環境＋配布形式＋プレイURL）・関連リンクの文言と入力 UI を共通化
- **投稿** — 対応環境（PC/スマホ/ブラウザ）チェックを追加（編集と同型）
- **Studio** — **配布・リンク**モーダルにプレイ URL を追加。作品情報モーダルに **開発フェーズ**・**想定プレイ時間**を追加
- **DB** — `estimated_play_time` 列を追加（migration **034**）。localStorage より DB を正本に

---

- **DB** — `projects.genres`（`text[]`）を追加。migration **033**（既存 `genre` は `RPG・ホラー` 形式の表示用に同期）
- **投稿・編集** — ジャンル **最大3つ**・特徴タグ **最大5つ**（チェックボックス複数選択）
- **検索・一覧** — `genres` 配列を参照。`genre` 列は後方互換の表示ラベル

---

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

