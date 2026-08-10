export const COLLAB_CONSULTATION_PURPOSES = [
  { value: "use_their_work", label: "相手の作品を利用したい" },
  { value: "offer_my_work", label: "自分の作品を利用してほしい" },
  { value: "commission", label: "制作を依頼したい" },
  { value: "collaborate", label: "共同制作を相談したい" },
  { value: "other", label: "その他のコラボ相談" },
] as const;

export type CollabConsultationPurpose =
  (typeof COLLAB_CONSULTATION_PURPOSES)[number]["value"];
export type CollabConsultationStatus =
  | "open"
  | "closed"
  | "hidden_by_initiator"
  | "hidden_by_counterpart";

export type CollabConsultationSummary = {
  consultationId: string;
  counterpartId: string;
  purpose: CollabConsultationPurpose;
  initiatorProjectId: string | null;
  counterpartProjectId: string | null;
  status: CollabConsultationStatus;
  lastMessageBody: string | null;
  lastMessageSenderId: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
};

export type CollabConsultation = {
  id: string;
  initiatorId: string;
  counterpartId: string;
  purpose: CollabConsultationPurpose;
  initiatorProjectId: string | null;
  counterpartProjectId: string | null;
  status: CollabConsultationStatus;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CollabConsultationMessage = {
  id: string;
  consultationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export function consultationPurposeLabel(
  purpose: CollabConsultationPurpose,
): string {
  return (
    COLLAB_CONSULTATION_PURPOSES.find((item) => item.value === purpose)?.label ??
    "コラボ相談"
  );
}

export function isCollabConsultationPurpose(
  value: unknown,
): value is CollabConsultationPurpose {
  return COLLAB_CONSULTATION_PURPOSES.some((item) => item.value === value);
}
