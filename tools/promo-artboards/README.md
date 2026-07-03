# Forge 広告用アートボード（静的）

本体アプリ・本番 DB・Preview DB・seed とは**完全に切り離した** X 投稿用モック画像の生成用ファイルです。

## 場所を `tools/promo-artboards/` にした理由

- `app/` 配下ではなく、Next.js 本番ルート・build に混ざらない
- `promo-artboards/` 単体より「開発用ツール」であることが明確
- main merge しない運用と相性がよい（本体 PR に含めない）

## 含まれるもの

| ファイル | 内容 |
|----------|------|
| `index.html` | 4 枚へのリンク |
| `home.html` | プレイヤーホーム |
| `game-detail.html` | ゲーム詳細 |
| `voices.html` | みんなのフィードバック |
| `community.html` | コミュニティ |
| `styles.css` | 共通スタイル（1200×675 アートボード） |
| `export-png.mjs` | Playwright で PNG 書き出し（任意） |
| `output/` | 書き出し PNG（生成物） |

## ブラウザで確認（ラフ確認）

1. `tools/promo-artboards/home.html` などをブラウザで直接開く
2. アートボードは **1200×675px** 固定

## PNG 書き出し（任意）

```bash
cd tools/promo-artboards
npx --yes playwright install chromium
node export-png.mjs
```

`output/*-1200x675.png` が 4 枚できます。

## 1440×900 版

`export-png.mjs` の `VIEWPORTS` に `{ width: 1440, height: 900, suffix: '1440x900' }` を追加して再実行。

## 注意

- 架空のゲーム名・数値のみ（実在 IP / 実ユーザーなし）
- 本体 deploy・DB・seed とは無関係
- **main には merge しない**（広告制作用の一時資産）
