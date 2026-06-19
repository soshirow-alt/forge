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
