"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import {
  summarizeVersionPromptSettings,
  VersionPromptEditorDialog,
} from "@/components/version-prompt-editor-dialog";
import type { DeveloperPromptDraft } from "@/lib/version-prompt-form";

type VersionPromptSettingsTriggerProps = {
  mode: "none" | "custom";
  onModeChange: (mode: "none" | "custom") => void;
  drafts: DeveloperPromptDraft[];
  onDraftsChange: (drafts: DeveloperPromptDraft[]) => void;
  versionLabel?: string;
  showValidation?: boolean;
  title?: string;
  buttonLabel?: string;
};

/** 投稿フォーム用 — 問い設定ボタン + モーダル（DB 保存は親フォームの投稿時） */
export function VersionPromptSettingsTrigger({
  mode,
  onModeChange,
  drafts,
  onDraftsChange,
  versionLabel = "現在のプレイ可能ver",
  showValidation = false,
  title = "プレイヤーへの問い",
  buttonLabel = "問いを設定",
}: VersionPromptSettingsTriggerProps) {
  const [open, setOpen] = useState(false);
  const summary = summarizeVersionPromptSettings(mode, drafts);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-400">
            {title}{" "}
            <span className="font-normal text-zinc-600">（任意）</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">{summary}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-violet-500/40 hover:text-white"
        >
          <MessageCircleQuestion className="size-4" aria-hidden="true" />
          {buttonLabel}
        </button>
      </div>

      <VersionPromptEditorDialog
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        onModeChange={onModeChange}
        drafts={drafts}
        onDraftsChange={onDraftsChange}
        versionLabel={versionLabel}
        showValidation={showValidation}
      />
    </>
  );
}
