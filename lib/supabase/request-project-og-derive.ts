/**
 * Request server-side 1200×630 OGP derive after gallery thumbnails are saved.
 * Failures are non-fatal for thumbnail persistence (caller may ignore).
 */
export async function requestProjectOgImageDerive(
  projectId: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "browser only" };
  }
  try {
    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/og-image/derive`,
      { method: "POST", credentials: "same-origin" },
    );
    const body = (await response.json().catch(() => null)) as {
      url?: string;
      error?: string;
    } | null;
    if (!response.ok || !body?.url) {
      return { ok: false, error: body?.error || `status ${response.status}` };
    }
    return { ok: true, url: body.url };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "derive failed",
    };
  }
}
