"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import { V0SimpleModal } from "@/components/v0-simple-modal";
import { VersionPromptEditor } from "@/components/version-prompt-editor";
import type { DeveloperPromptDraft } from "@/lib/version-prompt-form";

type VersionPromptSettingsModalProps = {
  mode: "none" | "custom";
  onModeChange: (mode: "none" | "custom") => void;
  drafts: DeveloperPromptDraft[];
  onDraftsChange: (drafts: DeveloperPromptDraft[]) => void;
  versionLabel?: string;
  showValidation?: boolean;
};

function summarizePromptSettings(
  mode: "none" | "custom",
  drafts: DeveloperPromptDraft[],
): string {
  if (mode === "none") {
    return "デフォルト問い（未設定）";
  }

  const count = drafts.filter((draft) => draft.promptText.trim()).length;
  return count > 0 ? `カスタム問い（${count}問）` : "カスタム問い（未入力）";
}

export function VersionPromptSettingsModal({
  mode,
  onModeChange,
  drafts,
  onDraftsChange,
  versionLabel = "現在のプレイ可能ver",
  showValidation = false,
}: VersionPromptSettingsModalProps) {
  const [open, setOpen] = useState(false);
  const summary = summarizePromptSettings(mode, drafts);

  return (
    <>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-400">プレイヤーへの問い</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              プレイ後に届けてほしい短い問い（任意）。{versionLabel}向け。
            </p>
            <p className="mt-2 text-sm text-zinc-300">{summary}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-violet-500/40 hover:text-white"
          >
            <MessageCircleQuestion className="size-4" aria-hidden="true" />
            問いを設定
          </button>
        </div>
      </div>

      {open ? (
        <V0SimpleModal
          title="プレイヤーへの問い"
          subtitle={`${versionLabel} — 未設定の場合は「もう一度遊びたい？」などのデフォルト問いが表示されます`}
          onClose={() => setOpen(false)}
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
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              閉じる
            </button>
          </div>
        </V0SimpleModal>
      ) : null}
    </>
  );
}
