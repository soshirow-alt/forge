# Vercel Preview 正本プロジェクト

| 項目 | 値 |
|---|---|
| 正本 Vercel project | **`forge`** (`prj_jqvcGI0YVFVZodxRZRYRignbyLxQ`) |
| ローカル link | `.vercel/project.json` → `projectName: forge`（gitignored） |
| Preview branch | `preview/landing-01` |
| Preview alias | `forge-git-preview-landing-01-soshirow-alts-projects.vercel.app` |
| Production Web | `forge` の Production（`forge-flame-gamma.vercel.app`） |

## 禁止・注意

- **`forge-app`** (`prj_lpXFrMOxOJkeXmKrbcDUXvz9OIzb`) は **同一 GitHub repo の二重 Git 連携用ではない**。2026-07-16 に `soshirow-alt/forge` から **Git disconnect** 済み（プロジェクト削除はしない）。
- Cursor / CLI は必ず repo ルート（`.vercel` → `forge`）で `vercel` を実行する。別 cwd で `forge-app` に link しない。
- push 後に cards API が 503 のときは、alias が `forge-app` 側 deploy を指していないか先に確認する。

## 確認コマンド

```bash
# link 先
type .vercel\project.json

# 最新 Preview が forge か
npx vercel ls forge
npx vercel alias ls   # landing-01 → forge-*.vercel.app
```
