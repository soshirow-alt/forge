"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createEmptyPromptDraft,
  sanitizePromptDrafts,
  validatePromptDrafts,
  type DeveloperPromptDraft,
  type DeveloperPromptInput,
} from "@/lib/version-prompt-form";
import { normalizePlayableVersionInput } from "@/lib/playable-version";
import { promptInputsToDrafts } from "@/lib/studio-version-prompt-v0-store";

type UseDevlogComposePromptsOptions = {
  projectId: string;
  currentVersionKey: string;
  publishNewVersion: boolean;
  newVersionInput: string;
  loadPrompts: (
    projectId: string,
    versionKey: string,
  ) => Promise<DeveloperPromptInput[]>;
};

export function useDevlogComposePrompts({
  projectId,
  currentVersionKey,
  publishNewVersion,
  newVersionInput,
  loadPrompts,
}: UseDevlogComposePromptsOptions) {
  const targetVersionKey = useMemo(() => {
    if (publishNewVersion && newVersionInput.trim()) {
      return normalizePlayableVersionInput(newVersionInput);
    }
    return currentVersionKey;
  }, [publishNewVersion, newVersionInput, currentVersionKey]);

  const versionLabel = `v${targetVersionKey}`;

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

    void stableLoadPrompts(projectId, targetVersionKey).then((inputs) => {
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
  }, [projectId, targetVersionKey, stableLoadPrompts]);

  function resolvePromptsForSave():
    | { ok: true; prompts: DeveloperPromptInput[]; versionKey: string }
    | { ok: false; message: string } {
    if (publishNewVersion && !newVersionInput.trim()) {
      return {
        ok: false,
        message: "新しいプレイ可能verのバージョン名を入力してください。",
      };
    }

    if (promptMode !== "custom") {
      return { ok: true, prompts: [], versionKey: targetVersionKey };
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
      versionKey: targetVersionKey,
    };
  }

  return {
    targetVersionKey,
    versionLabel,
    promptMode,
    setPromptMode,
    promptDrafts,
    setPromptDrafts,
    showValidation,
    setShowValidation,
    loading,
    resolvePromptsForSave,
  };
}
