import { NextResponse } from "next/server";
import { runAdoptionMatcherForDevlog } from "@/lib/voice-adoption/run-adoption-matcher";
import { createClient } from "@/lib/supabase/server";
import {
  fetchDevlogForMatcher,
  verifyProjectOwner,
} from "@/lib/supabase/voice-adoption-matcher-db";

export const runtime = "nodejs";

type RunRequest = {
  devlogId?: string;
};

export async function POST(request: Request) {
  let body: RunRequest = {};
  try {
    body = (await request.json()) as RunRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const devlogId = body.devlogId?.trim();
  if (!devlogId) {
    return NextResponse.json({ error: "devlogId is required" }, { status: 400 });
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

  const context = await fetchDevlogForMatcher(supabase, devlogId);
  if (!context) {
    return NextResponse.json(
      { error: "Published devlog not found" },
      { status: 404 },
    );
  }

  const isOwner = await verifyProjectOwner(
    supabase,
    context.devlog.projectId,
    user.id,
  );

  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await runAdoptionMatcherForDevlog(devlogId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("voice adoption matcher run failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Matcher run failed",
      },
      { status: 500 },
    );
  }
}
