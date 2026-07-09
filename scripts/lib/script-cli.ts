import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseWriteAllowed } from "../../lib/supabase/write-guard";

export function parseScriptExecuteArgs(argv: string[]): {
  execute: boolean;
  dryRun: boolean;
} {
  const execute = argv.includes("--execute");
  const dryRun = argv.includes("--dry-run") || !execute;
  return { execute, dryRun };
}

export function exitIfDryRun(scriptName: string, execute: boolean): void {
  if (!execute) {
    console.log(
      `[${scriptName}] dry-run mode (no DB writes). Pass --execute to write.`,
    );
    process.exit(0);
  }
}

export function createScriptServiceClient(context: string): SupabaseClient {
  assertSupabaseWriteAllowed(context);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function logSupabaseTarget(scriptName: string): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const host = url ? (() => { try { return new URL(url).hostname; } catch { return "invalid-url"; } })() : "missing";
  console.log(`[${scriptName}] supabase host: ${host}`);
}
