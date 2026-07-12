import type { SupabaseClient } from "@supabase/supabase-js";
import { mapProjectSubmitErrorMessage } from "@/lib/error-message";
import { mergeTagsWithRecruitment } from "@/lib/game-tags";
import type { Game } from "@/lib/mock-games";
import { DEFAULT_PLAYABLE_VERSION } from "@/lib/playable-version";
import {
  deriveProjectDescription,
  sanitizeOverviewFeatures,
  type ProjectOverviewFeature,
} from "@/lib/project-overview";
import type { ProjectRow } from "@/lib/supabase/schema";
import { writeProjectRowWithSchemaFallback } from "@/lib/supabase/project-write-compat";
import { normalizePlayAccessType } from "@/lib/play-access-type";
import type { ProjectEditFormData, SubmitFormData } from "@/lib/project-form";
import {
  genresToLegacyGenreColumn,
  resolveGenresFromDbRow,
  sanitizeProjectGenresForSave,
} from "@/lib/project-genres";
import { normalizeExternalUrlForDb } from "@/lib/game-links";
import { resolveLinkFieldsForWrite } from "@/lib/project-link-write";
import {
  sanitizePublishDestinations,
  sanitizeRelatedLinks,
} from "@/lib/project-publish-links";
import {
  MAX_PROJECT_THUMBNAILS,
  projectThumbnailsForDb,
  projectThumbnailsForDbUpdate,
  resolveProjectPrimaryThumbnail,
  resolveProjectThumbnailUrlsFromRow,
} from "@/lib/project-thumbnails";
import {
  publicProjectThumbnailPath,
  publicProjectThumbnailPaths,
} from "@/lib/public-project-thumbnail";
import { materializeThumbnailUrlsToStorage } from "@/lib/supabase/project-thumbnail-storage";
import { requestProjectOgImageDerive } from "@/lib/supabase/request-project-og-derive";

const PUBLIC_PROJECT_CATALOG_COLUMNS = [
  "id",
  "owner_id",
  "owner_name",
  "title",
  "creator",
  "genre",
  "genres",
  "description",
  "phase",
  "status",
  "looking_for_testers",
  "tester_slots",
  "section",
  "tags",
  "play_url",
  "visibility",
  "playable_version",
  "release_status",
  "play_access_type",
  "estimated_play_time",
  "created_at",
  "updated_at",
  "first_published_at",
].join(", ");

/** Public /games/[id] — all detail fields except raw thumbnail blobs. */
const PUBLIC_PROJECT_DETAIL_COLUMNS = [
  "id",
  "owner_id",
  "owner_name",
  "title",
  "creator",
  "genre",
  "genres",
  "description",
  "overview_introduction",
  "overview_features",
  "phase",
  "status",
  "looking_for_testers",
  "tester_slots",
  "section",
  "tags",
  "play_url",
  "steam_url",
  "itch_url",
  "github_url",
  "discord_url",
  "official_url",
  "x_url",
  "youtube_url",
  "publish_destinations",
  "related_links",
  "visibility",
  "playable_version",
  "release_status",
  "play_access_type",
  "estimated_play_time",
  "created_at",
  "updated_at",
  "first_published_at",
].join(", ");

function linkColumnsFromForm(data: {
  playUrl: string;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  publishDestinations?: import("@/lib/project-publish-links").PublishDestination[];
  relatedLinks?: import("@/lib/project-publish-links").RelatedLink[];
}) {
  const links = resolveLinkFieldsForWrite(data);
  return {
    play_url: links.playUrl,
    steam_url: normalizeExternalUrlForDb(links.steamUrl),
    itch_url: normalizeExternalUrlForDb(links.itchUrl),
    github_url: normalizeExternalUrlForDb(links.githubUrl),
    discord_url: normalizeExternalUrlForDb(links.discordUrl),
    official_url: normalizeExternalUrlForDb(links.officialUrl),
    x_url: normalizeExternalUrlForDb(links.xUrl),
    youtube_url: normalizeExternalUrlForDb(links.youtubeUrl),
    publish_destinations: links.publishDestinations,
    related_links: links.relatedLinks,
  };
}
/**
 * If thumbs changed, upload non-https candidates to Storage first, then set
 * HTTPS URLs on the payload. On upload failure, throw before DB write so
 * existing thumbnails are preserved.
 */
