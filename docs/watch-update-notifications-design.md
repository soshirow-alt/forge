# Watch update notifications — Current / Gap / Recommended（2026-08-13）

## Current

- Toggle: `addProjectWatch` / `removeProjectWatch` → `project_watches`
- Fanout: **client-side** in `components/games-provider.tsx` `addDevlog` after successful publish/devlog
- Types: `version_published` | `devlog` | `confirmation_request`
- Pref gate: player `watch-updates`
- Email: **none** for watch updates
- Self excluded; owner INSERT RLS requires recipient is watcher (or confirmation audience RPC)

## Staging permission (read-only MCP 2026-08-13)

`project_watches` grants for `authenticated`: SELECT yes; **INSERT/DELETE no** → watch toggle broken until GRANT restored.  
RLS policies for own insert/delete/select + owner read exist.

## Production permission

Cursor has no Production MCP write/read automation in this task beyond Owner SQL.  
Owner should run `docs/legal/../` → use:

`scripts/production-rollout/2026-08/read-only-audit-project-watches-grants.sql`

## Gaps addressed in app (this branch)

1. Confirmation early-return skipped all watcher updates → **split recipients** (`selectWatchUpdateRecipientIds`)
2. `notifyEnabled===false` skipped all updates → **only skips confirmation**
3. Notif failure could fail whole `addDevlog` → **soft-fail** after successful publish
4. Game-only copy → **category-aware** messages / mypage CTA
5. No dedupe → **coalesce_key** + migration **103** unique partial index; per-recipient insert so one conflict does not abort peers
6. Watch toggle used `upsert` (needs UPDATE) → **INSERT** + treat duplicate PK as success; migration **102** restores INSERT/DELETE

## Remaining (migration / later)

| Item | Need |
|---|---|
| GRANT INSERT/DELETE on `project_watches` | Migration `102_…` — Owner apply Staging+Prod |
| Unique watch-update coalesce | Migration `103_…` — Owner apply |
| Server-side fanout trigger/RPC | Optional hardening; not required if soft-fail + coalesce accepted |
| Watch-update email | New pref category + migration — design only unless Owner asks |
| Full Postgres gate for 102/103 | Owner/local harness — Cursor did not claim DB PASS |

## Reliability stance (formal)

「公開は成功したが通知が消えた」は **許容（best-effort）**。UIは公開成功を優先。ログに `[watch-notify]` を残す。厳密 exactly-once が必要なら server trigger + outbox を次フェーズで。
