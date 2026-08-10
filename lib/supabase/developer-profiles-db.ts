import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createDeveloperProfile,
  type DeveloperProfile,
  type DeveloperProfileInput,
} from "@/lib/developer-profiles";
import { mapProjectSubmitErrorMessage } from "@/lib/error-message";
import { normalizeExternalUrlForDb } from "@/lib/game-links";
import type { DeveloperProfileRow } from "@/lib/supabase/schema";

/** Explicit columns; avatar_url may be absent until migration 064. */
const DEVELOPER_PROFILE_COLUMNS_WITH_AVATAR =
  "user_id, creator_id, public_name, profile, avatar_url, x_account, website, discord_url, youtube_url, activity_tags, created_at, updated_at";

const DEVELOPER_PROFILE_COLUMNS_WITHOUT_AVATAR =
  "user_id, creator_id, public_name, profile, x_account, website, discord_url, youtube_url, activity_tags, created_at, updated_at";

type DbErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type ProfileQueryResult = {
  data: unknown;
  error: DbErrorLike | null;
};

function isMissingAvatarUrlColumnError(error: DbErrorLike): boolean {
  const text = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(" ");
  if (!/avatar_url/i.test(text)) {
    return false;
  }
  return /does not exist|Could not find|schema cache|PGRST204|42703/i.test(text);
}

function profileRowToDeveloperProfile(row: DeveloperProfileRow): DeveloperProfile {
  return {
    userId: row.user_id,
    creatorId: row.creator_id,
    publicName: row.public_name,
    profile: row.profile,
    avatarUrl: row.avatar_url?.trim() || undefined,
    xAccount: row.x_account ?? undefined,
    website: row.website ?? undefined,
    discordUrl: row.discord_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    activityTags: Array.isArray(row.activity_tags)
      ? row.activity_tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
  };
}

function profileToRow(profile: DeveloperProfile) {
  return {
    user_id: profile.userId,
    creator_id: profile.creatorId,
    public_name: profile.publicName,
    profile: profile.profile,
    avatar_url: profile.avatarUrl ?? null,
    x_account: profile.xAccount ?? null,
    website: profile.website ?? null,
    discord_url: profile.discordUrl ?? null,
    youtube_url: profile.youtubeUrl ?? null,
    activity_tags: profile.activityTags ?? [],
  };
}

function profileToRowWithoutAvatar(profile: DeveloperProfile) {
  const { avatar_url: _omit, ...rest } = profileToRow(profile);
  void _omit;
  return rest;
}

async function queryWithOptionalAvatarColumn(
  run: (columns: string) => PromiseLike<ProfileQueryResult>,
): Promise<ProfileQueryResult> {
  const withAvatar = await run(DEVELOPER_PROFILE_COLUMNS_WITH_AVATAR);
  if (!withAvatar.error) {
    return withAvatar;
  }
  if (!isMissingAvatarUrlColumnError(withAvatar.error)) {
    return withAvatar;
  }
  return run(DEVELOPER_PROFILE_COLUMNS_WITHOUT_AVATAR);
}

export async function fetchDeveloperProfiles(
  supabase: SupabaseClient,
): Promise<DeveloperProfile[]> {
  const { data, error } = await queryWithOptionalAvatarColumn((columns) =>
    supabase
      .from("developer_profiles")
      .select(columns)
      .order("created_at", { ascending: false }),
  );

  if (error) {
    throw error;
  }

  return ((data ?? []) as DeveloperProfileRow[]).map(profileRowToDeveloperProfile);
}

export async function fetchDeveloperProfilesByUserIds(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<DeveloperProfile[]> {
  const unique = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return [];
  }

  const { data, error } = await queryWithOptionalAvatarColumn((columns) =>
    supabase.from("developer_profiles").select(columns).in("user_id", unique),
  );

  if (error) {
    throw error;
  }

  return ((data ?? []) as DeveloperProfileRow[]).map(profileRowToDeveloperProfile);
}

export async function upsertDeveloperProfile(
  supabase: SupabaseClient,
  userId: string,
  input: DeveloperProfileInput,
): Promise<DeveloperProfile> {
  const profile = createDeveloperProfile(userId, input);

  const first = await supabase
    .from("developer_profiles")
    .upsert(profileToRow(profile), { onConflict: "user_id" })
    .select(DEVELOPER_PROFILE_COLUMNS_WITH_AVATAR)
    .single();

  if (!first.error) {
    return profileRowToDeveloperProfile(first.data as DeveloperProfileRow);
  }

  if (!isMissingAvatarUrlColumnError(first.error)) {
    const text = [first.error.message, first.error.details, first.error.code]
      .filter(Boolean)
      .join(" ");
    if (/avatar_url|20000|check constraint|23514/i.test(text)) {
      console.error("[developer-profiles] avatar_url upsert rejected", first.error);
      throw new Error(
        "プロフィール画像の保存に失敗しました。別の画像で再度お試しください。",
      );
    }
    throw new Error(mapProjectSubmitErrorMessage(first.error));
  }

  const second = await supabase
    .from("developer_profiles")
    .upsert(profileToRowWithoutAvatar(profile), { onConflict: "user_id" })
    .select(DEVELOPER_PROFILE_COLUMNS_WITHOUT_AVATAR)
    .single();

  if (second.error) {
    throw new Error(mapProjectSubmitErrorMessage(second.error));
  }

  return profileRowToDeveloperProfile(second.data as DeveloperProfileRow);
}

export type DeveloperProfileSocialPatch = {
  discordUrl?: string;
  youtubeUrl?: string;
  xUrl?: string;
  officialUrl?: string;
};

/** Copy non-empty project social URLs onto developer_profiles (developer-wide defaults). */
export async function mergeDeveloperProfileSocialLinks(
  supabase: SupabaseClient,
  userId: string,
  patch: DeveloperProfileSocialPatch,
): Promise<void> {
  const discord = normalizeExternalUrlForDb(patch.discordUrl);
  const youtube = normalizeExternalUrlForDb(patch.youtubeUrl);
  const xRaw = patch.xUrl?.trim();
  const website = normalizeExternalUrlForDb(patch.officialUrl);

  if (!discord && !youtube && !xRaw && !website) {
    return;
  }

  const { data, error: fetchError } = await queryWithOptionalAvatarColumn((columns) =>
    supabase
      .from("developer_profiles")
      .select(columns)
      .eq("user_id", userId)
      .maybeSingle(),
  );

  if (fetchError) {
    throw fetchError;
  }

  if (!data) {
    return;
  }

  const updates: Partial<DeveloperProfileRow> = {};

  if (discord) {
    updates.discord_url = discord;
  }
  if (youtube) {
    updates.youtube_url = youtube;
  }
  if (xRaw) {
    updates.x_account = xRaw.startsWith("http") ? xRaw : xRaw.replace(/^@/, "");
  }
  if (website) {
    updates.website = website;
  }

  const { error: updateError } = await supabase
    .from("developer_profiles")
    .update(updates)
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }
}