■ 現在の状態
- 01 `/landing` preview — **実コンテンツ高アートボード**へ修正 push 予定（`preview/landing-01`）
- 方式: **全体 scale** — 維持
- 修正点: 1080px 箱 / Hero 548px 固定を廃止。ResizeObserver で実高計測
- prod deploy 禁止 / `/` 差替禁止 — 維持

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- 01 LP はモック密度の入口。アートボードをそのまま最大表示し、余白は viewport 外側

■ 今回実装したこと
- **`landing-page-scaler.tsx`**
  - `LANDING_DESIGN_HEIGHT` 固定を廃止
  - ResizeObserver でキャンバス `offsetHeight` を計測
  - `scale = min(vw/1920, vh/実高)` — 余白込み 1080 は scale 対象外
  - ラッパー: `items-start` — 余白は主に viewport 下側
- **`landing-page.tsx` / `LandingPageCanvas`**
  - ルート: `w-[1920px]` のみ（高さ固定なし）
  - Hero: 高さ固定削除 — 中身（header + H1 + grid）で決まる
  - 注目 / お知らせ / FT: `py-*` のみ（`h-[52px]` 等の箱固定削除）
  - `px-[400px]` 削除 — `mx-auto w-[1120px]` に統一
  - CTA: `h-[248px]` 維持、内部 `flex-1` 削除
  - 3価値: `space-y-3.5` 維持
  - サムネ: `aspect-[16/10]` 維持

■ ユーザー目線の変化
- 変更前: 1080px 箱 + Hero 548px でキャンバス内に不要余白 → scale 後も密度がモックとズレ
- 変更後: モック密度で詰めた LP ブロック全体が scale — **中身比率は不変、下の黒余白は viewport 外側**
- 1920×1080 環境: 実高 ~860–920px 想定 → scale≈1.0–1.2 前後（実測はブラウザ依存）

■ 今回変更した画面
- **01 ランディング** / `/landing`（preview）
- **画面位置**: LP 全体
- **変更前**: 1920×1080 固定キャンバス、Hero 548px、キャンバス下 ~180px 空き
- **変更後**: 1920 幅・実コンテンツ高、Hero は中身高、scale 対象は LP ブロックのみ
- **確認手順**:
  1. preview `/landing` を desktop 1920×1080 で開く
  2. Hero 下〜注目の間に **不自然な空白帯がない**こと
  3. フッター直下の余白が **viewport 下**（キャンバス内の空箱ではない）こと
  4. CTA 248px 相当・3価値 compact・サムネ 16:10 が scale 後も比率維持
  5. モック PNG と並べて密度比較

■ なぜこの設計
- オーナー指摘: scale 方式は OK、問題は **キャンバス内余白設計**
- 1080 固定は「箱に入れる」発想で、モックの「詰まった LP を scale」と不一致
- ResizeObserver ならコンテンツ変更後も実高に追従

■ 他案不採用
- 1080 固定 + scale — 内側余白が scale に含まれる（今回 NG）
- Hero min-height — 中身より高い帯が残る
- 個別 clamp/fr — 密度崩れ（継続 NG）

■ 実装スコープ In / Out
- In: 実高計測 scale、Hero/キャンバス固定高廃止、CTA 内部 flex-1 削除
- Out: prod deploy、モック px 微調整（目視後）、`/` 反映

■ リスク
- 初回 ResizeObserver 前に一瞬非表示（visibility hidden）— 許容
- フォント読込後に実高変動 → 再計測（Observer が追従）

■ 注意事項
- placeholder 背景・サムネ・未リンクは従来どおり
- モック px 完全一致は別タスクで目視調整可

■ 今すぐ私がやるべきこと
- preview Ready 後 `/landing` をモック PNG と並べて確認
- Hero 内空白・viewport 下余白の出方をフィードバック

■ Cursorだけで完了できること
- キャンバス内 px 微調整（padding/gap）
- max-scale 上限（4K 判断後）

■ 次に検討すべきこと
- 01 ガワ OK ライン
- 他画面 preview

■ Preview URL
https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing
