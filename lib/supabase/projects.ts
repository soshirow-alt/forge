import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeTagsWithRecruitment } from "@/lib/game-tags";
import type { Game } from "@/lib/mock-games";
import { DEFAULT_PLAYABLE_VERSION } from "@/lib/playable-version";
import {
  deriveProjectDescription,
  sanitizeOverviewFeatures,
  type ProjectOverviewFeature,
} from "@/lib/project-overview";
import type { ProjectRow } from "@/lib/supabase/schema";
import type { ProjectEditFormData, SubmitFormData } from "@/lib/project-form";
import {
  genresToLegacyGenreColumn,
  resolveGenresFromDbRow,
  sanitizeProjectGenresForSave,
} from "@/lib/project-genres";
import { normalizeExternalUrlForDb } from "@/lib/game-links";
import {
  projectThumbnailsForDb,
  resolveProjectPrimaryThumbnail,
  resolveProjectThumbnailUrlsFromRow,
} from "@/lib/project-thumbnails";

function formatDateOnly(iso: string) {
  return iso.split("T")[0];
}

export function projectRowToGame(row: ProjectRow): Game {
  const genres = resolveGenresFromDbRow(row);

  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    genres,
    genre: genresToLegacyGenreColumn(genres),
    description: row.description,
    overviewIntroduction: row.overview_introduction ?? null,
    overviewFeatures: sanitizeOverviewFeatures(row.overview_features),
    phase: row.phase,
    status: row.status,
    lookingForTesters: row.looking_for_testers,
    testerSlots: row.tester_slots ?? undefined,
    lastUpdated: formatDateOnly(row.updated_at),
    createdAt: row.created_at,
    section: row.section,
    thumbnailUrl: resolveProjectPrimaryThumbnail(row),
    thumbnailUrls: resolveProjectThumbnailUrlsFromRow(row),
    tags: row.tags ?? [],
    playUrl: row.play_url,
    steamUrl: row.steam_url ?? undefined,
    itchUrl: row.itch_url ?? undefined,
    githubUrl: row.github_url ?? undefined,
    discordUrl: row.discord_url ?? undefined,
    officialUrl: row.official_url ?? undefined,
    xUrl: row.x_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    visibility: row.visibility,
    playableVersion: row.playable_version ?? DEFAULT_PLAYABLE_VERSION,
    releaseStatus: row.release_status ?? "in_development",
    estimatedPlayTime: row.estimated_play_time ?? undefined,
  };
}

function projectGenresForDb(genres: string[]) {
  const sanitized = sanitizeProjectGenresForSave(genres);
  return {
    genres: sanitized,
    genre: genresToLegacyGenreColumn(sanitized),
  };
}

function submitFormToInsertRow(
  data: SubmitFormData,
  owner: { ownerId: string; ownerName: string },
) {
  const intro = data.introduction?.trim() ?? data.description?.trim() ?? "";
  const { genres, genre } = projectGenresForDb(data.genres);
  const thumbnails = projectThumbnailsForDb(data.thumbnailUrls);
  return {
    owner_id: owner.ownerId,
    owner_name: owner.ownerName,
    title: data.title,
    creator: data.creator,
    genre,
    genres,
    description: deriveProjectDescription(intro) || intro,
    overview_introduction: intro || null,
    phase: data.phase,
    status: data.lookingForTesters ? "テスター募集中" : data.phase,
    looking_for_testers: data.lookingForTesters,
    tester_slots: data.lookingForTesters ? (data.testerSlots ?? null) : null,
    section: "new" as const,
    thumbnail_url: thumbnails.thumbnail_url,
    thumbnail_urls: thumbnails.thumbnail_urls,
    tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
    play_url: data.playUrl,
    steam_url: normalizeExternalUrlForDb(data.steamUrl),
    itch_url: normalizeExternalUrlForDb(data.itchUrl),
    github_url: normalizeExternalUrlForDb(data.githubUrl),
    discord_url: normalizeExternalUrlForDb(data.discordUrl),
    official_url: normalizeExternalUrlForDb(data.officialUrl),
    x_url: normalizeExternalUrlForDb(data.xUrl),
    youtube_url: normalizeExternalUrlForDb(data.youtubeUrl),
    visibility: data.visibility ?? ("public" as const),
    playable_version: DEFAULT_PLAYABLE_VERSION,
    estimated_play_time: data.estimatedPlayTime ?? null,
  };
}

export async function fetchProjects(supabase: SupabaseClient): Promise<Game[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProjectRow[]).map(projectRowToGame);
}

