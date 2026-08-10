# Staging real-email E2E

Automated path (preferred):

See **`docs/preview-real-email-e2e.md`**.

```powershell
npm run verify:preview-real-email-guards
npm run verify:preview-real-email
```

- Recipient is fixed to `forge.operation@gmail.com`
- Permanent Staging operation + actor users (no per-run registration)
- Real business event → outbox → Resend → Gmail readonly (after OAuth bootstrap)
- **Do not run against Production**

Owner one-time setup (Resend local secret + Gmail OAuth) is listed in that doc. After setup, do not ask Owner to eyeball each mail.
