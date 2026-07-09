/**
 * Blocks non-production runtimes from writing to production Supabase via service role.
 * Environment separation (staging URL) is the first line of defense; this is the second.
 */
export class SupabaseWriteGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseWriteGuardError";
  }
}

/** Extract project ref from https://<ref>.supabase.co */
export function getSupabaseProjectRef(url?: string | null): string | null {
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

/** True only on Vercel production deployment (`VERCEL_ENV === "production"`). */
export function isVercelProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Throws if the current env would write to production Supabase from a non-production runtime.
 * `FORGE_PRODUCTION_MODE` is intentionally not used as a write-allow signal.
 */
export function assertSupabaseWriteAllowed(context: string): void {
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
