import type { ConfirmationRequestDraft } from "@/lib/confirmation-request-draft";

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

export type ChangeCheckState = ChangeCheckWithConfirmation | ChangeCheckGeneric;

export const CHANGE_CHECK_SECTION_ID = "change-check-card";
