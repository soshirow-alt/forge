import type { ConfirmationRequestDraft } from "@/lib/confirmation-request-draft";
import { hasConfirmationRequestContent } from "@/lib/confirmation-request-draft";
import type {
  ChangeCheckGeneric,
  ChangeCheckState,
  ChangeCheckWithConfirmation,
} from "@/lib/change-check-types";

export type {
  ChangeCheckGeneric,
  ChangeCheckState,
  ChangeCheckWithConfirmation,
};

/** @deprecated use ChangeCheckState */
export type ChangeCheckPreviewState = ChangeCheckState;

const MOCK_BY_GAME: Record<string, ChangeCheckState> = {
  "seikat-no-tabiji": {
    kind: "confirmed",
    priorPlayedVersion: "v0.3.1",
    confirmation: {
      changesSummary: "ボス戦の難易度を調整しました",
      askSummary: "前より理不尽に感じないか確認してほしい",
      estimatedDuration: "5分",
      linkedPriorities: [
        { id: "concern-summary", title: "ボス戦が理不尽に感じる" },
      ],
      notifyAudience: [],
      notifyEnabled: true,
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
): ChangeCheckState | null {
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

export { formatChangeCheckConfirmedBody } from "@/lib/change-check-display";

export function isConfirmationRequestFilled(
  state: ChangeCheckState,
): state is ChangeCheckWithConfirmation {
  if (state.kind !== "confirmed") {
    return false;
  }
  return hasConfirmationRequestContent(state.confirmation);
}
