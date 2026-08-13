# Feedback reciprocity — Phase 1 fact sheet (2026-08-13)

## Eligibility (server)

`consider_feedback_reciprocity(actor, target_project)` via triggers on `project_feedback` / `project_voice_responses` (migrations 093/095).

Requires ALL of:

- target project exists, `visibility = 'public'`
- actor ≠ owner
- not blocking
- `actor_has_public_project(actor)` → ≥1 project with `visibility='public'`
- `developer_profiles` row for actor

Then inserts/updates `user_notifications.type = 'feedback_reciprocity'` with coalesce `feedback-reciprocity:{owner}:{actor}`, optional email enqueue (`feedback_reciprocity` pref).

## CASE matrix (owner of work B)

| Case | Actor A | Reciprocity notif/email | Normal FB path |
|---|---|---|---|
| A | ≥1 public project | Yes (+ profile CTA `/creators/{A}`) | Yes (`voice_received` on voice insert; detailed-only may differ) |
| B | no projects | No | Yes only |
| C | draft/private only (0 public) | No | Yes only |
| D | multiple public | Yes (same as A; CTA is profile not a specific project) | Yes |

## No-project UX (important)

- Creator gets **normal Feedback notification only** (when voice/feedback path fires)
- **No** reciprocity notification / email
- Profile reciprocity CTA is not added
- FB content itself is **not** demoted in listing/ranking by this feature
- Forge treats feedback without public works as valuable; reciprocity is optional rediscovery, not status

## Guest

Production APIs: `guest_feedback_disabled`. No reachable guest reciprocity path. Dead guest write routes remain code-level hard-stops.

## Judgment

Behavior matches product intent (non-obligatory rediscovery). **No code change** in Phase 1.

Soft issues (Owner optional later): hidden creator profile still eligible if public projects exist; detailed-only FB without voice may yield no owner `voice_received` while reciprocity still may fire from `project_feedback` trigger — verify product preference if needed.
