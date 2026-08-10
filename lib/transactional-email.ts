import { Resend } from "resend";

export type TransactionalEmailTemplateKey =
  | "collab_consultation_new"
  | "collab_consultation_message"
  | "usage_relation_request"
  | "usage_relation_accepted"
  | "usage_relation_rejected"
  | "feedback_reciprocity";

type EmailContent = { subject: string; text: string; html: string };

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeId(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

export function buildTransactionalEmail(
  templateKey: TransactionalEmailTemplateKey,
  payload: Record<string, unknown>,
): EmailContent {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://forge-games.net").replace(
    /\/$/,
    "",
  );
  const consultationId = safeId(payload, "consultation_id");
  const consultationUrl = consultationId
    ? `${siteUrl}/consultations/${consultationId}`
    : `${siteUrl}/consultations`;
  const usageUrl = `${siteUrl}/consultations#usage-relations`;
  const actorUserId = safeId(payload, "actor_user_id");
  const actorNameRaw = payload.actor_display_name;
  const actorName =
    typeof actorNameRaw === "string" && actorNameRaw.trim()
      ? actorNameRaw.trim().slice(0, 80)
      : "ユーザー";
  const receivingTitleRaw = payload.receiving_project_title;
  const receivingTitle =
    typeof receivingTitleRaw === "string" && receivingTitleRaw.trim()
      ? receivingTitleRaw.trim().slice(0, 120)
      : "作品";
  const actorProfileUrl = actorUserId
    ? `${siteUrl}/creators/${actorUserId}`
    : `${siteUrl}/notifications`;

  if (templateKey === "feedback_reciprocity") {
    const subject = "Forgeでフィードバックが届きました";
    const text = [
      `${actorName}さんがあなたの「${receivingTitle}」にフィードバックしました。`,
      "",
      `お返しに、${actorName}さんの作品も見てみませんか？`,
      "",
      `${actorName}さんの作品を見る: ${actorProfileUrl}`,
      "",
      "※ フィードバック本文はメールに掲載していません。",
    ].join("\n");
    const html = [
      `<p>${escapeHtml(actorName)}さんがあなたの「${escapeHtml(receivingTitle)}」にフィードバックしました。</p>`,
      `<p>お返しに、${escapeHtml(actorName)}さんの作品も見てみませんか？</p>`,
      `<p><a href="${escapeHtml(actorProfileUrl)}">${escapeHtml(actorName)}さんの作品を見る</a></p>`,
      `<p style="color:#666;font-size:12px">※ フィードバック本文はメールに掲載していません。</p>`,
    ].join("");
    return { subject: `[Forge] ${subject}`, text, html };
  }

  const templates: Record<
    Exclude<TransactionalEmailTemplateKey, "feedback_reciprocity">,
    [string, string, string]
  > = {
    collab_consultation_new: [
      "新しいコラボ相談が届きました",
      "Forge に新しいコラボ相談が届きました。",
      consultationUrl,
    ],
    collab_consultation_message: [
      "コラボ相談に新しいメッセージがあります",
      "Forge のコラボ相談に新しいメッセージがあります。本文はForgeで確認してください。",
      consultationUrl,
    ],
    usage_relation_request: [
      "作品の使用関係を確認してください",
      "作品の使用関係について確認依頼が届きました。",
      usageUrl,
    ],
    usage_relation_accepted: [
      "作品の使用関係が承認されました",
      "申請した作品の使用関係が承認されました。",
      usageUrl,
    ],
    usage_relation_rejected: [
      "作品の使用関係の確認結果",
      "申請した作品の使用関係は承認されませんでした。",
      usageUrl,
    ],
  };
  const [subject, message, url] = templates[templateKey];
  return {
    subject: `[Forge] ${subject}`,
    text: `${message}\n\n${url}\n\n※ プライベートなメッセージ本文はメールに掲載していません。`,
    html: `<p>${escapeHtml(message)}</p><p><a href="${escapeHtml(url)}">Forgeで確認する</a></p><p style="color:#666;font-size:12px">※ プライベートなメッセージ本文はメールに掲載していません。</p>`,
  };
}

export async function sendTransactionalEmail(input: {
  to: string;
  templateKey: TransactionalEmailTemplateKey;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Forge <onboarding@resend.dev>";
  const content = buildTransactionalEmail(input.templateKey, input.payload);
  const { error } = await new Resend(apiKey).emails.send(
    {
      from,
      to: [input.to],
      subject: content.subject,
      text: content.text,
      html: content.html,
    },
    input.idempotencyKey
      ? { idempotencyKey: input.idempotencyKey }
      : undefined,
  );
  if (error) throw new Error(error.message);
}

export function isTransactionalEmailTemplateKey(
  value: string,
): value is TransactionalEmailTemplateKey {
  return [
    "collab_consultation_new",
    "collab_consultation_message",
    "usage_relation_request",
    "usage_relation_accepted",
    "usage_relation_rejected",
    "feedback_reciprocity",
  ].includes(value);
}
