/**
 * MJS mirror of lib/supabase/write-guard.ts — keep logic in sync.
 * Used by .mjs scripts that cannot import TypeScript directly.
 */
export class SupabaseWriteGuardError extends Error {
  constructor(message) {
    super(message);
    this.name = "SupabaseWriteGuardError";
  }
}

export function getSupabaseProjectRef(url) {
  if (!url?.trim()) {
    return null;
  }
  try {
    const host = new URL(url.trim()).hostname;
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isVercelProductionDeployment() {
  return process.env.VERCEL_ENV === "production";
}

export function assertSupabaseWriteAllowed(context) {
  if (isVercelProductionDeployment()) {
    return;
  }

  const prodRef = process.env.FORGE_PRODUCTION_SUPABASE_REF?.trim();
  if (!prodRef) {
    throw new SupabaseWriteGuardError(
      `[supabase-write-guard] blocked (${context}): FORGE_PRODUCTION_SUPABASE_REF is not set (fail closed in non-production).`,
    );
  }

  const targetRef = getSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!targetRef) {
    throw new SupabaseWriteGuardError(
      `[supabase-write-guard] blocked (${context}): cannot extract Supabase project ref from NEXT_PUBLIC_SUPABASE_URL (fail closed).`,
    );
  }

  if (targetRef !== prodRef) {
    return;
  }

  if (process.env.FORGE_ALLOW_PRODUCTION_SUPABASE_WRITE === "1") {
    return;
  }

  throw new SupabaseWriteGuardError(
    `[supabase-write-guard] blocked (${context}): non-production cannot write production Supabase (${prodRef}). ` +
      `Set staging NEXT_PUBLIC_SUPABASE_URL or FORGE_ALLOW_PRODUCTION_SUPABASE_WRITE=1 for owner-approved scripts only.`,
  );
}
