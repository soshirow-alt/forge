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

export function settingsXErrorPath(reason: OAuthCallbackFailReason): string {
  return `/settings?x=error&reason=${encodeURIComponent(reason)}`;
}

export function loginAuthErrorPath(reason: OAuthCallbackFailReason): string {
  if (reason === "exchange_failed" || reason === "missing_code") {
    return `/login?error=auth_callback&reason=${encodeURIComponent(reason)}`;
  }
  return "/login?error=auth_callback";
}

export function mapExchangeErrorMessage(message: string): OAuthCallbackFailReason {
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
  const lower = message.toLowerCase();
  if (lower.includes("x_account_already_linked")) {
    return "x_account_already_linked";
  }
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
