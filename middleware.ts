import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveV0LegacyRedirect } from "@/lib/v0-legacy-redirects";

export async function middleware(request: NextRequest) {
  // Public OG card URL ends with .png for crawler sniffing; App Router / Vercel
  // often 404s extensionful route folders, so rewrite to the extensionless handler.
  const pngOg = request.nextUrl.pathname.match(
    /^\/api\/projects\/([^/]+)\/og-image\.png$/,
  );
  if (pngOg) {
    const url = request.nextUrl.clone();
    url.pathname = `/api/projects/${pngOg[1]}/og-image`;
    return NextResponse.rewrite(url);
  }

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
    /*
     * Run middleware for most paths.
     * Keep static image assets excluded, but always include OG PNG rewrite path.
     */
    "/api/projects/:projectId/og-image.png",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
