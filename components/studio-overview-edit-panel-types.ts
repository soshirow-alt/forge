import type { StudioEditPreviewPatch } from "@/lib/studio-edit-preview-merge";

export type StudioOverviewEditPanelCommonProps = {
  projectId: string;
  onCancel: () => void;
  onSaved?: () => void;
  onPreviewPatchChange?: (patch: StudioEditPreviewPatch | null) => void;
};
