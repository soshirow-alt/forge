■ 現在の状態
- 01 `/landing` preview — commit **a47dcdd** push 済み（ブランチ `preview/landing-01`）
- オーナー指摘「縦が狭い・下が空く」に対応 — **desktop で 1 viewport に収める**レイアウトへ変更
- `/` は現行発見ホームのまま / **prod deploy 禁止** — 維持
- DB migration 変更なし

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- 01 LP は **発見前の入口**。縦を画面いっぱい使い、初見で hero・2 CTA・注目作品まで一望できると「育てる場所」の全体像が伝わる

■ 今回実装したこと
- `components/landing-page.tsx` — **100dvh 1画面レイアウト**（lg 以上）
- ルート: `lg:h-dvh lg:max-h-dvh lg:overflow-hidden` + `grid-rows-[1.08fr / 0.38fr / auto / auto]`
- ヒーロー: `flex-1 min-h-0` — 背景・ヘッダー・H1・左コピー/3価値/右2CTA を主領域に拡大
- 3価値リスト: `flex-1 justify-between` — CTA カードの上下に揃える（前回の意図を維持しつつ縦を使う）
- CTA カード: 固定 `min-h-[248px]` 廃止 → `h-full` + 内部 `clamp(vh)` padding/文字
- 注目5列: サムネを `flex-1` 可変高 — grid 行の残り高さを占有
- タイポ・余白: 全体 `clamp(..., vh, ...)` で viewport 高に比例
- **削除**: ページ最下部 `flex-1 min-h-[10vh]` spacer（上に内容が押し上げられ下が空いていた原因）
- build OK / preview push 済み

■ ユーザー目線の変化
- 変更前: コンテンツが画面上部に固まり、下 30〜40% が黒い余白。縦が「狭い」印象
- 変更後: 1920×1080 等の desktop で **スクロールなし**に hero・CTA・注目・お知らせ・FT が画面高に配分
- 文字は viewport に応じて少し大きくなり、CTA/注目カードも縦方向に伸びて「画面を使っている」感が出る
- スマホ・タブレット縦・window 高 720px 未満は従来どおり **自然スクロール**（無理な 1 画面固定はしない）

■ 今回変更した画面
- **01 ランディング** / URL: `/landing`（preview のみ）
- **画面位置**: 未ログイン LP 全体（ヘッダー → ヒーロー → 注目の開発中ゲーム → お知らせ帯 → フッター）
- **変更前**: `min-h-screen` + 下部 spacer。hero/CTA がコンパクト、下に大きな空白
- **変更後**: lg+ で `h-dvh` grid。hero が flex 拡大、注目行が可変高、spacer なし
- **プレイヤー視点**: ファーストビューで「探す/参加」と注目作品が同時に見える
- **開発者視点**: 緑 CTA と Studio 導線が CTA 高さ分しっかり見える
- **確認手順**:
  1. https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing を desktop 幅で開く
  2. 1920×1080 前後 — 縦スクロールバーが出ないこと
  3. 3価値の1行目上端 ≒ CTA 上端、3行目下端 ≒ CTA 下端（おおむね）
  4. 注目カードのサムネが横一列で縦に伸びていること
  5. DevTools で高さ 900px / 768px — スクロール許容 or 僅かなはみ出し（極端な潰れなし）
  6. モバイル幅 — 縦スクロールで全セクション読めること

■ なぜこの設計
- オーナー要望: 「縦は画面いっぱい」「無駄なスクロールは避けたい」「原則1画面」
- CSS の viewport 単位（dvh + fr grid + clamp）なら **JS なし・低負荷**で実現可能
- 固定 px の font/padding だけでは 1080p と 900p で同時に「1画面・読みやすさ」を満たせない

■ 他案不採用
- **scale transform 全体縮小** — ブラウザズーム相当でぼやけ・クリック領域が不安定
- **全セクションを absolute 配置** — メンテ困難、レスポンシブ破綻
- **モバイルも overflow-hidden 強制** — タップ領域不足・法務リンク到達不能

■ 実装スコープ In / Out
- In: lg+ 1 viewport 配分、dvh grid、clamp typography、CTA/注目可変高、spacer 削除
- Out: `/` への反映、prod deploy、実サムネ接続、法務リンク、Studio リンク、短画面専用 @media 微調整（必要なら次タスク）

■ リスク
- 極端に低い desktop 高（例 600px）では lg ブレークポイントでもはみ出しうる — 現状は scroll 許容
- `dvh` は古い Safari で `vh` フォールバック差 — Forge 想定ブラウザでは許容
- preview deploy 反映に数分 — Ready 後に再確認

■ 注意事項
- 注目カード・背景は **placeholder のまま**（モック実サムネ未接続）
- 「Studioに入る」「お知らせ一覧」「フッター法務」は未リンク
- prod / `/` 切替は Phase1-B または Walkthrough 後 GO

■ 今すぐ私がやるべきこと
- preview Ready 後、desktop 1920×1080 で `/landing` を目視 — 1画面感・CTA/3価値の揃い・注目高さ
- まだ「狭い/空く/スクロールが出る」なら解像度とスクショ付きでフィードバック

■ Cursorだけで完了できること
- 短 viewport 用 `@media (max-height: …)` 微調整
- 背景画像差替 / 注目 placeholder 強化
- 01 OK 後の他画面 preview route 追加

■ 次に検討すべきこと
- 01 ガワ OK ライン — 構造一致 vs ピクセル一致
- 01 OK 後: Phase 1-A Studio Shell mock 残（21/24/25/17）→ Walkthrough → 実装 GO

■ ChatGPTに相談したい論点
- desktop 1画面固定を **lg のみ**にした判断 — tablet 横 1024×768 も 1 画面に含めるべきか
- 注目5列のサムネ高 — 現状 flex-1 可変 vs モック固定 aspect のどちらを正とするか

■ Preview URL
https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing
