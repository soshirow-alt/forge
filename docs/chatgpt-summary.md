■ 現在の状態
- 01 `/landing` preview — **モック模写方針**をコード正本化 push 予定（`preview/landing-01`）
- 方式: 参照アートボード + **均一 scale**（個別伸縮なし）
- 新規: `components/landing-design.ts` — モック比率トークン
- prod deploy 禁止 / `/` 差替禁止 — 維持

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- 01 LP は入口。モックと同じ見た目を、ブラウザサイズに最適化（max-fit 均一 scale）

■ 今回実装・整理したこと
- **`landing-design.ts`（新規）**
  - モックから読んだ比率を参照幅 1920 上に encoding
  - 左右カラム 1.18fr / 0.82fr（~59/41）、CTA 高 236px、サムネ 16:10、余白トークン
  - コメント: 固定 px 再現ではなく模写用アートボード定義
- **`landing-page.tsx`**
  - トークン参照に統一。Hero/キャンバス固定高なし
  - CTA `shrink-0` + 固定高（個別 stretch 禁止）
  - 3価値: 固定 gap（散らしなし）
- **`landing-page-scaler.tsx`**
  - ResizeObserver + `scale = min(vw/1920, vh/実高)` — 変更なし、コメント明確化

■ ユーザー目線の変化
- 目標の言語化: 「1920×1080 の箱」→「**モック比率のアートボードを max-fit scale**」
- 1920×1080 環境: モック PNG に近い密度・位置関係
- 他解像度: 比率維持のまま拡大/縮小。余白は viewport 外側

■ 今回変更した画面
- **01 ランディング** / `/landing`（preview）
- **変更**: レイアウト方式の正本化 + モック比率微調整（左右カラム・CTA 高・セクション余白）
- **確認手順**:
  1. preview をモック PNG と並置
  2. 左右カラム比・CTA 縦横比・注目 16:10・3価値行間がモックと同系か
  3. 1920×1080 / 1440×900 で scale 後も **相対位置が崩れない**こと
  4. Hero/CTA/カードが viewport だけ伸びていないこと

■ なぜこの設計
- オーナー: 模写だが固定 px 再現ではない → 比率 encoding + 均一 scale が正解
- トークン化で「どの数値がモック由来か」が追える → 目視微調整が容易

■ 他案不採用
- viewport 個別 responsive — 模写崩れ（継続 NG）
- 1080 固定箱 — 内側余白が scale に混入（継続 NG）

■ 実装スコープ In / Out
- In: landing-design.ts、比率 tune、doc 更新
- Out: prod deploy、ピクセル完全一致（目視後トークン調整）

■ 今すぐ私がやるべきこと
- preview Ready 後、モック PNG と並べて差分フィードバック（どの区間がまだズレるか）

■ Cursorだけで完了できること
- landing-design.ts トークン値の目視微調整（オーナー指摘区間）

■ Preview URL
https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing
