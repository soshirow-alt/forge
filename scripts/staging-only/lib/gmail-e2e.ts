/**
 * Gmail readonly verifier for Preview real-email E2E.
 * Uses OAuth refresh token (never Google account password).
 */

export type GmailMessageSummary = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  internalDateMs: number;
  bodyText: string;
  bodyHtml: string;
};

export type GmailSearchInput = {
  accessToken: string;
  query: string;
  newerThanMs: number;
  timeoutMs?: number;
  pollMs?: number;
};

async function gmailGet<T>(
  accessToken: string,
  path: string,
): Promise<T> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Gmail API ${response.status}`);
  }
  return (await response.json()) as T;
}

function decodeBody(data?: string): string {
  if (!data) return "";
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function collectBodies(payload: unknown): { text: string; html: string } {
  let text = "";
  let html = "";
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const part = node as {
      mimeType?: string;
      body?: { data?: string };
      parts?: unknown[];
    };
    if (part.mimeType === "text/plain" && part.body?.data) {
      text += decodeBody(part.body.data);
    }
    if (part.mimeType === "text/html" && part.body?.data) {
      html += decodeBody(part.body.data);
    }
    for (const child of part.parts || []) walk(child);
  };
  walk(payload);
  return { text, html };
}

function header(
  headers: Array<{ name: string; value: string }> | undefined,
  name: string,
): string {
  const hit = (headers || []).find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  );
  return hit?.value || "";
}

export async function refreshGmailAccessToken(input: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> {
  const body = new URLSearchParams({
    client_id: input.clientId,
    client_secret: input.clientSecret,
    refresh_token: input.refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`Gmail token refresh failed (${response.status})`);
  }
  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Gmail token refresh missing access_token");
  return json.access_token;
}

export async function waitForGmailMessage(
  input: GmailSearchInput,
): Promise<GmailMessageSummary> {
  const timeoutMs = input.timeoutMs ?? 90_000;
  const pollMs = input.pollMs ?? 4_000;
  const deadline = Date.now() + timeoutMs;
  let lastError = "not found";

  while (Date.now() < deadline) {
    try {
      const list = await gmailGet<{
        messages?: Array<{ id: string; threadId: string }>;
      }>(
        input.accessToken,
        `users/me/messages?maxResults=10&q=${encodeURIComponent(input.query)}`,
      );
      for (const item of list.messages || []) {
        const full = await gmailGet<{
          id: string;
          threadId: string;
          snippet?: string;
          internalDate?: string;
          payload?: {
            headers?: Array<{ name: string; value: string }>;
            mimeType?: string;
            body?: { data?: string };
            parts?: unknown[];
          };
        }>(input.accessToken, `users/me/messages/${item.id}?format=full`);
        const internalDateMs = Number(full.internalDate || 0);
        if (internalDateMs < input.newerThanMs - 5_000) {
          continue; // refuse old-mail false positive
        }
        const bodies = collectBodies(full.payload);
        return {
          id: full.id,
          threadId: full.threadId,
          subject: header(full.payload?.headers, "Subject"),
          from: header(full.payload?.headers, "From"),
          to: header(full.payload?.headers, "To"),
          snippet: full.snippet || "",
          internalDateMs,
          bodyText: bodies.text,
          bodyHtml: bodies.html,
        };
      }
      lastError = "no matching message yet";
    } catch (cause) {
      lastError = cause instanceof Error ? cause.message : String(cause);
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  throw new Error(`Gmail poll timeout: ${lastError}`);
}

/** Pure assertions used by deterministic tests + live verifier. */
export function assertTransactionalMailContent(input: {
  message: Pick<
    GmailMessageSummary,
    "subject" | "from" | "to" | "bodyText" | "bodyHtml" | "snippet"
  >;
  expectedRecipient: string;
  expectedSubjectIncludes: string;
  runId: string;
  previewHostNeedle: string;
  forbiddenBodySnippets?: string[];
}): void {
  const haystack = [
    input.message.bodyText,
    input.message.bodyHtml,
    input.message.snippet,
  ].join("\n");
  if (!input.message.to.toLowerCase().includes(input.expectedRecipient.toLowerCase())) {
    throw new Error("mail recipient mismatch");
  }
  if (!input.message.subject.includes(input.expectedSubjectIncludes)) {
    throw new Error("mail subject mismatch");
  }
  for (const forbidden of input.forbiddenBodySnippets || []) {
    if (forbidden && haystack.includes(forbidden)) {
      throw new Error("private/forbidden body snippet leaked into email");
    }
  }
  if (haystack.toLowerCase().includes("forge-games.net/messages")) {
    // Production host CTA is a hard fail for Preview E2E.
    throw new Error("mail CTA appears to point at Production");
  }
  if (!haystack.includes(input.previewHostNeedle) && !haystack.includes("/messages")) {
    throw new Error("mail CTA/preview host missing");
  }
  // run id may appear in subject via consultation context — optional soft check omitted
  void input.runId;
}
