# Feedback reciprocity — final specification (approved candidate)

Status: **Owner承認候補**（コード変更なし・2026-08-13）

## Product intent

登録ユーザーが他作品へ Feedback したとき、そのユーザー自身に public 作品がある場合のみ、相手側へ「この人にも作品があります」系の再発見導線を出す。

これは:

- 強制交換ではない
- point / credit 制度ではない
- 「FBしたから返せ」という義務ではない

## Eligibility（実装）

`consider_feedback_reciprocity`（migrations 093/095）。トリガーは `project_feedback` と `project_voice_responses` の双方。

すべて必須:

- 対象作品が存在し `visibility='public'`
- actor ≠ owner
- 相互ブロックなし
- `actor_has_public_project(actor)`（public 作品 ≥1）
- actor に `developer_profiles` 行がある

## CASE matrix（作品 B の制作者視点）

| CASE | Actor A | 通常 Feedback 通知 (`voice_received`) | Reciprocity | UI CTA |
|---|---|---|---|---|
| A public≥1 + voice 回答 | 条件満たす | **あり**（voice INSERT時） | **あり** | `/creators/{A}` |
| A public≥1 + detailed-only（voiceなし） | 条件満たす | **なし**（voice経路のみ） | **あり**（project_feedback トリガー） | `/creators/{A}` |
| B 作品なし | 不可 | voiceがあれば通常のみ | **なし** | 追加なし |
| C draft/privateのみ | 不可 | voiceがあれば通常のみ | **なし** | 追加なし |
| D 複数 public | Aと同様 | voice経路に依存 | **あり** | **creator profile**（特定作品ではない） |

## No-project UX

- reciprocity は出ない
- 通常通知は voice 経路があるときのみ（作品の有無で格下げしない）
- FB 一覧・本文の価値扱いは変えない

## Soft findings（Production blocker ではない）

1. プロフィール非公開でも public 作品+developer_profiles があれば reciprocity 発火しうる
2. detailed-only では通常 `voice_received` が無く reciprocity だけ届く組合せがありうる（上表）

## Judgment

現行実装を最終仕様候補として採用。point / obligation / badge / ranking連動は導入しない。