async function applyMaterializedThumbnailFieldsForUpdate(
  supabase: SupabaseClient,
  projectId: string,
  payload: Record<string, unknown>,
  thumbnailUrls: string[] | undefined,
  existing: {
    thumbnail_url?: string | null;
    thumbnail_urls?: string[] | null;
  },
  options?: { allowClear?: boolean },
): Promise<void> {
  const fields = projectThumbnailsForDbUpdate(
    thumbnailUrls,
    existing,
    options,
  );
  if (!fields) {
    return;
  }
  if (fields.thumbnail_urls.length === 0) {
    payload.thumbnail_url = null;
    payload.thumbnail_urls = [];
    payload.og_image_url = null;
    return;
  }
  const httpsUrls = await materializeThumbnailUrlsToStorage(
    supabase,
    projectId,
    fields.thumbnail_urls,
  );
  payload.thumbnail_url = httpsUrls[0] ?? null;
  payload.thumbnail_urls = httpsUrls;
  // OGP derive runs after DB write (see callers) so a failed derive never
  // rolls back gallery thumbnails.
}

async function persistProjectThumbnailHttpsUrls(
  supabase: SupabaseClient,
  projectId: string,
  urls: string[],
): Promise<ProjectRow> {
  const httpsUrls = await materializeThumbnailUrlsToStorage(
    supabase,
    projectId,
    urls,
  );
  const { data, error } = await supabase
    .from("projects")
    .update({
      thumbnail_url: httpsUrls[0] ?? null,
      thumbnail_urls: httpsUrls,
    })
    .eq("id", projectId)
    .select("*")
    .single();
  if (error || !data) {
    throw error ?? new Error("サムネイル URL の保存に失敗しました。");
  }
  // Best-effort OGP derive; gallery thumbs already saved.
  await requestProjectOgImageDerive(projectId);
  return data as ProjectRow;
}

