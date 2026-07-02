import { displayPhase, getPhasePlayerDescription } from "@/lib/development-phases";
import {
  sanitizeFeatureTagsForSave,
  type ForgeFeatureTagOption,
} from "@/lib/forge-feature-tag-options";
import type { ForgeGenreOption } from "@/lib/forge-genre-options";
import {
  resolveGameDetailPlayerMeta,
  resolvePlayerPlayInfoDisplay,
  type GameDetailPlayerMeta,
} from "@/lib/game-detail-player-meta";
import type { GameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import type { Game } from "@/lib/mock-games";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  getPlayEnvironmentLabels,
  mergePlayEnvironmentIntoTags,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";
import type { SubmitFormData } from "@/lib/project-form";
import { deriveProjectDescription } from "@/lib/project-overview";
import {
  genresToLegacyGenreColumn,
  sanitizeProjectGenresForSave,
} from "@/lib/project-genres";
import { DEFAULT_PLAYABLE_VERSION } from "@/lib/playable-version";
import { gameToDetailV0 } from "@/lib/submitted-game-v0-adapter";
import type { ProjectVisibility } from "@/lib/project-visibility";
import {
  createEmptyPromptDraft,
  sanitizePromptDrafts,
  type DeveloperPromptDraft,
  type DeveloperPromptInput,
} from "@/lib/version-prompt-form";

export const SUBMIT_DRAFT_PREVIEW_ID = "submit-draft-preview";

export type SubmitDraftState = {
  title: string;
  phase: string;
  genres: ForgeGenreOption[];
  featureTags: ForgeFeatureTagOption[];
  introduction: string;
  thumbnailUrls: string[];
  playEnvironment: PlayEnvironmentFormState;
  playUrl: string;
  estimatedPlayTime: string;
  steamUrl: string;
  itchUrl: string;
  discordUrl: string;
  xUrl: string;
  officialUrl: string;
  youtubeUrl: string;
  githubUrl: string;
  visibility: ProjectVisibility;
  promptMode: "none" | "custom";
  promptDrafts: DeveloperPromptDraft[];
};

export type SubmitDraftOwner = {
  ownerId: string;
  ownerName: string;
  creator: string;
};

export function createEmptySubmitDraft(): SubmitDraftState {
  return {
    title: "",
    phase: "",
    genres: [],
    featureTags: [],
    introduction: "",
    thumbnailUrls: [],
    playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
    playUrl: "",
    estimatedPlayTime: "",
    steamUrl: "",
    itchUrl: "",
    discordUrl: "",
    xUrl: "",
    officialUrl: "",
    youtubeUrl: "",
    githubUrl: "",
    visibility: "public",
    promptMode: "none",
    promptDrafts: [createEmptyPromptDraft()],
  };
}

export function buildDraftGame(
  draft: SubmitDraftState,
  owner: SubmitDraftOwner,
): Game {
  const intro = draft.introduction.trim();
  const genres = sanitizeProjectGenresForSave(draft.genres);
  const featureTags = sanitizeFeatureTagsForSave(draft.featureTags);
  const tags = mergePlayEnvironmentIntoTags(featureTags, draft.playEnvironment);
  const description = intro ? deriveProjectDescription(intro) : "";

  return {
    id: SUBMIT_DRAFT_PREVIEW_ID,
    title: draft.title.trim() || "タイトル未入力",
    creator: owner.creator,
    ownerName: owner.ownerName,
    ownerId: owner.ownerId,
    genres,
    genre: genresToLegacyGenreColumn(genres) || "その他",
    description: description || "作品紹介がここに表示されます",
    overviewIntroduction: intro || null,
    phase: draft.phase.trim() || "試作ver",
    status: draft.phase.trim() || "試作ver",
    lookingForTesters: false,
    lastUpdated: "投稿前",
    createdAt: new Date().toISOString(),
    section: "new",
    thumbnailUrls: draft.thumbnailUrls,
    thumbnailUrl: draft.thumbnailUrls[0],
    tags,
    playUrl: draft.playUrl.trim(),
    estimatedPlayTime: draft.estimatedPlayTime.trim() || undefined,
    steamUrl: draft.steamUrl.trim() || undefined,
    itchUrl: draft.itchUrl.trim() || undefined,
    discordUrl: draft.discordUrl.trim() || undefined,
    xUrl: draft.xUrl.trim() || undefined,
    officialUrl: draft.officialUrl.trim() || undefined,
    youtubeUrl: draft.youtubeUrl.trim() || undefined,
    githubUrl: draft.githubUrl.trim() || undefined,
    visibility: draft.visibility,
    playableVersion: DEFAULT_PLAYABLE_VERSION,
    releaseStatus: "in_development",
    overviewFeatures: null,
  };
}

export function buildSubmitDraftDetailV0(
  draft: SubmitDraftState,
  owner: SubmitDraftOwner,
): GameDetailV0 {
  const game = buildDraftGame(draft, owner);
  const detail = gameToDetailV0(game);
  return applySubmitDraftPreviewDisplay(detail, draft);
}

export function applySubmitDraftPreviewDisplay(
  detail: GameDetailV0,
  draft: SubmitDraftState,
): GameDetailV0 {
  const intro = draft.introduction.trim();
  const genres = sanitizeProjectGenresForSave(draft.genres);
  const featureTags = sanitizeFeatureTagsForSave(draft.featureTags);
  const tags = [
    ...(genres.length > 0 ? genres : ["ジャンル未設定"]),
    ...featureTags,
  ];

  return {
    ...detail,
    title: draft.title.trim() || "タイトル未入力",
    lead: intro ? detail.lead : "作品紹介がここに表示されます",
    introduction: intro || "作品紹介がここに表示されます",
    tags,
    galleryImages:
      draft.thumbnailUrls.length > 0 ? detail.galleryImages : [detail.heroImage],
  };
}

export function resolveSubmitDraftPreviewPlayerMeta(
  draft: SubmitDraftState,
  game: Game,
): GameDetailPlayerMeta {
  const resolved = resolveGameDetailPlayerMeta(game);
  if (resolved) {
    return resolved;
  }

  return {
    phaseLabel: draft.phase.trim() ? displayPhase(draft.phase) : "開発フェーズ未設定",
    phaseDescription: draft.phase.trim()
      ? getPhasePlayerDescription(draft.phase)
      : "右パネルで開発フェーズを設定できます",
    estimatedPlayTime: draft.estimatedPlayTime.trim() || null,
    environmentLabels: draft.playUrl.trim()
      ? getPlayEnvironmentLabels(game)
      : ["公開先未設定"],
    playInfo: resolvePlayerPlayInfoDisplay(game),
    focusNotes: null,
  };
}

export function draftToSubmitFormData(
  draft: SubmitDraftState,
  owner: SubmitDraftOwner,
): SubmitFormData {
  const featureTags = sanitizeFeatureTagsForSave(draft.featureTags);

  return {
    title: draft.title.trim(),
    creator: owner.creator,
    genres: sanitizeProjectGenresForSave(draft.genres),
    introduction: draft.introduction.trim(),
    phase: draft.phase.trim(),
    thumbnailUrls: draft.thumbnailUrls,
    lookingForTesters: false,
    tags: mergePlayEnvironmentIntoTags(featureTags, draft.playEnvironment),
    playUrl: draft.playUrl.trim(),
    estimatedPlayTime: draft.estimatedPlayTime.trim() || undefined,
    steamUrl: draft.steamUrl.trim() || undefined,
    itchUrl: draft.itchUrl.trim() || undefined,
    discordUrl: draft.discordUrl.trim() || undefined,
    xUrl: draft.xUrl.trim() || undefined,
    officialUrl: draft.officialUrl.trim() || undefined,
    youtubeUrl: draft.youtubeUrl.trim() || undefined,
    githubUrl: draft.githubUrl.trim() || undefined,
    visibility: draft.visibility,
  };
}

export function getSubmitPromptsToSave(draft: SubmitDraftState): DeveloperPromptInput[] {
  if (draft.promptMode !== "custom") {
    return [];
  }
  return sanitizePromptDrafts(draft.promptDrafts);
}

export function summarizeSubmitDraftBasic(draft: SubmitDraftState): string {
  const title = draft.title.trim() || "タイトル未入力";
  const phase = draft.phase.trim() ? displayPhase(draft.phase) : "開発フェーズ未設定";
  return `${title} · ${phase}`;
}

export function summarizeSubmitDraftGenres(draft: SubmitDraftState): string {
  const genres = sanitizeProjectGenresForSave(draft.genres);
  if (genres.length === 0) {
    return "ジャンル未設定";
  }
  const tags = sanitizeFeatureTagsForSave(draft.featureTags);
  return tags.length > 0 ? `${genres.join("・")} / タグ${tags.length}件` : genres.join("・");
}

export function summarizeSubmitDraftIntroduction(draft: SubmitDraftState): string {
  const intro = draft.introduction.trim();
  if (!intro) {
    return "作品紹介未入力";
  }
  return intro.length > 48 ? `${intro.slice(0, 47)}…` : intro;
}

export function summarizeSubmitDraftImages(draft: SubmitDraftState): string {
  if (draft.thumbnailUrls.length === 0) {
    return "画像未設定";
  }
  return `${draft.thumbnailUrls.length}枚`;
}

export function summarizeSubmitDraftPlayInfo(draft: SubmitDraftState): string {
  if (!draft.playEnvironment.distribution) {
    return "配布形式未設定";
  }
  const url = draft.playUrl.trim();
  return url ? "配布形式・URL 設定済み" : "プレイURL未入力";
}
