# サービスイン前 — production deploy 準備チェックリスト（Batch 1 正本）

**目的** — 本番反映（`main` push / production deploy）の直前に、**本当にまずいものだけ**を潰す。リファクタ・大規模整理は別バッチ。

**関連正本**

| ファイル | 用途 |
|---|---|
| `docs/forge-triage-operations.md` §8 | Preview / main 同期・デプロイ手順 |
| `docs/forge-triage-operations.md` §10.2 | **必ず停止**する 9 条件 |
| `docs/production-mode-audit.md` | mock / 本番分岐の禁止ルール・6 URL |
| `docs/mvp-production-e2e-checklist.md` | deploy **後**の E2E（通知・読了・プレイ導線） |
| `docs/supabase-post-migration-checklist.md` | migration 適用直後の動作確認 |
| `docs/parallel-execution-checklist.md` | Vercel env・PLAYER_VISIBLE・OpenAI |

---

## 0. URL 運用（必須）

| 種別 | URL | 用途 |
|---|---|---|
| **固定 Preview（オーナー確認用）** | https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app | 実装後の目視・ログイン確認。**毎回これだけ** |
| **本番** | https://forge-flame-gamma.vercel.app | production deploy **後**のみ |
| **禁止** | `forge-xxxxx-...vercel.app` 等の per-deploy URL | origin が違い cookie / session が共有されない |

Cursor のブラウザ確認・オーナー報告は **固定 Preview URL** を使う。per-deploy URL での確認は **無効** とみなす。

---

## 1. 固定 Preview で確認済み（2026-07 時点・Batch 0 まで）

オーナーが固定 Preview で **確認済み** と記録している項目。本番 GO 前に再確認が必要なものは §5 を参照。

| テーマ | 確認 URL / 観点 | 状態 |
|---|---|---|
| UI 文言（実装用語除去） | 全体 | 確認済 |
| Coming Soon 統一 | OAuth・SDK・空状態パネル | 確認済 |
| Studio 認証ループ | `/studio` ↔ `/login` | 確認済 |
| 公開カタログ分離 | `/home`・`/search` — 実公開作品のみ | 確認済 |
| ゲーム詳細 hotfix | `/games/[実 UUID]` — devlog・shell | 確認済 |
| Phase 3 PR1 | `/studio` home viewModel | 確認済 |

**Batch 1 で追加確認** — `/home` mock 経路の整理、`/games/[id]` プレイ導線（実作品・playUrl なし時のスタブ抑止）。commit 後に固定 Preview で再確認。

---

## 2. production deploy 前の停止条件（§10.2 正本）

以下に該当する作業は **GPT判断用メモ**（`docs/gpt-run-decision-memo.md`）を出して停止。**Batch 1 では本番 deploy 禁止**。

| 停止 | 例 |
|---|---|
| 課金発生 | OpenAI 本番大量実行、Supabase/Vercel プラン変更 |
| 新規 API 契約 | 未使用 SaaS の signup / API key 新規発行 |
| **本番公開** | `main` merge + production deploy、ユーザー向け GO |
| **PLAYER_VISIBLE=true** | 採用 UI の本番表示 ON |
| DB 破壊変更 | DROP、列削除、既存行が壊れる CHECK 変更 |
| 既存データ移行 | バックフィル、一括 UPDATE、推測補完 |
| Forge 原典変更 | `docs/forge-principles.md` の意味変更 |
| ロードマップ優先順位変更 | 次テーマ順位の確定変更 |
| 不可逆作業 | force push、本番データ削除 |

**deploy 手順（GO 後）** — `docs/forge-triage-operations.md` §8:

1. `preview/landing-01` で実装 → push → **オーナーが固定 Preview 確認**
2. `main` merge + push（本番 deploy）
3. **必ず** `preview/landing-01` を `main` に fast-forward + push（両ブランチ同一 commit）

---

## 3. migration 適用状況の確認ポイント

**適用方法** — Supabase Dashboard SQL（`docs/supabase-dashboard-migration-guide.md`）。CLI より可視性優先。

| 確認 | 方法 |
|---|---|
| 最新 migration ファイル一覧 | `supabase/migrations/` と Dashboard 適用履歴の突合 |
| 009 / 010（通知・読了） | `docs/mvp-production-e2e-checklist.md` §0 の SQL |
| 011 以降（voice adoption 等） | 該当 runbook（例: `docs/voice-adoptions-staging-011-apply.md`） |
| 適用直後の smoke | `docs/supabase-post-migration-checklist.md` |

