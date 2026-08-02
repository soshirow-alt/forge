# Cursor × Codex 独立レビュー（通常フロー）

Forge の実装は Cursor が行い、**Codex CLI が read-only で独立レビュー**する。PASS の前に commit / push しない。

## 公式呼出（Windows PowerShell 5.1）

`powershell.exe -File` では `-VerifyLog a,b` が **1 要素の文字列**になり得る。複数ログは **call operator + 配列**を使う（これが公式契約）:

```powershell
& .\scripts\agents\run-codex-review.ps1 `
  -TaskFile .agent\tasks\<task>.md `
  -BaseSha 9270d9928aa773d3f9073202f8f3c5ee33839b4e `
  -VerifyNoteFile .agent\runtime\verify-note.txt `
  -VerifyLog @('.agent\runtime\verify-tsc.log', '.agent\runtime\verify-build.log')
```

- Round 1 は **必ず** 40 文字の `-BaseSha`（symbolic ref / branch / short SHA は拒否）
- BaseSha は `.agent/runtime/<task>.review-base-sha` に固定。以降の round も同じ SHA
- comma-separated の単一 `-VerifyLog` 文字列は分割しない（USAGE で失敗）
- `npm run review:codex -- ...` は引数転送が壊れやすいので、上記の call operator を正とする

## 手順

1. Cursor が実装（着手前に `.agent/tasks/<yyyy-MM-dd-HHmm>-<slug>.md` を保存）
2. verify を実行（結果は `.agent/runtime/` へ）
3. 上記公式呼出で Codex read-only レビュー
4. Codex 起動直前に `.agent/reviews/<task>-round-<n>.attempt.json`（`started`）を書く
5. valid JSON のみ formal review として保存し attempt を `reviewed` に更新
6. Codex 失敗 / invalid JSON / validator reject → attempt `blocked`、formal review は作らない、**task 終端**
7. `FAIL_FIXABLE` のみ同一 task の次 round へ
8. `PASS` / `NEEDS_OWNER_DECISION` / `BLOCKED`（formal）も task 終端
9. 最大 3 round。Round 4 は常に拒否

## Exit code

| Code | Meaning |
|---|---|
| 0 | PASS |
| 10 | FAIL_FIXABLE |
| 20 | NEEDS_OWNER_DECISION |
| 30 | BLOCKED |
| 40 | dry-run（Codex 未実行・attempt なし。PASS ではない） |
| 2 | usage |

## 採用する脅威モデル（ゲート判定の対象）

- Cursor の実装ミス
- staged / unstaged / untracked の取得不備・レビュー漏れ
- test / verify 不足
- JSON verdict と validator の不整合
- Codex 未実行で PASS になる経路
- round 上限回避（失敗 attempt の未記録含む）
- `.env*` や通常 secret の prompt 混入（template 本文含む）
- ambient Codex user config / MCP / 不要 tool
- secret 環境変数の不必要な継承
- Production / DB write 権限
- PASS 前 commit / push
- 通常利用における明確な shell 引数ミス

## 対象外（これだけで FAIL / high にしない）

- 実行中の悪意ある junction 差し替え
- 悪意ある ReparsePoint を含む repository 前提
- PATH / npm の能動的偽装
- OS 管理者権限を持つ攻撃者
- Codex / Git / Node 本体の改ざん
- PowerShell だけの完全 TOCTOU 防御
- ローカルマシン全体を信用できない前提

成果物の命名: `.agent/README.md`
受け入れセルフテスト: `npm run verify:codex-review-selftest`
