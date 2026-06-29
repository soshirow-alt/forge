"use client";

import { V0SimpleModal } from "@/components/v0-simple-modal";
import { DevlogComposeForm } from "@/components/devlog-compose-form";

type DevlogComposeModalProps = {
  projectId: string;
  playableVersion?: string;
  open: boolean;
  onClose: () => void;
};

export function DevlogComposeModal({
  projectId,
  playableVersion,
  open,
  onClose,
}: DevlogComposeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <V0SimpleModal
      title="新verの開発ログ"
      subtitle="変更の記録・新ver公開・プレイヤーへの問い"
      onClose={onClose}
      size="xl"
    >
      <DevlogComposeForm
        projectId={projectId}
        playableVersion={playableVersion}
        onSaved={onClose}
        onCancel={onClose}
      />
    </V0SimpleModal>
  );
}
