/**
 * forgeplace.app canonical + Preview-safe origin contracts.
 * Does not deploy. Does not read secret values.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  FORGE_LEGACY_PRODUCTION_SITE_ORIGIN,
  FORGE_PREVIEW_BRANCH_ALIAS_ORIGIN,
  FORGE_PRODUCTION_SITE_ORIGIN,
  getSiteOrigin,
  isLegacyProductionHost,
  isProductionPublicHost,
  toAbsoluteUrl,
} from "../lib/site-url";
import {
  FORGE_LEGACY_PRODUCTION_OAUTH_ORIGIN,
  FORGE_PRODUCTION_OAUTH_ORIGIN,
} from "../lib/auth-redirect";
import { buildTransactionalEmail } from "../lib/transactional-email";
import { buildGameDetailMetadata } from "../lib/game-detail-metadata";

const ROOT = process.cwd();

assert.equal(FORGE_PRODUCTION_SITE_ORIGIN, "https://forgeplace.app");
assert.equal(
  FORGE_LEGACY_PRODUCTION_SITE_ORIGIN,
  "https://forge-flame-gamma.vercel.app",
);
assert.equal(FORGE_PRODUCTION_OAUTH_ORIGIN, FORGE_PRODUCTION_SITE_ORIGIN);
assert.equal(
  FORGE_LEGACY_PRODUCTION_OAUTH_ORIGIN,
  FORGE_LEGACY_PRODUCTION_SITE_ORIGIN,
);
assert.equal(isProductionPublicHost("https://forgeplace.app/games/x"), true);
assert.equal(isLegacyProductionHost("https://forge-flame-gamma.vercel.app"), true);
assert.equal(isProductionPublicHost(FORGE_PREVIEW_BRANCH_ALIAS_ORIGIN), false);

function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const keys = Object.keys(env);
  const prev = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) {
      const value = env[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fn();
  } finally {
    for (const key of keys) {
      const value = prev[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

withEnv(
  {
    VERCEL_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://forge-flame-gamma.vercel.app",
    VERCEL_URL: "forge-flame-gamma.vercel.app",
  },
  () => {
    assert.equal(getSiteOrigin(), "https://forgeplace.app");
    assert.equal(
      toAbsoluteUrl("/games/abc"),
      "https://forgeplace.app/games/abc",
    );
  },
);

withEnv(
  {
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_SITE_URL: "https://forgeplace.app",
    VERCEL_BRANCH_URL:
      "forge-git-preview-landing-01-soshirow-alts-projects.vercel.app",
  },
  () => {
    assert.equal(
      getSiteOrigin(),
      "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app",
    );
  },
);

withEnv(
  {
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_SITE_URL: FORGE_PREVIEW_BRANCH_ALIAS_ORIGIN,
  },
  () => {
    const built = buildTransactionalEmail("collab_consultation_new", {
      consultation_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
    assert.match(built.text, /preview-landing-01/);
    assert.doesNotMatch(built.text, /forgeplace\.app/);
    assert.doesNotMatch(built.text, /forge-games\.net/);
    assert.doesNotMatch(built.text, /forge-flame-gamma/);
  },
);

withEnv(
  {
    VERCEL_ENV: "production",
    NEXT_PUBLIC_SITE_URL: undefined,
  },
  () => {
    const built = buildTransactionalEmail("collab_consultation_new", {
      consultation_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
    assert.match(built.text, /https:\/\/forgeplace\.app\/messages\//);
    const meta = buildGameDetailMetadata({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      title: "Example",
      description: "desc",
      overviewIntroduction: "",
      playableVersion: "1",
      phase: "alpha",
      releaseStatus: null,
      ogImageUrl: null,
    });
    assert.equal(
      meta.alternates?.canonical,
      "https://forgeplace.app/games/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    assert.equal(
      typeof meta.openGraph === "object" && meta.openGraph && "url" in meta.openGraph
        ? meta.openGraph.url
        : null,
      "https://forgeplace.app/games/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
  },
);

const runtimeRoots = ["lib", "app", "components"];
const forbiddenRuntime = [
  "forge-games.net",
  "mail.forge-games.net",
];

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkTsFiles(full, acc);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

for (const root of runtimeRoots) {
  for (const file of walkTsFiles(join(ROOT, root))) {
    if (file.endsWith(`${join("lib", "site-url.ts")}`)) continue;
    const text = readFileSync(file, "utf8");
    for (const needle of forbiddenRuntime) {
      if (text.includes(needle)) {
        throw new Error(`unintended runtime ref ${needle} in ${file}`);
      }
    }
  }
}

const tx = readFileSync(join(ROOT, "lib/transactional-email.ts"), "utf8");
assert.match(tx, /onboarding@resend\.dev/);
assert.match(tx, /assertTransactionalFromAllowed/);

const layout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");
assert.match(layout, /metadataBase: new URL\(getSiteOrigin\(\)\)/);

const auth = readFileSync(join(ROOT, "lib/auth-redirect.ts"), "utf8");
assert.match(auth, /getSiteOrigin\(\)/);
assert.doesNotMatch(auth, /NEXT_PUBLIC_SITE_URL \?\?/);

console.log("verify-forgeplace-domain: PASS");
