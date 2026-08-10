import {
  createSupabaseEmailOutboxDeps,
  EMAIL_OUTBOX_MAX_ATTEMPTS,
  processEmailOutboxRows,
  type EmailOutboxDeps,
  type EmailOutboxRow,
} from "@/lib/email-outbox-worker";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { after } from "next/server";

export type EmailOutboxKickResult = {
  attempted: boolean;
  processed?: number;
  sent?: number;
  failed?: number;
  skipped?: number;
};

export type EmailOutboxKickDeps = {
  loadRows: (limit: number) => Promise<EmailOutboxRow[] | null>;
  process: (
    rows: EmailOutboxRow[],
  ) => Promise<{
    processed: number;
    sent: number;
    failed: number;
    skipped: number;
  }>;
  logError: (message: string, detail?: string) => void;
};

function createDefaultKickDeps(): EmailOutboxKickDeps {
  return {
    async loadRows(limit) {
      const supabase = createServiceRoleClient();
      if (!supabase) {
        return null;
      }
      const { data, error } = await supabase
        .from("transactional_email_outbox")
        .select("id, to_email, template_key, payload, attempts")
        .in("status", ["pending", "failed"])
        .lte("available_at", new Date().toISOString())
        .lt("attempts", EMAIL_OUTBOX_MAX_ATTEMPTS)
        .order("available_at", { ascending: true })
        .limit(limit);
      if (error) {
        throw new Error("outbox load failed");
      }
      return (data ?? []) as EmailOutboxRow[];
    },
    async process(rows) {
      const supabase = createServiceRoleClient();
      if (!supabase) {
        throw new Error("service role unavailable");
      }
      return processEmailOutboxRows(
        rows,
        createSupabaseEmailOutboxDeps(supabase) as EmailOutboxDeps,
      );
    },
    logError(message, detail) {
      // Never log recipient email, payload, or private message bodies.
      if (detail) {
        console.error(message, detail);
      } else {
        console.error(message);
      }
    },
  };
}

/**
 * Best-effort outbox sweep after a business mutation has already committed.
 * Never throws to callers — email failure must not affect mutation responses.
 * Uses the same atomic claim path as the cron/ops HTTP worker (no self-HTTP).
 */
export async function kickEmailOutboxBestEffort(
  options?: {
    limit?: number;
    deps?: EmailOutboxKickDeps;
  },
): Promise<EmailOutboxKickResult> {
  const deps = options?.deps ?? createDefaultKickDeps();
  try {
    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);
    const rows = await deps.loadRows(limit);
    if (rows === null) {
      deps.logError("[email-outbox] kick skipped: service role unavailable");
      return { attempted: false };
    }
    const result = await deps.process(rows);
    return { attempted: true, ...result };
  } catch (cause) {
    deps.logError(
      "[email-outbox] kick failed",
      cause instanceof Error ? cause.name : "unknown",
    );
    return { attempted: false };
  }
}

/**
 * Schedule kick after the HTTP response is sent so provider latency cannot
 * turn a successful mutation into a client timeout/retry.
 * The returned Promise from the callback is what Next.js keeps the isolate alive for.
 */
export function scheduleEmailOutboxKickBestEffort(
  options?: {
    limit?: number;
    deps?: EmailOutboxKickDeps;
  },
  schedule: (task: () => void | Promise<unknown>) => void = after,
): void {
  try {
    schedule(() => kickEmailOutboxBestEffort(options));
  } catch (cause) {
    // Mutation already committed; scheduler registration must not fail the route.
    console.error(
      "[email-outbox] schedule failed",
      cause instanceof Error ? cause.name : "unknown",
    );
  }
}
