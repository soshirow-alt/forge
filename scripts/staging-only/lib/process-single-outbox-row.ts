/**
 * Process a single transactional_email_outbox row with Resend.
 * Hard-blocks non-allowlisted recipients.
 */

import { createClient } from "@supabase/supabase-js";
import {
  createSupabaseEmailOutboxDeps,
  processEmailOutboxRows,
  type EmailOutboxRow,
} from "@/lib/email-outbox-worker";
import {
  assertAllowedRecipient,
  assertStagingOnly,
  requireEnv,
  siteUrl,
} from "./preview-e2e-env";

export async function processSingleOutboxRow(input: {
  env: Record<string, string>;
  outboxId: string;
}): Promise<{ sent: boolean; toEmail: string; templateKey: string }> {
  assertStagingOnly(input.env);
  // Ensure transactional email builder uses Preview CTA host.
  process.env.NEXT_PUBLIC_SITE_URL = siteUrl(input.env);
  process.env.RESEND_API_KEY = requireEnv(input.env, "RESEND_API_KEY");
  process.env.RESEND_FROM_EMAIL = requireEnv(input.env, "RESEND_FROM_EMAIL");

  const url = requireEnv(input.env, "NEXT_PUBLIC_SUPABASE_URL");
  const service = requireEnv(input.env, "SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("transactional_email_outbox")
    .select("id, to_email, template_key, payload, attempts, status")
    .eq("id", input.outboxId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("outbox row not found");

  assertAllowedRecipient(String(data.to_email), input.env);

  if (data.status === "sent") {
    return {
      sent: true,
      toEmail: String(data.to_email),
      templateKey: String(data.template_key),
    };
  }

  const row: EmailOutboxRow = {
    id: String(data.id),
    to_email: String(data.to_email),
    template_key: String(data.template_key),
    payload: data.payload,
    attempts: Number(data.attempts ?? 0),
  };

  // Reset failed/dead for controlled one-shot retry on this row only.
  if (data.status !== "pending" && data.status !== "failed") {
    throw new Error(`outbox status not sendable: ${data.status}`);
  }

  const result = await processEmailOutboxRows(
    [row],
    createSupabaseEmailOutboxDeps(supabase),
  );
  if (result.sent !== 1) {
    const { data: after } = await supabase
      .from("transactional_email_outbox")
      .select("status,last_error")
      .eq("id", input.outboxId)
      .maybeSingle();
    throw new Error(
      `outbox send failed status=${after?.status || "?"} err=${after?.last_error || "unknown"}`,
    );
  }

  return {
    sent: true,
    toEmail: row.to_email,
    templateKey: row.template_key,
  };
}
