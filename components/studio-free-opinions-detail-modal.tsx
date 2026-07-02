"use client";

import { V0SimpleModal } from "@/components/v0-simple-modal";
import { NurtureDeepFeedbackSection } from "@/components/nurture-deep-feedback-section";
import type { HelpfulMarkSourceType } from "@/lib/developer-helpful-mark";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

type StudioFreeOpinionsDetailModalProps = {
  open: boolean;
  onClose: () => void;
  playableVersion: string;
  feedbackEntries: ProjectFeedbackEntry[];
  helpfulMarks?: Set<string>;
  onToggleHelpful?: (
    sourceType: HelpfulMarkSourceType,
    sourceId: string,
    marked: boolean,
  ) => void;
};

export function StudioFreeOpinionsDetailModal({
  open,
  onClose,
  playableVersion,
  feedbackEntries,
  helpfulMarks,
  onToggleHelpful,
}: StudioFreeOpinionsDetailModalProps) {
  if (!open) {
    return null;
  }

  return (
    <V0SimpleModal
      title="自由な意見"
      subtitle={`v${playableVersion}`}
      onClose={onClose}
      size="xl"
    >
      <NurtureDeepFeedbackSection
        feedbackEntries={feedbackEntries}
        playableVersion={playableVersion}
        studioPane
        helpfulMarks={helpfulMarks}
        onToggleHelpful={onToggleHelpful}
      />
    </V0SimpleModal>
  );
}
