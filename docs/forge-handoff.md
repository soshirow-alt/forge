# Forge Handoff

最終更新：**2026-07-06**（X Auth 本番 GO 完了 — `6192348`）

---

## 現在の状態（2026-07-06）

| 項目 | 内容 |
|------|------|
| **本番 URL** | https://forge-flame-gamma.vercel.app |
| **Preview URL** | https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app |
| **Supabase** | `bpnisgzxuwdxelhnduuf`（Preview / 本番共通 DB） |
| **最新 commit** | `619234829dac80978c172fd13eb9e6449e5bb2b9` |
| **ブランチ** | `origin/main` = `origin/preview/landing-01`（同期済み） |
| **本番 deploy** | **完了**（2026-07-06 smoke PASS） |

---

## 直近完了 — X Auth 本番 GO（2026-07-06）

**正本**: `docs/x-auth-setup-runbook.md`

| 項目 | 内容 |
|------|------|
| ログイン | `/login`・`/register` → **Xでログイン**（`signInWithOAuth`） |
| 連携 | `/settings` → **Xで連携**（`linkIdentity` / Manual linking ON） |
| 遷移 | Xログイン return なし → **`/home`**。連携成功 → **`/settings?x=linked`** |
| 保存 | `user_x_profiles`（`x_user_id`, `x_username`, `x_display_name`, `x_avatar_url`） |
| 公開表示 | 設定・公開FB・作品作者・`/creators/...` の `@handle` |
| env | 本番 `NEXT_PUBLIC_X_AUTH_ENABLED=true` |
| X App 表示名 | **Forge game** |
| E2E | Preview 全項目 PASS → 本番 smoke P0 PASS |

**本番 smoke 確認済み（P0）**

- `/login`・`/register` に「Xでログイン」
- `/login` → X → `/home`
- `/settings` で `@Forge_game_0601` 連携済み（`forge.operation@gmail.com` 側）
- メールログイン / ゲスト参加 / `/games/[id]` 退行なし / 旧ログイン UI 非表示

**ロールバック（問題時）**

1. Vercel `NEXT_PUBLIC_X_AUTH_ENABLED=false` + Redeploy（X 導線のみ OFF）
2. 必要なら Supabase X Provider OFF / Vercel 直前デプロイへ Rollback

**未実装（明示）**

- ユーザー向け X **unlink** UI（`unlinkIdentity`）— 検証時は Dashboard SQL のみ
- `/players/[handle]` の X `@handle` 表示

---

## 同梱デプロイ — 公開FBカード・ゲストFB（041 Phase 2 等）

| テーマ | 備考 |
|--------|------|
| **041 公開FBカード** | migration 適用済み。みんなの声 UI / `get_public_feedback_cards` |
| **ゲスト深掘りFB Phase 1** | ゲスト声 UI + Studio 表示（040 前提） |
| **声 aggregate 修正** | answer_value バケット統合 |

正本: `docs/public-feedback-041-apply-runbook.md`, `docs/public-feedback-cards-phase0.md`

---

## DB migration 状態（本番）

| migration | 状態 |
|-----------|------|
| 001–040 | 適用済み |
| **041** `public_feedback_cards` | **適用済み**（2026-07-05 Dashboard） |
| **042** `user_x_profiles` | **適用済み** |
| **043** RPC grants fixup | **適用済み** |

本番 deploy 時に **再 Run 不要**。

---

## 事業仮説・P0（参照）

- 原典: `docs/forge-principles.md`
- 事業仮説: `docs/forge-business-hypothesis.md`
- P0 改善ループ: `docs/forge-p0-improvement-loop-plan.md`
- コア: **版ごとの学習ループ**（発見→プレイ→初声→次に直すこと→次版）

---

## Cursor 推奨 1 位（本番 GO 後）

1. **X Auth フォロー** — unlink UI 方針 / `/players/[handle]` X 表示 / 開発者初回導線（別 TODO）
2. **公開FBカード** — 本番での表示・モデレーション運用確認
3. **改善ループ Studio** — `/projects/{id}/studio` 実機レビュー継続

---

## 運用（deploy）

正本: `docs/forge-triage-operations.md` §8

- Preview で試す → 本番 push → **`preview/landing-01` を `main` と同一 commit に同期**
- merge は **`--ff-only`** 推奨
- GPT 用厚いメモ廃止（2026-06）— 返答本文 + `forge-changelog.md` のみ（節目時 handoff 更新）

---

## 触らない（オーナー指示まで）

- 原典の意味変更
- 破壊的 DB / データ移行
- `PLAYER_VISIBLE=true` 本番公開
- X Client Secret を Vercel に置く
