import {
  FIXTURE_STORAGE_KEY,
  isVoiceAdoptionFixtureMode,
} from "@/lib/voice-adoption/constants";
import {
  FIXTURE_CANDIDATES,
  FIXTURE_DEVLOG,
  FIXTURE_PROJECT_TITLE,
} from "@/lib/voice-adoption/fixture-data";
import {
  evaluateFixturePrecision,
  filterAdoptableMatches,
  runFixtureMatcher,
} from "@/lib/voice-adoption/fixture-matcher";
import type { VoiceAdoptionRow } from "@/lib/voice-adoption/types";

type FixtureStoreState = {
  adoptions: VoiceAdoptionRow[];
  matcherRunIds: string[];
  seededAt: string | null;
};

function emptyState(): FixtureStoreState {
  return { adoptions: [], matcherRunIds: [], seededAt: null };
}

function readState(): FixtureStoreState {
  if (typeof window === "undefined") {
    return emptyState();
  }

  try {
    const raw = localStorage.getItem(FIXTURE_STORAGE_KEY);
    if (!raw) {
      return emptyState();
    }

    return JSON.parse(raw) as FixtureStoreState;
  } catch {
    return emptyState();
  }
}

function writeState(state: FixtureStoreState): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(FIXTURE_STORAGE_KEY, JSON.stringify(state));
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function clearFixtureStore(): void {
  writeState(emptyState());
}

export function seedFixtureAdoptionsForUser(userId: string): VoiceAdoptionRow[] {
  const output = runFixtureMatcher(FIXTURE_DEVLOG, FIXTURE_CANDIDATES);
  const adoptable = filterAdoptableMatches(output);
  const runId = createId("fixture-run");
  const now = new Date().toISOString();

  const adoptions: VoiceAdoptionRow[] = adoptable.map((match) => {
    const candidate = FIXTURE_CANDIDATES.find(
      (entry) => entry.voiceResponseId === match.voiceResponseId,
    );

    return {
      id: createId("fixture-adoption"),
      projectId: FIXTURE_DEVLOG.projectId,
      userId,
      voiceResponseId: match.voiceResponseId,
      devlogId: FIXTURE_DEVLOG.id,
      voiceVersionKey: candidate?.versionKey ?? "0.1",
      publishedVersion: FIXTURE_DEVLOG.publishedVersion,
      playerQuote: match.playerQuote,
      updateSummary: match.updateSummary,
      promptText: candidate?.promptText ?? null,
      confidence: match.confidence,
      model: "fixture",
      modelVersion: "fixture-v1",
      matcherRunId: runId,
      status: "active",
      suppressionReason: null,
      createdAt: now,
      updatedAt: now,
    };
  });
  const state = readState();
  state.adoptions = [
    ...state.adoptions.filter((row) => row.userId !== userId),
    ...adoptions,
  ];
  state.matcherRunIds = [...state.matcherRunIds, runId];
  state.seededAt = now;
  writeState(state);

  return adoptions;
}

/** Seed demo adoptions for fixture-user-a persona (5 related voices → user-a gets 2) */
export function seedDefaultFixtureDemo(): VoiceAdoptionRow[] {
  return seedFixtureAdoptionsForUser("fixture-user-a");
}

export function listFixtureAdoptionsForUser(
  userId: string,
  projectId?: string,
): VoiceAdoptionRow[] {
  const rows = readState().adoptions.filter(
    (row) => row.userId === userId && row.status === "active",
  );

  if (projectId) {
    return rows.filter((row) => row.projectId === projectId);
  }

  return rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function countFixtureAdoptionsForDevlog(devlogId: string): number {
  return readState().adoptions.filter(
    (row) => row.devlogId === devlogId && row.status === "active",
  ).length;
}

export function disputeFixtureAdoption(
  userId: string,
  adoptionId: string,
): boolean {
  const state = readState();
  const target = state.adoptions.find(
    (row) => row.id === adoptionId && row.userId === userId,
  );

  if (!target) {
    return false;
  }

  target.status = "suppressed";
  target.suppressionReason = "player_dispute";
  target.updatedAt = new Date().toISOString();
  writeState(state);
  return true;
}

export function getFixtureProjectTitle(projectId: string): string | null {
  if (projectId === FIXTURE_DEVLOG.projectId) {
    return FIXTURE_PROJECT_TITLE;
  }

  return null;
}

export function runFixturePrecisionSelfTest() {
  const output = runFixtureMatcher(FIXTURE_DEVLOG, FIXTURE_CANDIDATES);
  return evaluateFixturePrecision(output);
}

export function isFixtureStorageActive(): boolean {
  return isVoiceAdoptionFixtureMode();
}

export function mapFixtureUserToDemo(userId: string | undefined): string {
  if (!userId) {
    return "fixture-user-a";
  }

  return userId;
}

/** When fixture mode and user has no rows, auto-seed on first read */
export function ensureFixtureSeededForUser(userId: string): VoiceAdoptionRow[] {
  const existing = listFixtureAdoptionsForUser(userId);
  if (existing.length > 0) {
    return existing;
  }

  return seedFixtureAdoptionsForUser(userId);
}
