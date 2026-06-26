import type { GameDevlogEntry } from "@/lib/game-devlog-v0-mock-data";

const STORAGE_KEY = "forge-v0-studio-devlog-extras";

type ExtrasByProject = Record<string, GameDevlogEntry[]>;

const serverSnapshot: ExtrasByProject = {};

let cachedClientSnapshot: ExtrasByProject | null = null;

function cloneExtras(data: ExtrasByProject): ExtrasByProject {
  const next: ExtrasByProject = {};
  for (const [projectId, entries] of Object.entries(data)) {
    next[projectId] = entries.map((entry) => ({ ...entry }));
  }
  return next;
}

function readExtras(): ExtrasByProject {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as ExtrasByProject;
  } catch {
    return {};
  }
}

function refreshClientSnapshot(data?: ExtrasByProject): ExtrasByProject {
  cachedClientSnapshot = cloneExtras(data ?? readExtras());
  return cachedClientSnapshot;
}

export function getStudioDevlogExtrasServerSnapshot(): ExtrasByProject {
  return serverSnapshot;
}

export function getStudioDevlogExtrasSnapshot(): ExtrasByProject {
  if (typeof window === "undefined") {
    return getStudioDevlogExtrasServerSnapshot();
  }
  if (cachedClientSnapshot === null) {
    return refreshClientSnapshot();
  }
  return cachedClientSnapshot;
}

export function getStudioDevlogExtrasForProject(projectId: string): GameDevlogEntry[] {
  return getStudioDevlogExtrasSnapshot()[projectId] ?? [];
}

function writeExtras(data: ExtrasByProject) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  refreshClientSnapshot(data);
  window.dispatchEvent(new Event("forge-studio-devlog-extras-change"));
}

export function addStudioDevlogExtra(
  projectId: string,
  entry: GameDevlogEntry,
): void {
  const current = readExtras();
  const existing = current[projectId] ?? [];
  writeExtras({
    ...current,
    [projectId]: [entry, ...existing],
  });
}

export function subscribeStudioDevlogExtras(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = () => {
    refreshClientSnapshot();
    listener();
  };
  window.addEventListener("forge-studio-devlog-extras-change", handler);
  return () =>
    window.removeEventListener("forge-studio-devlog-extras-change", handler);
}

export function studioProjectDevlogNewHref(projectId: string): string {
  return `/studio/projects/${projectId}/devlog/new`;
}

function formatToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

export function buildStudioDevlogEntry(input: {
  title: string;
  content: string;
  publishNewVersion: boolean;
  newVersion?: string;
  developerWorry?: string;
  wantedVoices?: string[];
}): GameDevlogEntry {
  const version =
    input.publishNewVersion && input.newVersion?.trim()
      ? input.newVersion.trim().startsWith("v")
        ? input.newVersion.trim()
        : `v${input.newVersion.trim()}`
      : "—";

  const wantedVoices =
    input.wantedVoices?.map((line) => line.trim()).filter(Boolean) ?? [];

  return {
    id: `session-${Date.now()}`,
    version,
    publishedAt: formatToday(),
    relativeLabel: "たった今",
    title: input.title.trim(),
    excerpt: input.content.trim(),
    highlights: [],
    kind: input.publishNewVersion ? "version" : "note",
    isLatest: true,
    developerWorry: input.developerWorry?.trim() || undefined,
    wantedVoices: wantedVoices.length > 0 ? wantedVoices : undefined,
  };
}
