# Forge Handoff

最終更新：**2026-07-06**（主要導線パフォーマンス改善 本番反映完了 — `e980842`）

---

## 現在の状態（2026-07-06）

| 項目 | 内容 |
|------|------|
| **本番 URL** | https://forge-flame-gamma.vercel.app |
| **Preview URL** | https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app |
| **Supabase** | `bpnisgzxuwdxelhnduuf`（Preview / 本番共通 DB） |
| **最新 commit** | `e980842b9938265e9e178954f5d95f553c33a6dc` |
| **ブランチ** | `origin/main` = `origin/preview/landing-01`（同期済み） |
| **本番 deploy** | **完了**（`dpl_ARS8yDJzg9gD4iQbhpKoSDEiLYnD`） |

---

## 直近完了 — 主要導線パフォーマンス改善 本番反映（2026-07-06）

**正本**: `docs/forge-changelog.md`（2026-07-06 エントリ）

| 項目 | 内容 |
|------|------|
| **本番反映** | ✅ 完了（Preview 確認 → main merge → Production deploy） |
| **同期 commit** | `e980842`（`origin/main` = `origin/preview/landing-01`） |
| **deploy ID** | `dpl_ARS8yDJzg9gD4iQbhpKoSDEiLYnD` |
| **コア機能 commit** | `46d40f3` までの一連（`122cb6b` で本番記録、`e980842` は changelog deploy ID 追記） |

### 実装済み（今後の前提）

| テーマ | 内容 |
|--------|------|
| **作品詳細 1件直取得** | `fetchPublicProjectById` / `useGameDetailProject` — catalog 全件待ちを廃止 |
| **タブ即時切替** | `useInstantQueryTab` + `history.replaceState`（Next navigation なし） |
| **横展開** | `/mypage`・`/studio/mypage` に instant tab + 遅延マウント |
| **みんなのFB スクロール** | タブ切替で上部へ戻る問題を修正（`preserve-scroll` + パネル `min-h`） |
| **ログイン入力保持** | `revalidatePath` 削除、controlled input、「ログイン中…」表示 |
| **GamesProvider 遅延** | グローバル devlog / release / support counts を `setTimeout(0)` で後追い |
| **基盤** | skeleton 化、`[forge:perf]` 計測、`ForgeTabPanel` keep-alive |

### 本番確認（オーナー実機）

- 作品詳細タブが Preview 同様に速いこと
- みんなのFBタブで上部へ戻らないこと
- `/mypage`・`/studio/mypage` タブが速いこと
- メールログイン時に入力欄が遷移前に消えないこと
- Xログイン導線が壊れていないこと

### 残課題（次フェーズ）

- **サイドバー遷移がまだ 1〜2秒**（`/home` `/search` `/mypage` `/community` 等）
- 原因候補: Shell のページごと再 mount、Next navigation、遷移先初期 fetch、GamesProvider 一括取得、auth/profile/getUser 系、prefetch 不足

### 次フェーズ候補

1. PlayerShell / StudioShell **共通 layout 化**
2. サイドバーリンクの **prefetch**
3. 遷移先 **初期 fetch の分解**
4. `/home` `/search` の **catalog 取得改善**

### 未移行（router.replace 監査）

- `creator-profile-real-view` / `developer-profile-v0-page` / `studio-project-detail-page` 等 — 次フェーズで検討

---

## 完了済み — X Auth 本番 GO（2026-07-06）

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

## Cursor 推奨 1 位（パフォーマンス本番反映後）

1. **サイドバー遷移パフォーマンス** — Shell 共通 layout 化、prefetch、初期 fetch 分解、`/home` `/search` catalog 改善
2. **X Auth フォロー** — unlink UI 方針 / `/players/[handle]` X 表示 / 開発者初回導線（別 TODO）
3. **公開FBカード** — 本番での表示・モデレーション運用確認
4. **改善ループ Studio** — `/projects/{id}/studio` 実機レビュー継続

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
