# Legal Gap Report — Forge Terms / Privacy vs current product (2026-08-13)

Source of truth (Production-facing):

| Document | Route | Component |
|---|---|---|
| 利用規約 | `/terms` | `components/terms-of-service-document.tsx` |
| プライバシーポリシー | `/privacy` | `components/privacy-policy-document.tsx` |

Contact constant: `lib/legal-routes.ts` → `forge.operation@gmail.com`  
Canonical domain: `https://forgeplace.app`

Draft replacements (Owner review only — **not** wired to routes):

- `docs/legal/2026-08-terms-draft.md`
- `docs/legal/2026-08-privacy-draft.md`
- `docs/legal/2026-08-change-summary.md`
- `docs/legal/2026-08-reconsent-recommendation.md`

## Findings

### F01 — Operator / corporate identity incomplete
- **current clause**: 「運営者：Forge 運営」; jurisdiction「運営者の所在地を管轄する…」without named entity / address
- **product reality**: Public brand Forge / forgeplace.app; contact email only
- **mismatch**: Users cannot identify the legal operator from the documents alone
- **severity**: High (legal/ops)
- **recommended change**: Owner supplies legal name, address, representative as needed under Japanese disclosure norms; **legal review recommended**

### F02 — Privacy still describes guest Feedback as an active path
- **current clause**: Privacy §1 / §3 describe guest FB, submitter_key Cookie,「初声」, guest aggregation
- **product reality**: Production guest write APIs return `guest_feedback_disabled` (`app/api/.../guest-feedback`, `guest-voice`). Feedback requires login
- **mismatch**: Privacy overstates guest write capability; Terms already lean login-required
- **severity**: High
- **recommended change**: State guest Feedback is **disabled** on Production; remove「初声」user-facing wording; keep historical data retention note if rows still exist

### F03 — 「初声」legacy wording in Privacy
- **current clause**: Privacy §1 item 3, §3 guest paragraphs
- **product reality**: UI copy rules ban 「声」 for user-facing; product uses フィードバック / FB
- **mismatch**: Legal copy lags UI glossary
- **severity**: Medium
- **recommended change**: Replace with フィードバック terminology in drafts

### F04 — 5 categories partially reflected in Terms, incomplete elsewhere
- **current clause**: Terms §1–2 mention five categories; Privacy still often frames「プレイ」
- **product reality**: `game` / `audio` / `asset` / `dev-tool` / `service-app` with labels ゲーム / 音楽・音声 / アセット / 開発ツール / サービス
- **mismatch**: Play-centric Privacy / some liability framing
- **severity**: Medium
- **recommended change**: Category-neutral verbs (試用・利用・閲覧) + explicit five-category list

### F05 — Roles: developer vs player vs both
- **current clause**: Terms define 開発者 / プレイヤー (notes クリエイター UI)
- **product reality**: Same account can be both; Studio + Player shells
- **mismatch**: Mild — definitions OK if clarified that roles are not mutually exclusive
- **severity**: Low–Medium
- **recommended change**: Explicit「同一ユーザーが両方の立場になりうる」

### F06 — Feedback reciprocity
- **current clause**: Terms §7 last paragraph (optional discovery nudge; not obligation)
- **product reality**: DB trigger `consider_feedback_reciprocity` only when actor has ≥1 `visibility='public'` project + developer_profiles; CTA `/creators/{actor}`; email template gated by prefs
- **mismatch**: Clause is directionally correct; should not imply return-FB obligation (already careful)
- **severity**: Low
- **recommended change**: Keep non-obligation language; optionally add「公開作品がない場合は通常のFB通知のみ」

### F07 — Messages / collab
- **current clause**: Terms §7-2; Privacy §1 item 5
- **product reality**: Shared pair/thread messaging (Player/Studio), context segments, transactional email for message categories
- **mismatch**: Mostly aligned; retention / moderation depth light
- **severity**: Medium
- **recommended change**: Clarify user responsibility, prohibited conduct, Forge not a party to deals; **legal review** on retention wording

### F08 — Usage relation boundary
- **current clause**: Terms §2 / §7-2 — not copyright assignment / license / fee contract
- **product reality**: Matches product intent
- **mismatch**: None material
- **severity**: Low (keep prominent)
- **recommended change**: Keep / strengthen examples (music, assets, tools, services)

### F09 — External publication links / not a binary host
- **current clause**: Terms §5–6 external URL responsibility
- **product reality**: Forge links out (itch, Unity Play, Steam, BOOTH, GitHub, arbitrary URL); not primary binary hosting
- **mismatch**: Could state more explicitly「原則としてバイナリホスティングサービスではない」
- **severity**: Medium
- **recommended change**: Add explicit non-hosting / no warranty of external availability/security

