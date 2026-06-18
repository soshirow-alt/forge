■ 現在の状態
- 01 `/landing` — **モック模写として再実装** push 予定（`preview/landing-01`）
- 基準: モック原寸 **1024×496**（従来 1920 基準は誤り）
- 配置: `landing-mock-layout.ts` 絶対座標 + 全体均一 scale
- 背景: モック原画像をヒーローに使用
- 注目サムネ: グラデ近似（モック実画像切り出し不可 — レイアウトのみ一致目標）
- prod deploy 禁止 / `/` 差替禁止 — 維持

■ 今回実装したこと（再実装）
- 微調整をやめ、モック JPEG を `public/images/landing-mock-reference.jpg` に配置
- **`landing-mock-layout.ts`** — オーバーレイ計測値（ロゴ/H1/CTA 204×218/注目 172×64 thumb 等）
- **`landing-page.tsx`** — 1024×496 絶対配置アートボード。flex/grid 伸縮廃止
- **`/landing/overlay`** — モック原寸と実装の重ね合わせ確認（preview 専用）
- **`landing-design.ts` 削除** — 1920 基準トークンを廃止
- ヒーロー背景: 旧 AI placeholder → **モック原画像**

■ 画像素材の限界（明示）
- ヒーロー背景: モック原画像使用 → モックと同系統
- 注目5カードサムネ: モック内イラストの切り出しなし → CSS グラデ。**完全一致不可**
- 完全一致にはオーナー提供の5サムネ PNG が必要

■ 今回変更した画面
- **01 ランディング** `/landing` — 全面再実装
- **01 オーバーレイ** `/landing/overlay` — 新規（preview 確認用）
- **確認手順**:
  1. `/landing/overlay` — 下段 50% opacity でモックと位置合わせ
  2. `/landing` — 1920×1080 で max-fit scale、モックと同密度か
  3. CTA 204×218、注目 cardW 172 がモックと重なるか

■ ユーザー目線の変化
- 変更前: 1920 基準 CSS 調整 → モックと密度・背景・CTA サイズがズレ
- 変更後: モック原寸アートボードをそのまま scale → 「1枚の LP」迫力に近づける

■ 今すぐ私がやるべきこと
- preview Ready 後 `/landing/overlay` でズレ確認 → 座標フィードバック

■ Cursorだけで完了できること
- overlay 見ながら `landing-mock-layout.ts` 座標のピクセル単位修正
- 5サムネ PNG 提供後の差し替え

■ Preview URL
https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing
https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing/overlay
