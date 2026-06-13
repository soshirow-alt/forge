<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:forge-agent-rules -->
# Forge development rules

## Source of truth

- **Forge原典を最優先** — `docs/forge-principles.md` が憲法
- 原典の**意味を勝手に変更しない**（整理・参照のみ）
- MVP スコープ外は `docs/out-of-scope.md` を確認

## Feature decisions

- 新機能・変更は **「投稿 → 発見 → プレイ → フィードバック → 改善 → 再プレイ」** を強化するかで判断
- **実装都合で仕様を変更しない**
- ランキング、バッジ、投げ銭、販売、SDK実装（説明UI除く）は作らない

## Data & storage

- **本番でユーザー間共有される情報を localStorage に保存しない**
- localStorage は **下書き・UI状態・デモ暫定** のみ
- 永続データは **Supabase** を前提

## Login UX (when touching auth flows)

- 発見（トップ・一覧・詳細閲覧）は公開
- プレイ以降はログイン必須。ボタンは隠さず `/login` へ
- モーダルで阻まない。redirect クエリは複雑化しない
- 詳細は `docs/forge-principles.md` §ログイン方針

## Documentation duty (every completed task)

作業完了時に必ず更新：

1. `docs/forge-changelog.md` — ユーザー体験・仕様の変化
2. `docs/forge-handoff.md` — 現在地
3. **`docs/chatgpt-summary.md`** — ChatGPT に貼る最新サマリ（本文のみ、見出しや装飾線なし）
4. レスポンス末尾 — 同じサマリを **1つの `text` コードブロック** に入れる（Cursor のコピーボタン用）

サマリ形式（非エンジニア向け、コード差分・ファイル一覧不要）：

```
■ 現在の状態
■ 今回実装したこと
■ ユーザー目線の変化
■ 注意事項
■ 次に検討すべきこと
■ ChatGPTに相談したい論点
```

**設計判断が絡むときだけ**、上記の末尾（または「相談したい論点」の直前）に **論点ごと** 以下を追加する。各項目 **3〜5行**、長文議論は不要。

```
■ Cursorの推奨案
■ 推奨理由
■ 懸念点
```

追加する場面（該当時のみ。毎回不要）：

- DB設計 / 認証設計 / 通知設計 / 権限設計
- データ保存先（localStorage vs Supabase 等）
- 将来の拡張性に関わる判断
- ChatGPT に意見を聞きたい設計論点

目的：ChatGPT が「結論」だけでなく「なぜそう考えたか」を把握して Cursor案を評価できるようにする。

## Handoff for ChatGPT

ユーザーは **`docs/chatgpt-summary.md` の内容だけ** を ChatGPT に貼る。

コピー方法（いずれか）：

- ターミナルで `npm run copy-summary` → クリップボードに入る
- Cursor 返答末尾のコードブロック右上 **Copy** をクリック
- `docs/chatgpt-summary.md` を開いて全選択

長文レス全文のコピーは不要。
<!-- END:forge-agent-rules -->