export async function updateProjectPlayableVersion(
  supabase: SupabaseClient,
  projectId: string,
  playableVersion: string,
): Promise<Game> {
  const { data, error } = await supabase
    .from("projects")
    .update({ playable_version: playableVersion })
    .eq("id", projectId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return projectRowToGame(data as ProjectRow);
}

export async function insertProject(
  supabase: SupabaseClient,
  data: SubmitFormData,
  owner: { ownerId: string; ownerName: string },
): Promise<Game> {
  const { data: row, error } = await supabase
    .from("projects")
    .insert(submitFormToInsertRow(data, owner))
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return projectRowToGame(row as ProjectRow);
}

export async function updateProjectFromSubmitForm(
  supabase: SupabaseClient,
  id: string,
  data: SubmitFormData,
): Promise<Game> {
  const intro = data.introduction?.trim() ?? data.description?.trim() ?? "";
  const { genres, genre } = projectGenresForDb(data.genres);
  const thumbnails = projectThumbnailsForDb(data.thumbnailUrls);
  const { data: row, error } = await supabase
    .from("projects")
    .update({
      title: data.title,
      creator: data.creator,
      genre,
      genres,
      description: deriveProjectDescription(intro) || intro,
      overview_introduction: intro || null,
      phase: data.phase,
      status: data.lookingForTesters ? "テスター募集中" : data.phase,
      looking_for_testers: data.lookingForTesters,
      tester_slots: data.lookingForTesters ? (data.testerSlots ?? null) : null,
      thumbnail_url: thumbnails.thumbnail_url,
      thumbnail_urls: thumbnails.thumbnail_urls,
      tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
      play_url: data.playUrl,
      estimated_play_time: data.estimatedPlayTime ?? null,
    steam_url: normalizeExternalUrlForDb(data.steamUrl),
    itch_url: normalizeExternalUrlForDb(data.itchUrl),
    github_url: normalizeExternalUrlForDb(data.githubUrl),
    discord_url: normalizeExternalUrlForDb(data.discordUrl),
    official_url: normalizeExternalUrlForDb(data.officialUrl),
    x_url: normalizeExternalUrlForDb(data.xUrl),
    youtube_url: normalizeExternalUrlForDb(data.youtubeUrl),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return projectRowToGame(row as ProjectRow);
}

export async function updateProjectDetailsInDb(
  supabase: SupabaseClient,
  id: string,
  data: ProjectEditFormData,
): Promise<Game> {
  const { genres, genre } = projectGenresForDb(data.genres);
  const thumbnails = projectThumbnailsForDb(data.thumbnailUrls);
  const { data: row, error } = await supabase
    .from("projects")
    .update({
      title: data.title,
      genre,
      genres,
      phase: data.phase,
      status: data.lookingForTesters ? "テスター募集中" : data.phase,
      looking_for_testers: data.lookingForTesters,
      tester_slots: data.lookingForTesters ? (data.testerSlots ?? null) : null,
      thumbnail_url: thumbnails.thumbnail_url,
      thumbnail_urls: thumbnails.thumbnail_urls,
      tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
      play_url: data.playUrl,
      estimated_play_time: data.estimatedPlayTime ?? null,
    steam_url: normalizeExternalUrlForDb(data.steamUrl),
    itch_url: normalizeExternalUrlForDb(data.itchUrl),
    github_url: normalizeExternalUrlForDb(data.githubUrl),
    discord_url: normalizeExternalUrlForDb(data.discordUrl),
    official_url: normalizeExternalUrlForDb(data.officialUrl),
    x_url: normalizeExternalUrlForDb(data.xUrl),
    youtube_url: normalizeExternalUrlForDb(data.youtubeUrl),
      visibility: data.visibility,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return projectRowToGame(row as ProjectRow);
}

export type ProjectOverviewUpdate = {
  overviewIntroduction: string | null;
  overviewFeatures: ProjectOverviewFeature[] | null;
};

export async function updateProjectOverviewInDb(
  supabase: SupabaseClient,
  id: string,
  data: ProjectOverviewUpdate,
): Promise<Game> {
  const introText = data.overviewIntroduction?.trim() ?? "";
  const { data: row, error } = await supabase
    .from("projects")
    .update({
      overview_introduction: data.overviewIntroduction,
      overview_features: data.overviewFeatures,
      description: deriveProjectDescription(introText) || introText,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return projectRowToGame(row as ProjectRow);
}

export async function deleteProjectInDb(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/** Map Supabase/Postgres delete errors to owner-facing Japanese hints. */
export function formatProjectDeleteError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : "";

  if (
    message.includes("project_witness_grants is append-only") ||
    message.includes("row-level security")
  ) {
    return "見届け人データが紐づいているため削除できません。migration 027 適用後に再度お試しください。";
  }

  return "削除に失敗しました。時間をおいて再度お試しください。";
}

export async function updateProjectsOwnerDisplayName(
  supabase: SupabaseClient,
  ownerId: string,
  displayName: string,
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({
      owner_name: displayName,
      creator: displayName,
    })
    .eq("owner_id", ownerId);

  if (error) {
    throw error;
  }
}

export async function insertDemoProjects(
  supabase: SupabaseClient,
  ownerId: string,
  ownerName: string,
  projects: SubmitFormData[],
): Promise<Game[]> {
  const demoTitles = projects.map((project) => project.title);

  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .eq("owner_id", ownerId)
    .in("title", demoTitles);

  if (deleteError) {
    throw deleteError;
  }

  const rows = projects.map((project) => submitFormToInsertRow(project, {
    ownerId,
    ownerName,
  }));

  const { data, error } = await supabase
    .from("projects")
    .insert(rows)
    .select("*");

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProjectRow[]).map(projectRowToGame);
}
