# Preview 5カテゴリ E2E 目視チェックリスト（Staging seed 適用後）

Staging (`vuqpwvjvgyxffmvpfrxo`) + Preview branch alias で確認。Production では行わない。

seed / beautify / audit 適用後に使う。違和感は次 task の UI 修正候補として記録する（この task では UI を直さない）。

## Studio

| カテゴリ | 確認 |
|---|---|
| game | picker → 投稿/編集。ジャンル・特徴タグ・プレイ情報・公開先 |
| audio | picker → 音源情報（kind / 再生時間）・公開先。game play-info に落ちない |
| asset | picker → 共通項目のみ。asset_kinds UI なし。play-info / play-access 非表示 |
| dev-tool | picker → 利用情報（環境・利用方法） |
| service-app | picker → 利用情報（環境） |

## Search

| 項目 | 確認 |
|---|---|
| category tabs | すべて / game / audio / asset / dev-tool / service-app |
| keyword | 例: `ローグライク` `ドット絵` `Unity` `配信者` `BGM` |
| game genre | RPG / アクション / ローグライク など公式 option |
| game feature tag | ピクセルアート / 協力プレイ など |
| genre + tag | `ローグライク`+`ピクセルアート` → ヒットあり |
| genre + tag zero | `ローグライク`+`協力プレイ` → 0 件 |
| right sidebar | game 時のみ genre/tag。他カテゴリで game filter が残らない |
| cards | カテゴリ badge・タイトル・説明・thumb |

hidden filter（quick_try / usable_for_creation / feedback_wanted / stream_policy / asset_kind）は **UI 確認対象外**（seed も UI 用に盛っていない）。

## Detail / Studio Preview

| 項目 | 確認 |
|---|---|
| category pill | asset は「アセット」pill |
| game play info | game のみ（想定時間・端末・遊び方） |
| audio 音源情報 | あり |
| asset | game play-info **なし**（値が残っていても非表示） |
| dev-tool / service-app 利用情報 | あり |
| publish link | 公開先 CTA |
| images | no-image は game …0004 / asset …0021 |
| phase | playable 等 |

## Home

| 項目 | 確認 |
|---|---|
| cards | 6棚の既存ロジック（均等 quota なし） |
| category badges | 混在して見えればよい（全カテゴリ必須ではない） |
| duplicated suppression | 同一作品の過剰重複がない |
| layout / loading | 目視 |

## 記録用

- 日付:
- Preview URL:
- 気になった UI finding（次 task 用）:
