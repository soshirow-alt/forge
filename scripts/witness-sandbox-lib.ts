/**
 * Shared helpers for witness sandbox / grant verify scripts.
 */
import { readFileSync } from "fs";
import type { SupabaseClient } from "@supabase/supabase-js";

export const WITNESS_SANDBOX_TITLE_PREFIX = "[witness-sandbox]";
export const WITNESS_SANDBOX_MARKER = "witness-sandbox-grant-verify";

export type WitnessSandboxUsers = {
  ownerId: string;
  userA: string;
  userB: string;
  userC: string;
  userNegative: string;
};

export function encodeSandboxUsersMeta(users: WitnessSandboxUsers): string {
  return `${WITNESS_SANDBOX_MARKER}\n${JSON.stringify({
    userA: users.userA,
    userB: users.userB,
    userC: users.userC,
    userNegative: users.userNegative,
  })}`;
}

export function decodeSandboxUsersMeta(
  description: string | null | undefined,
  ownerId: string,
): WitnessSandboxUsers | null {
  if (!description?.startsWith(WITNESS_SANDBOX_MARKER)) {
    return null;
  }

  const jsonLine = description.split("\n")[1];
  if (!jsonLine) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonLine) as {
      userA: string;
      userB: string;
      userC: string;
      userNegative: string;
    };

    return {
      ownerId,
      userA: parsed.userA,
      userB: parsed.userB,
      userC: parsed.userC,
      userNegative: parsed.userNegative,
    };
  } catch {
    return null;
  }
}

export async function check014Applied(supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase.from("project_witness_grants").select("id").limit(1);

  if (error) {
    console.log("FAIL 014 — project_witness_grants:", error.message);
    return false;
  }

  console.log("PASS 014 — project_witness_grants exists");
  return true;
}

export async function findSandboxProject(
  supabase: SupabaseClient,
): Promise<{ id: string; owner_id: string; title: string; description: string } | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id, title, description")
    .like("title", `${WITNESS_SANDBOX_TITLE_PREFIX}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("findSandboxProject:", error.message);
    return null;
  }

  return data
    ? {
        id: data.id as string,
        owner_id: data.owner_id as string,
        title: data.title as string,
        description: data.description as string,
      }
    : null;
}

export function sandboxTitleFresh(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${WITNESS_SANDBOX_TITLE_PREFIX} grant-verify ${stamp}`;
}

const SANDBOX_EMAIL_DOMAIN = "forge-witness-sandbox.local";

export async function ensureSandboxAuthUsers(
  supabase: SupabaseClient,
  count: number,
): Promise<string[]> {
  const stamp = Date.now();
  const ids: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const email = `witness-sandbox-${stamp}-${index}@${SANDBOX_EMAIL_DOMAIN}`;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: `WitnessSandbox!${stamp}${index}`,
      email_confirm: true,
    });

    if (error || !data.user) {
      console.error("createUser failed:", error?.message);
      return ids;
    }

    ids.push(data.user.id);
  }

  return ids;
}

export async function resolveSandboxUsers(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<WitnessSandboxUsers | null> {
  const envOwner = process.env.WITNESS_SANDBOX_OWNER_ID;
  const envA = process.env.WITNESS_SANDBOX_USER_A;
  const envB = process.env.WITNESS_SANDBOX_USER_B;
  const envC = process.env.WITNESS_SANDBOX_USER_C;
  const envNegative = process.env.WITNESS_SANDBOX_USER_NEGATIVE;

  if (envA && envB && envC && envNegative) {
    return {
      ownerId: envOwner ?? ownerId,
      userA: envA,
      userB: envB,
      userC: envC,
      userNegative: envNegative,
    };
  }

  const resolvedOwner = envOwner ?? ownerId;

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });

  if (error) {
    console.error("listUsers failed:", error.message);
    return null;
  }

  const candidates = (data.users ?? [])
    .map((user) => user.id)
    .filter((id) => id !== resolvedOwner);

  if (candidates.length >= 4) {
    return {
      ownerId: resolvedOwner,
      userA: envA ?? candidates[0]!,
      userB: envB ?? candidates[1]!,
      userC: envC ?? candidates[2]!,
      userNegative: envNegative ?? candidates[3]!,
    };
  }

  console.log(
    `Only ${candidates.length} non-owner user(s) — creating 4 sandbox auth users…`,
  );

  const created = await ensureSandboxAuthUsers(supabase, 4);
  if (created.length < 4) {
    console.error("Failed to create sandbox auth users");
    return null;
  }

  return {
    ownerId: resolvedOwner,
    userA: envA ?? created[0]!,
    userB: envB ?? created[1]!,
    userC: envC ?? created[2]!,
    userNegative: envNegative ?? created[3]!,
  };
}

export function loadEnvLocal() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}
