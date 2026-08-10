export type ContentReportTargetType =
  | "project"
  | "community_post"
  | "community_reply"
  | "developer"
  | "consultation_message";

export type ContentReportReasonCode =
  | "spam"
  | "harassment"
  | "rights"
  | "unsafe_link"
  | "other";

export type ContentReportTarget = {
  targetType: ContentReportTargetType;
  targetId: string;
  contextLabel: string;
};

export const CONTENT_REPORT_REASONS: {
  code: ContentReportReasonCode;
  label: string;
}[] = [
  { code: "spam", label: "スパム・宣伝" },
  { code: "harassment", label: "ハラスメント・迷惑行為" },
  { code: "rights", label: "権利侵害のおそれ" },
  { code: "unsafe_link", label: "不適切な外部リンク" },
  { code: "other", label: "その他" },
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 本番通報対象 — Supabase 正本の UUID のみ */
export function isReportableContentId(id: string): boolean {
  return UUID_RE.test(id);
}

export function contentReportTargetLabel(type: ContentReportTargetType): string {
  switch (type) {
    case "project":
      return "作品";
    case "community_post":
      return "コミュニティ投稿";
    case "community_reply":
      return "コミュニティ返信";
    case "developer":
      return "開発者";
    case "consultation_message":
      return "メッセージ";
    default:
      return "コンテンツ";
  }
}
