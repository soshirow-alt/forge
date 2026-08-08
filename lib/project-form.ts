import type {
  PublishDestination,
  RelatedLink,
} from "@/lib/project-publish-links";
import type { AgeRating } from "@/lib/age-rating";
import type { ProjectCategoryId } from "@/lib/project-categories";

export type SubmitFormData = {
  title: string;
  creator: string;
  genres: string[];
  /** @deprecated use introduction — kept for callers that still pass description */
  description?: string;
  /** 作品紹介（正本）。短い description は保存時に先頭から自動生成 */
  introduction: string;
  phase: string;
  thumbnailUrls?: string[];
  lookingForTesters: boolean;
  testerSlots?: number;
  tags: string[];
  playUrl: string;
  estimatedPlayTime?: string;
  focusNotes?: string;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  publishDestinations?: PublishDestination[];
  relatedLinks?: RelatedLink[];
  visibility?: "public" | "private";
  playAccessType?: "free" | "demo_available" | "paid" | "other";
  /** Submit/edit only — triggers onboarding release after save when true and not yet released */
  declareAlreadyReleased?: boolean;
  ageRating?: AgeRating;
  /** Formal projects.category. Omitted → DB default game (legacy callers). */
  category?: ProjectCategoryId;
  /** Full category_attributes jsonb payload to persist (merge done by caller). */
  categoryAttributes?: Record<string, unknown>;
};

export type ProjectEditFormData = {
  title: string;
  /** ヒーロー・一覧用の短い説明 */
  description?: string;
  genres: string[];
  phase: string;
  playUrl: string;
  estimatedPlayTime?: string;
  tags: string[];
  lookingForTesters: boolean;
  testerSlots?: number;
  thumbnailUrls?: string[];
  /** Images panel only — allows intentional removal of all thumbnails */
  explicitThumbnailUpdate?: boolean;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  publishDestinations?: PublishDestination[];
  relatedLinks?: RelatedLink[];
  visibility: "public" | "private";
  playAccessType?: "free" | "demo_available" | "paid" | "other";
  /** Edit only — triggers onboarding release after save when true and not yet released */
  declareAlreadyReleased?: boolean;
  ageRating?: AgeRating;
  /** When set, persists projects.category (do not clear by omitting). */
  category?: ProjectCategoryId;
  /** When set, replaces category_attributes jsonb. */
  categoryAttributes?: Record<string, unknown>;
};
