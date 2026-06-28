import { NextResponse } from "next/server";
import {
  PLATFORM_FEEDBACK_CATEGORIES,
  PLATFORM_FEEDBACK_MESSAGE_MAX,
  PLATFORM_FEEDBACK_MESSAGE_MIN,
  type PlatformFeedbackCategoryCode,
  type PlatformFeedbackViewerMode,
} from "@/lib/platform-feedback";
import { sendPlatformFeedbackEmail } from "@/lib/platform-feedback-notify";
import { createClient } from "@/lib/supabase/server";
import { submitPlatformFeedback } from "@/lib/supabase/platform-feedback-db";

export const runtime = "nodejs";

type PlatformFeedbackRequest = {
  category?: string;
  message?: string;
  pagePath?: string;
  viewerMode?: string;
};

function isCategoryCode(value: string): value is PlatformFeedbackCategoryCode {
  return PLATFORM_FEEDBACK_CATEGORIES.some((item) => item.code === value);
}

function isViewerMode(value: string): value is PlatformFeedbackViewerMode {
  return value === "player" || value === "studio";
}

export async function POST(request: Request) {
  let body: PlatformFeedbackRequest = {};
  try {
    body = (await request.json()) as PlatformFeedbackRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const category = body.category?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const pagePath = body.pagePath?.trim() ?? "";
  const viewerMode = body.viewerMode?.trim() ?? "";

  if (!isCategoryCode(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (!isViewerMode(viewerMode)) {
    return NextResponse.json({ error: "Invalid viewerMode" }, { status: 400 });
  }

  if (message.length < PLATFORM_FEEDBACK_MESSAGE_MIN) {
    return NextResponse.json(
      { error: `Message must be at least ${PLATFORM_FEEDBACK_MESSAGE_MIN} characters` },
      { status: 400 },
    );
  }

  if (message.length > PLATFORM_FEEDBACK_MESSAGE_MAX) {
    return NextResponse.json(
      { error: `Message must be at most ${PLATFORM_FEEDBACK_MESSAGE_MAX} characters` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await submitPlatformFeedback(supabase, {
      userId: user.id,
      category,
      message,
      pagePath,
      viewerMode,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "platform_feedback_table_missing") {
      return NextResponse.json(
        { error: "Platform feedback is not ready yet" },
        { status: 503 },
      );
    }

    console.error("platform feedback insert failed", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  const createdAtIso = new Date().toISOString();
  const emailResult = await sendPlatformFeedbackEmail({
    category,
    message,
    pagePath,
    viewerMode,
    userId: user.id,
    userEmail: user.email ?? null,
    createdAtIso,
  });

  if (!emailResult.sent) {
    console.warn("platform feedback saved but email not sent", emailResult);
  }

  return NextResponse.json({
    ok: true,
    emailSent: emailResult.sent,
  });
}
