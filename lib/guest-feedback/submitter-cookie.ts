import { cookies } from "next/headers";
import { GUEST_SUBMITTER_COOKIE, GUEST_SUBMITTER_COOKIE_MAX_AGE_SEC } from "@/lib/guest-feedback/constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidGuestSubmitterKey(value: string | undefined | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

function cookieBaseOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function readGuestSubmitterKeyFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(GUEST_SUBMITTER_COOKIE)?.value;
  return isValidGuestSubmitterKey(value) ? value : null;
}

export async function issueGuestSubmitterCookie(): Promise<{
  submitterKey: string;
  issued: boolean;
}> {
  const existing = await readGuestSubmitterKeyFromCookie();
  if (existing) {
    return { submitterKey: existing, issued: false };
  }

  const submitterKey = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(GUEST_SUBMITTER_COOKIE, submitterKey, {
    ...cookieBaseOptions(),
    maxAge: GUEST_SUBMITTER_COOKIE_MAX_AGE_SEC,
  });

  return { submitterKey, issued: true };
}

/** Clears abuse-prevention cookie after registered login — not linked to user_id. */
export async function clearGuestSubmitterCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_SUBMITTER_COOKIE, "", {
    ...cookieBaseOptions(),
    maxAge: 0,
  });
}

export function guestSubmitterClearSetCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${GUEST_SUBMITTER_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}
