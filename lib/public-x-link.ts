/**
 * Public X account link helpers — only for explicitly published profile X.
 * Never auto-publish from X OAuth login alone.
 */

const X_HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

export type PublicXLink = {
  handle: string;
  href: string;
  label: string;
};

/** Extract @handle from profile x_account (handle or x.com URL). */
export function normalizePublicXHandle(
  accountOrUrl: string | null | undefined,
): string | null {
  const raw = (accountOrUrl ?? "").trim();
  if (!raw) return null;

  let candidate = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const host = url.hostname.replace(/^www\./i, "").toLowerCase();
      if (host !== "x.com" && host !== "twitter.com") {
        return null;
      }
      const seg = url.pathname.split("/").filter(Boolean)[0] ?? "";
      candidate = seg;
    } catch {
      return null;
    }
  }

  candidate = candidate.replace(/^@/, "").trim();
  if (!X_HANDLE_RE.test(candidate)) {
    return null;
  }
  return candidate;
}

export function resolvePublicXLink(
  accountOrUrl: string | null | undefined,
): PublicXLink | null {
  const handle = normalizePublicXHandle(accountOrUrl);
  if (!handle) return null;
  return {
    handle,
    href: `https://x.com/${handle}`,
    label: `@${handle}`,
  };
}
