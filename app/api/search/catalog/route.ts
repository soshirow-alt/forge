import { NextResponse } from "next/server";
import { isProjectCategoryId } from "@/lib/project-categories";
import { createAnonSupabaseClient } from "@/lib/supabase/anon-client";
import {
  fetchPublicProjectsByCategory,
  isAssetKindFilter,
} from "@/lib/supabase/public-catalog-db";

export const runtime = "nodejs";

function parseBooleanParam(value: string | null): boolean | null {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

export async function GET(request: Request) {
  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "サービスが準備中です。" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const categoryRaw = url.searchParams.get("category")?.trim() ?? null;
  const category =
    categoryRaw && categoryRaw !== "all" && isProjectCategoryId(categoryRaw)
      ? categoryRaw
      : null;
  const sort = url.searchParams.get("sort")?.trim() || "newest";
  const streamPolicy = url.searchParams.get("stream_policy")?.trim() || null;
  const assetKindRaw = url.searchParams.get("asset_kind")?.trim() || null;
  const assetKind = isAssetKindFilter(assetKindRaw) ? assetKindRaw : null;
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "24", 10);
  const offsetParam = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);

  try {
    const projects = await fetchPublicProjectsByCategory(supabase, {
      category,
      sort,
      quickTry: parseBooleanParam(url.searchParams.get("quick_try")),
      feedbackWanted: parseBooleanParam(url.searchParams.get("feedback_wanted")),
      usableForCreation: parseBooleanParam(
        url.searchParams.get("usable_for_creation"),
      ),
      streamPolicy,
      assetKind,
      limit: Number.isFinite(limitParam) ? limitParam : 24,
      offset: Number.isFinite(offsetParam) ? offsetParam : 0,
    });

    return NextResponse.json({ ok: true, projects });
  } catch (error: unknown) {
    console.error("[search/catalog] failed", error);
    return NextResponse.json(
      { ok: false, message: "作品一覧を読み込めませんでした。" },
      { status: 500 },
    );
  }
}
