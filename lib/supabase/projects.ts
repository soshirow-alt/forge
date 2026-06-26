import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeTagsWithRecruitment } from "@/lib/game-tags";
import type { Game } from "@/lib/mock-games";
import { DEFAULT_PLAYABLE_VERSION } from "@/lib/playable-version";
import {
  sanitizeOverviewFeatures,
  type ProjectOverviewFeature,
} from "@/lib/project-overview";
import type { ProjectRow } from "@/lib/supabase/schema";
import type { ProjectEditFormData, SubmitFormData } from "@/lib/project-form";

function formatDateOnly(iso: string) {
  return iso.split("T")[0];
}

export function projectRowToGame(row: ProjectRow): Game {
  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    genre: row.genre,
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
    thumbnailUrl: row.thumbnail_url ?? undefined,
    tags: row.tags ?? [],
    playUrl: row.play_url,
    steamUrl: row.steam_url ?? undefined,
    itchUrl: row.itch_url ?? undefined,
    githubUrl: row.github_url ?? undefined,
    discordUrl: row.discord_url ?? undefined,
    officialUrl: row.official_url ?? undefined,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    visibility: row.visibility,
    playableVersion: row.playable_version ?? DEFAULT_PLAYABLE_VERSION,
    releaseStatus: row.release_status ?? "in_development",
  };
}

function submitFormToInsertRow(
  data: SubmitFormData,
  owner: { ownerId: string; ownerName: string },
) {
  return {
    owner_id: owner.ownerId,
    owner_name: owner.ownerName,
    title: data.title,
    creator: data.creator,
    genre: data.genre,
    description: data.description,
    phase: data.phase,
    status: data.lookingForTesters ? "テスター募集中" : data.phase,
    looking_for_testers: data.lookingForTesters,
    tester_slots: data.lookingForTesters ? (data.testerSlots ?? null) : null,
    section: "new" as const,
    thumbnail_url: data.thumbnailUrl ?? null,
    tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
    play_url: data.playUrl,
    steam_url: data.steamUrl ?? null,
    itch_url: data.itchUrl ?? null,
    github_url: data.githubUrl ?? null,
    discord_url: data.discordUrl ?? null,
    official_url: data.officialUrl ?? null,
    visibility: data.visibility ?? ("public" as const),
    playable_version: DEFAULT_PLAYABLE_VERSION,
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
  const { data: row, error } = await supabase
    .from("projects")
    .update({
      title: data.title,
      creator: data.creator,
      genre: data.genre,
      description: data.description,
      phase: data.phase,
      status: data.lookingForTesters ? "テスター募集中" : data.phase,
      looking_for_testers: data.lookingForTesters,
      tester_slots: data.lookingForTesters ? (data.testerSlots ?? null) : null,
      thumbnail_url: data.thumbnailUrl ?? null,
      tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
      play_url: data.playUrl,
      steam_url: data.steamUrl ?? null,
      itch_url: data.itchUrl ?? null,
      github_url: data.githubUrl ?? null,
      discord_url: data.discordUrl ?? null,
      official_url: data.officialUrl ?? null,
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
  currentPhase: string,
): Promise<Game> {
  const { data: row, error } = await supabase
    .from("projects")
    .update({
      title: data.title,
      genre: data.genre,
      description: data.description,
      status: data.lookingForTesters ? "テスター募集中" : currentPhase,
      looking_for_testers: data.lookingForTesters,
      tester_slots: data.lookingForTesters ? (data.testerSlots ?? null) : null,
      thumbnail_url: data.thumbnailUrl ?? null,
      tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
      steam_url: data.steamUrl ?? null,
      itch_url: data.itchUrl ?? null,
      github_url: data.githubUrl ?? null,
      discord_url: data.discordUrl ?? null,
      official_url: data.officialUrl ?? null,
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
  const { data: row, error } = await supabase
    .from("projects")
    .update({
      overview_introduction: data.overviewIntroduction,
      overview_features: data.overviewFeatures,
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
