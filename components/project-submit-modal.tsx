"use client";

import { useState } from "react";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { ProjectSubmitForm } from "@/components/project-submit-form";
import { ProjectSubmitSuccessPanel } from "@/components/project-submit-success-panel";
import type { ProjectVisibility } from "@/lib/project-visibility";

type ProjectSubmitModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ProjectSubmitModal({ open, onClose }: ProjectSubmitModalProps) {
  const [successState, setSuccessState] = useState<{
    gameId: string;
    title: string;
    visibility: ProjectVisibility;
  } | null>(null);

  if (!open) {
    return null;
  }

  function handleClose() {
    setSuccessState(null);
    onClose();
  }

  function handleSubmitAnother() {
    setSuccessState(null);
  }

  const title = successState ? "投稿しました！" : "作品を投稿する";
  const subtitle = successState
    ? undefined
    : "開発中のゲーム情報を入力して、Forgeに掲載しましょう";

  return (
    <V0SimpleModal
      title={title}
      subtitle={subtitle}
      onClose={handleClose}
      size="xl"
    >
      {successState ? (
        <ProjectSubmitSuccessPanel
          gameId={successState.gameId}
          title={successState.title}
          visibility={successState.visibility}
          compact
          onSubmitAnother={handleSubmitAnother}
          onClose={handleClose}
        />
      ) : (
        <ProjectSubmitForm
          formKey="submit-modal"
          embedded
          onCancel={handleClose}
          onSubmitted={(gameId, visibility, projectTitle) =>
            setSuccessState({ gameId, title: projectTitle, visibility })
          }
        />
      )}
    </V0SimpleModal>
  );
}
