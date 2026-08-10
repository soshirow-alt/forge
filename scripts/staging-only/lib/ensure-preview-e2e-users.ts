/**
 * Idempotent Staging Auth ensure for Preview E2E users (Admin API only).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  assertStagingOnly,
  requireEnv,
} from "./preview-e2e-env";

type Env = Record<string, string>;

export type EnsuredUser = {
  userId: string;
  email: string;
  created: boolean;
  passwordUpdated: boolean;
};

function adminClient(env: Env): SupabaseClient {
  assertStagingOnly(env);
  const url = requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const service = requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  // Paginate lightly — Staging is small.
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const hit = (data.users || []).find(
      (user) => (user.email || "").toLowerCase() === normalized,
    );
    if (hit?.id) return hit.id;
    if ((data.users || []).length < 200) break;
  }
  return null;
}

export async function ensureAuthUser(input: {
  env: Env;
  email: string;
  password: string;
  displayName: string;
  marker: string;
}): Promise<EnsuredUser> {
  const admin = adminClient(input.env);
  const email = input.email.trim().toLowerCase();
  const existingId = await findUserIdByEmail(admin, email);

  if (!existingId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        forge_e2e: true,
        forge_e2e_marker: input.marker,
        display_name: input.displayName,
      },
      app_metadata: {
        forge_e2e: true,
        forge_e2e_marker: input.marker,
      },
    });
    if (error || !data.user?.id) {
      throw new Error(error?.message || "createUser failed");
    }
    return {
      userId: data.user.id,
      email,
      created: true,
      passwordUpdated: true,
    };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    existingId,
    {
      password: input.password,
      email_confirm: true,
      user_metadata: {
        forge_e2e: true,
        forge_e2e_marker: input.marker,
        display_name: input.displayName,
      },
      app_metadata: {
        forge_e2e: true,
        forge_e2e_marker: input.marker,
      },
    },
  );
  if (updateError) throw new Error(updateError.message);

  return {
    userId: existingId,
    email,
    created: false,
    passwordUpdated: true,
  };
}

export async function ensureDeveloperProfile(input: {
  env: Env;
  userId: string;
  publicName: string;
  profile: string;
  activityTags?: string[];
  marker: string;
}): Promise<void> {
  const admin = adminClient(input.env);
  const creatorId = `e2e-${input.marker}-${input.userId.replaceAll("-", "").slice(0, 12)}`;
  const { error } = await admin.from("developer_profiles").upsert(
    {
      user_id: input.userId,
      creator_id: creatorId,
      public_name: input.publicName,
      profile: input.profile,
      activity_tags: input.activityTags ?? ["game_creator"],
    },
    { onConflict: "user_id" },
  );
  if (error) {
    // creator_id unique conflict: update name/tags only
    const { error: updateError } = await admin
      .from("developer_profiles")
      .update({
        public_name: input.publicName,
        profile: input.profile,
        activity_tags: input.activityTags ?? ["game_creator"],
      })
      .eq("user_id", input.userId);
    if (updateError) throw new Error(updateError.message);
  }
}

export async function signInPassword(input: {
  env: Env;
  email: string;
  password: string;
}): Promise<{
  userId: string;
  accessToken: string;
  refreshToken: string;
}> {
  assertStagingOnly(input.env);
  const url = requireEnv(input.env, "NEXT_PUBLIC_SUPABASE_URL");
  const anon = requireEnv(input.env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (
    error ||
    !data.session?.access_token ||
    !data.session.refresh_token ||
    !data.user?.id
  ) {
    throw new Error(error?.message || "signInWithPassword failed");
  }
  return {
    userId: data.user.id,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

export function authedClient(env: Env, accessToken: string): SupabaseClient {
  assertStagingOnly(env);
  const url = requireEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const anon = requireEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function serviceClient(env: Env): SupabaseClient {
  return adminClient(env);
}
