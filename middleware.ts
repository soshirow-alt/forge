import { type NextRequest, NextResponse } from "next/server";
import { shouldRedirectRootToDiscoveryHome } from "@/lib/preview-v0";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/" &&
    shouldRedirectRootToDiscoveryHome(request.nextUrl.hostname)
  ) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
