"use client";

import { VersionPromptEditor } from "@/components/version-prompt-editor";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import type { DeveloperPromptDraft } from "@/lib/version-prompt-form";

type VersionPromptEditorDialogProps = {
  open: boolean;
  onClose: () => void;
  mode: "none" | "custom";
  onModeChange: (mode: "none" | "custom") => void;
  drafts: DeveloperPromptDraft[];
  onDraftsChange: (drafts: DeveloperPromptDraft[]) => void;
  versionLabel?: string;
  showValidation?: boolean;
  onConfirm?: () => void | Promise<void>;
  confirmLabel?: string;
  confirming?: boolean;
  confirmError?: string | null;
  title?: string;
  subtitle?: string;
};

export function VersionPromptEditorDialog({
  open,
  onClose,
  mode,
  onModeChange,
  drafts,
  onDraftsChange,
  versionLabel = "現在のプレイ可能ver",
  showValidation = false,
  onConfirm,
  confirmLabel = "保存",
  confirming = false,
  confirmError = null,
  title = "プレイヤーへの問い",
  subtitle,
}: VersionPromptEditorDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <V0SimpleModal
      title={title}
      subtitle={subtitle ?? versionLabel}
      onClose={onClose}
      size="lg"
    >
      <VersionPromptEditor
        mode={mode}
        onModeChange={onModeChange}
        drafts={drafts}
        onDraftsChange={onDraftsChange}
        versionLabel={versionLabel}
        showValidation={showValidation}
        embeddedInModal
      />
      {confirmError ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {confirmError}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={confirming}
          className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-60"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={() => (onConfirm ? void onConfirm() : onClose())}
          disabled={confirming}
          className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {confirming ? "保存中…" : confirmLabel}
        </button>
      </div>
    </V0SimpleModal>
  );
}

export function summarizeVersionPromptSettings(
  mode: "none" | "custom",
  drafts: DeveloperPromptDraft[],
): string {
  if (mode === "none") {
    return "デフォルト問い";
  }

  const count = drafts.filter((draft) => draft.promptText.trim()).length;
  return count > 0 ? `カスタム（${count}問）` : "カスタム（未入力）";
}
