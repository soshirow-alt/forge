■ 現在の状態
- 01 `/landing` preview — **レイアウト方針を再整理**して push 予定（ブランチ `preview/landing-01`）
- 前回の dvh grid + 個別 clamp 伸縮は **オーナー NG 判定** → 廃止
- 新方針: **1920×1080 固定キャンバス + 全体等倍 scale**
- `/` 差替禁止 / prod deploy 禁止 — 維持

■ Forge原典コアループ（判断の基準）
- 投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ
- 01 LP は入口。モックの密度・視線の流れを崩さず、PC で可能な限り大きく見せる

■ 今回実装したこと
- **`components/landing-page-scaler.tsx`（新規）**
  - デザインキャンバス 1920×1080
  - lg+ で `scale = min(window.innerWidth/1920, window.innerHeight/1080)`
  - ラッパー高さ = 1080×scale、中身に `transform: scale()` + `origin-top-left`
  - 水平中央寄せ。縦は上揃え（余白は外側）
- **`components/landing-page.tsx` 再構成**
  - `LandingPageCanvas` — キャンバス内は **すべて固定 px**（モック密度）
  - Hero 548px / コンテンツ幅 1120px / 左右 padding 400px
  - 3価値: `space-y-3.5`（散らし禁止）
  - CTA: 固定 `h-[248px]`（縦伸ばし禁止）
  - 注目: サムネ `aspect-[16/10]`（flex-1 縦伸ばし禁止）
  - キャンバス下 ~200px は意図的なアートボード余白（要素で埋めない）
  - `LandingPageMobile` — lg 未満はスケールなし・縦スクロール
- **廃止**: `h-dvh` grid-rows fr / clamp(vh) / flex-1 justify-between / CTA h-full / サムネ flex-1

■ ユーザー目線の変化
- 変更前（dvh 版）: Hero・CTA・サムネが個別に伸び、モックより密度が薄く・視線が散る
- 変更後: モックと同じ比率のまま、画面サイズに応じて **ページ全体が一括で拡大縮小**
- 1920×1080 なら scale=1（等倍）。1440×900 なら約 0.75 倍。4K なら約 2 倍まで拡大
- viewport に余った領域は黒い外側余白 — 中身を引き伸ばして埋めない

■ 今回変更した画面
- **01 ランディング** / URL: `/landing`（preview）
- **画面位置**: LP 全体（ヘッダー〜フッター）
- **変更前**: 各セクションが viewport 高に合わせて個別伸縮
- **変更後**: 1920×1080 アートボードとして描画 → PC 表示領域に収まる最大倍率で全体 scale
- **プレイヤー視点**: 3価値がコンパクトに縦並び、CTA が縦長すぎない、注目サムネ比率が一定
- **開発者視点**: モック PNG と同じ情報密度でガワ確認可能
- **確認手順**:
  1. preview `/landing` を 1920×1080 で開く — scale≈1、モック密度に近いこと
  2. 1440×900 — 全体が縮小、パーツ比率は変わらないこと
  3. 3価値行間が広がりすぎないこと（justify-between なし）
  4. CTA 高さ 248px 相当、サムネ 16:10 であること
  5. 下に外側余白があっても Hero/CTA/カードが伸びていないこと
  6. モバイル幅 — 縦スクロールで読めること

■ なぜこの設計
- オーナー目標は「1画面を要素で埋める」ではなく「**モック密度を保った最大表示**」
- 個別 responsive 伸縮は密度と視線の流れを壊す
- 全体 scale はモック=アートボードのメタファに一致。実装コストも低い

■ 他案不採用
- dvh grid + fr 配分 — NG 明示
- clamp(vh) パーツ単位 — 比率が viewport ごとに変わる
- scale なし固定 px + 下余白 — 小さい画面でスクロール増、大きい画面で小さすぎ

■ 実装スコープ In / Out
- In: 1920×1080 キャンバス、scaler、固定 px レイアウト、mobile フォールバック
- Out: prod deploy、`/` 反映、実サムネ、リンク接続、scale 時の hover 微調整

■ リスク
- transform scale 下のクリック領域 — ブラウザは通常 scale 後の見た目に追従。問題あれば報告
- 4K で scale>1 のときテキストがややにじむ可能性 — 許容 or max-scale=1 は次判断
- preview deploy 反映に数分

■ 注意事項
- キャンバス px 値はモック目視ベース — ピクセル完全一致は再調整可
- placeholder 背景・注目サムネ・未リンクは従来どおり

■ 今すぐ私がやるべきこと
- preview Ready 後 `/landing` を 1920×1080 と 1440×900 で比較 — 密度・比率・外側余白
- モック PNG と並べて「散らばり/縦伸び」が解消したか確認

■ Cursorだけで完了できること
- キャンバス内 px の微調整（モック目視合わせ）
- max-scale 上限の追加（必要なら）
- 背景・サムネ差替

■ 次に検討すべきこと
- 01 ガワ OK ライン確定
- scale>1 を許容するか（4K）

■ ChatGPTに相談したい論点
- 4K で scale=2 まで許す vs max 1.0 で中央寄せ — どちらが LP として自然か

■ Preview URL
https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing
