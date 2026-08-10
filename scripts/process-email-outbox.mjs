/**
 * Manually invoke the deployed transactional email outbox worker.
 *
 * Required:
 *   FORGE_APP_URL=https://<deployment-host>
 *   EMAIL_OUTBOX_SECRET=<secret> (or CRON_SECRET)
 *
 * This script only calls the application endpoint. It never connects directly
 * to Supabase.
 */
const baseUrl = process.env.FORGE_APP_URL?.trim();
const secret =
  process.env.EMAIL_OUTBOX_SECRET?.trim() || process.env.CRON_SECRET?.trim();

if (!baseUrl) {
  throw new Error("FORGE_APP_URL is required");
}
if (!secret) {
  throw new Error("EMAIL_OUTBOX_SECRET or CRON_SECRET is required");
}

const endpoint = new URL("/api/internal/process-email-outbox", baseUrl);
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    authorization: `Bearer ${secret}`,
  },
});
const body = await response.text();

if (!response.ok) {
  throw new Error(`email outbox worker returned ${response.status}: ${body}`);
}

console.log(body);
