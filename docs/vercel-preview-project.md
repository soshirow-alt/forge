# Vercel Preview 正本プロジェクト

| 項目 | 値 |
|---|---|
| 正本 Vercel project | **`forge`** (`prj_jqvcGI0YVFVZodxRZRYRignbyLxQ`) |
| ローカル link | `.vercel/project.json` → `projectName: forge`（gitignored） |
| Preview branch | `preview/landing-01` |
| Preview alias（オーナー確認 URL） | `forge-git-preview-landing-01-soshirow-alts-projects.vercel.app` |
| Production Web | `forge` の Production（`forge-flame-gamma.vercel.app`） |

## 正しい Deploy / alias の流れ

```text
git push origin preview/landing-01
  → Vercel Git Integration が project forge に Preview を build
  → Ready 後、自動 branch alias が最新 Ready deploy を指す
  → オーナーは上記 alias URL だけを見る
```

- Preview 完了条件は **単発 deploy URL（`forge-<hash>-…`）の Ready ではない**。
- **必須**: `node scripts/verify-preview-branch-alias.mjs` が PASS（alias 上の JS が期待 bundle）。
- 任意: `COMPARE_DEPLOY_URL=<最新 Ready の unique URL>` を付けて fingerprint 一致も確認。

## 禁止・注意

- **`forge-app`** (`prj_lpXFrMOxOJkeXmKrbcDUXvz9OIzb`) は **同一 GitHub repo の二重 Git 連携用ではない**。2026-07-16 に `soshirow-alt/forge` から **Git disconnect** 済み（プロジェクト削除はしない）。
- それでも `forge-app-git-preview-landing-01-…` が残って古い bundle を返すことがある。**オーナー確認 URL は forge 側 alias のみ**。forge-app の残骸 alias は見ない／Domains から削除してよい。
- Cursor / CLI は必ず repo ルート（`.vercel` → `forge`）で `vercel` を実行する。別 cwd で `forge-app` に link しない。
- push 後に cards API が 503 のときは、alias が `forge-app` 側 deploy を指していないか先に確認する。
- **`vercel alias set <deployment> forge-git-preview-landing-01-…` をしない**。自動 git branch hostname を特定 deploy に固定し、以降 push しても alias が追従しなくなる。
- Preview 反映は **Git push → Git Integration** を正とする。CLI 単発 `vercel deploy`（git metadata なし）を Preview 完了扱いにしない。

## alias が最新に追従しないとき（Dashboard・一度きり）

症状: unique deploy URL は新しいが、`forge-git-preview-landing-01-…` だけ古い commit のまま。

1. Vercel → **forge** → Deployments → branch `preview/landing-01` の最新 Ready を開く
2. Git metadata が `preview/landing-01` であること（CLI detached でないこと）を確認
3. **Settings → Domains** で `forge-git-preview-landing-01-soshirow-alts-projects.vercel.app` を探す
4. 割当を **特定 Deployment 固定** ではなく **Git Branch = `preview/landing-01`** にする（または誤った手動 alias を外して自動 branch alias に戻す）
5. 必要なら最新 Ready を Redeploy（Use existing Build Cache オフ可）
6. `node scripts/verify-preview-branch-alias.mjs` で PASS を確認

これで以後は push のたびに alias が自動更新され、毎回の手動付け替えは不要。

## 確認コマンド

```bash
# link 先
type .vercel\project.json

# オーナー確認 URL の bundle（Preview 完了の正）
node scripts/verify-preview-branch-alias.mjs

# 最新 Ready unique URL と fingerprint 一致（任意）
COMPARE_DEPLOY_URL=https://forge-<hash>-soshirow-alts-projects.vercel.app \
  node scripts/verify-preview-branch-alias.mjs

# 認証がある場合のみ
npx vercel ls forge
npx vercel alias ls
```
