# Preview 5カテゴリ E2E 目視チェックリスト（Staging seed 適用後）

Staging (`vuqpwvjvgyxffmvpfrxo`) + Preview branch alias で確認。Production では行わない。

seed / beautify / audit 適用後に使う。違和感は次 task の UI 修正候補として記録する（この task では UI を直さない）。

## Studio — 投稿・編集（構造化フィールド）

| カテゴリ | 確認 |
|---|---|
| game | picker → 投稿/編集。ジャンル・特徴タグ・プレイ人数・プレイ情報・公開先 |
| audio | picker → 種類（kinds, 複数可）・音楽ジャンル・雰囲気・再生時間・公開先。game play-info に落ちない |
| asset | picker → **アセット種別 chip（asset_kinds, maxSelection あり）・表現形式（formats）・テイスト（tastes）・対応ツール（tools）** の構造化 chip UI。play-info / play-access 非表示 |
| dev-tool | picker → 種類（kinds）・環境（toolEnvironments）・利用方法（toolUsageMethod）・特徴（features） |
| service-app | picker → 種類（kinds）・環境（serviceEnvironments）・用途（purposes）・特徴（features） |
| chip cap 挙動 | 各 chip 群で registry の maxSelection を超えて選べない（UI 側で選択不可 or 警告） |
| asset 一部クリア保存 | asset の formats/tastes/tools を空にして保存 → 他パネル所有のキー（kind/kinds/purposes/features/公開先）が消えない（category-scoped merge） |

## Search — Formal Filters（registry 駆動）

| 項目 | 確認 |
|---|---|
| category tabs | すべて / game / audio / asset / dev-tool / service-app |
| keyword | 例: `ローグライク` `ドット絵` `Unity` `配信者` `BGM` |
| game formal filters | ジャンル / 特徴タグ / プレイ時間 / プレイ環境 / プレイ人数 |
| audio formal filters | 種類（kinds）/ 音楽ジャンル / 雰囲気 / 再生時間バケット |
| asset formal filters | アセット種別 / 表現形式 / テイスト / 対応ツール |
| dev-tool formal filters | 種類 / 環境 / 特徴 |
| service-app formal filters | 種類 / 用途 / 環境 / 特徴 |
| genre + tag | `ローグライク`+`ピクセルアート` → ヒットあり |
| genre + tag zero | `ローグライク`+`協力プレイ` → 0 件 |
| 同一軸 OR / 異軸 AND | 同じ filter 軸内の複数選択は OR、異なる軸間は AND で絞り込まれる |
| legacy ラベル互換 | 旧ラベル（例: サービス種別のスマートフォンアプリ、dev-tool 環境の Visual Studio Code）を持つ既存行が canonical ラベルの filter でもヒットする |
| right sidebar | game 時のみ genre/tag。他カテゴリで game filter が残らない |
| cards | カテゴリ badge・タイトル・説明・thumb |

hidden filter（quick_try / usable_for_creation / feedback_wanted / stream_policy）は **UI 確認対象外**（seed も UI 用に盛っていない）。

## Detail / Studio Preview

| 項目 | 確認 |
|---|---|
| category pill | asset は「アセット」pill |
| game play info | game のみ（想定時間・端末・プレイ人数・遊び方） |
| audio 音源情報 | 種類・音楽ジャンル・雰囲気・再生時間 |
| asset 構造化情報 | アセット種別・表現形式・テイスト・対応ツール。game play-info **なし**（値が残っていても非表示） |
| dev-tool / service-app 利用情報 | あり（環境・特徴など） |
| publish link | 公開先 CTA |
| images | no-image は game …0004 / asset …0021 |
| phase | playable 等 |

## Home（プラットフォーム全体）

| 項目 | 確認 |
|---|---|
| feature card grid | 5カテゴリ（game / audio / asset / dev-tool / service-app）が並ぶ |
| Coming Soon semantics | game のみ「注目作品を見る」が `/home/game` へのリンク。他4カテゴリは「注目作品を見る」= Coming Soon 表示（リンクなし）。**5カテゴリすべて**「条件で探す」は `/search?category=<id>` へのリンク |
| Home セクションに公開 CTA なし | feature card grid / 各棚に「投稿する」等の公開 CTA がないこと（Studio 投稿導線は Home 最上部の別 CTA。カード grid やカテゴリ棚に混在させない） |
| cards | 6棚の既存ロジック（均等 quota なし） |
| category badges | 混在して見えればよい（全カテゴリ必須ではない） |
| duplicated suppression | 同一作品の過剰重複がない |
| layout / loading | 目視 |

## `/home/game`（ゲームカテゴリ専用 Home）

| 項目 | 確認 |
|---|---|
| アクセス | Home の game カード「注目作品を見る」から遷移。直接 URL でも表示 |
| category スコープ | FBを求めている作品 / 進化を続ける作品 棚が **game カテゴリのみ**で構成される（他カテゴリが上位を占めていても game 棚が空にならない） |
| 新着 | 新着棚も game のみ |
| 公開 CTA なし | このページ内に「投稿する」等の公開 CTA がない |
| 空データ時 | game 該当作品が少ない/ゼロの場合の表示が破綻しない |

## 記録用

- 日付:
- Preview URL:
- 気になった UI finding（次 task 用）:
