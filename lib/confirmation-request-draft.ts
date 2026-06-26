import type { ConfirmationNotifyAudienceKey } from "@/lib/confirmation-request-audience";

/** Studio「次に直すこと」から公開時に任意紐付け */
export type LinkedPriorityRef = {
  id: string;
  title: string;
};

/** 確認依頼の任意入力（Devlog 公開時に confirmation_requests へ保存） */

export type ConfirmationRequestDraft = {
  changesSummary: string;
  askSummary: string;
  estimatedDuration: string;
  linkedPriorities: LinkedPriorityRef[];
  notifyAudience: ConfirmationNotifyAudienceKey[];
  notifyEnabled: boolean;
};

export const EMPTY_CONFIRMATION_REQUEST_DRAFT: ConfirmationRequestDraft = {
  changesSummary: "",
  askSummary: "",
  estimatedDuration: "",
  linkedPriorities: [],
  notifyAudience: [],
  notifyEnabled: true,
};

export function hasConfirmationRequestContent(
  draft: ConfirmationRequestDraft,
): boolean {
  return Boolean(
    draft.changesSummary.trim() ||
      draft.askSummary.trim() ||
      draft.estimatedDuration.trim() ||
      draft.linkedPriorities.length > 0,
  );
}

export function shouldPersistConfirmationRequest(
  draft: ConfirmationRequestDraft,
): boolean {
  return (
    hasConfirmationRequestContent(draft) ||
    draft.notifyAudience.length > 0 ||
    draft.notifyEnabled === false
  );
}

export function linkedPriorityIds(draft: ConfirmationRequestDraft): string[] {
  return draft.linkedPriorities.map((item) => item.id);
}
