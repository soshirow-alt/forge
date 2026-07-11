import { displayPhase, getPhasePlayerDescription } from "@/lib/development-phases";
import { PROJECT_ONE_LINE_DESCRIPTION_MAX } from "@/lib/project-one-line-description";
import {
  sanitizeFeatureTagsForSave,
  type ForgeFeatureTagOption,
} from "@/lib/forge-feature-tag-options";
import type { ForgeGenreOption } from "@/lib/forge-genre-options";
import type { GameDetailPlayerMeta } from "@/lib/game-detail-player-meta";
import type { GameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import type { Game } from "@/lib/mock-games";
import {
  getCompletedProductBadge,
  getPlayAccessPlayerBadge,
} from "@/lib/game-player-display";
import { getPlayAccessBadgeLabel } from "@/lib/play-access-type";
import { PLAY_TIME_OPTIONS } from "@/lib/play-time-options";
import {
  EMPTY_PLAY_ENVIRONMENT_FORM,
  mergePlayEnvironmentIntoTags,
  type PlayEnvironmentFormState,
} from "@/lib/play-environment";
import type { SubmitPlayAccessType } from "@/lib/play-access-type";
import {
  genresToLegacyGenreColumn,
  sanitizeProjectGenresForSave,
} from "@/lib/project-genres";
import { DEFAULT_PLAYABLE_VERSION } from "@/lib/playable-version";
import type { SubmitFormData } from "@/lib/project-form";
import { resolveLinkFieldsForWrite } from "@/lib/project-link-write";
import {
  countConfiguredPublishLinks,
  createEmptyPublishDestination,
  distributionTypeFromPrimary,
  type PublishDestination,
  type RelatedLink,
} from "@/lib/project-publish-links";
import type { ProjectVisibility } from "@/lib/project-visibility";
import {
  createEmptyPromptDraft,
  sanitizePromptDrafts,
  type DeveloperPromptDraft,
  type DeveloperPromptInput,
} from "@/lib/version-prompt-form";

export const SUBMIT_DRAFT_PREVIEW_ID = "submit-draft-preview";

/** 投稿バリデーション失敗時に開く編集パネル（任意項目・画像は含まない） */
export type SubmitValidationEditMode =
  | "basic-info"
  | "genres-tags"
  | "introduction"
  | "play-info"
  | "publication";

export const SUBMIT_VALIDATION_PANEL_LABELS: Record<SubmitValidationEditMode, string> = {
  "basic-info": "基本情報",
  "genres-tags": "ジャンル・タグ",
  introduction: "作品紹介",
  "play-info": "プレイ情報",
  publication: "公開先・公開設定",
};

/** プレビュー表示専用 — 保存データには入れない */
export const SUBMIT_DRAFT_TITLE_PLACEHOLDER = "タイトル未入力";
export const SUBMIT_DRAFT_LEAD_PLACEHOLDER = "キャッチコピーがここに表示されます";
export const SUBMIT_DRAFT_INTRO_PLACEHOLDER = "作品紹介がここに表示されます";
export const SUBMIT_DRAFT_GENRE_PLACEHOLDER = "ジャンル未設定";
export const SUBMIT_DRAFT_PHASE_PLACEHOLDER = "開発フェーズ未設定";
export const SUBMIT_DRAFT_IMAGE_PLACEHOLDER = "画像を追加するとここに表示されます";

const DRAFT_PLAY_METHOD_OPTIONS = [
  { id: "browser" as const, label: "ブラウザで遊ぶ" },
  { id: "download" as const, label: "ダウンロードする" },
  { id: "external" as const, label: "ストアで入手する" },
];

export type SubmitDraftState = {
  title: string;
  /** ヒーロー用の1行説明（game.description） */
  description: string;
  phase: string;
  genres: ForgeGenreOption[];
  featureTags: ForgeFeatureTagOption[];
  introduction: string;
  thumbnailUrls: string[];
  playEnvironment: PlayEnvironmentFormState;
  /** @deprecated synced from publishDestinations — kept for callers / preview */
  playUrl: string;
  estimatedPlayTime: string;
  steamUrl: string;
  itchUrl: string;
  discordUrl: string;
  xUrl: string;
  officialUrl: string;
  youtubeUrl: string;
  githubUrl: string;
  publishDestinations: PublishDestination[];
  relatedLinks: RelatedLink[];
  visibility: ProjectVisibility;
  promptMode: "none" | "custom";
  promptDrafts: DeveloperPromptDraft[];
  playAccessType: SubmitPlayAccessType;
  declareAlreadyReleased: boolean;
};

export type SubmitDraftOwner = {
  ownerId: string;
  ownerName: string;
  creator: string;
};

function resolveDraftLinkFields(draft: SubmitDraftState) {
  return resolveLinkFieldsForWrite({
    playUrl: draft.playUrl,
    steamUrl: draft.steamUrl,
    itchUrl: draft.itchUrl,
    githubUrl: draft.githubUrl,
    discordUrl: draft.discordUrl,
    officialUrl: draft.officialUrl,
    xUrl: draft.xUrl,
    youtubeUrl: draft.youtubeUrl,
    publishDestinations: draft.publishDestinations,
    relatedLinks: draft.relatedLinks,
  });
}

function playEnvironmentWithSyncedDistribution(
  draft: SubmitDraftState,
): PlayEnvironmentFormState {
  const distribution = distributionTypeFromPrimary(draft.publishDestinations);
  return {
    ...draft.playEnvironment,
    distribution: distribution || draft.playEnvironment.distribution,
  };
}

export function createEmptySubmitDraft(): SubmitDraftState {
  return {
    title: "",
    description: "",
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
    publishDestinations: [
      createEmptyPublishDestination({
        isPrimary: true,
        kind: "other",
        usageMethod: "other",
      }),
    ],
    relatedLinks: [],
    visibility: "public",
    promptMode: "custom",
    promptDrafts: [createEmptyPromptDraft()],
    playAccessType: "free",
    declareAlreadyReleased: false,
  };
}

/** 投稿保存用 — 未入力は空のまま。プレースホルダー文字列は入れない */
export function buildDraftGame(
  draft: SubmitDraftState,
  owner: SubmitDraftOwner,
): Game {
  const intro = draft.introduction.trim();
  const lead = draft.description.trim();
  const genres = sanitizeProjectGenresForSave(draft.genres);
  const featureTags = sanitizeFeatureTagsForSave(draft.featureTags);
  const playEnvironment = playEnvironmentWithSyncedDistribution(draft);
  const tags = mergePlayEnvironmentIntoTags(featureTags, playEnvironment);
  const links = resolveDraftLinkFields(draft);

  return {
    id: SUBMIT_DRAFT_PREVIEW_ID,
    title: draft.title.trim(),
    creator: owner.creator,
    ownerName: owner.ownerName,
    ownerId: owner.ownerId,
    genres,
    genre: genresToLegacyGenreColumn(genres) || "",
    description: lead,
    overviewIntroduction: intro || null,
    phase: draft.phase.trim(),
    status: draft.phase.trim(),
    lookingForTesters: false,
    lastUpdated: "投稿前",
    createdAt: new Date().toISOString(),
    section: "new",
    thumbnailUrls: draft.thumbnailUrls,
    thumbnailUrl: draft.thumbnailUrls[0],
    tags,
    playUrl: links.playUrl,
    estimatedPlayTime: draft.estimatedPlayTime.trim() || undefined,
    steamUrl: links.steamUrl,
    itchUrl: links.itchUrl,
    discordUrl: links.discordUrl,
    xUrl: links.xUrl,
    officialUrl: links.officialUrl,
    youtubeUrl: links.youtubeUrl,
    githubUrl: links.githubUrl,
    publishDestinations: links.publishDestinations,
    relatedLinks: links.relatedLinks,
    visibility: draft.visibility,
    playableVersion: DEFAULT_PLAYABLE_VERSION,
    releaseStatus: draft.declareAlreadyReleased ? "released" : "in_development",
    playAccessType: draft.playAccessType,
    overviewFeatures: null,
  };
}

/** 左プレビュー表示専用 — 未入力はプレースホルダー文言で見せる */
export function buildSubmitDraftDetailV0(
  draft: SubmitDraftState,
  owner: SubmitDraftOwner,
): GameDetailV0 {
  const intro = draft.introduction.trim();
  const lead = draft.description.trim();
  const genres = sanitizeProjectGenresForSave(draft.genres);
  const featureTags = sanitizeFeatureTagsForSave(draft.featureTags);
  const tags =
    genres.length > 0
      ? [...genres, ...featureTags]
      : [SUBMIT_DRAFT_GENRE_PLACEHOLDER];
  const heroImage = draft.thumbnailUrls[0] ?? "";

  return {
    id: SUBMIT_DRAFT_PREVIEW_ID,
    title: draft.title.trim() || SUBMIT_DRAFT_TITLE_PLACEHOLDER,
    lead: lead || SUBMIT_DRAFT_LEAD_PLACEHOLDER,
    tags,
    heroImage,
    galleryImages: draft.thumbnailUrls,
    currentVersion: DEFAULT_PLAYABLE_VERSION,
    developer: {
      id: owner.ownerId,
      name: owner.ownerName,
      avatar: heroImage,
      followers: 0,
      bio: "",
      following: false,
    },
    witnessCount: 0,
    voiceCount: 0,
    devlogUpdatedAgo: "投稿前",
    lastUpdated: "投稿前",
    watching: false,
    saved: false,
    introduction: intro || SUBMIT_DRAFT_INTRO_PLACEHOLDER,
    features: [],
    developerWorry: "",
    wantedVoices: [],
    relatedTags: tags,
    relatedGames: [],
  };
}

export function resolveSubmitDraftPreviewPlayerMeta(
  draft: SubmitDraftState,
): GameDetailPlayerMeta {
  const phase = draft.phase.trim();
  const playTime = draft.estimatedPlayTime.trim();
  const distribution = distributionTypeFromPrimary(draft.publishDestinations);
  const releaseBadge = draft.declareAlreadyReleased ? getCompletedProductBadge() : null;
  const playAccessBadge = getPlayAccessPlayerBadge(draft.playAccessType);

  return {
    phaseLabel: phase ? displayPhase(phase) : SUBMIT_DRAFT_PHASE_PLACEHOLDER,
    phaseDescription: phase
      ? getPhasePlayerDescription(phase)
      : "右パネルで開発フェーズを設定できます",
    releaseBadgeLabel: releaseBadge?.label ?? null,
    releaseBadgeEmoji: releaseBadge?.emoji,
    releaseBadgeTone: releaseBadge?.tone === "completed" ? "completed" : undefined,
    playAccessBadgeLabel: playAccessBadge?.label ?? getPlayAccessBadgeLabel(draft.playAccessType),
    estimatedPlayTime: playTime || null,
    environmentLabels: ["公開先未設定"],
    playInfo: {
      playTimeOptions: PLAY_TIME_OPTIONS.map((label) => ({
        label,
        active: Boolean(playTime && label === playTime),
      })),
      deviceOptions: [
        { label: "PC", active: draft.playEnvironment.pc },
        { label: "スマホ", active: draft.playEnvironment.mobile },
      ],
      playMethodOptions: DRAFT_PLAY_METHOD_OPTIONS.map((option) => ({
        label: option.label,
        active: Boolean(distribution && distribution === option.id),
      })),
    },
    focusNotes: null,
  };
}

export function draftToSubmitFormData(
  draft: SubmitDraftState,
  owner: SubmitDraftOwner,
): SubmitFormData {
  const featureTags = sanitizeFeatureTagsForSave(draft.featureTags);
  const playEnvironment = playEnvironmentWithSyncedDistribution(draft);
  const links = resolveDraftLinkFields(draft);

  return {
    title: draft.title.trim(),
    creator: owner.creator,
    genres: sanitizeProjectGenresForSave(draft.genres),
    description: draft.description.trim(),
    introduction: draft.introduction.trim(),
    phase: draft.phase.trim(),
    thumbnailUrls: draft.thumbnailUrls,
    lookingForTesters: false,
    tags: mergePlayEnvironmentIntoTags(featureTags, playEnvironment),
    playUrl: links.playUrl,
    estimatedPlayTime: draft.estimatedPlayTime.trim() || undefined,
    steamUrl: links.steamUrl,
    itchUrl: links.itchUrl,
    discordUrl: links.discordUrl,
    xUrl: links.xUrl,
    officialUrl: links.officialUrl,
    youtubeUrl: links.youtubeUrl,
    githubUrl: links.githubUrl,
    publishDestinations: links.publishDestinations,
    relatedLinks: links.relatedLinks,
    visibility: draft.visibility,
    playAccessType: draft.playAccessType,
    declareAlreadyReleased: draft.declareAlreadyReleased,
  };
}

export function getSubmitPromptsToSave(draft: SubmitDraftState): DeveloperPromptInput[] {
  return sanitizePromptDrafts(draft.promptDrafts);
}

export function summarizeSubmitDraftBasic(draft: SubmitDraftState): string {
  const title = draft.title.trim() || SUBMIT_DRAFT_TITLE_PLACEHOLDER;
  const phase = draft.phase.trim() ? displayPhase(draft.phase) : SUBMIT_DRAFT_PHASE_PLACEHOLDER;
  const lead = draft.description.trim();
  const leadSummary = lead
    ? lead.length > PROJECT_ONE_LINE_DESCRIPTION_MAX
      ? `${lead.slice(0, PROJECT_ONE_LINE_DESCRIPTION_MAX - 1)}…`
      : lead.length > 36
        ? `${lead.slice(0, 35)}…`
        : lead
    : "キャッチコピー未入力";
  return `${title} · ${phase} · ${leadSummary}`;
}

export function summarizeSubmitDraftGenres(draft: SubmitDraftState): string {
  const genres = sanitizeProjectGenresForSave(draft.genres);
  if (genres.length === 0) {
    return SUBMIT_DRAFT_GENRE_PLACEHOLDER;
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
  const parts: string[] = [];
  if (draft.playAccessType) {
    parts.push("料金設定済み");
  }
  const devices: string[] = [];
  if (draft.playEnvironment.pc) {
    devices.push("PC");
  }
  if (draft.playEnvironment.mobile) {
    devices.push("スマホ");
  }
  if (devices.length > 0) {
    parts.push(devices.join("・"));
  } else {
    parts.push("対応環境未設定");
  }
  return parts.join(" · ");
}

export function summarizeSubmitDraftPublication(draft: SubmitDraftState): string {
  const { publishCount, relatedCount } = countConfiguredPublishLinks(
    draft.publishDestinations,
    draft.relatedLinks,
  );
  const visibility = draft.visibility === "public" ? "公開" : "非公開";
  const linkParts: string[] = [];
  if (publishCount > 0) {
    linkParts.push(`公開先 ${publishCount} 件`);
  } else {
    linkParts.push("公開先未設定");
  }
  if (relatedCount > 0) {
    linkParts.push(`関連リンク ${relatedCount} 件`);
  }
  return `${visibility} · ${linkParts.join(" · ")}`;
}
