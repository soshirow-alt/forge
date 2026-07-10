import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCOUNT_REGISTRATION_REQUIRED_NOTICE,
  isAnonymousSupabaseUser,
  requiresRegisteredAccount,
} from "@/lib/guest-auth";
import {
  getProductionAuthProtectedPrefixes,
  isProductionReleaseMode,
} from "@/lib/production-mode";
import { buildLoginUrlWithReturn } from "@/lib/login-return-url";

const ALWAYS_PROTECTED_PREFIXES = [
  "/admin",
  "/submit",
  "/my-projects",
  "/bookmarks",
  "/projects/",
];

function resolveProtectedPrefixes(hostname: string): string[] {
  if (!isProductionReleaseMode(hostname)) {
    return [...ALWAYS_PROTECTED_PREFIXES];
  }

  return [...ALWAYS_PROTECTED_PREFIXES, ...getProductionAuthProtectedPrefixes()];
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const protectedPrefixes = resolveProtectedPrefixes(request.nextUrl.hostname);
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  const returnPath = `${pathname}${request.nextUrl.search}`;

  if (!user && isProtected) {
    const loginPath = buildLoginUrlWithReturn(returnPath);
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (user && isAnonymousSupabaseUser(user) && requiresRegisteredAccount(pathname)) {
    const loginPath = buildLoginUrlWithReturn(returnPath, {
      notice: ACCOUNT_REGISTRATION_REQUIRED_NOTICE,
    });
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return supabaseResponse;
}
