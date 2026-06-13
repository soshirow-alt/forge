export type SubmitFormData = {
  title: string;
  creator: string;
  genre: string;
  description: string;
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
};

export type ProjectEditFormData = {
  title: string;
  genre: string;
  description: string;
  tags: string[];
  lookingForTesters: boolean;
  testerSlots?: number;
  thumbnailUrl?: string;
  steamUrl?: string;
  itchUrl?: string;
  githubUrl?: string;
  discordUrl?: string;
  officialUrl?: string;
  visibility: "public" | "private";
};
