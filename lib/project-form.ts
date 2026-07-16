import type {
  PublishDestination,
  RelatedLink,
} from "@/lib/project-publish-links";
import type { AgeRating } from "@/lib/age-rating";

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
};
