import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isTransactionalEmailTemplateKey,
  sendTransactionalEmail,
} from "@/lib/transactional-email";

export const EMAIL_OUTBOX_MAX_ATTEMPTS = 5;

export type EmailOutboxRow = {
  id: string;
  user_id?: string;
  to_email: string;
  template_key: string;
  payload: unknown;
  attempts: number | null;
};

export type EmailOutboxDeps = {
  /** Send-time preference + Auth email recheck. Marks suppressed when blocked. */
  evaluateSend?: (
    row: EmailOutboxRow,
  ) => Promise<{ allowed: boolean; toEmail: string | null; reason?: string | null }>;
  claimRow: (
    row: EmailOutboxRow,
    nextAttempts: number,
  ) => Promise<{ claimed: boolean }>;
  /** claimedAttempts = attempts value written at claim time (generation guard). */
  markSent: (id: string, claimedAttempts: number) => Promise<void>;
  markFailed: (
    id: string,
    input: { attempts: number; lastError: string; dead: boolean },
  ) => Promise<void>;
  send: (input: {
    to: string;
    templateKey: string;
    payload: Record<string, unknown>;
    idempotencyKey: string;
  }) => Promise<void>;
};

export async function processEmailOutboxRows(
  rows: EmailOutboxRow[],
  deps: EmailOutboxDeps,
): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  suppressed: number;
}> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let suppressed = 0;
  for (const row of rows) {
    try {
      if (deps.evaluateSend) {
        const evaluation = await deps.evaluateSend(row);
        if (!evaluation.allowed) {
          suppressed += 1;
          continue;
        }
        if (evaluation.toEmail) {
          row.to_email = evaluation.toEmail;
        }
      }

      const priorAttempts = Number(row.attempts ?? 0);
      const attempts = priorAttempts + 1;
      const claim = await deps.claimRow(row, attempts);
      if (!claim.claimed) {
        skipped += 1;
        continue;
      }
      try {
        if (!isTransactionalEmailTemplateKey(String(row.template_key))) {
          throw new Error("Unsupported template");
        }
        await deps.send({
          to: String(row.to_email),
          templateKey: String(row.template_key),
          payload:
            row.payload && typeof row.payload === "object"
              ? (row.payload as Record<string, unknown>)
              : {},
          idempotencyKey: `forge-outbox-${row.id}`,
        });
        await deps.markSent(row.id, attempts);
        sent += 1;
      } catch (cause) {
        failed += 1;
        const message =
          cause instanceof Error ? cause.message.slice(0, 1000) : "Unknown error";
        await deps.markFailed(row.id, {
          attempts,
          lastError: message,
          dead: attempts >= EMAIL_OUTBOX_MAX_ATTEMPTS,
        });
      }
    } catch (cause) {
      // Per-row fail-closed: evaluation/claim infra errors must not abort the batch.
      failed += 1;
      const message =
        cause instanceof Error ? cause.message.slice(0, 1000) : "Unknown error";
      try {
        await deps.markFailed(row.id, {
          attempts: Number(row.attempts ?? 0) + 1,
          lastError: message,
          dead: Number(row.attempts ?? 0) + 1 >= EMAIL_OUTBOX_MAX_ATTEMPTS,
        });
      } catch {
        // ignore secondary markFailed errors
      }
    }
  }
  return { processed: rows.length, sent, failed, skipped, suppressed };
}

export function createSupabaseEmailOutboxDeps(
  supabase: SupabaseClient,
): EmailOutboxDeps {
  return {
    async evaluateSend(row) {
      const { data, error } = await supabase.rpc(
        "evaluate_transactional_email_outbox_row",
        { p_outbox_id: row.id },
      );
      if (error) {
        // Fail closed: never send when send-time preference cannot be evaluated.
        throw new Error(
          error.message || "outbox evaluate failed (fail-closed)",
        );
      }
      const first = Array.isArray(data) ? data[0] : data;
      if (!first || typeof first !== "object") {
        return { allowed: false, toEmail: null, reason: "empty_evaluate" };
      }
      const record = first as {
        allowed?: boolean;
        to_email?: string | null;
        suppress_reason?: string | null;
      };
      return {
        allowed: Boolean(record.allowed),
        toEmail: record.to_email ?? null,
        reason: record.suppress_reason ?? null,
      };
    },
    async claimRow(row, nextAttempts) {
      const claim = await supabase
        .from("transactional_email_outbox")
        .update({
          attempts: nextAttempts,
          available_at: new Date(Date.now() + 60_000).toISOString(),
        })
        .eq("id", row.id)
        .eq("attempts", Number(row.attempts ?? 0))
        .in("status", ["pending", "failed"])
        .select("id")
        .maybeSingle();
      if (claim.error) {
        throw new Error(claim.error.message || "outbox claim failed");
      }
      return { claimed: Boolean(claim.data) };
    },
    async markSent(id, claimedAttempts) {
      const { data, error } = await supabase
        .from("transactional_email_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", id)
        .eq("attempts", claimedAttempts)
        .in("status", ["pending", "failed"])
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error(
          "outbox markSent affected 0 rows (stale generation or non-sendable status)",
        );
      }
    },
    async markFailed(id, input) {
      const { error } = await supabase
        .from("transactional_email_outbox")
        .update({
          status: input.dead ? "dead" : "failed",
          last_error: input.lastError,
          available_at: new Date(
            Date.now() + input.attempts * 60_000,
          ).toISOString(),
        })
        .eq("id", id)
        .eq("attempts", input.attempts)
        .in("status", ["pending", "failed"]);
      if (error) throw error;
    },
    async send(input) {
      if (!isTransactionalEmailTemplateKey(input.templateKey)) {
        throw new Error("Unsupported template");
      }
      await sendTransactionalEmail({
        to: input.to,
        templateKey: input.templateKey,
        payload: input.payload,
        idempotencyKey: input.idempotencyKey,
      });
    },
  };
}
