■ 現在の状態
- 01 `/landing` preview — **push なし**（ローカルのみ）
- **overlay 正本を fb505643（1024×819）に統一** — `landing-mock-reference.jpg` 差し替え済み
- 55022e3e（496）は非正本 — コード・docs から除外
- 実装アートボード: 1024×558（座標は未調整）。カード 118px は維持
- prod deploy 禁止継続

■ 今回実装したこと
1. **正本画像差し替え**
   - ソース: `assets/...-fb505643-....png`（1024×819）
   - 出力: `public/images/landing-mock-reference.jpg`（1024×819 JPEG）
   - 旧 55022e3e（496）由来ファイルを上書き

2. **layout 定数**
   - `MOCK_REF_IMAGE_H = 819`（正本原寸）
   - `MOCK_OVERLAY_H = max(実装558, 正本819) = 819`（overlay コンテナ）
   - `MOCK_H`（実装 558）— 座標合わせ前のまま
   - カード 118px / Hero y=322 等 — **今回触らない**

3. **overlay UI（`/landing/overlay`）**
   - 左右比較: 左 = 正本 819 / 右 = 実装 558、**上端 Y=0 揃え**
   - 重ね: 正本 50% + 実装 100%、コンテナ高 819
   - ラベルに fb505643 / 819×558 を明示

4. **docs**
   - `01-landing.md` / `forge-changelog.md` — 正本 819、496 非正本を記載

■ オーナー判断（反映済み）
- 正本: **fb505643 819** / 55022e3e 496 は正本にしない
- カード ~122 vs 実装 118 — 過大ではない。カードサイズは触らない
- 次フェーズ: Hero（ロゴ→H1→リード→3価値→CTA→Hero高）を overlay で合わせる
- 特に Hero 下端 y=322 と Hero 内余白の検証

■ ユーザー目線の変化
- overlay 左右比較で **正本の縦尺（819）** が見える — Hero が実装より長く見える問題を確認しやすい
- 496 基準による見かけのズレ要因を排除

■ 注意事項
- ローカル未 push — preview URL は旧 496 基準のまま
- fb505643 下端 ~570 以降は余白 — アートボード高 819 全体を scale するかは座標合わせ後に判断
- `/landing` ヒーロー背景も正本 819 画像を clip（MOCK_HERO_BG_H=322）

■ 今すぐ私がやるべきこと
- ローカル `/landing/overlay` で正本 819 vs 実装 558 を上端揃え確認
- Hero 領域の違和感（CTA 高・Hero 内余白）を目視
- OK なら Hero 座標合わせ GO を Cursor に指示（push は別途）

■ Cursorだけで完了できること
- Hero 座標パス（`landing-mock-layout.ts` — ロゴ/H1/リード/3価値/CTA/MOCK_HERO_BG_H）
- push 前に overlay で 1 要素ずつ確認

■ 次に検討すべきこと
- Hero 下端 322 が fb505643 上で正しいか（ピクセル + overlay）
- 実装 MOCK_H 558 vs 正本コンテンツ高 ~570 前後の関係（news/footer Y 再計測）

■ ChatGPTに相談したい論点
- 819 正本のうち下端余白を scale 対象に含めるか、コンテンツ高 ~570 で artboard を切るか

■ 今回変更した画面
- URL: `/landing/overlay`（preview）
- 画面位置: 比較 UI 全体 — 左列が 819px 正本、右列が 558px 実装
- 変更前: 496px 非正本 vs 558 実装
- 変更後: **819px fb505643 正本** vs 558 実装、上端揃え
- 確認: ローカル lg+ で overlay 左右比較 — Hero 高さ差が視覚的に確認できること
