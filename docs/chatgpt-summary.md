■ 現在の状態
- 01 `/landing` preview — `preview/landing-01` / push 済み
- commit **a354ae3** — 正本 fb505643 819 統一
- commit **21ffd13** — Hero 座標合わせ（overlay 実測）
- prod deploy 禁止 / `/` 反映禁止

■ 今回実装したこと

**Push 1 — 正本統一（a354ae3）**
- `landing-mock-reference.jpg` → fb505643 1024×819
- 55022e3e 496 非正本化
- overlay: 正本 819 vs 実装、上端揃え
- docs 更新

**Push 2 — Hero 座標（21ffd13）** fb505643 ピクセルスキャン + overlay
- ロゴ y: 11→**27** / ログイン・登録 y: 8→**24**
- H1 y: 50→**56**（リード y=119 から逆算 — グラデ被りで自動検出不可）
- リード y: 90→**119**
- 3価値 y: 128→**131**（rowH 36 定数化）
- CTA y: 92→**132** / h: 218→**168**（左箱 top~134 bot~303 実測）
- Hero 下端 / 注目上端: 322→**326**（注目タイトル y~326–333）
- 作品カード **118px 維持** / cardsY 352 維持
- 実装 MOCK_H: **558**（Hero 変更のみでは cards 連鎖不変）

■ Hero 322 について（オーナー確認論点）
- fb505643 上: 注目タイトル明る行 **y=326–336**、行変化ピーク **y=315–330**
- **322 は 496 時代の値** — 819 正本では **326** に更新（+4px）
- 大幅変更は CTA（+40px 下げ・高さ -50px）とリード（+29px）— Hero 縦余白の主因

■ 今回変更した画面
- `/landing` — Hero 領域（ロゴ/H1/リード/3価値/CTA/背景 clip）
- `/landing/overlay` — 正本 819 vs 実装 558、Hero 合わせ後比較

■ preview URL（lg+ 推奨）
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing
- https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app/landing/overlay

■ ユーザー目線の変化
- Hero が正本に近づき、CTA が上に張り付いた見え方が緩和される想定
- overlay 左右比較で Hero 高さ・CTA サイズ差を確認可能

■ 注意事項
- Vercel 反映待ち（数分）
- H1 y=56 は推定 — overlay で目視微調整余地あり
- 819 下端余白 — scale 切り出しは news/footer 合わせ後

■ 今すぐ私がやるべきこと
- preview URL で `/landing/overlay` 左右比較 — Hero・CTA を目視
- H1 ずれあれば overlay で px 指示

■ Cursorだけで完了できること
- 作品カード / お知らせ / フッター座標（正本 819 再測定）
- H1 overlay 微調整

■ 次に検討すべきこと
- 座標合わせ 7–9: 作品カード位置 → お知らせ → フッター（card 118 維持）
- コンテンツ実高 ~570 で scale 切るか（Hero 完了後）

■ ChatGPTに相談したい論点
- H1 自動検出不可時の overlay 合わせ手順（目視 vs グラデ除去スキャン）

■ Forge原典コアループ
- 01 LP ガワ — 模写精度が発見入口の第一印象に触れる。Hero 優先は妥当

■ Cursorの推奨案
- 正本 819 固定のまま、残りは overlay 1 要素ずつ — news/footer は fb505643 実測 y~507/558 を次の正本値候補

■ 推奨理由
- 496 基準を排除済み。Hero 主因は CTA y/h とリード y の 496 時代ズレ

■ 懸念点
- featured.y +4 だけでは Hero 全体の「大きく見える」問題の大部分は CTA/リード修正で吸収 — 目視確認必須
