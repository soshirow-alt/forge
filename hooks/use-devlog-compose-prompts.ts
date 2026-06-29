"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createEmptyPromptDraft,
  sanitizePromptDrafts,
  validatePromptDrafts,
  type DeveloperPromptDraft,
  type DeveloperPromptInput,
} from "@/lib/version-prompt-form";
import { promptInputsToDrafts } from "@/lib/studio-version-prompt-v0-store";

type UseDevlogComposePromptsOptions = {
  projectId: string;
  currentVersionKey: string;
  loadPrompts: (
    projectId: string,
    versionKey: string,
  ) => Promise<DeveloperPromptInput[]>;
};

export function useDevlogComposePrompts({
  projectId,
  currentVersionKey,
  loadPrompts,
}: UseDevlogComposePromptsOptions) {
  const [promptMode, setPromptMode] = useState<"none" | "custom">("none");
  const [promptDrafts, setPromptDrafts] = useState<DeveloperPromptDraft[]>([
    createEmptyPromptDraft(),
  ]);
  const [showValidation, setShowValidation] = useState(false);
  const [loading, setLoading] = useState(true);

  const stableLoadPrompts = useCallback(loadPrompts, [loadPrompts]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    void stableLoadPrompts(projectId, currentVersionKey).then((inputs) => {
      if (!active) {
        return;
      }

      if (inputs.length > 0) {
        setPromptMode("custom");
        setPromptDrafts(promptInputsToDrafts(inputs));
      } else {
        setPromptMode("none");
        setPromptDrafts([createEmptyPromptDraft()]);
      }
      setShowValidation(false);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [projectId, currentVersionKey, stableLoadPrompts]);

  function resolvePromptsForVersion(versionKey: string):
    | { ok: true; prompts: DeveloperPromptInput[]; versionKey: string }
    | { ok: false; message: string } {
    if (promptMode !== "custom") {
      return { ok: true, prompts: [], versionKey };
    }

    const validation = validatePromptDrafts(promptDrafts);
    if (validation.blocking) {
      setShowValidation(true);
      return {
        ok: false,
        message: validation.message ?? "問いの入力を確認してください。",
      };
    }

    return {
      ok: true,
      prompts: sanitizePromptDrafts(promptDrafts),
      versionKey,
    };
  }

  return {
    currentVersionLabel: `v${currentVersionKey}`,
    promptMode,
    setPromptMode,
    promptDrafts,
    setPromptDrafts,
    showValidation,
    setShowValidation,
    loading,
    resolvePromptsForVersion,
  };
}
