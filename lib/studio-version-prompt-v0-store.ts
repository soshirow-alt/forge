import {
  draftFromVersionPrompt,
  type DeveloperPromptDraft,
  type DeveloperPromptInput,
} from "@/lib/version-prompt-form";
import type { VersionPrompt } from "@/lib/version-prompt-types";

const STORAGE_KEY = "forge-v0-studio-version-prompts";

type PromptStore = Record<string, DeveloperPromptInput[]>;

function storageKey(projectId: string, versionKey: string): string {
  return `${projectId}::${versionKey}`;
}

function readStore(): PromptStore {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as PromptStore;
  } catch {
    return {};
  }
}

function writeStore(store: PromptStore) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getStudioVersionPromptInputs(
  projectId: string,
  versionKey: string,
): DeveloperPromptInput[] {
  const key = storageKey(projectId, versionKey);
  return readStore()[key] ?? [];
}

export function saveStudioVersionPromptInputs(
  projectId: string,
  versionKey: string,
  prompts: DeveloperPromptInput[],
): void {
  const store = readStore();
  const key = storageKey(projectId, versionKey);
  if (prompts.length === 0) {
    delete store[key];
  } else {
    store[key] = prompts;
  }
  writeStore(store);
}

export function promptInputsToDrafts(
  inputs: DeveloperPromptInput[],
): DeveloperPromptDraft[] {
  return inputs.map((input, index) => {
    const mockPrompt: VersionPrompt = {
      id: input.id ?? `studio-prompt-${index}`,
      projectId: "",
      versionKey: "",
      promptText: input.promptText,
      responseKind: input.responseKind,
      options: input.options,
      sortOrder: index,
      source: "developer",
      createdAt: new Date().toISOString(),
    };
    return draftFromVersionPrompt(mockPrompt);
  });
}
