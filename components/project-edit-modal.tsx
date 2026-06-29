"use client";

import { V0SimpleModal } from "@/components/v0-simple-modal";
import { ProjectEditForm } from "@/components/project-edit-form";

type ProjectEditModalProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
};

export function ProjectEditModal({ projectId, open, onClose }: ProjectEditModalProps) {
  if (!open) {
    return null;
  }

  return (
    <V0SimpleModal
      title="作品情報を編集"
      subtitle="タイトル・紹介・公開設定・関連リンクなど"
      onClose={onClose}
      size="xl"
    >
      <ProjectEditForm projectId={projectId} onSaved={onClose} onCancel={onClose} />
    </V0SimpleModal>
  );
}
