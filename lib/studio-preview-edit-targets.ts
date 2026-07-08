import type { StudioOverviewEditMode } from "@/lib/studio-edit-url";
import type { SubmitValidationEditMode } from "@/lib/studio-submit-draft";

export type StudioPreviewEditTarget =
  | "title"
  | "catch-copy"
  | "introduction"
  | "phase"
  | "genres"
  | "play-access"
  | "play-info"
  | "distribution"
  | "publication"
  | "thumbnail"
  | "already-released";

export const STUDIO_FIELD_IDS = {
  title: "studio-field-title",
  catchCopy: "studio-field-catch-copy",
  phase: "studio-field-phase",
  alreadyReleased: "studio-field-already-released",
  genres: "studio-field-genres",
  introduction: "studio-field-introduction",
  playAccess: "studio-field-play-access",
  playInfo: "studio-field-play-info",
  distribution: "studio-field-distribution",
  publication: "studio-field-publication",
  thumbnail: "studio-field-thumbnail",
} as const;

export type StudioFieldId = (typeof STUDIO_FIELD_IDS)[keyof typeof STUDIO_FIELD_IDS];

export type StudioPanelEditMode =
  | SubmitValidationEditMode
  | StudioOverviewEditMode
  | "images"
  | "visibility"
  | "publication";

export type StudioPreviewEditRoute = {
  editMode: StudioPanelEditMode;
  fieldId: StudioFieldId;
  /** false = open panel at top only (no field scrollIntoView) */
  scrollToField?: boolean;
};

export const STUDIO_PREVIEW_EDIT_ROUTES: Record<
  StudioPreviewEditTarget,
  StudioPreviewEditRoute
> = {
  title: { editMode: "basic-info", fieldId: STUDIO_FIELD_IDS.title },
  "catch-copy": { editMode: "basic-info", fieldId: STUDIO_FIELD_IDS.catchCopy },
  phase: { editMode: "basic-info", fieldId: STUDIO_FIELD_IDS.phase },
  "already-released": {
    editMode: "basic-info",
    fieldId: STUDIO_FIELD_IDS.alreadyReleased,
  },
  genres: { editMode: "genres-tags", fieldId: STUDIO_FIELD_IDS.genres },
  introduction: { editMode: "introduction", fieldId: STUDIO_FIELD_IDS.introduction },
  "play-access": { editMode: "play-info", fieldId: STUDIO_FIELD_IDS.playAccess },
  "play-info": {
    editMode: "play-info",
    fieldId: STUDIO_FIELD_IDS.playInfo,
    scrollToField: false,
  },
  distribution: { editMode: "play-info", fieldId: STUDIO_FIELD_IDS.distribution },
  publication: {
    editMode: "publication",
    fieldId: STUDIO_FIELD_IDS.publication,
    scrollToField: false,
  },
  thumbnail: { editMode: "images", fieldId: STUDIO_FIELD_IDS.thumbnail },
};

export type StudioPanelFocusRequest = {
  editMode: StudioPanelEditMode;
  fieldId: StudioFieldId;
  requestId: number;
  scrollToField?: boolean;
};
