import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeveloperFollowRow } from "@/lib/supabase/schema";

export async function fetchFollowingDeveloperUserIds(
  supabase: SupabaseClient,
  followerId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("developer_follows")
    .select("developer_user_id")
    .eq("follower_id", followerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    String((row as Pick<DeveloperFollowRow, "developer_user_id">).developer_user_id),
  );
}

export async function isFollowingDeveloperInDb(
  supabase: SupabaseClient,
  followerId: string,
  developerUserId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("developer_follows")
    .select("developer_user_id")
    .eq("follower_id", followerId)
    .eq("developer_user_id", developerUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
}

export async function followDeveloperInDb(
  supabase: SupabaseClient,
  followerId: string,
  developerUserId: string,
): Promise<void> {
  const { error } = await supabase.from("developer_follows").insert({
    follower_id: followerId,
    developer_user_id: developerUserId,
  });

  if (error && error.code !== "23505") {
    throw error;
  }
}

export async function unfollowDeveloperInDb(
  supabase: SupabaseClient,
  followerId: string,
  developerUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("developer_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("developer_user_id", developerUserId);

  if (error) {
    throw error;
  }
}

export async function countDeveloperFollowersInDb(
  supabase: SupabaseClient,
  developerUserId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("count_developer_followers", {
    p_developer_user_id: developerUserId,
  });

  if (error) {
    throw error;
  }

  return typeof data === "number" ? data : 0;
}

export async function countDeveloperFollowersBatchInDb(
  supabase: SupabaseClient,
  developerUserIds: string[],
): Promise<Record<string, number>> {
  if (developerUserIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase.rpc("count_developer_followers_batch", {
    p_developer_user_ids: developerUserIds,
  });

  if (error) {
    throw error;
  }

  const result: Record<string, number> = {};
  for (const row of data ?? []) {
    const item = row as { developer_user_id: string; follower_count: number };
    result[String(item.developer_user_id)] = item.follower_count ?? 0;
  }
  return result;
}

export type DeveloperFollowerForOwner = {
  followerId: string;
  followedAt: string;
  displayName: string;
  creatorRouteId: string | null;
};

type DeveloperFollowerForOwnerRow = {
  follower_id: string;
  followed_at: string;
  display_name: string;
  creator_route_id: string | null;
};

export function isDeveloperFollowersListMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("list_developer_followers_for_owner") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

/** Studio — followers of the authenticated developer (migration 028). */
export async function fetchDeveloperFollowersForOwner(
  supabase: SupabaseClient,
  options?: { limit?: number; offset?: number },
): Promise<DeveloperFollowerForOwner[]> {
  const { data, error } = await supabase.rpc("list_developer_followers_for_owner", {
    p_limit: options?.limit ?? 100,
    p_offset: options?.offset ?? 0,
  });

  if (error) {
    if (isDeveloperFollowersListMissingError(error)) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as DeveloperFollowerForOwnerRow[]).map((row) => ({
    followerId: String(row.follower_id),
    followedAt: row.followed_at,
    displayName: row.display_name?.trim() || "プレイヤー",
    creatorRouteId: row.creator_route_id?.trim() || null,
  }));
}
