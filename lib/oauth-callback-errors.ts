export type OAuthCallbackFailReason =
  | "missing_oauth_flow_cookie"
  | "missing_code"
  | "oauth_provider_error"
  | "exchange_failed"
  | "missing_session"
  | "missing_user"
  | "missing_x_identity"
  | "missing_x_user_id"
  | "missing_x_username"
  | "x_account_already_linked"
  | "anonymous_not_allowed"
  | "upsert_failed"
  | "sync_failed_unknown"
  | "callback_failed";

export const X_ACCOUNT_ALREADY_LINKED_USER_MESSAGE =
  "このXアカウントは別のForgeアカウントに連携済みです。別のXアカウントを使うか、Xでログインしてください。";

export function isXAccountAlreadyLinkedReason(
  reason: string | null | undefined,
): boolean {
  if (!reason) {
    return false;
  }
  const lower = reason.toLowerCase();
  return (
    lower === "already_linked" ||
    lower === "x_account_already_linked" ||
    lower === "identity_already_exists"
  );
}

export function settingsXErrorPath(reason: OAuthCallbackFailReason): string {
  const normalized =
    reason === "x_account_already_linked" ? "x_account_already_linked" : reason;
  return `/settings?x=error&reason=${encodeURIComponent(normalized)}`;
}

export function loginAuthErrorPath(reason: OAuthCallbackFailReason): string {
  if (reason === "x_account_already_linked") {
    return `/login?error=auth_callback&reason=${encodeURIComponent(reason)}`;
  }
  if (reason === "exchange_failed" || reason === "missing_code") {
    return `/login?error=auth_callback&reason=${encodeURIComponent(reason)}`;
  }
  return "/login?error=auth_callback";
}

export function normalizeOAuthFailureReason(parts: {
  error?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  exchangeMessage?: string | null;
  exchangeCode?: string | null;
}): OAuthCallbackFailReason | null {
  const blob = [
    parts.error,
    parts.errorCode,
    parts.errorDescription,
    parts.exchangeMessage,
    parts.exchangeCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    blob.includes("identity_already_exists") ||
    blob.includes("identity is already linked") ||
    blob.includes("x_account_already_linked") ||
    blob.includes("already linked to another user")
  ) {
    return "x_account_already_linked";
  }

  return null;
}

export function mapExchangeErrorMessage(
  message: string,
  code?: string | null,
): OAuthCallbackFailReason {
  const normalized = normalizeOAuthFailureReason({
    exchangeMessage: message,
    exchangeCode: code,
  });
  if (normalized) {
    return normalized;
  }

  const lower = message.toLowerCase();
  if (lower.includes("pkce") || lower.includes("code verifier")) {
    return "exchange_failed";
  }
  if (lower.includes("flow state") || lower.includes("invalid grant")) {
    return "exchange_failed";
  }
  return "exchange_failed";
}

export function mapRpcErrorMessage(message: string): OAuthCallbackFailReason {
  const normalized = normalizeOAuthFailureReason({ exchangeMessage: message });
  if (normalized) {
    return normalized;
  }

  const lower = message.toLowerCase();
  if (lower.includes("not_authenticated")) {
    return "missing_session";
  }
  if (lower.includes("anonymous_not_allowed")) {
    return "anonymous_not_allowed";
  }
  if (lower.includes("invalid_x_user_id")) {
    return "missing_x_user_id";
  }
  if (lower.includes("invalid_x_username")) {
    return "missing_x_username";
  }
  return "upsert_failed";
}

/** Server log helper — no PII */
export function logOAuthCallbackStep(
  step: string,
  detail: Record<string, string | boolean | null | undefined>,
): void {
  console.info("[auth/callback]", step, detail);
}
