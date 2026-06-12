export function getSafeRedirectPath(redirect: string | null | undefined): string {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/";
  }

  return redirect;
}

export function getRedirectFromCurrentUrl(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  return getSafeRedirectPath(
    new URLSearchParams(window.location.search).get("redirect"),
  );
}
