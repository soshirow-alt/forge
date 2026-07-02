"use client";

import { V0SimpleModal } from "@/components/v0-simple-modal";
import { ProjectReleaseStudioPanel } from "@/components/project-release-studio-panel";

type StudioReleaseDetailModalProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  devlogCount: number;
  playableVersion: string;
};

export function StudioReleaseDetailModal({
  open,
  onClose,
  projectId,
  devlogCount,
  playableVersion,
}: StudioReleaseDetailModalProps) {
  if (!open) {
    return null;
  }

  return (
    <V0SimpleModal
      title="正式版について"
      subtitle="完成版として公開する準備ができたら、正式版として宣言できます"
      onClose={onClose}
      size="xl"
    >
      <ProjectReleaseStudioPanel
        projectId={projectId}
        devlogCount={devlogCount}
        playableVersion={playableVersion}
        layout="detail"
      />
    </V0SimpleModal>
  );
}
