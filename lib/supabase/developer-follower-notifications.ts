import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchDeveloperFollowersForOwner } from "@/lib/supabase/developer-follows-db";
import {
  insertFollowedDeveloperNewProjectNotifications,
  insertFollowedDeveloperReleasedProjectNotifications,
  isNotificationTypeMissingError,
} from "@/lib/supabase/user-notifications-db";
import { filterUsersByPlayerNotificationPref } from "@/lib/supabase/user-settings-db";

async function fetchDeveloperFollowerUserIds(
  supabase: SupabaseClient,
): Promise<string[]> {
  const rows = await fetchDeveloperFollowersForOwner(supabase, { limit: 500 });
  return rows.map((row) => row.followerId);
}

export async function notifyDeveloperFollowersOfNewProject(
  supabase: SupabaseClient,
  input: {
    ownerUserId: string;
    projectId: string;
    projectTitle: string;
    developerName: string;
  },
): Promise<void> {
  try {
    const followerIds = (await fetchDeveloperFollowerUserIds(supabase)).filter(
      (followerId) => followerId !== input.ownerUserId,
    );

    if (followerIds.length === 0) {
      return;
    }

    const enabledRecipients = await filterUsersByPlayerNotificationPref(
      supabase,
      followerIds,
      "developer-follow",
    );

    if (enabledRecipients.length === 0) {
      return;
    }

    const message = `フォロー中の開発者「${input.developerName}」が新作「${input.projectTitle}」を公開しました`;

    await insertFollowedDeveloperNewProjectNotifications(supabase, {
      recipientUserIds: enabledRecipients,
      projectId: input.projectId,
      message,
    });
  } catch (error) {
    if (isNotificationTypeMissingError(error)) {
      return;
    }
    throw error;
  }
}

export async function notifyDeveloperFollowersOfReleasedProject(
  supabase: SupabaseClient,
  input: {
    ownerUserId: string;
    projectId: string;
    projectTitle: string;
    developerName: string;
  },
): Promise<void> {
  try {
    const followerIds = (await fetchDeveloperFollowerUserIds(supabase)).filter(
      (followerId) => followerId !== input.ownerUserId,
    );

    if (followerIds.length === 0) {
      return;
    }

    const enabledRecipients = await filterUsersByPlayerNotificationPref(
      supabase,
      followerIds,
      "developer-follow",
    );

    if (enabledRecipients.length === 0) {
      return;
    }

    const message = `フォロー中の開発者「${input.developerName}」の「${input.projectTitle}」が正式版になりました`;

    await insertFollowedDeveloperReleasedProjectNotifications(supabase, {
      recipientUserIds: enabledRecipients,
      projectId: input.projectId,
      message,
    });
  } catch (error) {
    if (isNotificationTypeMissingError(error)) {
      return;
    }
    throw error;
  }
}