### F10 — UGC rights expansion (music / assets / tools / services)
- **current clause**: Terms §5, §9, §11 general IP
- **product reality**: Five categories increase third-party rights risk (samples, fonts, code, malware in tools)
- **mismatch**: Prohibitions mention malware/素材 but could be more category-aware
- **severity**: High
- **recommended change**: Expand warranties + prohibited list for audio/asset/dev-tool/service; platform display license for thumbnails/OGP; **legal review** on license grant breadth

### F11 — X / OAuth / profile
- **current clause**: Privacy mentions「外部アカウント情報」broadly
- **product reality**: X via Supabase Auth; profile handle / social links stored
- **mismatch**: Scope of OAuth data not itemized
- **severity**: Medium
- **recommended change**: Name X authentication + profile fields actually stored; **do not invent** unused scopes

### F12 — Notifications / watch / follow
- **current clause**: Sparse in Privacy §1 item 6; Terms little on watch
- **product reality**: In-app notifications; project watch (`project_watches`); creator follow; reciprocity; platform announcements; prefs include `watch-updates` (in-app). Watch update **email not** currently sent
- **mismatch**: Documents under-describe watch update notifications
- **severity**: Medium
- **recommended change**: Document in-app watch updates; clarify email only for gated categories unless Owner adds prefs later

### F13 — Email / Resend
- **current clause**: Privacy §7 mentions Resend
- **product reality**: Resend transactional; Production sender domain policy around `mail.forgeplace.app`; prefs for messages_collab / usage_relation / feedback_reciprocity etc.
- **mismatch**: Mostly OK; sender address should stay accurate to env
- **severity**: Low–Medium
- **recommended change**: Keep Resend; note preference gates; no marketing mail claim if none exists

### F14 — Processors (fact-checked from repo)
Confirmed in code/docs/env patterns:

| Processor | Use |
|---|---|
| Supabase | Auth, DB, Storage |
| Vercel | Hosting / Preview / Production |
| Resend | Transactional email |
| OpenAI | Voice-adoption matcher (optional live mode) |
| X (via Supabase Auth) | OAuth login / profile linkage |

Not found as product analytics: GA/gtag, PostHog, Sentry (do **not** invent).

- **severity**: Medium
- **recommended change**: Name these in Privacy; remove vague「アクセス解析」unless Owner confirms a tool

### F15 — Cookies / localStorage / analytics
- **current clause**: Privacy §5 Cookie +「アクセス解析ツール」
- **product reality**: Auth session cookies; localStorage for drafts/UI; guest submitter_key path exists in code but guest write disabled in Production; no confirmed third-party analytics SDK in app
- **mismatch**: Analytics claim may overstate
- **severity**: Medium
- **recommended change**: Limit to actual tech; mark analytics as「利用する場合」only if true, else remove affirmative claim

### F16 — Minors
- **current clause**: Terms §4; Privacy §12 — consent presumed if used
- **product reality**: No hard age gate in auth flow beyond R18 content localStorage patterns elsewhere
- **mismatch**: Presumption language may be aggressive under consumer/minor rules
- **severity**: High (legal)
- **recommended change**: **legal review recommended** — do not invent stricter age without Owner policy

### F17 — Moderation / prohibited content for tools/services
- **current clause**: Terms §9 includes malware
- **product reality**: Categories include dev-tool / service-app
- **mismatch**: Credential theft, phishing tools, harmful automation under-specified
- **severity**: Medium–High
- **recommended change**: Add explicit bans for credential theft, phishing, malware distribution via tools/services

### F18 — Block feature claimed
- **current clause**: Terms §7-2 block
- **product reality**: Prior audits suggested block UI incomplete / not fully shipped — **re-verify before publish**; if absent, remove or soften
- **severity**: Medium
- **recommended change**: Owner confirms block status; draft softens to「提供する場合」

### F19 — Domain / branding
- **current clause**: Contact email OK; no obsolete domain spotted in legal components
- **product reality**: forgeplace.app
- **mismatch**: Low
- **severity**: Low
- **recommended change**: Keep canonical URL in drafts header

### F20 — Version / re-consent fields absent
- **current clause**: effective/last-updated dates only; no `accepted_terms_version` in product
- **product reality**: No forced re-accept flow
- **mismatch**: Large refresh without versioning plan
- **severity**: Medium (product/legal process)
- **recommended change**: See re-consent recommendation doc — design only this phase

## Severity summary

| Severity | IDs |
|---|---|
| High | F01, F02, F10, F16 |
| Medium | F03, F04, F07, F09, F11–F15, F17, F18, F20 |
| Low | F05, F06, F08, F19 |

## Note
This is a **product/technical consistency** audit, not legal advice. Uncertain Japanese-law points are flagged for Owner + counsel.