async function fetchExistingProjectThumbnails(
  supabase: SupabaseClient,
  projectId: string,
): Promise<{
  thumbnail_url: string | null;
  thumbnail_urls: string[] | null;
}> {
  const { data, error } = await supabase
    .from("projects")
    .select("thumbnail_url, thumbnail_urls")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) {
    return { thumbnail_url: null, thumbnail_urls: null };
  }

  return {
    thumbnail_url: (data as { thumbnail_url?: string | null }).thumbnail_url ?? null,
    thumbnail_urls:
      (data as { thumbnail_urls?: string[] | null }).thumbnail_urls ?? null,
  };
}

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
    publishDestinations: sanitizePublishDestinations(row.publish_destinations),
    relatedLinks: sanitizeRelatedLinks(row.related_links),
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    visibility: row.visibility,
    playableVersion: row.playable_version ?? DEFAULT_PLAYABLE_VERSION,
    releaseStatus: row.release_status ?? "in_development",
    playAccessType: normalizePlayAccessType(row.play_access_type),
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
  options?: { deferThumbnails?: boolean },
) {
  const lead = data.description?.trim() ?? "";
  const intro = data.introduction?.trim() ?? "";
  const { genres, genre } = projectGenresForDb(data.genres);
  const thumbnails = options?.deferThumbnails
    ? { thumbnail_url: null as string | null, thumbnail_urls: [] as string[] }
    : projectThumbnailsForDb(data.thumbnailUrls);
  const linkColumns = linkColumnsFromForm(data);
  return {
    owner_id: owner.ownerId,
    owner_name: owner.ownerName,
    title: data.title,
    creator: data.creator,
    genre,
    genres,
    description: lead,
    overview_introduction: intro || null,
    phase: data.phase,
    status: data.lookingForTesters ? "テスター募集中" : data.phase,
    looking_for_testers: data.lookingForTesters,
    tester_slots: data.lookingForTesters ? (data.testerSlots ?? null) : null,
    section: "new" as const,
    thumbnail_url: thumbnails.thumbnail_url,
    thumbnail_urls: thumbnails.thumbnail_urls,
    tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
    ...linkColumns,
    visibility: data.visibility ?? ("public" as const),
    playable_version: DEFAULT_PLAYABLE_VERSION,
    estimated_play_time: data.estimatedPlayTime ?? null,
    ...(data.playAccessType
      ? { play_access_type: data.playAccessType }
      : {}),
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

/** Player-facing catalog — public visibility only (never includes owned private). */
export async function fetchPublicProjects(
  supabase: SupabaseClient,
): Promise<Game[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(PUBLIC_PROJECT_CATALOG_COLUMNS)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as Array<
    Omit<ProjectRow, "thumbnail_url" | "thumbnail_urls">
  >;

  return rows.map((row) =>
    projectRowToGame({
      ...row,
      thumbnail_url: publicProjectThumbnailPath(row.id),
      thumbnail_urls: [publicProjectThumbnailPath(row.id)],
    } as ProjectRow),
  );
}

/** Player-facing single project — public visibility only. */
export async function fetchPublicProjectThumbnailCount(
  supabase: SupabaseClient,
  projectId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc(
    "get_public_project_thumbnail_count",
    { p_project_id: projectId },
  );
  if (!error) {
    const n = typeof data === "number" ? data : Number(data);
    if (!Number.isFinite(n) || n < 0) {
      return 0;
    }
    return Math.min(MAX_PROJECT_THUMBNAILS, Math.floor(n));
  }

  // Pre-migration 060 fallback: head-only probes (no thumbnail body in response).
  let count = 0;
  for (let index = 0; index < MAX_PROJECT_THUMBNAILS; index += 1) {
    const { count: slotCount, error: probeError } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("id", projectId)
      .eq("visibility", "public")
      .not(`thumbnail_urls->>${index}`, "is", null);
    if (probeError || !slotCount) {
      break;
    }
    count += 1;
  }
  if (count > 0) {
    return count;
  }

  const { count: primaryCount, error: primaryError } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("id", projectId)
    .eq("visibility", "public")
    .not("thumbnail_url", "is", null)
    .neq("thumbnail_url", "");
  if (primaryError || !primaryCount) {
    return 0;
  }
  return 1;
}
/** Player-facing single project — public visibility only. */
export async function fetchPublicProjectById(
  supabase: SupabaseClient,
  projectId: string,
): Promise<Game | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(PUBLIC_PROJECT_DETAIL_COLUMNS)
    .eq("id", projectId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as Omit<
    ProjectRow,
    "thumbnail_url" | "thumbnail_urls"
  >;

  // Index 0 path immediately — do not wait for count RPC (Fix A).
  const path0 = publicProjectThumbnailPath(projectId);

  return projectRowToGame({
    ...row,
    thumbnail_url: path0,
    thumbnail_urls: [path0],
  } as ProjectRow);
}

/**
 * Enrich gallery paths after count RPC (parallel with first image load).
 * On failure, returns null so callers keep the index-0 path.
 */
export async function fetchPublicProjectGalleryPaths(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string[] | null> {
  try {
    const thumbCount = await fetchPublicProjectThumbnailCount(
      supabase,
      projectId,
    );
    if (thumbCount <= 0) {
      return [];
    }
    return publicProjectThumbnailPaths(projectId, thumbCount);
  } catch {
    return null;
  }
}

/** Lightweight ownership check — no thumbnail columns. */
export async function isOwnedPublicOrPrivateProject(
  supabase: SupabaseClient,
  projectId: string,
  ownerId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  return !error && Boolean(data?.id);
}

/** Owner's project by id — includes non-public visibility (RLS applies). */
export async function fetchOwnedProjectById(
  supabase: SupabaseClient,
  projectId: string,
  ownerId: string,
): Promise<Game | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return projectRowToGame(data as ProjectRow);
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
  try {
    const pendingThumbs = projectThumbnailsForDb(data.thumbnailUrls).thumbnail_urls;
    const row = await writeProjectRowWithSchemaFallback(
      async (payload) =>
        supabase.from("projects").insert(payload).select("*").single(),
      submitFormToInsertRow(data, owner, { deferThumbnails: true }),
    );
    const inserted = row as ProjectRow;
    if (pendingThumbs.length === 0) {
      return projectRowToGame(inserted);
    }
    const withThumbs = await persistProjectThumbnailHttpsUrls(
      supabase,
      inserted.id,
      pendingThumbs,
    );
    return projectRowToGame(withThumbs);
  } catch (error) {
    throw new Error(mapProjectSubmitErrorMessage(error));
  }
}

export async function updateProjectFromSubmitForm(
  supabase: SupabaseClient,
  id: string,
  data: SubmitFormData,
): Promise<Game> {
  const existingThumbs = await fetchExistingProjectThumbnails(supabase, id);
  const intro = data.introduction?.trim() ?? data.description?.trim() ?? "";
  const { genres, genre } = projectGenresForDb(data.genres);
  const payload: Record<string, unknown> = {
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
      tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
      estimated_play_time: data.estimatedPlayTime ?? null,
      ...linkColumnsFromForm(data),
      ...(data.playAccessType
        ? { play_access_type: data.playAccessType }
        : {}),
    };
  await applyMaterializedThumbnailFieldsForUpdate(
    supabase,
    id,
    payload,
    data.thumbnailUrls,
    existingThumbs,
  );
  const row = await writeProjectRowWithSchemaFallback(
    async (p) =>
      supabase.from("projects").update(p).eq("id", id).select("*").single(),
    payload,
  );
  if (
    Object.prototype.hasOwnProperty.call(payload, "thumbnail_url") &&
    typeof payload.thumbnail_url === "string" &&
    payload.thumbnail_url.startsWith("https://")
  ) {
    await requestProjectOgImageDerive(id);
  }

  return projectRowToGame(row as ProjectRow);
}

export async function updateProjectDetailsInDb(
  supabase: SupabaseClient,
  id: string,
  data: ProjectEditFormData,
): Promise<Game> {
  const existingThumbs = await fetchExistingProjectThumbnails(supabase, id);
  const { genres, genre } = projectGenresForDb(data.genres);
  const payload: Record<string, unknown> = {
      title: data.title,
      ...(data.description !== undefined ? { description: data.description.trim() } : {}),
      genre,
      genres,
      phase: data.phase,
      status: data.lookingForTesters ? "テスター募集中" : data.phase,
      looking_for_testers: data.lookingForTesters,
      tester_slots: data.lookingForTesters ? (data.testerSlots ?? null) : null,
      tags: mergeTagsWithRecruitment(data.tags, data.lookingForTesters),
      estimated_play_time: data.estimatedPlayTime ?? null,
      ...linkColumnsFromForm(data),
      visibility: data.visibility,
      ...(data.playAccessType
        ? { play_access_type: data.playAccessType }
        : {}),
    };
  await applyMaterializedThumbnailFieldsForUpdate(
    supabase,
    id,
    payload,
    data.thumbnailUrls,
    existingThumbs,
    {
      allowClear: data.explicitThumbnailUpdate === true,
    },
  );
  const row = await writeProjectRowWithSchemaFallback(
    async (p) =>
      supabase.from("projects").update(p).eq("id", id).select("*").single(),
    payload,
  );
  if (
    Object.prototype.hasOwnProperty.call(payload, "thumbnail_url") &&
    typeof payload.thumbnail_url === "string" &&
    payload.thumbnail_url.startsWith("https://")
  ) {
    await requestProjectOgImageDerive(id);
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
