# Feedback reciprocity + body notification — current specification

Status: **2026-08-13**（104: detailed-only でも本体通知）

## Product intent

登録ユーザーが他作品へ Feedback したとき:

1. **まず**作品 Owner に「フィードバックが届いた」本体通知を出す（detailed-only / voice 回答の双方）
2. 送信者に public 作品がある場合のみ、相手側へ reciprocity（再発見導線）を**追加**する

これは:

- 強制交換ではない
- point / credit 制度ではない
- 「FBしたから返せ」という義務ではない

## Body notification（実装）

- Helper: `notify_owner_feedback_arrived`（migration **104**）
- 内部 type は既存の `voice_received`（unread unique: owner × project × version）
- Triggers:
  - `project_voice_responses` INSERT → `notify_owner_on_voice_response` → helper
  - `project_feedback` INSERT → `project_feedback_notify_owner` → helper
- 同一 owner×project×version の未読は UPDATE で合流 → **二重通知にしない**
- actor = owner はスキップ
- クリック先: Studio フィードバック（`projectStudioFeedbackHref`）

## Reciprocity（実装）

`consider_feedback_reciprocity`（093/095）。トリガーは `project_feedback` と `project_voice_responses` の双方。

すべて必須:

- 対象作品が存在し `visibility='public'`
- actor ≠ owner
- 相互ブロックなし（DB 関数。ユーザー向けブロック UI は未提供）
- `actor_has_public_project(actor)`（public 作品 ≥1）
- actor に `developer_profiles` 行がある

## CASE matrix（作品 B の制作者視点）

| CASE | Actor A | 本体 Feedback 通知 | Reciprocity | UI CTA（reciprocity） |
|---|---|---|---|---|
| public≥1 + voice | 条件満たす | **あり** | **あり** | `/creators/{A}` |
| public≥1 + detailed-only | 条件満たす | **あり**（104） | **あり** | `/creators/{A}` |
| publicなし + detailed-only | — | **あり** | **なし** | — |
| publicなし + voice | — | **あり** | **なし** | — |
| voice + detailed 同一 ver | — | **1件に合流** | 条件次第で1件 | creator profile |
| self | — | **なし** | **なし** | — |

## Judgment

point / obligation / badge / ranking連動は導入しない。
