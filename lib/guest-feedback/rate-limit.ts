import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  GUEST_RATE_LIMIT_IP_PER_PROJECT,
  GUEST_RATE_LIMIT_SUBMITTER_BOOTSTRAP,
  GUEST_RATE_LIMIT_SUBMITTER_VOICE_BURST,
  GUEST_RATE_LIMIT_WINDOW_MS,
} from "@/lib/guest-feedback/constants";

export type GuestRateLimitAction = "voice" | "detailed" | "submitter_bootstrap";

function rateLimitSalt(): string {
  return (
    process.env.GUEST_FEEDBACK_RATE_LIMIT_SALT?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) ||
    "forge-guest-feedback-rate-limit"
  );
}

export function hashClientIp(ip: string | null | undefined): string {
  const normalized = ip?.trim() || "unknown";
  return createHash("sha256")
    .update(`${rateLimitSalt()}:${normalized}`)
    .digest("hex");
}

export function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function countRecentEvents(
  supabase: SupabaseClient,
  filters: {
    ipHash?: string;
    projectId?: string;
    action?: GuestRateLimitAction;
    sinceIso: string;
  },
): Promise<number> {
  let query = supabase
    .from("guest_feedback_rate_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", filters.sinceIso);

  if (filters.ipHash) {
    query = query.eq("ip_hash", filters.ipHash);
  }
  if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }
  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  const { count, error } = await query;
  if (error) {
    if (error.code === "42P01") {
      return 0;
    }
    throw error;
  }
  return count ?? 0;
}

async function recordRateEvent(
  supabase: SupabaseClient,
  event: {
    ipHash: string;
    projectId: string;
    action: GuestRateLimitAction;
  },
): Promise<void> {
  const { error } = await supabase.from("guest_feedback_rate_events").insert({
    ip_hash: event.ipHash,
    project_id: event.projectId,
    action: event.action,
  });

  if (error && error.code !== "42P01") {
    throw error;
  }
}

export async function assertGuestFeedbackRateLimit(
  supabase: SupabaseClient,
  request: Request,
  options: {
    projectId: string;
    action: GuestRateLimitAction;
    submitterKey?: string;
    answerCount?: number;
  },
): Promise<{ allowed: true } | { allowed: false; reason: "rate_limited" }> {
  const ipHash = hashClientIp(resolveClientIp(request));
  const sinceIso = new Date(Date.now() - GUEST_RATE_LIMIT_WINDOW_MS).toISOString();

  try {
    const ipProjectCount = await countRecentEvents(supabase, {
      ipHash,
      projectId: options.projectId,
      sinceIso,
    });

    if (ipProjectCount >= GUEST_RATE_LIMIT_IP_PER_PROJECT) {
      return { allowed: false, reason: "rate_limited" };
    }

    if (options.action === "submitter_bootstrap") {
      const bootstrapCount = await countRecentEvents(supabase, {
        ipHash,
        projectId: "_bootstrap",
        action: "submitter_bootstrap",
        sinceIso,
      });
      if (bootstrapCount >= GUEST_RATE_LIMIT_SUBMITTER_BOOTSTRAP) {
        return { allowed: false, reason: "rate_limited" };
      }
    }

    if (options.action === "voice" && options.answerCount) {
      const voiceBurst = await countRecentEvents(supabase, {
        ipHash,
        projectId: options.projectId,
        action: "voice",
        sinceIso,
      });
      if (voiceBurst + options.answerCount > GUEST_RATE_LIMIT_SUBMITTER_VOICE_BURST) {
        return { allowed: false, reason: "rate_limited" };
      }
    }

    await recordRateEvent(supabase, {
      ipHash,
      projectId:
        options.action === "submitter_bootstrap" ? "_bootstrap" : options.projectId,
      action: options.action,
    });

    return { allowed: true };
  } catch (error) {
    console.error("guest feedback rate limit check failed", error);
    return { allowed: true };
  }
}
