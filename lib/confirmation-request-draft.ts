/** Step 1 mock — 確認依頼の任意入力（永続化なし） */

export type ConfirmationRequestDraft = {
  changesSummary: string;
  askSummary: string;
  estimatedDuration: string;
};

export const EMPTY_CONFIRMATION_REQUEST_DRAFT: ConfirmationRequestDraft = {
  changesSummary: "",
  askSummary: "",
  estimatedDuration: "",
};

export function hasConfirmationRequestContent(
  draft: ConfirmationRequestDraft,
): boolean {
  return Boolean(
    draft.changesSummary.trim() ||
      draft.askSummary.trim() ||
      draft.estimatedDuration.trim(),
  );
}
