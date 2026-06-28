/** OAuth ボタン表示 — Supabase で各プロバイダーを有効化 + Vercel env 後に true */
export function isOAuthLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FORGE_OAUTH_ENABLED === "true";
}
