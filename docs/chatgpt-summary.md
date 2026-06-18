■ 現在の状態
- 01 `/landing` — セクション重なり修正 + overlay 改善 push 予定（`preview/landing-01`）
- 模写フェーズ継続。prod deploy 禁止

■ 今回実装したこと
1. **① レイアウト崩れ（最優先）**
   - 原因: 作品カード高（thumb 64 + meta）> お知らせまでの余白（66px）
   - 修正: `landing-mock-layout.ts` でセクション境界を連鎖定義
     - カード高 = thumb 42 + meta 22 = 64
     - カード下端 416 → gap 6 → お知らせ y=422 → フッター y=454
   - 注目セクション `overflow-hidden` + 高さ = NEWS.y - FEATURED.y
   - お知らせ z-20 で作品領域へ侵食しない

2. **② overlay 改善**
   - `landing-overlay-tool.tsx` 新規 — 3モード
     - **左右比較**（デフォルト）
     - **重ね**: モック 50% + 実装 100%（ヒーロー画像は下層モックのみ）
     - **表示切替**: モック ⇔ 実装
   - `/landing/overlay` から利用

■ コード構成
- `landing-page-canvas.tsx` — アートボード本体
- `landing-overlay-tool.tsx` — 比較 UI
- `landing-mock-layout.ts` — 座標正本（セクション連鎖）

■ 今回変更した画面
- `/landing` — 作品/お知らせ/FT の重なり解消
- `/landing/overlay` — 比較 UI 刷新

■ 次フェーズ（座標合わせ）
- overlay 左右比較でロゴ → H1 → 3価値 → CTA → 注目 → お知らせ → FT を px 単位で合わせる

■ 今すぐ私がやるべきこと
- `/landing/overlay` 左右比較で重なり解消と比較しやすさを確認

■ Preview URL
https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing
https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing/overlay