**ルール** — migration **作成**は Cursor 可。**Dashboard への本番適用**はオーナー操作。破壊的 migration は §2 停止。

---

## 4. env / インフラ確認ポイント

### 4.1 Vercel（プロジェクト **forge**）

| 変数 | Production 期待 | メモ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 設定済 | 未設定 → 画面上部エラー |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 設定済 | |
| `SUPABASE_SERVICE_ROLE_KEY` | 設定済 | サーバー専用 |
| `NEXT_PUBLIC_VOICE_ADOPTION_PLAYER_VISIBLE` | **`false`** | adoption UI 非表示（GO まで維持） |
| `VOICE_ADOPTION_MATCHER_MODE` | `fixture` または live 方針に従う | `docs/parallel-execution-checklist.md` |
| `OPENAI_API_KEY` | Edge / matcher live 時のみ | Vercel クライアントに不要なら未設定可 |
| `NEXT_PUBLIC_FORGE_PRODUCTION_MODE` | 本番 hostname では通常不要 | Preview に付いていても `VERCEL_ENV` で判定 |

Preview / Production **両方**に Supabase 系は揃える。env 変更後は redeploy。

### 4.2 公開環境モード（mock 非表示）

正本: `lib/production-mode.ts` + `ForgeDeploymentProvider`（`lib/forge-deployment-context.tsx`）

- 本番 hostname / `VERCEL_ENV=production` → mock 非表示
- UI は `useHideV0MockContent()` を使い **SSR/CSR 一致**（`shouldHideV0MockContent()` の client 直呼びは避ける）

**ローカル本番同等 build**

```powershell
$env:NEXT_PUBLIC_FORGE_PRODUCTION_MODE="true"; npm run build
```

### 4.3 自動ガード（deploy 前に Cursor が実行）

```bash
npm run verify:production-mode-guards
npm run verify:submit-auth-utils
npm run build
```

---

## 5. production deploy 後に確認すべき画面

**正本 E2E** — `docs/mvp-production-e2e-checklist.md`（プレイ → 初声 → 通知 → 読了）

**最低限の目視（`docs/production-mode-audit.md` 6 URL）**

| # | URL | 観点 |
|---|---|---|
| 1 | `/home` | 公開作品のみ。mock スライド・サンプルタイトルが混ざらない |
| 2 | `/search` | 同上 |
| 3 | `/games/[公開作品 UUID]` | 実データ・プレイ URL・devlog・FB タブ |
| 4 | `/games/[存在しない id]` | 404 / 見つかりません（mock 詳細が出ない） |
| 5 | `/studio` / `/studio/mypage` | 実作品グリッド・認証 |
| 6 | `/mypage?tab=following` | フォロー（本番は Supabase 正本） |

未ログイン: `/`・`/home`・作品詳細の**閲覧**は可能。プレイ以降は `/login` へ（モーダル阻害なし）。

---

## 6. rollback / revert 判断

| 状況 | 推奨 |
|---|---|
| 直前 deploy のみ不具合 | Vercel → Deployments → 直前の成功 deploy を **Promote to Production** |
| コード revert が必要 | `git revert <commit>` を `main` に merge（force push 禁止） |
| migration 起因 | **新しい additive migration で修正**。DROP / 列削除は最終手段（§2 停止） |
| データ破損の疑い | deploy 停止 → Supabase バックアップ / Table Editor 確認 → オーナー判断 |

本番 push 後は §8.2 に従い `preview/landing-01` も同じ revert commit に揃える。

---

## 7. Batch 1 スコープ外（後回し）

- `/home` 大規模 viewModel 化
- `/games/[id]` 大規模構造整理・未使用 `GameDetailPageClient` 削除
- Phase 3 PR2 / `StudioOwnedProjectsSection` viewModel
- public catalog 契約変更・games-provider 大変更
- 認証フロー再設計・Coming Soon 文言の全面やり直し・UI デザイン変更

---

## 8. 記録欄（deploy GO 時にオーナーが追記）

```
deploy commit:
固定 Preview 最終確認日:
本番 deploy 日時:
migration 最終適用（番号）:
PLAYER_VISIBLE:
残課題:
```
