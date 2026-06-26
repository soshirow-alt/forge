import type { ConfirmationRequestDraft } from "@/lib/confirmation-request-draft";
import { hasConfirmationRequestContent } from "@/lib/confirmation-request-draft";

/** プレイヤー向け変化チェック — 確認依頼あり */
export type ChangeCheckWithConfirmation = {
  kind: "confirmed";
  priorPlayedVersion: string;
  confirmation: ConfirmationRequestDraft;
};

/** プレイヤー向け変化チェック — 確認依頼なし */
export type ChangeCheckGeneric = {
  kind: "generic";
  priorPlayedVersion: string;
  updateKind: "devlog" | "version";
};

export type ChangeCheckPreviewState =
  | ChangeCheckWithConfirmation
  | ChangeCheckGeneric;

const MOCK_BY_GAME: Record<string, ChangeCheckPreviewState> = {
  "seikat-no-tabiji": {
    kind: "confirmed",
    priorPlayedVersion: "v0.3.1",
    confirmation: {
      changesSummary: "ボス戦の難易度を調整しました",
      askSummary: "前より理不尽に感じないか確認してほしい",
      estimatedDuration: "5分",
    },
  },
  "roshin-no-zanko": {
    kind: "generic",
    priorPlayedVersion: "v0.2.0",
    updateKind: "devlog",
  },
};

export type ChangeCheckPreviewOverride = "confirmed" | "generic" | "off";

export function resolveChangeCheckPreviewState(
  gameId: string,
  override: ChangeCheckPreviewOverride | null,
): ChangeCheckPreviewState | null {
  if (override === "off") {
    return null;
  }

  if (override === "confirmed") {
    return MOCK_BY_GAME["seikat-no-tabiji"]!;
  }

  if (override === "generic") {
    return MOCK_BY_GAME["roshin-no-zanko"]!;
  }

  return MOCK_BY_GAME[gameId] ?? null;
}

export function parseChangeCheckPreviewOverride(
  param: string | null,
): ChangeCheckPreviewOverride | null {
  if (param === "confirmed" || param === "generic" || param === "off") {
    return param;
  }
  return null;
}

export function formatChangeCheckConfirmedBody(
  confirmation: ConfirmationRequestDraft,
): { changeLine: string; askLine: string | null } {
  const changeLine = confirmation.changesSummary.trim();
  const ask = confirmation.askSummary.trim();
  const duration = confirmation.estimatedDuration.trim();

  if (!ask && !duration) {
    return { changeLine, askLine: null };
  }

  const durationPrefix = duration ? `${duration}ほど遊んで、` : "";
  const askCore = ask || "変更を確認してほしい";
  const askLine = `${durationPrefix}${askCore}${ask.endsWith("。") || ask.endsWith("？") || ask.endsWith("?") ? "" : "そうです。"}`;

  return { changeLine, askLine };
}

export function isConfirmationRequestFilled(
  state: ChangeCheckPreviewState,
): state is ChangeCheckWithConfirmation {
  if (state.kind !== "confirmed") {
    return false;
  }
  return hasConfirmationRequestContent(state.confirmation);
}
