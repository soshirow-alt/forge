/**
 * Shared env + safety guards for Preview/Staging real-email E2E.
 * Never log secret values.
 */

import fs from "node:fs";
import path from "node:path";

export const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
export const PRODUCTION_REF = "bpnisgzxuwdxelhnduuf";
export const DEFAULT_OPERATION_EMAIL = "forge.operation@gmail.com";
export const PREVIEW_ALIAS =
  "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";

const ROOT = process.cwd();

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadPreviewE2EEnv(): Record<string, string> {
  const merged: Record<string, string> = {
    ...parseEnvFile(path.join(ROOT, ".env.local")),
    ...parseEnvFile(path.join(ROOT, ".env.preview-e2e.local")),
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
  };
  return merged;
}

export function assertStagingOnly(env: Record<string, string>): void {
  const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  if (!url.includes(STAGING_REF)) {
    throw new Error(
      `BLOCKED: NEXT_PUBLIC_SUPABASE_URL must target Staging ref ${STAGING_REF}`,
    );
  }
  if (url.includes(PRODUCTION_REF)) {
    throw new Error("BLOCKED: Production Supabase URL detected");
  }
  const prodRef = (env.FORGE_PRODUCTION_SUPABASE_REF || "").trim();
  if (prodRef && prodRef === STAGING_REF) {
    throw new Error("BLOCKED: FORGE_PRODUCTION_SUPABASE_REF misconfigured as Staging");
  }
}

export function assertAllowedRecipient(
  toEmail: string,
  env: Record<string, string>,
): void {
  const allowed = (
    env.FORGE_PREVIEW_E2E_ALLOWED_RECIPIENT ||
    env.FORGE_PREVIEW_E2E_EMAIL ||
    DEFAULT_OPERATION_EMAIL
  )
    .trim()
    .toLowerCase();
  const actual = toEmail.trim().toLowerCase();
  if (!actual || actual !== allowed) {
    throw new Error(
      `BLOCKED: recipient not allowed for real-send E2E (expected operation inbox only)`,
    );
  }
  if (actual.includes(",") || actual.includes(";")) {
    throw new Error("BLOCKED: multiple recipients are not allowed");
  }
}

export function requireEnv(env: Record<string, string>, key: string): string {
  const value = (env[key] || "").trim();
  if (!value) throw new Error(`Missing required env: ${key}`);
  if (/^\[SENSITIVE\]$/i.test(value) || /^REDACTED$/i.test(value)) {
    throw new Error(
      `Env ${key} looks redacted/unusable — set a real local value in .env.preview-e2e.local`,
    );
  }
  return value;
}

export function requireResend(env: Record<string, string>): {
  apiKey: string;
  fromEmail: string;
} {
  const apiKey = requireEnv(env, "RESEND_API_KEY");
  const fromEmail = requireEnv(env, "RESEND_FROM_EMAIL");
  if (!/^re_/.test(apiKey)) {
    throw new Error("RESEND_API_KEY does not look like a Resend key");
  }
  if (!fromEmail.includes("@")) {
    throw new Error("RESEND_FROM_EMAIL must be an email address");
  }
  return { apiKey, fromEmail };
}

export function siteUrl(env: Record<string, string>): string {
  return (env.NEXT_PUBLIC_SITE_URL || PREVIEW_ALIAS).replace(/\/$/, "");
}

export function isPreviewHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host.includes("preview-landing-01") ||
      host.includes("vercel.app") ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export function assertNoProductionCta(url: string): void {
  const lower = url.toLowerCase();
  if (lower.includes("forge-games.net") && !lower.includes("preview")) {
    // Allow only if explicitly preview alias; block bare production host.
    try {
      const host = new URL(url).hostname;
      if (host === "forge-games.net" || host === "www.forge-games.net") {
        throw new Error("BLOCKED: CTA points at Production host");
      }
    } catch (cause) {
      if (cause instanceof Error && cause.message.startsWith("BLOCKED")) throw cause;
    }
  }
}
