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
9. 最大 3 round。Round 4 は常に拒否（`OwnerApprovedRound4` 等の例外経路は存在しない）
10. **Round 3 FAIL_FIXABLE 終端後**に findings を修正し working tree が変わった場合のみ、**1 回だけ** `review_kind: remediation` の新 task を開始できる（これは Round 4 ではない）。parent Round 1–3 履歴を prompt に含め、parent あたり remediation は最大 1。remediation も最大 3 round。さらに別 task で連鎖してはならない
11. task id を変えただけの同一差分の再投入（通常 task でのカウンターリセット）は禁止
12. remediation Round 3 FAIL_FIXABLE 終端後に、固定した残 finding だけを直したとき、Owner は **1 回限り** `review_kind: terminal_closure` を開始できる（Round 4 / 第二 remediation / 再review ではない）。Codex は 1 回のみ。PASS 以外は完全 STOP（自動修正・再実行禁止）
13. terminal_closure が **review harness 欠陥のみ**で無効化された場合（`INVALIDATED_BY_REVIEW_HARNESS_DEFECT`）、Owner は **1 回限り** replacement closure（`replaces_task_id` + `replacement_reason: review_harness_scope_lock_defect`）を実行できる。製品 finding の追加修正による再挑戦ではない。replacement の再replacement は禁止

## Task front matter（remediation）

```yaml
---
review_kind: remediation
parent_task_id: 2026-08-10-0042-example-parent
remediation_depth: 1
remediation_changed_paths:
  - path/to/fixed-file.ts
related_blocked_task_ids:
  - 2026-08-10-0237-invalid-reset-attempt
---
```

## Task front matter（terminal_closure）

```yaml
---
review_kind: terminal_closure
parent_task_id: 2026-08-10-0042-example-parent
remediation_parent_task_id: 2026-08-10-0318-example-remediation
closure_depth: 1
closure_finding_ids:
  - components/example.tsx
closure_changed_paths:
  - components/example.tsx
# optional — harness-defect replacement only:
# replaces_task_id: 2026-08-10-0932-example-invalidated-closure
# replacement_reason: review_harness_scope_lock_defect
---
```

通常 task は front matter 省略可（`review_kind: normal`）。

Scope lock: closure 開始時に allowlist 外の dirty 変更について **path + content sha256 + porcelain** を baseline 化し、終了時に再計算して差分があれば fail-closed BLOCK（path 存在だけでは PASS にしない）。

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
