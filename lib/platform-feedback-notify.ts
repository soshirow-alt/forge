import {
  platformFeedbackCategoryLabel,
  type PlatformFeedbackCategoryCode,
  type PlatformFeedbackViewerMode,
} from "@/lib/platform-feedback";
import { FORGE_LEGAL_CONTACT_EMAIL } from "@/lib/legal-routes";
import { assertTransactionalFromAllowed } from "@/lib/resend-from-address";
import { Resend } from "resend";

const DEFAULT_RESEND_FROM = "Forge <onboarding@resend.dev>";

export type PlatformFeedbackEmailInput = {
  category: PlatformFeedbackCategoryCode;
  message: string;
  pagePath: string;
  viewerMode: PlatformFeedbackViewerMode;
  userId: string;
  userEmail: string | null;
  createdAtIso: string;
};

export type PlatformFeedbackEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "send_failed"; detail?: string };

function formatViewerMode(mode: PlatformFeedbackViewerMode): string {
  return mode === "studio" ? "Studio" : "Player";
}

function formatJst(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function buildEmailBodies(input: PlatformFeedbackEmailInput) {
  const categoryLabel = platformFeedbackCategoryLabel(input.category);
  const viewerLabel = formatViewerMode(input.viewerMode);
  const sentAt = formatJst(input.createdAtIso);
  const userLine = input.userEmail
    ? `${input.userEmail} (${input.userId})`
    : input.userId;

  const text = [
    "Forge に運営へのご意見が届きました。",
    "",
    `種類: ${categoryLabel}`,
    `画面: ${viewerLabel} ${input.pagePath || "(不明)"}`,
    `ユーザー: ${userLine}`,
    `日時 (JST): ${sentAt}`,
    "",
    "── 本文 ──",
    input.message,
    "",
    "※ Supabase の platform_feedback にも保存されています。",
  ].join("\n");

  const html = `
    <p>Forge に運営へのご意見が届きました。</p>
    <ul>
      <li><strong>種類:</strong> ${categoryLabel}</li>
      <li><strong>画面:</strong> ${viewerLabel} ${input.pagePath || "(不明)"}</li>
      <li><strong>ユーザー:</strong> ${userLine}</li>
      <li><strong>日時 (JST):</strong> ${sentAt}</li>
    </ul>
    <p><strong>本文</strong></p>
    <pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;">${escapeHtml(input.message)}</pre>
    <p style="color:#666;font-size:12px;">※ Supabase の platform_feedback にも保存されています。</p>
  `.trim();

  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendPlatformFeedbackEmail(
  input: PlatformFeedbackEmailInput,
): Promise<PlatformFeedbackEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, reason: "not_configured" };
  }

  const to =
    process.env.PLATFORM_FEEDBACK_NOTIFY_EMAIL?.trim() || FORGE_LEGAL_CONTACT_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_RESEND_FROM;
  try {
    assertTransactionalFromAllowed({ fromHeader: from });
  } catch (error) {
    console.error("platform feedback email blocked by sender guard", error);
    return {
      sent: false,
      reason: "send_failed",
      detail: error instanceof Error ? error.message : "sender_blocked",
    };
  }
  const categoryLabel = platformFeedbackCategoryLabel(input.category);
  const { text, html } = buildEmailBodies(input);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `[Forge] 運営へのご意見: ${categoryLabel}`,
    text,
    html,
  });

  if (error) {
    console.error("platform feedback email failed", error);
    return {
      sent: false,
      reason: "send_failed",
      detail: error.message,
    };
  }

  return { sent: true };
}
