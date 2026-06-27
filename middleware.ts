import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveV0LegacyRedirect } from "@/lib/v0-legacy-redirects";

export async function middleware(request: NextRequest) {
  const legacyTarget = resolveV0LegacyRedirect(request.nextUrl.pathname);
  if (legacyTarget) {
    return NextResponse.redirect(new URL(legacyTarget, request.url));
  }

  if (
    request.nextUrl.pathname === "/login" &&
    request.nextUrl.searchParams.get("mode") === "signup"
  ) {
    const registerUrl = new URL("/register", request.url);
    const returnParam = request.nextUrl.searchParams.get("return");
    if (returnParam) {
      registerUrl.searchParams.set("return", returnParam);
    }
    return NextResponse.redirect(registerUrl);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
