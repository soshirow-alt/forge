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

## alias が最新に追従しないとき（Dashboard / CLI）

### 確定しやすい症状（2026-07-22 実測）

- unique deploy URL は新しいが、`forge-git-preview-landing-01-…` だけ古い commit のまま
- `GET /v2/aliases/<hostname>` の `deploymentId` が旧 Ready のまま（`updatedAt` も止まる）
- 新 Ready は `aliasAssigned: true` / `automaticAliases` に hostname があるのに、`GET /v2/deployments/<id>/aliases` が **空**
- カスタム Domains 一覧は 0 件でも起きうる（これは Domain ではなく **deployment alias** の sticky）

### 復旧（自動追従を戻す・推奨）

1. **本番 alias / Production deploy は触らない**
2. `preview/landing-01` → `main` の **open PR があれば閉じる**（PR 紐付け中は branch alias 再付与が不安定になりうる）
3. sticky になった自動 hostname を外す（恒久固定の `alias set` ではない）:

```bash
npx vercel alias rm forge-git-preview-landing-01-soshirow-alts-projects.vercel.app --scope soshirow-alts-projects --yes
```

4. `git push origin preview/landing-01`（空でも可）で Git Integration の新しい Ready を作る
5. 確認:

```bash
npx vercel inspect forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
# Aliases に当該 hostname が出ること / id が最新 Ready であること
npm run verify:preview-branch-alias
```

6. **追従の再確認**: もう一度 push し、alias の `deploymentId` がさらに新しい Ready へ移動すること

### やってはいけないこと

- 原因不明のまま `vercel alias set <最新> forge-git-preview-landing-01-…` だけして終わり（**手動固定が再発**しうる）
- Production / `forge-flame-gamma` / main 向け alias を触る

### Domains 画面を使う場合

Settings → Domains に hostname が載っているときだけ、Git Branch=`preview/landing-01` へ付け替える。載っていなければ上記の alias rm → Git push が正。

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
