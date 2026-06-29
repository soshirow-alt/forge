export type SubmitFormData = {
  title: string;
  creator: string;
  genre: string;
  /** @deprecated use introduction — kept for callers that still pass description */
  description?: string;
  /** 作品紹介（正本）。短い description は保存時に先頭から自動生成 */
  introduction: string;
  phase: string;
  thumbnailUrl?: string;
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
  visibility?: "public" | "private";
};

export type ProjectEditFormData = {
  title: string;
  genre: string;
  tags: string[];
  lookingForTesters: boolean;
  testerSlots?: number;
  thumbnailUrl?: string;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  visibility: "public" | "private";
};
