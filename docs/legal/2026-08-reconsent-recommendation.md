# Re-consent / version management（改訂・2026-08 Staging gate 時点）

実装はしない。分類のみ。

## 二択にしない

| 案 | 評価 |
|---|---|
| 大幅改定なのに何も通知しない | リスク高（特に Privacy の取得・委託範囲の明確化） |
| 全ユーザーを blocking 再同意 | 運用負荷・離脱リスク大。今回必須とはしない |

中間案: **non-blocking notice**（お知らせ／バナー／メールのいずれか）+ 文書ヘッダの version / effective date。

## 必須（A）— 文書公開前に Owner 決定

1. 運営者表記（法人名／屋号／住所等のどこまで出すか）※個人情報を勝手に補完しない
2. Privacy のゲストFB記述を「Productionでは無効」へ直す承認
3. OpenAI を Privacy に名指しするか（Production で live matcher がユーザーデータを送るかの確認）
4. effective date / last updated の日付

## 推奨（B）

1. Terms / Privacy に version 文字列（例 `terms-2026-08-xx`）
2. 既存ユーザーへの **non-blocking** 告知（プラットフォームお知らせ ± メール）
3. 将来用に `accepted_terms_version` / `accepted_privacy_version` の設計検討（実装は別タスク）

## 後回し可（C）

1. ログイン直後の **blocking** 再同意ゲート
2. 全ユーザー強制チェックボックス
3. 用語だけの小改定での再同意

## 推奨サマリ

本文大幅改定時は **A を埋めたうえで B の non-blocking 告知**。Blocking 再同意は今回必須にしない。
