import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveOwnerUserIdFromRouteId } from "@/lib/developer-profiles";
import { formatXUsername } from "@/lib/x-auth";

async function fetchXUsernameForUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_x_profiles")
    .select("x_username")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return formatXUsername(String(data.x_username ?? ""));
}

export async function resolveCreatorUserIdForXLookup(
  supabase: SupabaseClient,
  routeId: string,
): Promise<string | null> {
  const direct = resolveOwnerUserIdFromRouteId(routeId);
  if (direct) {
    return direct;
  }

  const { data, error } = await supabase
    .from("developer_profiles")
    .select("user_id")
    .eq("creator_id", routeId)
    .maybeSingle();

  if (error || !data?.user_id) {
    return null;
  }

  return String(data.user_id);
}

export async function fetchProjectAuthorXUsername(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string | null> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("owner_id, visibility")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project || String(project.visibility) !== "public") {
    return null;
  }

  return fetchXUsernameForUserId(supabase, String(project.owner_id));
}

export async function fetchCreatorRouteXUsername(
  supabase: SupabaseClient,
  routeId: string,
): Promise<string | null> {
  const userId = await resolveCreatorUserIdForXLookup(supabase, routeId);
  if (!userId) {
    return null;
  }

  return fetchXUsernameForUserId(supabase, userId);
}
