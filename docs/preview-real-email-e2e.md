# Preview real transactional email E2E

## Commands

- `npm run verify:preview-real-email-guards` — deterministic guards (no network)
- `npm run verify:preview-real-email` — Staging business event → outbox → Resend (1 mail to operation inbox) → optional Gmail poll
- `npm run verify:preview-real-email-matrix` — smoke wrapper (`--full` reserved for extended events)
- `npm run ops:bootstrap-gmail-e2e-oauth` — one-time Gmail readonly OAuth

Diagnostics only (no Resend):

```powershell
npx --yes tsx scripts/staging-only/verify-preview-real-email.ts --through-outbox
```

## Local secrets

Copy `scripts/staging-only/preview-e2e.env.example` → `.env.preview-e2e.local` (gitignored).

Required for full real send:

- Staging Supabase URL/ref `vuqpwvjvgyxffmvpfrxo`
- `FORGE_PREVIEW_E2E_EMAIL` / `FORGE_PREVIEW_E2E_PASSWORD` (Forge Auth password, not Google)
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (real values; placeholders like `[SENSITIVE]` are rejected)
- `NEXT_PUBLIC_SITE_URL` = Preview alias

Recipient allowlist is hard-coded to the operation inbox (`forge.operation@gmail.com`).

Permanent users (not cleaned up):

- Operation: `forge.operation@gmail.com` / display **Forge Operation**
- Actor: `forge.e2e.actor.staging@example.invalid` / display **Forge E2E Actor**

## Smoke business path

1. Actor `create_collab_consultation` → operation user  
2. `consultation_new` notification  
3. `collab_consultation_new` outbox row (recipient allowlisted)  
4. Existing email worker + Resend adapter processes **that one row**  
5. Optional Gmail readonly poll + content/CTA/privacy asserts  
6. Cleanup consultation / outbox only (users kept)

## Gmail OAuth (Owner one-time)

1. Google Cloud console: OAuth client with redirect `http://127.0.0.1:53682/oauth2callback`
2. Enable Gmail API
3. Put `GMAIL_E2E_CLIENT_ID` / `GMAIL_E2E_CLIENT_SECRET` into `.env.preview-e2e.local`
4. Run `npm run ops:bootstrap-gmail-e2e-oauth` and approve as `forge.operation@gmail.com`
5. Refresh token is saved locally (never committed)

Scope: `https://www.googleapis.com/auth/gmail.readonly` only.

After that, `verify:preview-real-email` polls Gmail automatically. Do not ask Owner to eyeball each mail.

## Safety

- Production Supabase URL → hard BLOCK
- Non-allowlisted recipient → hard BLOCK
- Multiple recipients → hard BLOCK
- Private consultation body must not appear in email
- CTA must not point at Production host
- No mail send/delete/archive on Gmail (readonly)
- Production / `main` are out of scope for this infrastructure

## Preference E2E

```powershell
npm run verify:email-notification-prefs
npm run verify:email-notification-prefs-e2e
```

Covers master/category OFF, send-time `suppressed`, and re-ON without backfill.

## Resend on Preview runtime

Vercel Preview scope already has `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (Hidden). Prefer smoke via Preview runtime + `after()` kick when possible. Local `[SENSITIVE]` redaction does not mean Preview lacks secrets.

`npm run verify:preview-real-email` defaults to:

1. Actor session cookie against Preview alias
2. `POST /api/collab/consultations` (real business mutation)
3. Wait for Preview `after()` worker to mark outbox `sent`

Use `--local-resend` only when deliberately testing with local Resend secrets.
Use `--through-outbox` to stop before provider send.
