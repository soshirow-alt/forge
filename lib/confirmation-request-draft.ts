/** 確認依頼の任意入力（Devlog 公開時に confirmation_requests へ保存） */

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
