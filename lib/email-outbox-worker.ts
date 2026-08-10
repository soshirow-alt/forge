import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isTransactionalEmailTemplateKey,
  sendTransactionalEmail,
} from "@/lib/transactional-email";

export const EMAIL_OUTBOX_MAX_ATTEMPTS = 5;

export type EmailOutboxRow = {
  id: string;
  to_email: string;
  template_key: string;
  payload: unknown;
  attempts: number | null;
};

export type EmailOutboxDeps = {
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
): Promise<{ processed: number; sent: number; failed: number; skipped: number }> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const row of rows) {
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
  }
  return { processed: rows.length, sent, failed, skipped };
}

export function createSupabaseEmailOutboxDeps(
  supabase: SupabaseClient,
): EmailOutboxDeps {
  return {
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
      // No error + no row => another worker claimed first (benign skip).
      return { claimed: Boolean(claim.data) };
    },
    async markSent(id, claimedAttempts) {
      // Generation guard: only the worker that holds this attempts value may mark sent.
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
      // Same generation guard: stale workers cannot revert a newer claim's sent/failed/dead.
      // 0-row is intentional for races (another worker already advanced / finalized).
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
