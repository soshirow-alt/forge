# Cursor ALLOW と Forge Production GO

## 用語

| 用語 | 意味 |
| --- | --- |
| **Cursor ALLOW** | Run Mode / `permissions.json` / `sandbox.json` により承認カードなしでツール実行できる**技術的許可**（best-effort） |
| **通常依頼の承認範囲** | 調査〜編集〜verify〜local commit〜Preview push/deploy/smoke。追加の commit/Preview GO 再確認は不要 |
| **Forge Production GO** | main push・Production deploy・Production DB/Storage write・Production env・secrets・不可逆の**直前確認** |

## 設定場所

- `.cursor/permissions.json` — `terminalAllowlist` + Auto-review `autoRun`
- `.cursor/sandbox.json` — sandbox ネットワーク（`insecure_none` 禁止）
- `.cursor/rules/stall-detection-resume.mdc` — 工程の自律範囲と停止条件

Run Mode は **Auto-review を維持**（Run Everything にしない）。

## 素通りする範囲

- ローカル調査・編集・一時 `.tmp-*`（リポジトリ外削除は不可）
- typecheck / lint / test / build / verify / check / ローカル dev server
- git add / commit / `preview/landing-01` push
- Preview deploy・inspect/logs・smoke
- Staging Supabase（`vuqpwvjvgyxffmvpfrxo`）の read/write・migration・seed・backfill・Storage
- Production Supabase（`bpnisgzxuwdxelhnduuf`）の **read-only**（SELECT / REST GET / read-only RPC / 件数・行特定）

## 止まる範囲（手動確認）

- `git push origin main` / main merge の remote 反映
- force push / `git reset --hard` / `git clean`
- Production deploy / promote / `--prod`
- Vercel Production env 変更
- Production Supabase write / migration / seed / backfill / restore / Storage write
- secrets / JWT / service role / `.env` の表示・コピー
- `npm install` / package 追加・更新・削除
- リポジトリ外削除・その他の不可逆 Production 操作

Production write が必要なときは対象と対象行を提示してから確認する。
