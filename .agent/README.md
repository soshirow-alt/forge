# `.agent/` — Cursor × Codex review workspace

Per-run evidence for the independent review loop. **Directories are committed; contents are not**
(see `.gitignore`). Permanent rules and tooling: `AGENTS.md`,
`.cursor/rules/codex-independent-review.mdc`, `scripts/agents/`.

| Path | Contents | Committed |
|---|---|---|
| `tasks/` | `<yyyy-MM-dd-HHmm>-<slug>.md` — owner instruction (task id = filename without `.md`) | no |
| `reviews/` | Formal review + attempt markers (below) | no |
| `runtime/` | Per-run prompt / Codex IO / verify notes (below) | no |

## reviews/ (ignored except `.gitkeep`)

| Artifact | Example name | Meaning |
|---|---|---|
| Formal review JSON | `<task-id>-round-<n>.json` | Validator-accepted Codex verdict only |
| Normalized review | `<task-id>-round-<n>.normalized.json` | Validator rewrite for tooling |
| Round attempt marker | `<task-id>-round-<n>.attempt.json` | Round consumption record (`started` / `reviewed` / `blocked`) |

- Attempt markers are **not** formal reviews. Invalid / failed Codex output must not be saved as `<task-id>-round-<n>.json`.
- `blocked` or unfinished `started` ends that **task id** (start a new task to continue).
- Only `reviewed` + valid `FAIL_FIXABLE` formal JSON may advance to the next round on the same task.
- Distinct task ids never share attempt/review filenames; same task + round + concurrent runs use different `run_id` values in runtime (PID + nonce).

## runtime/ (ignored except `.gitkeep`)

Run id shape: `<task-id>-r<n>-p<pid>-<nonce>`

| Artifact | Example |
|---|---|
| Assembled prompt | `<run-id>-prompt.md` |
| Prompt archive sent to Codex | `<run-id>-codex-prompt.md` |
| Codex last message | `<run-id>-last-message.txt` |
| Diagnostics | `<run-id>-diagnostics.txt` |
| Stdout / stderr | `<run-id>-stdout.txt`, `<run-id>-stderr.txt` |
| Invalid raw (not formal) | `<run-id>-review-raw.json` |
| Immutable base lock | `<task-id>.review-base-sha` |
| Verify note / logs | `verify-note.txt`, operator-chosen `*.log` |

Dry-run writes a prompt and exits `40` **without** creating an attempt marker (Codex was not started).

Why not committed: per-task machine logs, full diffs in prompts, change every round. Share by path with the owner, not by git history.

Flow: `docs/agent-context/cursor-codex-review-flow.md`
