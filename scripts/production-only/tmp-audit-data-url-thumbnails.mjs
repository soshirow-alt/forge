/**
 * READ-ONLY Production audit for oversized data-URL thumbnails.
 * Usage: node scripts/production-only/tmp-audit-data-url-thumbnails.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import {
  extractRef,
  loadEnvFile,
  PROD_REF,
} from "./prod-env.mjs";

const ENV_PATH = ".env.vercel.production";
const PROD_SITE = "https://forge-flame-gamma.vercel.app";
const PROD_SUPABASE_URL = `https://${PROD_REF}.supabase.co`;

function isDataUrl(value) {
  return typeof value === "string" && value.trimStart().startsWith("data:");
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function legacyAnonJwt(tokens) {
  for (const token of tokens) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
      );
      if (payload.role === "anon" || payload.ref === PROD_REF) return token;
    } catch {
      // Ignore non-JWT candidates.
    }
  }
  return null;
}

async function capturePublicAnonKey() {
  const htmlResponse = await fetch(`${PROD_SITE}/home`, { cache: "no-store" });
  if (!htmlResponse.ok) {
    throw new Error(`Production HTML request failed (${htmlResponse.status})`);
  }
  const html = await htmlResponse.text();
  const scriptUrls = [
    ...new Set(
      [...html.matchAll(/src="([^"]+\.js(?:\?[^"]*)?)"/g)].map(
        (match) => new URL(match[1], PROD_SITE).href,
      ),
    ),
  ];

  for (const scriptUrl of scriptUrls) {
    const response = await fetch(scriptUrl, { cache: "no-store" });
    if (!response.ok) continue;
    const source = await response.text();
    if (!source.includes(PROD_REF) && !source.includes("supabase.co")) continue;

    const publishable = source.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
    if (publishable) return publishable;

    const jwts = [
      ...source.matchAll(
        /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      ),
    ].map((match) => match[0]);
    const anon = legacyAnonJwt(jwts);
    if (anon) return anon;
  }

  throw new Error(
    "Production anon key was empty and could not be captured from public site bundles.",
  );
}

async function productionReadClient() {
  const env = existsSync(ENV_PATH) ? loadEnvFile(ENV_PATH) : { ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL || PROD_SUPABASE_URL;
  const ref = extractRef(url);
  if (ref !== PROD_REF) {
    throw new Error(`Abort: expected production ref ${PROD_REF}, got ${ref}`);
  }

  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = serviceKey
    ? null
    : env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
      (await capturePublicAnonKey());
  const key = serviceKey || anonKey;
  return {
    ref,
    credential: serviceKey ? "service" : "anon",
    client: createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

async function main() {
  const { ref, credential, client } = await productionReadClient();
  const { data, error } = await client
    .from("projects")
    .select("id, title, thumbnail_url, thumbnail_urls")
    .eq("visibility", "public");

  if (error) throw error;

  const findings = (data ?? [])
    .filter(
      (row) =>
        isDataUrl(row.thumbnail_url) ||
        (Array.isArray(row.thumbnail_urls) &&
          row.thumbnail_urls.some(isDataUrl)),
    )
    .map((row) => {
      const array = Array.isArray(row.thumbnail_urls)
        ? row.thumbnail_urls.filter((value) => typeof value === "string")
        : [];
      const values = [row.thumbnail_url, ...array];
      return {
        project_id: row.id,
        title: row.title,
        thumbnail_url_char_length:
          typeof row.thumbnail_url === "string" ? row.thumbnail_url.length : 0,
        thumbnail_urls_char_lengths: array.map((value) => value.length),
        data_url_char_lengths: values.filter(isDataUrl).map((value) => value.length),
        has_http_alternative: values.some(isHttpUrl),
      };
    });

  console.log(
    JSON.stringify(
      {
        read_only: true,
        ref,
        credential,
        public_projects_scanned: (data ?? []).length,
        affected_projects: findings.length,
        findings,
      },
      null,
      2,
    ),
  );
  console.log(
    "\nNOTE: Studio still converts images through lib/read-image-as-data-url.ts and components/project-thumbnail-fields.tsx, then projectThumbnailsForDb saves data URLs. The root upload/storage fix remains separate.",
  );
}

main().catch((error) => {
  console.error("READ-ONLY Production thumbnail audit failed:", error);
  process.exit(1);
});
